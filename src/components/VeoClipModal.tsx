import React, { useState } from 'react';
import { 
  Video, 
  X, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Download, 
  Play, 
  Layers, 
  Film,
  Maximize2
} from 'lucide-react';
import { MathView } from '../utils/katexRenderer';
import { SupplementaryClip } from '../types';
import { generateVeoEducationalClip, buildPedagogicalPrompt } from '../utils/veoService';

interface VeoClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  conceptTitle: string;
  mathEquation?: string;
  explanation?: string;
  stepId?: string;
  existingClips?: SupplementaryClip[];
  onClipGenerated: (clip: SupplementaryClip) => void;
}

export const VeoClipModal: React.FC<VeoClipModalProps> = ({
  isOpen,
  onClose,
  conceptTitle,
  mathEquation,
  explanation,
  stepId,
  existingClips = [],
  onClipGenerated,
}) => {
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [prompt, setPrompt] = useState<string>(() => 
    buildPedagogicalPrompt(conceptTitle, mathEquation, explanation)
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentClip, setCurrentClip] = useState<SupplementaryClip | null>(null);

  // Update default prompt whenever concept changes
  React.useEffect(() => {
    if (isOpen) {
      setPrompt(buildPedagogicalPrompt(conceptTitle, mathEquation, explanation));
      // If there's an existing clip for this step, set it as current preview
      const matching = existingClips.find(c => c.stepId === stepId || c.conceptTitle === conceptTitle);
      if (matching) {
        setCurrentClip(matching);
      } else {
        setCurrentClip(null);
      }
    }
  }, [isOpen, conceptTitle, mathEquation, explanation, stepId]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgressPercent(10);
    setProgressStatus('Initiating Veo 3 engine...');

    try {
      const clip = await generateVeoEducationalClip({
        conceptTitle,
        mathEquation,
        explanation,
        customPrompt: prompt,
        aspectRatio,
        stepId,
        onProgress: (status, pct) => {
          setProgressStatus(status);
          setProgressPercent(pct);
        },
      });

      setCurrentClip(clip);
      onClipGenerated(clip);
    } catch (err: any) {
      console.error('Error generating clip:', err);
      setProgressStatus('Generation encountered an issue: ' + (err.message || 'Error'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0e1424] border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#090d16] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Generate Supplementary Video Clip
                </h3>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded-full font-medium">
                  Veo 3 Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md">
                Concept: <span className="text-cyan-300 font-medium">{conceptTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">

          {/* Math Equation & Concept Context Card */}
          {mathEquation && (
            <div className="bg-[#12192c] border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Mathematical Target Equation:
              </div>
              <div className="bg-[#090d16] p-2.5 rounded-xl border border-slate-800">
                <MathView math={mathEquation} block />
              </div>
              {explanation && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {explanation}
                </p>
              )}
            </div>
          )}

          {/* Video Preview If Generated */}
          {currentClip && (
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Supplementary Video Clip Ready
                </span>
                <span className="text-[11px] text-slate-500">
                  Format: {currentClip.aspectRatio || '16:9'} &bull; Generated {currentClip.generatedAt}
                </span>
              </div>

              <div className={`relative rounded-xl overflow-hidden border border-slate-800 bg-black ${
                currentClip.aspectRatio === '9:16' ? 'max-w-[260px] mx-auto aspect-[9/16]' : 'aspect-video'
              }`}>
                <video
                  key={currentClip.videoUrl}
                  src={currentClip.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[11px] text-slate-400 italic truncate max-w-sm">
                  {currentClip.conceptTitle}
                </span>
                <a
                  href={currentClip.videoUrl}
                  download={`veo-${conceptTitle.toLowerCase().replace(/\s+/g, '-')}.mp4`}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-lg transition flex items-center gap-1.5 font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4</span>
                </a>
              </div>
            </div>
          )}

          {/* Veo Prompt Formulation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">Veo 3 Prompt Specification:</label>
              <button
                type="button"
                onClick={() => setPrompt(buildPedagogicalPrompt(conceptTitle, mathEquation, explanation))}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Reset to Default
              </button>
            </div>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the 3D scientific visualization for Veo 3..."
              className="w-full bg-[#12192c] border border-slate-700 text-slate-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Aspect Ratio:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition flex items-center justify-center gap-2 ${
                  aspectRatio === '16:9'
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
                    : 'bg-[#12192c] border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>16:9 (Landscape - Desktop &amp; Board)</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition flex items-center justify-center gap-2 ${
                  aspectRatio === '9:16'
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
                    : 'bg-[#12192c] border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5 rotate-90" />
                <span>9:16 (Portrait - Mobile Shorts)</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="space-y-2 bg-[#090d16] border border-slate-800 rounded-2xl p-4">
              <div className="flex justify-between text-xs text-slate-300 font-medium">
                <span className="truncate max-w-[280px]">{progressStatus}</span>
                <span className="text-indigo-400 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-[#090d16] border-t border-slate-800 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            {currentClip ? 'Done' : 'Cancel'}
          </button>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating with Veo 3...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>{currentClip ? 'Regenerate Video Clip' : 'Generate Video Clip'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
