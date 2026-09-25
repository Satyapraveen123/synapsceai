import React, { useState, useEffect } from 'react';
import { 
  FileDown, 
  X, 
  Check, 
  Sparkles, 
  Layers, 
  Image as ImageIcon, 
  BookOpen, 
  Code2, 
  ShieldCheck, 
  Clock,
  Printer
} from 'lucide-react';
import { LessonData } from '../types';
import { MathView } from '../utils/katexRenderer';
import { exportLessonToPdf, PdfExportOptions } from '../utils/pdfGenerator';
import { generateKeyframeImages } from './InteractiveCanvas';

interface PdfExportModalProps {
  lesson: LessonData;
  simParams?: Record<string, any>;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  lesson,
  simParams = {},
  isOpen,
  onClose,
}) => {
  const [options, setOptions] = useState<PdfExportOptions>({
    includeKeyframes: true,
    includeDerivationSteps: true,
    includeSympyRules: true,
    includeCitations: true,
    includeManimCode: true,
  });

  const [keyframes, setKeyframes] = useState<{
    stepNumber: number;
    label: string;
    timestamp: number;
    dataUrl: string;
    latex: string;
  }[]>([]);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Generate preview keyframes when modal opens
  useEffect(() => {
    if (isOpen) {
      const frames = generateKeyframeImages(lesson, simParams);
      setKeyframes(frames);
      setDownloadSuccess(false);
    }
  }, [isOpen, lesson, simParams]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      await exportLessonToPdf(lesson, {
        ...options,
        simParams,
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0e1424] border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-[#090d16] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                Export Lesson PDF Summary
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                  jsPDF Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {lesson.title}
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

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Document Preview Card */}
          <div className="bg-[#12192c] border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between text-xs gap-2">
              <span className="font-bold text-white text-sm">
                {lesson.title}
              </span>
              <span className="font-mono text-cyan-400 text-[11px] bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                {lesson.category} &bull; {lesson.bloomLevel}
              </span>
            </div>

            <div className="bg-[#090d16] border border-slate-800 rounded-xl p-2.5">
              <MathView math={lesson.primaryEquation} block />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {lesson.description}
            </p>
          </div>

          {/* Captured Keyframe Thumbnails Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                Captured Animation Keyframes ({keyframes.length} steps):
              </span>
              <span className="text-[11px] font-mono text-slate-500">640x360 rendered snapshots</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {keyframes.map((kf) => (
                <div
                  key={kf.stepNumber}
                  className="bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden shadow-sm group hover:border-cyan-500/50 transition"
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img
                      src={kf.dataUrl}
                      alt={kf.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-mono text-cyan-300 px-1 py-0.2 rounded">
                      t={kf.timestamp}s
                    </span>
                  </div>
                  <div className="p-1.5 text-[10px] text-slate-300 font-medium truncate">
                    Step {kf.stepNumber}: {kf.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Customization Checkboxes */}
          <div className="space-y-2.5 bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Include Document Sections:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              
              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={options.includeKeyframes}
                  onChange={(e) => setOptions((o) => ({ ...o, includeKeyframes: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  Visual Keyframe Snapshots
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={options.includeDerivationSteps}
                  onChange={(e) => setOptions((o) => ({ ...o, includeDerivationSteps: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  LaTeX Step Derivations
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={options.includeSympyRules}
                  onChange={(e) => setOptions((o) => ({ ...o, includeSympyRules: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  SymPy Invariant Proof Badges
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={options.includeCitations}
                  onChange={(e) => setOptions((o) => ({ ...o, includeCitations: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  Textbook &amp; Paper Citations
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={options.includeManimCode}
                  onChange={(e) => setOptions((o) => ({ ...o, includeManimCode: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-amber-400" />
                  Manim CE 0.18 Python Script
                </span>
              </label>

            </div>
          </div>

          {/* Success toast if downloaded */}
          {downloadSuccess && (
            <div className="bg-emerald-950/80 border border-emerald-500/80 rounded-2xl p-3.5 text-xs text-emerald-200 flex items-center gap-2.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Success!</strong> PDF summary for &quot;{lesson.title}&quot; has been generated and downloaded to your device.
              </span>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="bg-[#090d16] border-t border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
            Target: A4 Portrait PDF &bull; High DPI
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition flex-1 sm:flex-initial"
            >
              Cancel
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Compiling PDF Document...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Download PDF Summary</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
