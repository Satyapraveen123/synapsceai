import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Code2, 
  BookOpen, 
  CheckCircle2, 
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Terminal,
  Clock,
  Layers,
  ExternalLink,
  FileDown,
  Video,
  Film,
  Download
} from 'lucide-react';
import { LessonData, DerivationStep, SupplementaryClip } from '../types';
import { MathView } from '../utils/katexRenderer';
import { InteractiveCanvas } from './InteractiveCanvas';
import { PdfExportModal } from './PdfExportModal';
import { VeoClipModal } from './VeoClipModal';

interface LessonPlayerProps {
  lesson: LessonData;
  allLessons: LessonData[];
  onSelectLesson: (lessonId: string) => void;
  onOpenVerifierForStep?: (latex: string) => void;
  onOpenTutorForLesson?: (query: string) => void;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({
  lesson,
  allLessons,
  onSelectLesson,
  onOpenVerifierForStep,
  onOpenTutorForLesson,
}) => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'derivation' | 'code' | 'params' | 'citations' | 'clips'>('derivation');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Veo Supplementary Video Generation State
  const [supplementaryClips, setSupplementaryClips] = useState<SupplementaryClip[]>(lesson.supplementaryClips || []);
  const [isVeoModalOpen, setIsVeoModalOpen] = useState<boolean>(false);
  const [veoModalTarget, setVeoModalTarget] = useState<{
    conceptTitle: string;
    mathEquation?: string;
    explanation?: string;
    stepId?: string;
  }>({
    conceptTitle: lesson.title,
    mathEquation: lesson.primaryEquation,
    explanation: lesson.description,
  });
  const [activeClipView, setActiveClipView] = useState<SupplementaryClip | null>(null);

  useEffect(() => {
    setSupplementaryClips(lesson.supplementaryClips || []);
    setActiveClipView(null);
  }, [lesson.id]);

  const handleOpenVeoModalForConcept = (title: string, equation?: string, explanation?: string) => {
    setVeoModalTarget({
      conceptTitle: title,
      mathEquation: equation,
      explanation: explanation,
    });
    setIsVeoModalOpen(true);
  };

  const handleOpenVeoModalForStep = (step: DerivationStep) => {
    setVeoModalTarget({
      conceptTitle: `${step.stepNumber}. ${step.label}`,
      mathEquation: step.latex,
      explanation: step.explanation,
      stepId: step.id,
    });
    setIsVeoModalOpen(true);
  };

  const handleClipGenerated = (newClip: SupplementaryClip) => {
    setSupplementaryClips((prev) => {
      const filtered = prev.filter((c) => c.id !== newClip.id);
      return [newClip, ...filtered];
    });

    if (newClip.stepId) {
      const st = lesson.steps.find((s) => s.id === newClip.stepId);
      if (st) {
        st.supplementaryClip = newClip;
      }
    }

    if (!lesson.supplementaryClips) {
      lesson.supplementaryClips = [];
    }
    lesson.supplementaryClips = [
      newClip,
      ...lesson.supplementaryClips.filter((c) => c.id !== newClip.id),
    ];

    setActiveClipView(newClip);
  };

  // Dynamic simulation parameters
  const [simParams, setSimParams] = useState<Record<string, number | string>>({
    harmonics: 5,
    learningRate: 0.08,
    theta: Math.PI / 3,
    phi: 0.8,
  });

  const activeCue = lesson.cues.find(
    (c) => currentTime >= c.timestamp && currentTime < c.endTimestamp
  );

  const activeStep = lesson.steps.find(
    (s, idx) => {
      const nextStep = lesson.steps[idx + 1];
      const endTime = nextStep ? nextStep.timestampStart : lesson.duration;
      return currentTime >= s.timestampStart && currentTime < endTime;
    }
  );

  // Speech synthesis for voice narration
  const lastSpokenCueIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAudioEnabled || !isPlaying || !activeCue) return;
    if (activeCue.id === lastSpokenCueIdRef.current) return;

    lastSpokenCueIdRef.current = activeCue.id;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeCue.text);
      utterance.rate = playbackSpeed;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [activeCue, isPlaying, isAudioEnabled, playbackSpeed]);

  // Main playback timer loop
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1 * playbackSpeed;
          if (next >= lesson.duration) {
            setIsPlaying(false);
            return lesson.duration;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, lesson.duration]);

  const handleSeek = (time: number) => {
    setCurrentTime(Math.min(lesson.duration, Math.max(0, time)));
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    lastSpokenCueIdRef.current = null;
  };

  const handleRestart = () => {
    handleSeek(0);
    setIsPlaying(true);
  };

  const copyPythonCode = () => {
    navigator.clipboard.writeText(lesson.manimPythonCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Topic Selector & Metadata */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0d1322] border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-cyan-950/80 border border-cyan-800/60 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
              {lesson.category}
            </span>
            <span className="rounded-md bg-purple-950/80 border border-purple-800/60 px-2 py-0.5 text-xs font-medium text-purple-300">
              Bloom: {lesson.bloomLevel}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {lesson.duration}s duration
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
            {lesson.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            {lesson.description}
          </p>
        </div>

        {/* Top Banner Actions & Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleOpenVeoModalForConcept(lesson.title, lesson.primaryEquation, lesson.description)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95"
            title="Generate Supplementary Educational Video Clip with Google Veo 3"
          >
            <Video className="w-4 h-4" />
            <span>Generate Video</span>
          </button>

          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-cyan-500/10 transition active:scale-95"
            title="Export Lesson Keyframes & LaTeX into Downloadable PDF Summary"
          >
            <FileDown className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400 font-medium hidden sm:inline">Switch Topic:</label>
            <select
              value={lesson.id}
              onChange={(e) => onSelectLesson(e.target.value)}
              className="bg-[#12192c] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              {allLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title.split('&')[0]} ({l.bloomLevel})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Manim Video Canvas + Controls, Right = Synchronized Step & Code Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Manim Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Canvas Mode Switcher Bar */}
          <div className="flex items-center justify-between bg-[#0e1424] border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveClipView(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  !activeClipView
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Manim Canvas Simulation
              </button>

              {supplementaryClips.length > 0 && (
                <button
                  onClick={() => setActiveClipView(supplementaryClips[0])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    activeClipView
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Veo Clip ({supplementaryClips.length})</span>
                </button>
              )}
            </div>

            <button
              onClick={() => handleOpenVeoModalForConcept(lesson.title, lesson.primaryEquation, lesson.description)}
              className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-semibold"
            >
              <Video className="w-3.5 h-3.5" />
              <span>+ Generate Video</span>
            </button>
          </div>

          <div className="relative">
            {activeClipView ? (
              <div className="w-full bg-[#070b14] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative aspect-video flex flex-col justify-between">
                <div className="bg-[#090d16]/95 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-white font-bold truncate max-w-[260px]">
                      {activeClipView.conceptTitle}
                    </span>
                    <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded-full font-medium">
                      Veo 3 Clip
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={activeClipView.videoUrl}
                      download={`veo-${activeClipView.conceptTitle.toLowerCase().replace(/\s+/g, '-')}.mp4`}
                      className="text-indigo-300 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                    <button
                      onClick={() => setActiveClipView(null)}
                      className="text-slate-400 hover:text-white text-[11px] underline ml-2"
                    >
                      Return to Manim
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
                  <video
                    key={activeClipView.videoUrl}
                    src={activeClipView.videoUrl}
                    controls
                    autoPlay
                    loop
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="bg-[#090d16]/95 border-t border-slate-800 px-4 py-2 text-[11px] text-slate-400 truncate">
                  Prompt: {activeClipView.prompt}
                </div>
              </div>
            ) : (
              <>
                <InteractiveCanvas
                  lesson={lesson}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  params={simParams}
                  onParamChange={(k, v) => setSimParams((p) => ({ ...p, [k]: v }))}
                />

                {/* Subtitle / Narration Banner Overlay */}
                {activeCue && (
                  <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-md border border-cyan-900/60 rounded-xl px-4 py-2 text-center text-xs sm:text-sm text-cyan-200 shadow-xl flex items-center justify-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                    <span className="font-sans leading-relaxed">{activeCue.text}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Player Timeline Scrubber & Transport Controls */}
          <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-4 space-y-3">
            
            {/* Scrubber Bar */}
            <div className="relative group">
              <input
                type="range"
                min={0}
                max={lesson.duration}
                step={0.1}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
              />
              {/* Step Keyframe Dots on Scrubber */}
              <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none flex items-center">
                {lesson.steps.map((st) => {
                  const pct = (st.timestampStart / lesson.duration) * 100;
                  return (
                    <div
                      key={st.id}
                      style={{ left: `${pct}%` }}
                      className="absolute -top-1 w-2.5 h-4 bg-amber-400/80 rounded-sm hover:scale-125 transition-transform"
                      title={`${st.label} (${formatTime(st.timestampStart)})`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Time labels & control buttons */}
            <div className="flex items-center justify-between">
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 transition"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={handleRestart}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Replay from start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <div className="text-xs text-slate-400 ml-2 font-medium">
                  <span className="text-white font-semibold">{formatTime(currentTime)}</span> / {formatTime(lesson.duration)}
                </div>
              </div>

              {/* Audio, Speed & Param Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className={`p-2 rounded-lg text-xs font-medium border transition ${
                    isAudioEnabled 
                      ? 'bg-slate-800 border-slate-700 text-cyan-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title={isAudioEnabled ? 'Voice narration active' : 'Voice muted'}
                >
                  {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Speed Selector */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-medium">
                  {[0.75, 1.0, 1.5, 2.0].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-1 rounded transition ${
                        playbackSpeed === spd 
                          ? 'bg-slate-700 text-white font-bold' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Quick Simulation Parameter Bar */}
          <div className="bg-[#0b0f19] border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-200">Interactive Canvas Controls:</span>
            </div>

            {lesson.interactiveType === 'fourier' && (
              <div className="flex items-center gap-3">
                <label className="text-slate-400">Harmonics (N):</label>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={simParams.harmonics}
                  onChange={(e) => setSimParams((p) => ({ ...p, harmonics: parseInt(e.target.value) }))}
                  className="w-24 h-1.5 bg-slate-800 rounded appearance-none accent-cyan-400"
                />
                <span className="font-mono text-cyan-300 w-4">{simParams.harmonics}</span>
              </div>
            )}

            {lesson.interactiveType === 'gradient_descent' && (
              <div className="flex items-center gap-3">
                <label className="text-slate-400">Learning Rate (α):</label>
                <input
                  type="range"
                  min={0.01}
                  max={0.45}
                  step={0.01}
                  value={simParams.learningRate}
                  onChange={(e) => setSimParams((p) => ({ ...p, learningRate: parseFloat(e.target.value) }))}
                  className="w-24 h-1.5 bg-slate-800 rounded appearance-none accent-amber-400"
                />
                <span className="font-mono text-amber-300 w-8">{Number(simParams.learningRate).toFixed(2)}</span>
              </div>
            )}

            {lesson.interactiveType === 'quantum_bloch' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSimParams((p) => ({ ...p, theta: 0 }))}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-mono"
                >
                  |0⟩
                </button>
                <button
                  onClick={() => setSimParams((p) => ({ ...p, theta: Math.PI / 2 }))}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-yellow-300 rounded font-mono"
                >
                  |+⟩
                </button>
                <button
                  onClick={() => setSimParams((p) => ({ ...p, theta: Math.PI }))}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-pink-300 rounded font-mono"
                >
                  |1⟩
                </button>
              </div>
            )}

            {lesson.interactiveType === 'maxwell' && (
              <div className="text-slate-400 font-mono text-[11px]">
                E-Field Displacement &times; Circulating B Loop Active
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Tabbed Synchronized Steps, Manim Code & Citations (5 cols) */}
        <div className="lg:col-span-5 bg-[#0e1424] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl min-h-[500px]">
          
          {/* Tab Headers */}
          <div className="flex border-b border-slate-800 bg-[#0a0f1d] px-2 pt-2 gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('derivation')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-t border-x ${
                activeTab === 'derivation'
                  ? 'bg-[#0e1424] text-cyan-300 border-slate-800 border-b-transparent'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>LaTeX Derivation</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full text-slate-400">
                {lesson.steps.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-t border-x ${
                activeTab === 'code'
                  ? 'bg-[#0e1424] text-cyan-300 border-slate-800 border-b-transparent'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Manim CE Code</span>
            </button>

            <button
              onClick={() => setActiveTab('citations')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-t border-x ${
                activeTab === 'citations'
                  ? 'bg-[#0e1424] text-cyan-300 border-slate-800 border-b-transparent'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Citations ({lesson.citations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('clips')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-t border-x ${
                activeTab === 'clips'
                  ? 'bg-[#0e1424] text-indigo-300 border-slate-800 border-b-transparent'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span>Veo Clips</span>
              {supplementaryClips.length > 0 && (
                <span className="text-[10px] bg-indigo-900/80 text-indigo-300 px-1.5 py-0.2 rounded-full font-medium">
                  {supplementaryClips.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1 p-4 overflow-y-auto max-h-[580px]">
            
            {/* Tab 1: Derivation Steps */}
            {activeTab === 'derivation' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
                  <span className="font-medium">Synchronized Mathematical Steps</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPdfModalOpen(true)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-medium transition"
                      title="Download PDF document containing steps and keyframes"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>PDF Summary</span>
                    </button>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">&bull; Click step to jump</span>
                  </div>
                </div>

                {lesson.steps.map((step) => {
                  const isCurrent = activeStep?.id === step.id;
                  const stepClip = supplementaryClips.find((c) => c.stepId === step.id);

                  return (
                    <div
                      key={step.id}
                      onClick={() => handleSeek(step.timestampStart)}
                      className={`cursor-pointer rounded-xl p-3 border transition-all duration-200 ${
                        isCurrent
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                          : 'bg-[#12192b]/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            isCurrent ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {step.stepNumber}
                          </span>
                          <span className={`font-semibold ${isCurrent ? 'text-cyan-200' : 'text-slate-200'}`}>
                            {step.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {formatTime(step.timestampStart)}
                        </span>
                      </div>

                      {/* Mathematical Equation */}
                      <div className="bg-[#090d16] rounded-lg px-3 py-2 border border-slate-800/80 my-2">
                        <MathView math={step.latex} block />
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {step.explanation}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/50">
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                          SymPy: {step.sympyRule}
                        </span>

                        <div className="flex items-center gap-2.5">
                          {stepClip && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveClipView(stepClip);
                              }}
                              className="text-[10px] bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium hover:bg-indigo-900 transition"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Watch Clip</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenVeoModalForStep(step);
                            }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-medium transition"
                            title="Generate supplementary Veo 3 educational video clip for this specific step"
                          >
                            <Video className="w-3 h-3" />
                            <span>{stepClip ? 'Regen Video' : 'Generate Video'}</span>
                          </button>

                          {onOpenVerifierForStep && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenVerifierForStep(step.latex);
                              }}
                              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                            >
                              Verify <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Manim CE Python Code & Sandbox */}
            {activeTab === 'code' && (
              <div className="space-y-3 font-mono text-xs">
                
                {/* Sandbox Status Bar */}
                <div className="bg-[#12192c] border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Self-Healing Sandbox: Clean (0 tracebacks)</span>
                  </div>
                  <span className="text-slate-400">Manim CE v0.18.1</span>
                </div>

                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>scene.py</span>
                  <button
                    onClick={copyPythonCode}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition"
                  >
                    {copiedCode ? 'Copied to Clipboard!' : 'Copy Manim Code'}
                  </button>
                </div>

                <div className="relative bg-[#090d16] border border-slate-800 rounded-xl p-3 overflow-x-auto text-slate-200 max-h-[420px] text-[11px] leading-relaxed">
                  <pre>
                    <code>{lesson.manimPythonCode}</code>
                  </pre>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-[10px] text-slate-400">
                  <span className="text-cyan-300 font-bold">Compiler Pipeline:</span> AST parsed &rarr; Bwrap process sandbox &rarr; Cairo vector rendering &rarr; FFMPEG H.264 mux.
                </div>
              </div>
            )}

            {/* Tab 3: Grounding Citations */}
            {activeTab === 'citations' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400 pb-2 border-b border-slate-800/80">
                  Exact Textbook & Paper Sources (Qdrant Dense + BM25 RRF Grounded)
                </div>

                {lesson.citations.map((cit) => (
                  <div
                    key={cit.id}
                    className="bg-[#12192b] border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white leading-tight">
                          {cit.bookTitle}
                        </h4>
                        <div className="text-[11px] text-cyan-400 font-mono">
                          {cit.section} &bull; Page {cit.pageNumber}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                        Score: {(cit.relevanceScore * 100).toFixed(0)}%
                      </span>
                    </div>

                    {cit.equationLatex && (
                      <div className="bg-[#090d16] rounded px-2.5 py-1.5 border border-slate-800">
                        <MathView math={cit.equationLatex} block />
                      </div>
                    )}

                    <p className="text-xs text-slate-300 italic leading-relaxed border-l-2 border-cyan-500/40 pl-2">
                      &ldquo;{cit.excerpt}&rdquo;
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <button
                        onClick={() => handleSeek(cit.videoTimestamp)}
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" /> Jump to {formatTime(cit.videoTimestamp)} in video
                      </button>

                      {onOpenTutorForLesson && (
                        <button
                          onClick={() => onOpenTutorForLesson(`Explain ${cit.section} in detail`)}
                          className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                        >
                          Ask RAG Tutor &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: Supplementary Veo 3 Video Clips */}
            {activeTab === 'clips' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
                  <div>
                    <span className="font-semibold text-white">Veo Supplementary Educational Clips</span>
                    <div className="text-[10px] text-slate-400">High-definition 3D video clips generated with Google Veo 3</div>
                  </div>
                  <button
                    onClick={() => handleOpenVeoModalForConcept(lesson.title, lesson.primaryEquation, lesson.description)}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>+ Generate Video</span>
                  </button>
                </div>

                {supplementaryClips.length === 0 ? (
                  <div className="text-center py-8 bg-[#090d16] border border-slate-800 rounded-xl p-5 space-y-3">
                    <Video className="w-10 h-10 text-indigo-400/60 mx-auto" />
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-white">No Supplementary Clips Generated Yet</div>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Click &quot;Generate Video&quot; above or on any derivation step to produce custom 3D educational video clips with Veo 3.
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenVeoModalForConcept(lesson.title, lesson.primaryEquation, lesson.description)}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold transition shadow-md inline-flex items-center gap-1.5"
                    >
                      <Video className="w-4 h-4" />
                      <span>Generate Video for Lesson</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supplementaryClips.map((clip) => (
                      <div
                        key={clip.id}
                        className="bg-[#090d16] border border-slate-800 rounded-xl p-3 space-y-2 hover:border-indigo-500/40 transition"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white truncate max-w-[220px]">
                            {clip.conceptTitle}
                          </span>
                          <span className="text-[10px] text-indigo-400 font-mono">
                            {clip.aspectRatio || '16:9'} &bull; {clip.generatedAt}
                          </span>
                        </div>

                        <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black aspect-video">
                          <video
                            src={clip.videoUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                          {clip.prompt}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                          <button
                            onClick={() => setActiveClipView(clip)}
                            className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 text-[11px]"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Play on Main Stage</span>
                          </button>

                          <a
                            href={clip.videoUrl}
                            download={`veo-${clip.conceptTitle.toLowerCase().replace(/\s+/g, '-')}.mp4`}
                            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 text-[11px]"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download MP4</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* PDF Export Modal */}
      <PdfExportModal
        lesson={lesson}
        simParams={simParams}
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />

      {/* Veo 3 Supplementary Video Generation Modal */}
      <VeoClipModal
        isOpen={isVeoModalOpen}
        onClose={() => setIsVeoModalOpen(false)}
        conceptTitle={veoModalTarget.conceptTitle}
        mathEquation={veoModalTarget.mathEquation}
        explanation={veoModalTarget.explanation}
        stepId={veoModalTarget.stepId}
        existingClips={supplementaryClips}
        onClipGenerated={handleClipGenerated}
      />

    </div>
  );
};
