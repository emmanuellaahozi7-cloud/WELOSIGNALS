import React, { useState, useMemo } from 'react';
import { Calculator, DollarSign, Percent, ShieldAlert, ArrowUpRight, Check } from 'lucide-react';
import { TradeSetup } from '../types/analysis.ts';

interface PositionCalculatorProps {
  setup: TradeSetup;
  recommendation: 'BUY' | 'SELL' | 'NO_TRADE';
}

export const PositionCalculator: React.FC<PositionCalculatorProps> = ({ setup, recommendation }) => {
  const [capital, setCapital] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [copied, setCopied] = useState<boolean>(false);

  // Parse numerical prices from strings
  const parseNum = (val: string | number): number | null => {
    if (typeof val === 'number') return isNaN(val) ? null : val;
    if (!val) return null;
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  };

  const entry = parseNum(setup.entry_price);
  const sl = parseNum(setup.stop_loss);
  const tp1 = parseNum(setup.take_profit_1);
  const tp2 = parseNum(setup.take_profit_2);

  const calculations = useMemo(() => {
    if (!entry || !sl || entry === sl || recommendation === 'NO_TRADE') {
      return null;
    }

    const dollarRisk = (capital * riskPercent) / 100;
    const priceRiskPerUnit = Math.abs(entry - sl);
    const riskPercentPrice = (priceRiskPerUnit / entry) * 100;
    
    // Position size in units / coins
    const units = priceRiskPerUnit > 0 ? dollarRisk / priceRiskPerUnit : 0;
    const totalPositionValue = units * entry;

    // Potential Gains
    let gainTp1 = 0;
    let gainTp2 = 0;
    if (tp1) {
      const rewardPerUnitTp1 = Math.abs(tp1 - entry);
      gainTp1 = units * rewardPerUnitTp1;
    }
    if (tp2) {
      const rewardPerUnitTp2 = Math.abs(tp2 - entry);
      gainTp2 = units * rewardPerUnitTp2;
    }

    return {
      dollarRisk,
      priceRiskPerUnit,
      riskPercentPrice,
      units,
      totalPositionValue,
      gainTp1,
      gainTp2,
      r1: dollarRisk > 0 && gainTp1 > 0 ? (gainTp1 / dollarRisk).toFixed(2) : '1:2',
      r2: dollarRisk > 0 && gainTp2 > 0 ? (gainTp2 / dollarRisk).toFixed(2) : '1:3.5',
    };
  }, [capital, riskPercent, entry, sl, tp1, tp2, recommendation]);

  if (recommendation === 'NO_TRADE' || !calculations) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
        <span>Le calculateur de position est désactivé en mode <strong>NO_TRADE</strong> (aucun niveau d'entrée à risquer).</span>
      </div>
    );
  }

  const copyCalculatorSummary = () => {
    if (!calculations) return;
    const text = `Plan de Risque Trade:
Capital: $${capital.toLocaleString()}
Risque: ${riskPercent}% ($${calculations.dollarRisk.toFixed(2)})
Taille Position: ${calculations.units.toFixed(4)} unités (~$${calculations.totalPositionValue.toFixed(2)})
Stop-Loss: ${setup.stop_loss} (-$${calculations.dollarRisk.toFixed(2)})
TP1: ${setup.take_profit_1} (+$${calculations.gainTp1.toFixed(2)})
TP2: ${setup.take_profit_2} (+$${calculations.gainTp2.toFixed(2)})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#111827] to-[#0c121e] border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Calculateur de Risque & Taille de Position</h4>
            <p className="text-[11px] text-slate-400">Gestion mathématique stricte du money management (1% - 2%)</p>
          </div>
        </div>

        <button
          onClick={copyCalculatorSummary}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors border border-slate-700 cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copié !' : 'Copier Plan'}</span>
        </button>
      </div>

      {/* Input parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
            <DollarSign className="w-3 h-3 text-emerald-400" /> Capital du Compte ($)
          </label>
          <div className="relative">
            <input
              type="number"
              min="100"
              step="500"
              value={capital}
              onChange={(e) => setCapital(Math.max(0, Number(e.target.value)))}
              className="w-full bg-[#0a0f1d] border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-sm font-mono-numbers text-white outline-none transition-all"
            />
            <span className="absolute right-3 top-2 text-xs text-slate-500">USD</span>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
            <Percent className="w-3 h-3 text-cyan-400" /> Risque Max Toléré (%)
          </label>
          <div className="flex items-center gap-2">
            {[0.5, 1.0, 1.5, 2.0].map((pct) => (
              <button
                key={pct}
                onClick={() => setRiskPercent(pct)}
                className={`flex-1 py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                  riskPercent === pct
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'bg-[#0a0f1d] text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calculation output cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
        <div className="p-3 rounded-xl bg-[#090d18] border border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Perte Max ($)</div>
          <div className="text-sm sm:text-base font-bold font-mono-numbers text-rose-400 mt-1">
            -${calculations.dollarRisk.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">({riskPercent}% du capital)</div>
        </div>

        <div className="p-3 rounded-xl bg-[#090d18] border border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Taille Conseillée</div>
          <div className="text-sm sm:text-base font-bold font-mono-numbers text-cyan-300 mt-1 truncate" title={`${calculations.units}`}>
            {calculations.units < 0.01 ? calculations.units.toFixed(6) : calculations.units.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">~${calculations.totalPositionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} notional</div>
        </div>

        <div className="p-3 rounded-xl bg-[#090d18] border border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gain Visé (TP1)</div>
          <div className="text-sm sm:text-base font-bold font-mono-numbers text-emerald-400 mt-1">
            +${calculations.gainTp1.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5 font-mono">R:R 1:{calculations.r1}</div>
        </div>

        <div className="p-3 rounded-xl bg-[#090d18] border border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gain Visé (TP2)</div>
          <div className="text-sm sm:text-base font-bold font-mono-numbers text-emerald-300 mt-1">
            +${calculations.gainTp2.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5 font-mono">R:R 1:{calculations.r2}</div>
        </div>
      </div>
    </div>
  );
};
