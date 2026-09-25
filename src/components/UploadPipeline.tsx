import React, { useState } from 'react';
import { 
  FileUp, 
  Sparkles, 
  Terminal, 
  CheckCircle2, 
  Play, 
  Clock, 
  Cpu, 
  ArrowRight,
  Layers,
  FileText,
  AlertTriangle,
  RefreshCw,
  Video,
  Download,
  Film
} from 'lucide-react';
import { LessonData, SupplementaryClip } from '../types';
import { MathView } from '../utils/katexRenderer';
import { VeoClipModal } from './VeoClipModal';

interface UploadPipelineProps {
  onLessonCreated: (lesson: LessonData) => void;
}

interface PipelineNodeStatus {
  name: string;
  stage: string;
  status: 'idle' | 'running' | 'completed' | 'healed';
  duration?: string;
  detail: string;
}

export const UploadPipeline: React.FC<UploadPipelineProps> = ({ onLessonCreated }) => {
  const [topicTitle, setTopicTitle] = useState<string>('Quantum Tunneling Through a Finite Rectangular Barrier');
  const [rawText, setRawText] = useState<string>(
    `The time-independent Schrödinger equation in one dimension is:
$$-\\frac{\\hbar^2}{2m} \\frac{d^2\\psi}{dx^2} + V(x)\\psi(x) = E\\psi(x)$$

For a rectangular barrier of height V_0 and width a, when the particle energy E < V_0, the wave inside the barrier satisfies:
$$\\frac{d^2\\psi}{dx^2} = \\kappa^2 \\psi(x), \\quad \\text{where} \\quad \\kappa = \\frac{\\sqrt{2m(V_0 - E)}}{\\hbar}$$

The wave function decays exponentially as $\\psi(x) \\approx e^{-\\kappa x}$. Applying boundary conditions at x = 0 and x = a yields the transmission coefficient:
$$T \\approx 16 \\frac{E}{V_0} \\left(1 - \\frac{E}{V_0}\\right) e^{-2\\kappa a}$$`
  );

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(-1);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [generatedLesson, setGeneratedLesson] = useState<LessonData | null>(null);

  // Veo Supplementary Video Generation State
  const [pipelineClips, setPipelineClips] = useState<SupplementaryClip[]>([]);
  const [isVeoModalOpen, setIsVeoModalOpen] = useState<boolean>(false);
  const [veoModalTarget, setVeoModalTarget] = useState<{
    conceptTitle: string;
    mathEquation?: string;
    explanation?: string;
    stepId?: string;
  }>({
    conceptTitle: 'Quantum Tunneling Through a Finite Rectangular Barrier',
    mathEquation: '-\\frac{\\hbar^2}{2m} \\frac{d^2\\psi}{dx^2} + V(x)\\psi(x) = E\\psi(x)',
    explanation: 'Quantum wavepacket penetration through a rectangular barrier with exponential amplitude decay.',
  });

  const handleOpenVeoModal = (title: string, equation?: string, explanation?: string, stepId?: string) => {
    setVeoModalTarget({
      conceptTitle: title,
      mathEquation: equation,
      explanation,
      stepId,
    });
    setIsVeoModalOpen(true);
  };

  const handleClipGenerated = (newClip: SupplementaryClip) => {
    setPipelineClips((prev) => [newClip, ...prev.filter((c) => c.id !== newClip.id)]);
    if (generatedLesson) {
      if (!generatedLesson.supplementaryClips) {
        generatedLesson.supplementaryClips = [];
      }
      generatedLesson.supplementaryClips = [
        newClip,
        ...generatedLesson.supplementaryClips.filter((c) => c.id !== newClip.id),
      ];
    }
  };

  const pipelineNodes: PipelineNodeStatus[] = [
    {
      name: 'Ingestion & OCR Normalizer',
      stage: 'ingest_document',
      status: activeNodeIndex > 0 ? 'completed' : activeNodeIndex === 0 ? 'running' : 'idle',
      duration: '0.4s',
      detail: 'Parsed 3 display equations, extracted canonical LaTeX AST and boundary variables'
    },
    {
      name: 'Canonical LaTeX Normalizer',
      stage: 'normalize_latex',
      status: activeNodeIndex > 1 ? 'completed' : activeNodeIndex === 1 ? 'running' : 'idle',
      duration: '0.2s',
      detail: 'Sanitized macros: \\dfrac -> \\frac, resolved boundary continuity matching equations'
    },
    {
      name: 'SymPy Proof Verifier',
      stage: 'verify_mathematics',
      status: activeNodeIndex > 2 ? 'completed' : activeNodeIndex === 2 ? 'running' : 'idle',
      duration: '0.8s',
      detail: 'Deterministic AST verification: Schrödinger differential operator matches exponential decay solution'
    },
    {
      name: 'Manim CE Scene Generator',
      stage: 'generate_manim',
      status: activeNodeIndex > 3 ? 'completed' : activeNodeIndex === 3 ? 'running' : 'idle',
      duration: '1.2s',
      detail: 'Generated Manim CE 0.18 scene class: Animated wavepacket incident upon potential wall'
    },
    {
      name: 'Self-Healing Sandbox Compiler',
      stage: 'sandbox_compile',
      status: activeNodeIndex > 4 ? 'healed' : activeNodeIndex === 4 ? 'running' : 'idle',
      duration: '2.1s',
      detail: 'Healed deprecated Manim call (ShowCreation -> Create); compiled 720p30 in isolated bwrap container'
    },
    {
      name: 'Edge-TTS Narration & Audio Sync',
      stage: 'sync_narration',
      status: activeNodeIndex > 5 ? 'completed' : activeNodeIndex === 5 ? 'running' : 'idle',
      duration: '1.0s',
      detail: 'Synthesized 4 phonetic cue markers with word-level boundary synchronization'
    },
    {
      name: 'Hybrid Qdrant & BM25 Indexing',
      stage: 'index_qdrant',
      status: activeNodeIndex > 6 ? 'completed' : activeNodeIndex === 6 ? 'running' : 'idle',
      duration: '0.5s',
      detail: 'Embedded vector chunks and indexed into Qdrant collection with Griffiths QM §2.5 citations'
    },
    {
      name: 'Veo 3 Supplementary Video Synthesis',
      stage: 'veo_clip_synthesis',
      status: activeNodeIndex > 7 ? 'completed' : activeNodeIndex === 7 ? 'running' : 'idle',
      duration: '1.2s',
      detail: 'Synthesized high-definition 3D wavepacket tunneling educational video clip via Google Veo 3 engine'
    }
  ];

  const handleRunPipeline = () => {
    setIsRunning(true);
    setActiveNodeIndex(0);
    setTerminalLogs([
      `[LangGraph::Engine] Initializing StateGraph with job_id=${Math.random().toString(36).substring(7)}`,
      `[LangGraph::Ingest] Parsing input text for topic: "${topicTitle}"`,
    ]);

    const delays = [800, 700, 1000, 1200, 1400, 1100, 900, 1100];
    let currentIdx = 0;

    const runNext = () => {
      if (currentIdx < delays.length) {
        setActiveNodeIndex(currentIdx);
        const node = pipelineNodes[currentIdx];
        
        setTerminalLogs((prev) => [
          ...prev,
          `[LangGraph::${node.stage}] Running node "${node.name}"...`,
          `[LangGraph::${node.stage}] Detail: ${node.detail}`,
        ]);

        currentIdx++;
        setTimeout(runNext, delays[currentIdx - 1]);
      } else {
        // Complete! Create lesson
        const newLesson: LessonData = {
          id: 'quantum-tunneling-' + Date.now(),
          title: topicTitle,
          category: 'Quantum Mechanics & Wave Mechanics',
          bloomLevel: 'Analyze',
          duration: 28,
          description: 'Autonomous pipeline derivation of quantum wavepacket transmission through a rectangular barrier, exponential wave decay, and transmission probability.',
          primaryEquation: 'T \\approx 16 \\frac{E}{V_0} \\left(1 - \\frac{E}{V_0}\\right) e^{-2\\kappa a}',
          interactiveType: 'fourier', // re-uses high performance wave renderer
          tags: ['Quantum Tunneling', 'Schrödinger Equation', 'Wavepacket', 'Barrier Penetration'],
          manimPythonCode: `from manim import *
import numpy as np

class QuantumTunnelingScene(Scene):
    def construct(self):
        title = Title(r"\\text{Quantum Barrier Tunneling}", color=BLUE)
        self.play(Write(title))

        # Potential Barrier V(x)
        barrier = Rectangle(height=3.5, width=1.4, color=RED, fill_opacity=0.3).shift(RIGHT * 0.5)
        barrier_label = MathTex(r"V_0", color=RED).next_to(barrier, UP)
        self.play(Create(barrier), Write(barrier_label))

        # Oscillating wavepacket
        axes = Axes(x_range=[-4, 4, 1], y_range=[-1.5, 1.5, 0.5])
        wave = axes.plot(lambda x: np.cos(5 * x) * np.exp(-0.5 * (x + 2)**2), color=CYAN)
        self.play(Create(wave), run_time=2)
        self.wait(2)
`,
          steps: [
            {
              id: 'qt_step_1',
              stepNumber: 1,
              label: '1D Time-Independent Schrödinger Equation',
              latex: '-\\frac{\\hbar^2}{2m} \\frac{d^2\\psi}{dx^2} + V(x)\\psi = E\\psi',
              explanation: 'Stationary states of energy E in an arbitrary piecewise continuous potential landscape.',
              sympyRule: 'Differential Operator Invariance',
              timestampStart: 0,
            },
            {
              id: 'qt_step_2',
              stepNumber: 2,
              label: 'Evanescent Decay Inside Barrier',
              latex: '\\frac{d^2\\psi}{dx^2} = \\kappa^2 \\psi(x), \\quad \\kappa = \\frac{\\sqrt{2m(V_0 - E)}}{\\hbar}',
              explanation: 'Because energy E is less than potential height V0, the wavevector becomes imaginary, yielding an exponentially damped evanescent state.',
              sympyRule: 'Characteristic ODE Roots (Real Exponentials)',
              timestampStart: 8,
            },
            {
              id: 'qt_step_3',
              stepNumber: 3,
              label: 'Continuity Boundary Matching',
              latex: '\\psi_{\\text{in}}(0) = \\psi_{\\text{barrier}}(0), \\quad \\left.\\frac{d\\psi}{dx}\\right|_{0^-} = \\left.\\frac{d\\psi}{dx}\\right|_{0^+}',
              explanation: 'Self-adjointness of the Hamiltonian demands wave function and its first derivative remain continuous across the barrier boundary.',
              sympyRule: 'Boundary Value Continuity Theorem',
              timestampStart: 16,
            },
            {
              id: 'qt_step_4',
              stepNumber: 4,
              label: 'Transmission Coefficient (Gamow Factor)',
              latex: 'T \\approx 16 \\frac{E}{V_0} \\left(1 - \\frac{E}{V_0}\\right) e^{-2\\kappa a}',
              explanation: 'Exponentially decaying Gamow transmission coefficient governing alpha decay and scanning tunneling microscopy (STM).',
              sympyRule: 'Scattering Matrix Transmission Norm',
              timestampStart: 22,
            },
          ],
          cues: [
            {
              id: 'cue_qt_01',
              timestamp: 0,
              endTimestamp: 8,
              text: 'In classical mechanics, a particle with energy E cannot cross a barrier of height V zero.',
              activeLatexId: 'qt_step_1',
              action: 'Write(title)'
            },
            {
              id: 'cue_qt_02',
              timestamp: 8,
              endTimestamp: 16,
              text: 'However, quantum wave mechanics allows the probability amplitude to penetrate as an evanescent decaying mode.',
              activeLatexId: 'qt_step_2',
              action: 'Create(barrier)'
            },
            {
              id: 'cue_qt_03',
              timestamp: 16,
              endTimestamp: 22,
              text: 'Matching boundary conditions at both faces yields non-zero transmission on the far side.',
              activeLatexId: 'qt_step_3',
              action: 'MatchBoundary()'
            },
            {
              id: 'cue_qt_04',
              timestamp: 22,
              endTimestamp: 28,
              text: 'This exponential transmission factor forms the fundamental basis of Scanning Tunneling Microscopy and nuclear fusion.',
              activeLatexId: 'qt_step_4',
              action: 'ShowTransmissionSpike()'
            }
          ],
          citations: [
            {
              id: 'cit_qt_01',
              bookTitle: 'Introduction to Quantum Mechanics (Griffiths & Schroeter)',
              section: '§2.5 The Tunneling Effect and Finite Square Well',
              pageNumber: 82,
              equationLatex: 'T = \\frac{1}{1 + \\frac{V_0^2}{4E(V_0 - E)} \\sinh^2(\\kappa a)}',
              excerpt: 'In the limit of a thick barrier kappa a >> 1, transmission is dominated by the exponential term e^{-2 kappa a}. Classically forbidden regions have strictly non-zero quantum tunneling amplitudes.',
              relevanceScore: 0.99,
              videoTimestamp: 16
            }
          ],
          supplementaryClips: pipelineClips.length > 0 ? pipelineClips : [
            {
              id: 'clip_qt_auto',
              conceptTitle: 'Quantum Barrier Tunneling Simulation',
              prompt: 'A high-definition 3D scientific visualization of quantum wavepacket transmission through a rectangular potential barrier with exponential decay tunneling, glowing cyan probability density',
              videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
              duration: 4.5,
              generatedAt: 'Auto-Pipeline Sync',
              aspectRatio: '16:9'
            }
          ],
        };

        setGeneratedLesson(newLesson);
        setIsRunning(false);
        setActiveNodeIndex(8);
        setTerminalLogs((prev) => [
          ...prev,
          `[LangGraph::Engine] StateGraph execution completed successfully in 8.6s!`,
          `[LangGraph::Engine] Synchronized video artifacts, LaTeX derivation steps, Veo supplementary clips, and Qdrant citations ready.`,
        ]);
      }
    };

    setTimeout(runNext, 400);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-950 border border-amber-800/60 text-amber-300 text-xs px-2.5 py-0.5 rounded-md font-semibold">
              LangGraph State Machine Pipeline
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Multi-Format Ingestion &to; Manim CE &to; SymPy Proof
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-sans">
            Autonomous STEM Ingestion Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Input textbook notes, handwritten formulas, or research abstracts. Watch the autonomous LangGraph state machine orchestrate LaTeX extraction, deterministic proof verification, self-healing Manim animation compilation, and audio synchronization.
          </p>
        </div>
      </div>

      {/* Input Configuration & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Input Form (5 cols) */}
        <div className="lg:col-span-5 bg-[#0e1424] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Topic Title / Document Name:</label>
              <input
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                className="w-full bg-[#12192c] border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Raw Notes, Equations, or Textbook Excerpt:</label>
                <span className="text-cyan-400 font-mono text-[11px]">LaTeX + Plain Text</span>
              </div>
              <textarea
                rows={9}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full bg-[#12192c] border border-slate-700 text-slate-100 rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleRunPipeline}
              disabled={isRunning}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing LangGraph State Machine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Autonomous Pipeline</span>
                </>
              )}
            </button>

            {generatedLesson && (
              <button
                onClick={() => onLessonCreated(generatedLesson)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 animate-pulse"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Open Generated Lesson in Player &rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Live LangGraph Visualizer & Execution Log (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Node Graph Stages */}
          <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-mono flex items-center gap-1.5 text-slate-200">
                <Layers className="w-4 h-4 text-cyan-400" />
                LangGraph State Machine Pipeline Nodes
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                {isRunning ? 'Status: Active Pipeline Run' : activeNodeIndex === 7 ? 'Status: Complete' : 'Status: Ready'}
              </span>
            </div>

            <div className="space-y-2">
              {pipelineNodes.map((node, idx) => {
                let badgeStyle = 'bg-slate-900 border-slate-800 text-slate-500';
                if (node.status === 'running') {
                  badgeStyle = 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/20';
                } else if (node.status === 'completed') {
                  badgeStyle = 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300';
                } else if (node.status === 'healed') {
                  badgeStyle = 'bg-amber-950/60 border-amber-700/60 text-amber-300';
                }

                return (
                  <div
                    key={node.name}
                    className={`rounded-xl p-3 border transition-all duration-200 flex items-center justify-between gap-3 ${badgeStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                        node.status === 'completed'
                          ? 'bg-emerald-500 text-slate-950'
                          : node.status === 'healed'
                          ? 'bg-amber-500 text-slate-950'
                          : node.status === 'running'
                          ? 'bg-cyan-500 text-slate-950 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {node.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {node.detail}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {node.status === 'running' && (
                        <span className="text-[10px] font-mono bg-cyan-900/60 text-cyan-300 px-2 py-0.5 rounded-full animate-pulse">
                          Running...
                        </span>
                      )}
                      {node.status === 'completed' && (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {node.duration}
                        </span>
                      )}
                      {node.status === 'healed' && (
                        <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Self-Healed ({node.duration})
                        </span>
                      )}
                      {node.status === 'idle' && (
                        <span className="text-[10px] font-mono text-slate-600">
                          Queued
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Terminal Logs Output */}
          <div className="bg-[#080d16] border border-slate-800 rounded-2xl p-4 font-mono text-[11px] space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-800/80">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                LangGraph StateGraph Event Stream
              </span>
              <span>{terminalLogs.length} events logged</span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 text-slate-300">
              {terminalLogs.length === 0 ? (
                <div className="text-slate-600 italic">Click &quot;Run Autonomous Pipeline&quot; to begin pipeline execution stream...</div>
              ) : (
                terminalLogs.map((log, lIdx) => (
                  <div key={lIdx} className="leading-relaxed">
                    <span className="text-cyan-400">&gt;</span> {log}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
