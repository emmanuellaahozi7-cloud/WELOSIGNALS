import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, X, Layers, ArrowRight, Clipboard, Eye, RefreshCw } from 'lucide-react';
import { SAMPLE_CHARTS, SampleChart } from '../data/sampleCharts.ts';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file reading
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      setImageName(file.name);
      setActiveSampleId(null);
    };
    reader.readAsDataURL(file);
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
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const selectSample = (sample: SampleChart) => {
    setSelectedImage(sample.dataUrl);
    setImageName(sample.name);
    setActiveSampleId(sample.id);
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
    <div className="w-full">
      {/* Upload Box */}
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
            <div className="relative group max-h-[420px] overflow-hidden rounded-2xl border border-slate-700 bg-black/40 flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Graphique TradingView à analyser"
                className="max-h-[380px] w-auto object-contain rounded-xl shadow-2xl transition-transform group-hover:scale-[1.01]"
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-mono text-emerald-400 border border-emerald-500/30">
                  {imageName || 'Graphique TradingView'}
                </span>
                <button
                  onClick={clearImage}
                  className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white shadow-lg transition-colors cursor-pointer"
                  title="Supprimer l'image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Optional trader notes */}
            <div className="max-w-xl mx-auto pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 px-1">
                <span>Note / Contexte optionnel pour l'IA :</span>
                <span className="text-[11px] text-slate-500">Ex: Scalp 15m, swing, focus sur le FVG...</span>
              </div>
              <input
                type="text"
                placeholder="Ex: Je vise un achat sur le retest de l'Order Block, qu'en penses-tu ?"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
              />
            </div>

            {/* Launch button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleStartAnalysis}
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Analyse Price Action & SMC en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Lancer l'Analyse Technique IA (Gemini 3.8)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
              >
                Changer d'image
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
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
                ou parcourez vos fichiers.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 shadow-md transition-all cursor-pointer hover:border-slate-600 flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Sélectionner un fichier</span>
              </button>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <Clipboard className="w-3.5 h-3.5 text-slate-400" />
                <span>Coller actif (Presse-papier)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Test Presets */}
      <div className="mt-5">
        <div className="flex items-center gap-2 mb-2.5 px-1">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Graphiques de test rapides (Prêts en 1 clic) :
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SAMPLE_CHARTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => selectSample(sample)}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between group ${
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
              <div className="text-[10px] text-cyan-400 font-mono mt-2 flex items-center gap-1">
                <span>Tester ce setup</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
