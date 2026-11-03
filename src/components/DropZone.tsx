import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  UploadCloud, Image as ImageIcon, Sparkles, X, Layers, 
  ArrowRight, Clipboard, RefreshCw, Zap, CheckCircle2, ShieldCheck, Play 
} from 'lucide-react';
import { SAMPLE_CHARTS, SampleChart } from '../data/sampleCharts.ts';
import { compressImageClient } from '../utils/imageCompressor.ts';

interface DropZoneProps {
  onAnalyze: (imageBase64: string, userNotes: string, selectedSampleId?: string) => void;
  isLoading: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onAnalyze, isLoading }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [autoAnalyze, setAutoAnalyze] = useState<boolean>(true);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file reading and instant client compression
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (PNG, JPG, WebP).');
      return;
    }

    setIsProcessingFile(true);
    try {
      // Compress to lightweight 1600px JPEG in milliseconds
      const compressedDataUrl = await compressImageClient(file, 1600);
      const name = file.name || 'Capture_TradingView.png';
      
      setSelectedImage(compressedDataUrl);
      setImageName(name);
      setActiveSampleId(null);

      // Auto-trigger analysis immediately if enabled
      if (autoAnalyze) {
        setTimeout(() => {
          onAnalyze(compressedDataUrl, userNotes, undefined);
        }, 100);
      }
    } catch (err) {
      console.error('Erreur compression image:', err);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Clipboard paste handler
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          break;
        }
      }
    }
  }, [userNotes, autoAnalyze]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const selectSample = async (sample: SampleChart) => {
    setIsProcessingFile(true);
    try {
      setSelectedImage(sample.dataUrl);
      setImageName(sample.name);
      setActiveSampleId(sample.id);

      // Trigger analysis immediately
      setTimeout(() => {
        onAnalyze(sample.dataUrl, sample.description, sample.id);
      }, 100);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImageName('');
    setActiveSampleId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartAnalysis = () => {
    if (!selectedImage) return;
    onAnalyze(selectedImage, userNotes, activeSampleId || undefined);
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 transition-all duration-300 text-center ${
          isDragOver
            ? 'border-emerald-400 bg-emerald-950/20 scale-[1.01]'
            : selectedImage
            ? 'border-emerald-500/50 bg-[#0d1322]'
            : 'border-slate-700/80 hover:border-slate-600 bg-[#0a0f1d]/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />

        {selectedImage ? (
          <div className="space-y-4">
            {/* Action Bar On Top of Image */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white font-mono">
                  {imageName || 'Capture prête'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartAnalysis}
                  disabled={isLoading || isProcessingFile}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Analyser Maintenant</span>
                </button>

                <button
                  onClick={clearImage}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thumbnail Preview */}
            <div className="relative group max-h-[360px] overflow-hidden rounded-2xl border border-slate-700 bg-black/40 flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Graphique TradingView à analyser"
                className="max-h-[340px] w-auto object-contain rounded-xl shadow-2xl transition-transform group-hover:scale-[1.01]"
              />
            </div>

            {/* Optional trader notes */}
            <div className="max-w-xl mx-auto pt-1">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 px-1">
                <span>Note / Contexte pour l'IA (optionnel) :</span>
                <span className="text-[11px] text-slate-500">Ex: Scalp 15m, swing, FVG...</span>
              </div>
              <input
                type="text"
                placeholder="Ex: Je vise un achat sur le retest de l'Order Block, qu'en penses-tu ?"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
              />
            </div>

            {/* Main Launch button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleStartAnalysis}
                disabled={isLoading || isProcessingFile}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Lancer l'Analyse Technique IA (Gemini 3.8)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
              >
                Remplacer la capture
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <UploadCloud className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                Déposez votre capture TradingView ici
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Glissez-déposez une capture d'écran, collez directement avec{' '}
                <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-400 font-mono text-xs">
                  Ctrl+V
                </kbd>{' '}
                ou cliquez pour parcourir.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Sélectionner une capture</span>
              </button>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <Clipboard className="w-3.5 h-3.5 text-slate-400" />
                <span>Coller actif (Presse-papier)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auto-analyze Option Toggle */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-400">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoAnalyze}
            onChange={(e) => setAutoAnalyze(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 focus:ring-1 cursor-pointer accent-emerald-500"
          />
          <span className="text-slate-300 font-medium">
            Lancer l'analyse immédiatement dès l'import de l'image
          </span>
        </label>
        <span className="text-[11px] text-slate-500 hidden sm:inline font-mono">
          Compression haute vitesse automatique
        </span>
      </div>

      {/* Quick Test Presets */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-2.5 px-1">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Ou testez instantanément en 1 clic sur ces graphiques réels :
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SAMPLE_CHARTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => selectSample(sample)}
              disabled={isLoading || isProcessingFile}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between group disabled:opacity-50 ${
                activeSampleId === sample.id
                  ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-500/10'
                  : 'bg-[#0d1322]/80 hover:bg-[#131c31] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-white font-mono group-hover:text-emerald-400 transition-colors">
                    {sample.asset}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      sample.expectedRecommendation === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : sample.expectedRecommendation === 'SELL'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {sample.expectedRecommendation}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                  {sample.description}
                </div>
              </div>
              <div className="text-[10px] text-cyan-400 font-mono mt-2 flex items-center gap-1 group-hover:text-emerald-300 transition-colors">
                <Play className="w-3 h-3 fill-cyan-400 group-hover:fill-emerald-300" />
                <span>Analyser en 1 clic</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
