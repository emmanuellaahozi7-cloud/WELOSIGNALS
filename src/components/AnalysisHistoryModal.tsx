import React from 'react';
import { X, Trash2, Clock, ArrowRight, TrendingUp, TrendingDown, MinusCircle, AlertCircle } from 'lucide-react';
import { TradeAnalysis } from '../types/analysis.ts';

interface AnalysisHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: TradeAnalysis[];
  onSelect: (item: TradeAnalysis) => void;
  onClear: () => void;
  onDeleteOne: (id: string) => void;
}

export const AnalysisHistoryModal: React.FC<AnalysisHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
  onDeleteOne,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0d121f] border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0a0e19]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Historique des Analyses ({history.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClear}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-all cursor-pointer"
                title="Vider tout l'historique"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Effacer tout</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Clock className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="text-sm">Aucune analyse enregistrée pour le moment.</p>
              <p className="text-xs text-slate-600 mt-1">Vos analyses futures s'afficheront ici automatiquement.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="group p-4 rounded-2xl bg-[#090d18] hover:bg-[#101626] border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-4 cursor-pointer"
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      item.recommendation === 'BUY'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : item.recommendation === 'SELL'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {item.recommendation === 'BUY' && <TrendingUp className="w-4 h-4" />}
                    {item.recommendation === 'SELL' && <TrendingDown className="w-4 h-4" />}
                    {item.recommendation === 'NO_TRADE' && <MinusCircle className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white font-mono truncate">
                        {item.asset}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {item.timeframe}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          item.recommendation === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : item.recommendation === 'SELL'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {item.recommendation} ({item.win_probability}%)
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-md mt-0.5">
                      {item.technical_justification}
                    </div>
                    {item.timestamp && (
                      <div className="text-[10px] text-slate-500 mt-1">
                        {new Date(item.timestamp).toLocaleString('fr-FR')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.id) onDeleteOne(item.id);
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Supprimer cette entrée"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="p-2 rounded-xl text-slate-400 group-hover:text-emerald-400 transition-colors">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
