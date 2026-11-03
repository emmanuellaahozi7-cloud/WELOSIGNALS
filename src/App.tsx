import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  TrendingUp, AlertTriangle, Shield, BookOpen, Layers, 
  Activity, ArrowRight, Zap, Target, BarChart2 
} from 'lucide-react';
import { TradeAnalysis } from './types/analysis.ts';
import { Header } from './components/Header.tsx';
import { DropZone } from './components/DropZone.tsx';
import { AnalysisResult } from './components/AnalysisResult.tsx';
import { RawJsonModal } from './components/RawJsonModal.tsx';
import { AnalysisHistoryModal } from './components/AnalysisHistoryModal.tsx';

const STORAGE_KEY = 'tradevision_analyses_history_v1';

export default function App() {
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [rawJson, setRawJson] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<TradeAnalysis[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isRawJsonOpen, setIsRawJsonOpen] = useState<boolean>(false);
  const [showSmcGuide, setShowSmcGuide] = useState<boolean>(false);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Could not save history to localStorage', e);
    }
  }, [history]);

  const handleAnalyze = async (imageBase64: string, userNotes: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentImage(imageBase64);

    try {
      const response = await fetch('/api/analyze-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          userNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Une erreur est survenue lors de l'analyse visuelle.");
      }

      const result: TradeAnalysis = {
        ...data.analysis,
        id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        imageUrl: imageBase64,
        userNotes,
      };

      setAnalysis(result);
      setRawJson(data.rawJson);

      // Trigger celebratory confetti for strong setups (>= 70%)
      if (result.win_probability >= 70 && result.recommendation !== 'NO_TRADE') {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: result.recommendation === 'BUY' ? ['#10b981', '#34d399', '#06b6d4'] : ['#f43f5e', '#fb7185', '#fb923c'],
        });
      }

      // Add to history
      setHistory((prev) => [result, ...prev.slice(0, 24)]);
    } catch (err: any) {
      console.error('Erreur API:', err);
      setError(err.message || 'Impossible de joindre le moteur IA. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setCurrentImage(null);
    setRawJson(undefined);
    setError(null);
  };

  const handleSelectFromHistory = (item: TradeAnalysis) => {
    setAnalysis(item);
    if (item.imageUrl) setCurrentImage(item.imageUrl);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleDeleteOneHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#070b14] bg-chart-grid text-slate-100 flex flex-col font-sans">
      {/* Trading Header */}
      <Header
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="text-xs sm:text-sm">
                <strong>Erreur d'analyse :</strong> {error}
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-xs text-rose-200 font-semibold cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Hero Section if no analysis active */}
        {!analysis && (
          <div className="text-center max-w-3xl mx-auto pt-2 pb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 mb-4 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Analyse Visuelle Multimodale Price Action & SMC</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Transformez vos graphiques TradingView en{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                plans de trade objectifs
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-4 max-w-2xl mx-auto leading-relaxed">
              Détectez automatiquement les <strong>Order Blocks</strong>, <strong>Fair Value Gaps (FVG)</strong>,
              prises de liquidités et structures clés avec calcul rigoureux du ratio Risque/Rendement et probabilité de réussite.
            </p>
          </div>
        )}

        {/* Input & Upload Zone */}
        {!analysis && (
          <div className="max-w-4xl mx-auto">
            <DropZone onAnalyze={handleAnalyze} isLoading={isLoading} />
          </div>
        )}

        {/* Active Analysis View */}
        {analysis && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Split View with uploaded chart image and Analysis result */}
            {currentImage && (
              <div className="p-4 rounded-3xl bg-[#0c101c] border border-slate-800 flex flex-col md:flex-row items-center gap-4">
                <div className="relative group max-h-56 md:max-h-64 overflow-hidden rounded-2xl border border-slate-700 bg-black/50 shrink-0">
                  <img
                    src={currentImage}
                    alt="Graphique analysé"
                    className="max-h-56 md:max-h-64 w-auto object-contain rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-mono text-cyan-300 bg-black/80 px-3 py-1.5 rounded-lg border border-cyan-500/30">
                      Graphique source analysé
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold">
                      {analysis.asset}
                    </span>
                    <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {analysis.timeframe}
                    </span>
                    <span className="text-xs text-slate-500">• Analyse complétée avec succès</span>
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Setup identifié : {analysis.recommendation} ({analysis.win_probability}% de réussite estimée)
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {analysis.technical_justification}
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={resetAnalysis}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                    >
                      Analyser un autre graphique
                    </button>
                    <button
                      onClick={() => setIsRawJsonOpen(true)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-800/40 transition-colors cursor-pointer"
                    >
                      Voir JSON Strict
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Result Details */}
            <AnalysisResult
              analysis={analysis}
              rawJson={rawJson}
              onOpenRawJson={() => setIsRawJsonOpen(true)}
              onReset={resetAnalysis}
            />
          </div>
        )}

        {/* SMC & Price Action Cheat Sheet Toggle */}
        <div className="max-w-4xl mx-auto pt-6 border-t border-slate-800/80">
          <button
            onClick={() => setShowSmcGuide(!showSmcGuide)}
            className="w-full p-4 rounded-2xl bg-[#0c111e] hover:bg-[#111728] border border-slate-800 flex items-center justify-between transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Guide Méthodologique : Price Action & Smart Money Concepts (SMC)
                </h4>
                <p className="text-xs text-slate-400">
                  Découvrez les critères stricts d'évaluation utilisés pour calculer la confluence
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {showSmcGuide ? 'Masquer' : 'Afficher les règles'}
            </span>
          </button>

          {showSmcGuide && (
            <div className="mt-4 p-6 rounded-2xl bg-[#090d18] border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 animate-in fade-in">
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#0e1424] border border-slate-800">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1 text-sm">
                    <Target className="w-4 h-4" /> Order Blocks & Zones d'Offre/Demande
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Dernière zone de consolidation institutionnelle avant un déplacement rapide. Les retests de ces zones fournissent des points d'entrée à haut ratio R:R.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0e1424] border border-slate-800">
                  <div className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1 text-sm">
                    <Layers className="w-4 h-4" /> Fair Value Gaps (FVG)
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Déséquilibres de prix créés par des impulsions violentes (espace entre la mèche 1 et la mèche 3). Le marché a tendance à revenir combler au moins 50% de ce déséquilibre.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#0e1424] border border-slate-800">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5 mb-1 text-sm">
                    <Zap className="w-4 h-4" /> Liquidity Sweeps & CHoCH / BOS
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Balayage des mèches hautes/basses pour activer les ordres stop des traders particuliers, suivi d'un Change of Character (CHoCH) confirmant le renversement.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0e1424] border border-slate-800">
                  <div className="font-bold text-rose-400 flex items-center gap-1.5 mb-1 text-sm">
                    <Shield className="w-4 h-4" /> Calcul Conservateur de la Probabilité
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    5 confluences de 20% chacune (Tendance, Rejet OB/Niveau, Structure chartiste validée, Indicateurs RSI/MACD, Ratio Risque/Rendement &ge; 1:2). Aucun setup n'obtient 100%.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d18] px-4 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">TradeVision AI</span>
            <span>— Moteur d'Analyse Technique Multimodale</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Avertissement : Les analyses fournies sont à titre informatif et éducatif uniquement et ne constituent pas un conseil financier.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RawJsonModal
        isOpen={isRawJsonOpen}
        onClose={() => setIsRawJsonOpen(false)}
        analysis={analysis}
        rawJson={rawJson}
      />

      <AnalysisHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={handleSelectFromHistory}
        onClear={handleClearHistory}
        onDeleteOne={handleDeleteOneHistory}
      />
    </div>
  );
}
