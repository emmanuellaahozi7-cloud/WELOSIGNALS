import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Download, Copy, Check, Share2, Image as ImageIcon, 
  MessageSquare, ExternalLink, Sparkles, Send, Twitter 
} from 'lucide-react';
import { TradeAnalysis } from '../types/analysis.ts';

interface ExportPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: TradeAnalysis | null;
}

export const ExportPlanModal: React.FC<ExportPlanModalProps> = ({
  isOpen,
  onClose,
  analysis,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
  const [textFormat, setTextFormat] = useState<'twitter' | 'telegram' | 'compact'>('twitter');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate high-resolution social sharing canvas
  const renderCanvas = useCallback(() => {
    if (!analysis) return;

    const width = 1200;
    const height = 675; // Standard 16:9 social share card
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isBuy = analysis.recommendation === 'BUY';
    const isSell = analysis.recommendation === 'SELL';
    const accentColor = isBuy ? '#10b981' : isSell ? '#f43f5e' : '#f59e0b';
    const accentSecondary = isBuy ? '#06b6d4' : isSell ? '#fb923c' : '#fbbf24';

    // 1. Dark Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#070b14');
    bgGrad.addColorStop(0.5, '#0c1322');
    bgGrad.addColorStop(1, '#080d17');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle Grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Glowing Corner Orbs
    const radGrad = ctx.createRadialGradient(width - 150, 150, 20, width - 150, 150, 300);
    radGrad.addColorStop(0, isBuy ? 'rgba(16, 185, 129, 0.25)' : isSell ? 'rgba(244, 63, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(width - 500, 0, 500, 450);

    // 4. Header Bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(50, 40, width - 100, 80, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // App Branding in Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('TradeVision AI', 80, 88);

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 12px monospace';
    ctx.fillText('• SMC & PRICE ACTION ENGINE', 235, 87);

    // Timeframe & Date
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    const dateStr = new Date(analysis.timestamp || Date.now()).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    ctx.fillText(dateStr, width - 200, 88);

    // 5. Asset & Recommendation Title Row
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 46px system-ui, -apple-system, sans-serif';
    ctx.fillText(analysis.asset || 'Actif Inconnu', 50, 180);

    // Timeframe Badge
    const tfWidth = 70;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(ctx.measureText(analysis.asset || 'Actif Inconnu').width + 70, 142, tfWidth, 42, 10);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(analysis.timeframe || '15m', ctx.measureText(analysis.asset || 'Actif Inconnu').width + 85, 171);

    // Recommendation Pill
    const recText = isBuy ? '▲ ACHAT / BUY' : isSell ? '▼ VENTE / SELL' : '◆ NO TRADE';
    const recWidth = 230;
    const recX = width - 50 - recWidth;
    ctx.fillStyle = isBuy ? 'rgba(16, 185, 129, 0.2)' : isSell ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)';
    ctx.beginPath();
    ctx.roundRect(recX, 136, recWidth, 52, 14);
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(recText, recX + 22, 170);

    // 6. Metrics & Levels Matrix (4 cards + R:R)
    const cards = [
      { label: "PRIX D'ENTRÉE", val: String(analysis.trade_setup.entry_price), color: '#ffffff', sub: 'Exécution' },
      { label: 'STOP LOSS (SL)', val: String(analysis.trade_setup.stop_loss), color: '#f43f5e', sub: 'Invalidation' },
      { label: 'TAKE PROFIT 1', val: String(analysis.trade_setup.take_profit_1), color: '#2dd4bf', sub: 'Objectif 1' },
      { label: 'TAKE PROFIT 2', val: String(analysis.trade_setup.take_profit_2), color: '#10b981', sub: 'Objectif 2' },
    ];

    const cardY = 220;
    const cardHeight = 135;
    const cardGap = 20;
    const cardWidth = (width - 100 - cardGap * 3) / 4;

    cards.forEach((c, idx) => {
      const cx = 50 + idx * (cardWidth + cardGap);

      // Card Background
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(cx, cardY, cardWidth, cardHeight, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top label
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(c.label, cx + 18, cardY + 32);

      // Value
      ctx.fillStyle = c.color;
      ctx.font = 'bold 28px monospace';
      const textVal = c.val.length > 11 ? c.val.substring(0, 11) + '..' : c.val;
      ctx.fillText(textVal, cx + 18, cardY + 78);

      // Sub
      ctx.fillStyle = '#475569';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillText(c.sub, cx + 18, cardY + 110);
    });

    // 7. Middle Row: Win Probability Banner + Ratio R:R + SMC Badges
    const midY = 380;
    ctx.fillStyle = '#0e1526';
    ctx.beginPath();
    ctx.roundRect(50, midY, width - 100, 160, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Prob column
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('PROBABILITÉ ESTIMÉE', 75, midY + 36);

    ctx.fillStyle = accentColor;
    ctx.font = '900 46px monospace';
    ctx.fillText(`${analysis.win_probability}%`, 75, midY + 90);

    ctx.fillStyle = '#64748b';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Confiance : ${analysis.confidence_level}`, 75, midY + 124);

    // Vertical Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(310, midY + 20);
    ctx.lineTo(310, midY + 140);
    ctx.stroke();

    // Ratio R:R Column
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('RATIO RISQUE/RENDEMENT', 340, midY + 36);

    ctx.fillStyle = '#818cf8';
    ctx.font = '900 46px monospace';
    ctx.fillText(analysis.trade_setup.risk_reward_ratio || '1:2.5', 340, midY + 90);

    ctx.fillStyle = '#64748b';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText('Gestion stricte du risque', 340, midY + 124);

    // Vertical Divider
    ctx.beginPath();
    ctx.moveTo(630, midY + 20);
    ctx.lineTo(630, midY + 140);
    ctx.stroke();

    // Confluences SMC list
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('CONFLUENCES IDENTIFIÉES (SMC)', 660, midY + 36);

    const confluences = analysis.key_confluences.slice(0, 3);
    confluences.forEach((conf, i) => {
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('✓', 660, midY + 68 + i * 28);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      const cleanConf = conf.length > 55 ? conf.substring(0, 52) + '...' : conf;
      ctx.fillText(cleanConf, 685, midY + 68 + i * 28);
    });

    // 8. Visual Price Ladder Bar
    const barY = 565;
    const barW = width - 100;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.roundRect(50, barY, barW, 10, 5);
    ctx.fill();

    // Stop Loss segment (Red)
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.roundRect(50, barY, barW * 0.25, 10, 5);
    ctx.fill();

    // TP1 segment (Teal)
    ctx.fillStyle = '#2dd4bf';
    ctx.beginPath();
    ctx.roundRect(50 + barW * 0.25, barY, barW * 0.35, 10, 5);
    ctx.fill();

    // TP2 segment (Emerald)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(50 + barW * 0.6, barY, barW * 0.4, 10, 5);
    ctx.fill();

    // 9. Footer Watermark
    ctx.fillStyle = '#475569';
    ctx.font = '12px monospace';
    ctx.fillText('Généré par TradeVision AI • Smart Money Concepts • Not financial advice', 50, 620);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('tradevision.app', width - 170, 620);

    setPreviewDataUrl(canvas.toDataURL('image/png'));
    setImageLoaded(true);
  }, [analysis]);

  useEffect(() => {
    if (isOpen && analysis) {
      renderCanvas();
    }
  }, [isOpen, analysis, renderCanvas]);

  if (!isOpen || !analysis) return null;

  const isBuy = analysis.recommendation === 'BUY';
  const isSell = analysis.recommendation === 'SELL';

  // Text generators
  const getTwitterText = () => {
    const symbol = analysis.asset.replace('/', '');
    const recEmoji = isBuy ? '🟢 LONG' : isSell ? '🔴 SHORT' : '⚪️ NEUTRAL';
    return `🎯 #TradeSetup $${symbol} (${analysis.timeframe})

${recEmoji} ${analysis.recommendation} • Confluence: ${analysis.win_probability}%
⚖️ R:R : ${analysis.trade_setup.risk_reward_ratio}

📍 Entrée: ${analysis.trade_setup.entry_price}
🛑 Stop-Loss: ${analysis.trade_setup.stop_loss}
🎯 TP1: ${analysis.trade_setup.take_profit_1}
🚀 TP2: ${analysis.trade_setup.take_profit_2}

💡 SMC: ${analysis.key_confluences[0] || 'Order Block + FVG'}

#Trading #SMC #PriceAction #Forex #Crypto`;
  };

  const getTelegramText = () => {
    return `━━━━━━━━━━━━━━━━━━━━━
⚡️ <b>TRADE SETUP SMC</b> • <code>${analysis.asset}</code> (${analysis.timeframe})
━━━━━━━━━━━━━━━━━━━━━
📊 <b>Direction:</b> ${analysis.recommendation === 'BUY' ? '🟢 ACHAT (BUY)' : analysis.recommendation === 'SELL' ? '🔴 VENTE (SELL)' : '⚪️ NEUTRE'}
🎯 <b>Probabilité Confluence:</b> <code>${analysis.win_probability}%</code> (${analysis.confidence_level})
⚖️ <b>Ratio Risque/Gain:</b> <code>${analysis.trade_setup.risk_reward_ratio}</code>

🔹 <b>Entrée:</b> <code>${analysis.trade_setup.entry_price}</code>
🛑 <b>Stop-Loss:</b> <code>${analysis.trade_setup.stop_loss}</code>
🎯 <b>Objectif 1:</b> <code>${analysis.trade_setup.take_profit_1}</code>
🚀 <b>Objectif 2:</b> <code>${analysis.trade_setup.take_profit_2}</code>

💡 <b>Confluences Clés:</b>
${analysis.key_confluences.map(c => `• ${c}`).join('\n')}

📝 <b>Justification:</b>
${analysis.technical_justification}

⚠️ <i>${analysis.risk_warning}</i>
━━━━━━━━━━━━━━━━━━━━━`;
  };

  const getCompactText = () => {
    return `[${analysis.recommendation}] ${analysis.asset} (${analysis.timeframe}) | Entry: ${analysis.trade_setup.entry_price} | SL: ${analysis.trade_setup.stop_loss} | TP1: ${analysis.trade_setup.take_profit_1} | TP2: ${analysis.trade_setup.take_profit_2} | R:R: ${analysis.trade_setup.risk_reward_ratio} | Prob: ${analysis.win_probability}%`;
  };

  const currentText = textFormat === 'twitter' ? getTwitterText() : textFormat === 'telegram' ? getTelegramText() : getCompactText();

  const handleCopyText = () => {
    navigator.clipboard.writeText(currentText);
    setCopiedType('text');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadImage = () => {
    if (!previewDataUrl) return;
    const a = document.createElement('a');
    a.href = previewDataUrl;
    a.download = `TradeVision_${analysis.asset.replace('/', '_')}_${analysis.recommendation}.png`;
    a.click();
  };

  const handleCopyImage = async () => {
    if (!previewDataUrl) return;
    try {
      const res = await fetch(previewDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopiedType('image');
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      handleDownloadImage();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Setup ${analysis.asset} - ${analysis.recommendation}`,
          text: currentText,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#0c121e] border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Hidden rendering canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090d18]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Exporter le Plan de Trade
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono font-normal">
                  {analysis.asset} • {analysis.timeframe}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Format carte visuelle haute définition ou texte compact pour les réseaux sociaux
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-[#090d18]/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'image'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Carte Image Sociale (PNG 16:9)</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'text'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Résumé Texte Réseaux (X / Telegram / SMS)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-[#070b14]">
          {activeTab === 'image' ? (
            <div className="space-y-4">
              {/* Visual Card Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black/60 shadow-2xl flex items-center justify-center p-2 group">
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Carte sociale du plan de trade"
                    className="w-full h-auto max-h-[440px] object-contain rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="py-24 text-slate-500 text-xs font-mono animate-pulse">
                    Génération de la carte sociale en cours...
                  </div>
                )}
              </div>

              {/* Action Bar for Image */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadImage}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger l'Image (PNG)</span>
                  </button>

                  <button
                    onClick={handleCopyImage}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
                  >
                    {copiedType === 'image' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">Image Copiée dans le Presse-Papier !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" />
                        <span>Copier l'Image</span>
                      </>
                    )}
                  </button>

                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-300 font-semibold text-xs border border-cyan-800/50 transition-all cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Partager...</span>
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-slate-500 font-mono">
                  Résolution : 1200 × 675 px
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Format selection */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTextFormat('twitter')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    textFormat === 'twitter'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Twitter className="w-3.5 h-3.5" />
                  <span>Twitter / X / Threads</span>
                </button>

                <button
                  onClick={() => setTextFormat('telegram')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    textFormat === 'telegram'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram / Discord (HTML/Mono)</span>
                </button>

                <button
                  onClick={() => setTextFormat('compact')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    textFormat === 'compact'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Compact (SMS / WhatsApp)</span>
                </button>
              </div>

              {/* Editable / readable preview box */}
              <div className="relative">
                <textarea
                  readOnly
                  value={currentText}
                  rows={textFormat === 'compact' ? 4 : 10}
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 outline-none leading-relaxed selection:bg-cyan-500/30 resize-none"
                />
              </div>

              {/* Action buttons for Text */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    {copiedType === 'text' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Texte Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copier le Résumé Texte</span>
                      </>
                    )}
                  </button>

                  {textFormat === 'twitter' && (
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(getTwitterText())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-semibold text-xs border border-sky-500/30 transition-all cursor-pointer"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Publier sur X (Twitter)</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}

                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Partager</span>
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-slate-500 font-mono">
                  {currentText.length} caractères
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#090d18] flex items-center justify-between text-xs text-slate-500">
          <span>Prêt pour Twitter, Telegram, Discord, Instagram & WhatsApp</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
