import React, { useState } from 'react';
import { X, Copy, Check, Code, Download } from 'lucide-react';
import { TradeAnalysis } from '../types/analysis.ts';

interface RawJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: TradeAnalysis | null;
  rawJson?: string;
}

export const RawJsonModal: React.FC<RawJsonModalProps> = ({
  isOpen,
  onClose,
  analysis,
  rawJson,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !analysis) return null;

  // Clean JSON string matching user's exact specification
  const formattedJson = JSON.stringify(
    {
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
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smc_plan_${analysis.asset.replace('/', '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#0d121f] border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0a0e19]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Objet JSON Strict (Spécification Conforme)</h3>
              <p className="text-[11px] text-slate-400">Sortie JSON pure prête pour Webhooks, Bots Trading & Journal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="Télécharger fichier JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-300 bg-[#070a12]">
          <pre className="p-4 rounded-xl bg-[#04060b] border border-slate-800/80 overflow-x-auto selection:bg-cyan-500/30 selection:text-cyan-200">
            <code>{formattedJson}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0a0e19] flex items-center justify-between text-[11px] text-slate-500">
          <span>Format: RFC 8259 Standard JSON</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
