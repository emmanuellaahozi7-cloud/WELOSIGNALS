import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import sharp from 'sharp';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Support large image payloads (screenshots can be up to 10-20MB base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Shared server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY non configurée. Veuillez configurer votre clé dans le panneau Secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
      timeout: 55000,
    },
  });
};

// System Prompt aligned strictly with user request instructions
const SYSTEM_INSTRUCTION = `Tu es un expert mondial en analyse technique des marchés financiers (Forex, Cryptomonnaies, Actions, Indices) spécialisé dans le Price Action, le Smart Money Concepts (SMC), l'analyse des chandeliers japonais, les zones de liquidité, les Fair Value Gaps (FVG) et les indicateurs techniques (RSI, MACD, Moyennes Mobiles, Volume Profile).

Ton rôle est d'analyser la capture d'écran d'un graphique TradingView fournie par l'utilisateur et d'émettre un plan de trade précis, objectif et réaliste.

---

### CONSIGNES D'ANALYSE VISUELLE :

1. IDENTIFICATION DU CONTEXTE :
   - Extrais l'actif (ex: BTC/USDT, EUR/USD, XAU/USD, NVDA, SP500) et l'unité de temps (ex: 1m, 5m, 15m, 1H, 4H, 1D) si visibles sur l'image. Si ce n'est pas certain ou coupé, indique "Inconnu".
   - Détermine la tendance globale actuelle visuelle sur le graphique (Haussière = BULLISH, Baissière = BEARISH, Neutre/Range = NEUTRAL).

2. STRUCTURE ET NIVEAUX CLÉS :
   - Repère les supports et résistances majeurs.
   - Identifie les structures clés : Order Blocks (OB haussier / baissier), Fair Value Gaps (FVG), zones d'offre/demande (Supply / Demand zones), cassures de structure (BOS - Break of Structure / CHoCH - Change of Character), ou figures chartistes (Tête-Épaules, Double Bottom/Top, Drapeaux, Triangles, etc.).
   - Analyse la dynamique récente des bougies (momentum, rejections, mèches de prise de liquidité - Liquidity Sweeps, pin bars, englobantes).

3. ESTIMATION DE LA PROBABILITÉ (PERCENTAGE) :
   - Calcule un pourcentage de réussite estimé (entre 0% et 100%) basé sur la confluence des facteurs suivants :
     * Tendance de fond alignée avec le trade (+20%)
     * Rejet clair sur un niveau majeur / Order Block (+20%)
     * Figure chartiste ou structure SMC validée (+20%)
     * Divergence ou confirmation d'indicateurs (RSI, MACD, Volume) (+20%)
     * Ratio Risque/Rendement favorable (minimum 1:2) (+20%)
   - Sois conservateur et réaliste : ne donne JAMAIS 100%. Un setup très fort se situe entre 70% et 85%. Si le graphique est ambigu ou en plein milieu d'un range sans signal clair, attribue une faible probabilité (ex: 30% - 50%) et privilégie l'état "NEUTRAL / NO_TRADE".

4. TRADE SETUP :
   - Si recommendation = BUY ou SELL : fournis des niveaux de prix précis lus ou estimés sur les échelles de prix du graphique : entry_price, stop_loss, take_profit_1, take_profit_2 et le risk_reward_ratio (ex: 1:2.4).
   - Si recommendation = NO_TRADE : entry_price = "Attendre confirmation", stop_loss = "N/A", take_profit_1 = "N/A", take_profit_2 = "N/A", risk_reward_ratio = "N/A".

5. JUSTIFICATION & GESTION DU RISQUE :
   - technical_justification : Explication synthétique et claire de l'analyse en 3-4 phrases maximum en français.
   - risk_warning : Remarque sur la gestion du risque, invalidation du scénario ou volatilité (news, sessions).`;

// POST /api/analyze-chart
app.post('/api/analyze-chart', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType = 'image/png', userNotes } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: "Aucune image fournie. Veuillez importer une capture d'écran TradingView." });
      return;
    }

    let base64Clean = imageBase64;
    let resolvedMimeType = mimeType;

    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      resolvedMimeType = parts[0].replace('data:', '') || 'image/png';
      base64Clean = parts[1];
    } else if (imageBase64.startsWith('data:image/svg+xml')) {
      const svgContent = decodeURIComponent(imageBase64.replace(/^data:image\/svg\+xml;utf8,/, ''));
      base64Clean = Buffer.from(svgContent).toString('base64');
      resolvedMimeType = 'image/svg+xml';
    }

    // Normalize, resize, and optimize any image (SVG, PNG, 4K screenshot) to high-quality JPEG (max 1920px)
    // This reduces payload from 15MB down to ~300KB, preventing Gemini timeouts and payload limits
    try {
      const inputBuffer = Buffer.from(base64Clean, 'base64');
      const optimizedBuffer = await sharp(inputBuffer)
        .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      base64Clean = optimizedBuffer.toString('base64');
      resolvedMimeType = 'image/jpeg';
    } catch (convErr: any) {
      console.warn("Optimisation image avec sharp échouée, conservation format d'origine:", convErr.message);
    }

    const ai = getGeminiClient();

    const promptText = `Analyse cette capture d'écran d'un graphique TradingView avec tes compétences d'expert mondial en Price Action et Smart Money Concepts (SMC).
${userNotes ? `Remarques/Contexte spécifié par le trader : "${userNotes}"` : ''}
Exécute l'analyse visuelle complète, identifie l'actif, le timeframe, la structure (OB, FVG, liquidité, BOS/CHoCH), calcule le score de confluence et retourne le plan de trade structuré au format JSON demandé.`;

    const responseSchemaConfig = {
      type: Type.OBJECT,
      properties: {
        asset: {
          type: Type.STRING,
          description: "STRING (ex: BTC/USDT, EUR/USD ou 'Inconnu')",
        },
        timeframe: {
          type: Type.STRING,
          description: "STRING (ex: 15m, 1H, 4H ou 'Inconnu')",
        },
        trend: {
          type: Type.STRING,
          enum: ["BULLISH", "BEARISH", "NEUTRAL"],
          description: "BULLISH | BEARISH | NEUTRAL",
        },
        recommendation: {
          type: Type.STRING,
          enum: ["BUY", "SELL", "NO_TRADE"],
          description: "BUY | SELL | NO_TRADE",
        },
        win_probability: {
          type: Type.NUMBER,
          description: "NUMBER (entre 0 et 100)",
        },
        confidence_level: {
          type: Type.STRING,
          enum: ["HAUTE", "MOYENNE", "FAIBLE"],
          description: "HAUTE | MOYENNE | FAIBLE",
        },
        trade_setup: {
          type: Type.OBJECT,
          properties: {
            entry_price: {
              type: Type.STRING,
              description: "STRING ou NUMBER (Prix suggéré d'entrée)",
            },
            stop_loss: {
              type: Type.STRING,
              description: "STRING ou NUMBER (Niveau de Stop-Loss)",
            },
            take_profit_1: {
              type: Type.STRING,
              description: "STRING ou NUMBER (Premier objectif)",
            },
            take_profit_2: {
              type: Type.STRING,
              description: "STRING ou NUMBER (Deuxième objectif)",
            },
            risk_reward_ratio: {
              type: Type.STRING,
              description: "STRING (ex: 1:2.5)",
            },
          },
          required: [
            "entry_price",
            "stop_loss",
            "take_profit_1",
            "take_profit_2",
            "risk_reward_ratio",
          ],
        },
        key_confluences: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Facteurs de confirmation clés",
        },
        technical_justification: {
          type: Type.STRING,
          description: "Explication synthétique et claire de l'analyse en 3-4 phrases maximum en français",
        },
        risk_warning: {
          type: Type.STRING,
          description: "Remarque sur la gestion du risque ou les événements à venir si visibles",
        },
      },
      required: [
        "asset",
        "timeframe",
        "trend",
        "recommendation",
        "win_probability",
        "confidence_level",
        "trade_setup",
        "key_confluences",
        "technical_justification",
        "risk_warning",
      ],
    };

    // Timeout helper to avoid any hanging call (50s threshold for vision analysis)
    const withTimeout = <T>(promise: Promise<T>, ms: number = 50000): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout IA (${ms / 1000}s)`)), ms);
        promise
          .then((val) => {
            clearTimeout(timer);
            resolve(val);
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      });
    };

    // Fast execution: try primary gemini-3.8-flash first, fallback to other valid models
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: any = null;
    let responseText: string | null = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`[TradeVision AI] Attempting model: ${modelName}...`);
        const genResult = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: resolvedMimeType,
                    data: base64Clean,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              responseSchema: responseSchemaConfig,
            },
          }),
          25000
        );

        if (genResult && genResult.text) {
          console.log(`[TradeVision AI] Success with model: ${modelName}!`);
          responseText = genResult.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[TradeVision AI] Model ${modelName} failed:`, err.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error("Le modèle IA n'a pas pu traiter l'image. Veuillez réessayer dans quelques instants.");
    }

    const rawText = responseText;
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        parsedData = JSON.parse(cleaned);
      } catch {
        parsedData = {};
      }
    }

    const sanitizedAnalysis = {
      asset: parsedData?.asset || 'Inconnu',
      timeframe: parsedData?.timeframe || 'Inconnu',
      trend: ['BULLISH', 'BEARISH', 'NEUTRAL'].includes(parsedData?.trend) ? parsedData.trend : 'NEUTRAL',
      recommendation: ['BUY', 'SELL', 'NO_TRADE'].includes(parsedData?.recommendation) ? parsedData.recommendation : 'NO_TRADE',
      win_probability: typeof parsedData?.win_probability === 'number' ? parsedData.win_probability : parseInt(String(parsedData?.win_probability || '50'), 10) || 50,
      confidence_level: ['HAUTE', 'MOYENNE', 'FAIBLE'].includes(parsedData?.confidence_level) ? parsedData.confidence_level : 'MOYENNE',
      trade_setup: {
        entry_price: parsedData?.trade_setup?.entry_price ?? 'N/A',
        stop_loss: parsedData?.trade_setup?.stop_loss ?? 'N/A',
        take_profit_1: parsedData?.trade_setup?.take_profit_1 ?? 'N/A',
        take_profit_2: parsedData?.trade_setup?.take_profit_2 ?? 'N/A',
        risk_reward_ratio: parsedData?.trade_setup?.risk_reward_ratio ?? '1:2',
      },
      key_confluences: Array.isArray(parsedData?.key_confluences) && parsedData.key_confluences.length > 0 
        ? parsedData.key_confluences 
        : ['Structure Price Action observée', 'Confluence technique globale'],
      technical_justification: parsedData?.technical_justification || "Analyse technique effectuée sur le graphique fourni.",
      risk_warning: parsedData?.risk_warning || "Toujours appliquer une gestion rigoureuse du capital (1% à 2% max par position).",
    };

    res.json({
      success: true,
      analysis: sanitizedAnalysis,
      rawJson: rawText,
    });
  } catch (error: any) {
    console.error("Erreur lors de l'analyse de graphique:", error);
    res.status(500).json({
      error: error.message || "Erreur interne lors du traitement visuel du graphique.",
      details: error.status || error.code || null,
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'TradeVision AI Analyst',
    model: 'gemini-3.8-flash',
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // In dev mode, mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In prod mode, serve built dist files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TradeVision AI Server running on port ${PORT} [${isProd ? 'PROD' : 'DEV'}]`);
  });
  server.headersTimeout = 120000;
  server.requestTimeout = 120000;
  server.keepAliveTimeout = 65000;
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
