import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, MinusCircle, ShieldAlert, CheckCircle2, 
  Copy, Check, Code, Target, ArrowDownRight, ArrowUpRight, Gauge, 
  FileText, Zap, HelpCircle, Eye, Sparkles, Scale, Share2
} from 'lucide-react';
import { TradeAnalysis } from '../types/analysis.ts';
import { PositionCalculator } from './PositionCalculator.tsx';

interface AnalysisResultProps {
  analysis: TradeAnalysis;
  rawJson?: string;
  onOpenRawJson: () => void;
  onOpenExport: () => void;
  onReset: () => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({
  analysis,
  rawJson,
  onOpenRawJson,
  onOpenExport,
  onReset,
}) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const isBuy = analysis.recommendation === 'BUY';
  const isSell = analysis.recommendation === 'SELL';
  const isNoTrade = analysis.recommendation === 'NO_TRADE';

  const prob = Math.min(100, Math.max(0, analysis.win_probability || 0));

  // Determine probability color
  const getProbColor = () => {
    if (prob >= 75) return 'text-emerald-400 stroke-emerald-400 fill-emerald-500/10';
    if (prob >= 60) return 'text-teal-400 stroke-teal-400 fill-teal-500/10';
    if (prob >= 45) return 'text-amber-400 stroke-amber-400 fill-amber-500/10';
    return 'text-rose-400 stroke-rose-400 fill-rose-500/10';
  };

  const copyTradingSummary = () => {
    const text = `🎯 PLAN DE TRADE SMC - ${analysis.asset} (${analysis.timeframe})
📊 Tendance: ${analysis.trend} | Recommandation: ${analysis.recommendation}
⚡ Probabilité estimée: ${analysis.win_probability}% | Confiance: ${analysis.confidence_level}
━━━━━━━━━━━━━━━━━━
🔹 Entrée: ${analysis.trade_setup.entry_price}
🛑 Stop Loss: ${analysis.trade_setup.stop_loss}
🎯 Take Profit 1: ${analysis.trade_setup.take_profit_1}
🚀 Take Profit 2: ${analysis.trade_setup.take_profit_2}
⚖️ Ratio R:R: ${analysis.trade_setup.risk_reward_ratio}
━━━━━━━━━━━━━━━━━━
💡 Confluences Clés:
${analysis.key_confluences.map(c => `• ${c}`).join('\n')}

📝 Justification:
${analysis.technical_justification}

⚠️ Gestion du Risque:
${analysis.risk_warning}`;

    navigator.clipboard.writeText(text);
    setCopiedFormat('trading');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const copyStrictJson = () => {
    const jsonOutput = {
      asset: analysis.asset,
      timeframe: analysis.timeframe,
      trend: analysis.trend,
      recommendation: analysis.recommendation,
      win_probability: analysis.win_probability,
      confidence_level: analysis.confidence_level,
      trade_setup: analysis.trade_setup,
      key_confluences: analysis.key_confluences,
      technical_justification: analysis.technical_justification,
      risk_warning: analysis.risk_warning,
    };
    navigator.clipboard.writeText(JSON.stringify(jsonOutput, null, 2));
    setCopiedFormat('json');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner - Asset & Recommendation Hero */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border transition-all ${
          isBuy
            ? 'bg-gradient-to-br from-emerald-950/70 via-[#0d1622] to-[#090e18] border-emerald-500/40 glow-emerald'
            : isSell
            ? 'bg-gradient-to-br from-rose-950/70 via-[#180d16] to-[#0e0910] border-rose-500/40 glow-rose'
            : 'bg-gradient-to-br from-amber-950/50 via-[#16140e] to-[#0f0e0c] border-amber-500/40'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="text-xs uppercase font-extrabold tracking-wider px-3 py-1 rounded-lg bg-slate-900/90 text-cyan-300 border border-slate-700 font-mono">
                {analysis.asset || 'Inconnu'}
              </span>
              <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-lg bg-slate-900/90 text-slate-300 border border-slate-700 font-mono">
                {analysis.timeframe || 'Inconnu'}
              </span>
              <span
                className={`text-xs uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                  analysis.trend === 'BULLISH'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : analysis.trend === 'BEARISH'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {analysis.trend === 'BULLISH' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                {analysis.trend === 'BEARISH' && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                {analysis.trend === 'NEUTRAL' && <MinusCircle className="w-3.5 h-3.5 text-amber-400" />}
                Tendance: {analysis.trend}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900/80 text-slate-400 border border-slate-800">
                Confiance: <strong className="text-white">{analysis.confidence_level}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Signal:{' '}
                <span
                  className={
                    isBuy
                      ? 'text-emerald-400'
                      : isSell
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }
                >
                  {isBuy ? 'ACHAT (BUY / LONG)' : isSell ? 'VENTE (SELL / SHORT)' : 'NEUTRE (NO_TRADE)'}
                </span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              {analysis.technical_justification}
            </p>
          </div>

          {/* Win Probability Score Card */}
          <div className="w-full lg:w-auto flex items-center justify-between lg:justify-end gap-5 bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shrink-0">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Probabilité Estimée
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono-numbers mt-1 flex items-baseline gap-1">
                <span
                  className={
                    prob >= 70
                      ? 'text-emerald-400'
                      : prob >= 50
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }
                >
                  {analysis.win_probability}%
                </span>
                <span className="text-xs font-normal text-slate-500">confluence</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {prob >= 75 ? 'Setup Haute Probabilité (SMC)' : prob >= 55 ? 'Setup Modéré' : 'Signal Faible / Prudence'}
              </div>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    prob >= 70 ? 'text-emerald-400' : prob >= 50 ? 'text-amber-400' : 'text-rose-400'
                  }
                  strokeDasharray={`${prob}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Zap className="w-5 h-5 absolute text-white/80" />
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar in Banner */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenExport}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              title="Exporter le plan en image sociale ou texte compact (Twitter, Telegram, WhatsApp)"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-950" />
              <span>Exporter le Plan</span>
            </button>

            <button
              onClick={copyTradingSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              {copiedFormat === 'trading' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Plan Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copier Plan (Discord/Telegram)</span>
                </>
              )}
            </button>

            <button
              onClick={copyStrictJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              {copiedFormat === 'json' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-300">JSON Copié !</span>
                </>
              ) : (
                <>
                  <Code className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copier JSON Strict</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenRawJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspecter JSON Brut</span>
            </button>
          </div>

          <button
            onClick={onReset}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer underline underline-offset-4"
          >
            + Nouvelle analyse
          </button>
        </div>
      </div>

      {/* Trade Setup Matrix (Entry, SL, TP1, TP2, R:R) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Entry Price */}
        <div className="p-4 rounded-2xl bg-[#0e1424] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Prix d'Entrée</span>
            <Target className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-base sm:text-xl font-bold font-mono-numbers text-white truncate" title={`${analysis.trade_setup.entry_price}`}>
            {analysis.trade_setup.entry_price}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {isNoTrade ? 'Attente breakout' : 'Niveau d\'exécution'}
          </div>
        </div>

        {/* Stop Loss */}
        <div className="p-4 rounded-2xl bg-[#140e15] border border-rose-900/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-rose-300/80 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Stop Loss (SL)</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-base sm:text-xl font-bold font-mono-numbers text-rose-400 truncate" title={`${analysis.trade_setup.stop_loss}`}>
            {analysis.trade_setup.stop_loss}
          </div>
          <div className="text-[10px] text-rose-500/80 mt-1 font-mono">
            Niveau d'invalidation
          </div>
        </div>

        {/* Take Profit 1 */}
        <div className="p-4 rounded-2xl bg-[#0c181a] border border-teal-900/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-teal-300/80 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Take Profit 1</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-base sm:text-xl font-bold font-mono-numbers text-teal-300 truncate" title={`${analysis.trade_setup.take_profit_1}`}>
            {analysis.trade_setup.take_profit_1}
          </div>
          <div className="text-[10px] text-teal-500/80 mt-1 font-mono">
            Prise de profit partielle
          </div>
        </div>

        {/* Take Profit 2 */}
        <div className="p-4 rounded-2xl bg-[#0d1a16] border border-emerald-900/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-emerald-300/80 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Take Profit 2</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base sm:text-xl font-bold font-mono-numbers text-emerald-400 truncate" title={`${analysis.trade_setup.take_profit_2}`}>
            {analysis.trade_setup.take_profit_2}
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-1 font-mono">
            Objectif final (Liquidité)
          </div>
        </div>

        {/* Risk / Reward Ratio */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-[#131221] border border-indigo-900/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-indigo-300/80 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Ratio Risque / Gain</span>
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-base sm:text-xl font-bold font-mono-numbers text-indigo-300 truncate">
            {analysis.trade_setup.risk_reward_ratio}
          </div>
          <div className="text-[10px] text-indigo-400/80 mt-1 font-mono">
            {isNoTrade ? 'N/A' : 'Minimum 1:2 requis'}
          </div>
        </div>
      </div>

      {/* Visual Risk-Reward Price Ladder (When levels are numeric) */}
      {!isNoTrade && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0d121f] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Visualisation de l'Échelle des Niveaux
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Stop-Loss ➔ Entrée ➔ TP1 ➔ TP2
            </span>
          </div>

          <div className="relative pt-2 pb-1">
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div className="w-1/4 bg-rose-500/80 h-full" title="Zone de Risque (Stop Loss)" />
              <div className="w-1/4 bg-teal-500/80 h-full" title="Zone TP1" />
              <div className="w-1/2 bg-emerald-500/80 h-full" title="Zone TP2" />
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs font-mono">
              <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-900/40">
                <div className="text-[10px] text-rose-400 font-bold uppercase">SL</div>
                <div className="font-bold text-white truncate">{analysis.trade_setup.stop_loss}</div>
              </div>
              <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-900/40">
                <div className="text-[10px] text-cyan-400 font-bold uppercase">Entrée</div>
                <div className="font-bold text-white truncate">{analysis.trade_setup.entry_price}</div>
              </div>
              <div className="p-2 rounded-lg bg-teal-950/30 border border-teal-900/40">
                <div className="text-[10px] text-teal-400 font-bold uppercase">TP 1</div>
                <div className="font-bold text-white truncate">{analysis.trade_setup.take_profit_1}</div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-900/40">
                <div className="text-[10px] text-emerald-400 font-bold uppercase">TP 2</div>
                <div className="font-bold text-white truncate">{analysis.trade_setup.take_profit_2}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Position & Money Management Calculator */}
      <PositionCalculator setup={analysis.trade_setup} recommendation={analysis.recommendation} />

      {/* Confluences & Justification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Key Confluences */}
        <div className="p-5 rounded-2xl bg-[#0d121f] border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Facteurs de Confluence Validés</h3>
              <p className="text-[11px] text-slate-400">Éléments SMC & Price Action identifiés sur le graphique</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {analysis.key_confluences && analysis.key_confluences.length > 0 ? (
              analysis.key_confluences.map((conf, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl bg-[#090d18] border border-slate-800/80 text-xs text-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{conf}</span>
                </div>
              ))
            ) : (
              <div className="p-3 text-xs text-slate-500 italic">Aucune confluence forte détectée.</div>
            )}
          </div>
        </div>

        {/* Technical Justification & Risk Warning */}
        <div className="space-y-5">
          {/* Technical Justification */}
          <div className="p-5 rounded-2xl bg-[#0d121f] border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Synthèse Technique Price Action</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#090d18] p-4 rounded-xl border border-slate-800/80">
              {analysis.technical_justification}
            </p>
          </div>

          {/* Risk Warning Box */}
          <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Gestion du Risque & Avertissement
              </h3>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              {analysis.risk_warning}
            </p>
            <div className="mt-3 text-[11px] text-amber-300/60 font-mono">
              Rappel : Risquez un maximum de 1% à 2% de votre capital par position. Ne jamais trader sans Stop-Loss défini.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
