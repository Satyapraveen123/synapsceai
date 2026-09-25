import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Network, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Award, 
  Sparkles, 
  ChevronRight, 
  X, 
  HelpCircle,
  BarChart3,
  BrainCircuit,
  GraduationCap
} from 'lucide-react';
import { DAGNode, BloomQuizQuestion } from '../types';
import { INITIAL_DAG_NODES } from '../data/lessonsData';
import { MathView } from '../utils/katexRenderer';

export const MasteryGraph: React.FC = () => {
  const [nodes, setNodes] = useState<DAGNode[]>(INITIAL_DAG_NODES);
  const [selectedNode, setSelectedNode] = useState<DAGNode | null>(null);
  const [activeQuizQuestionIndex, setActiveQuizQuestionIndex] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  const bloomColorMap: Record<string, { bg: string; text: string; border: string }> = {
    Remember: { bg: 'bg-blue-950/70', text: 'text-blue-300', border: 'border-blue-800' },
    Understand: { bg: 'bg-cyan-950/70', text: 'text-cyan-300', border: 'border-cyan-800' },
    Apply: { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-800' },
    Analyze: { bg: 'bg-amber-950/70', text: 'text-amber-300', border: 'border-amber-800' },
    Evaluate: { bg: 'bg-purple-950/70', text: 'text-purple-300', border: 'border-purple-800' },
    Create: { bg: 'bg-pink-950/70', text: 'text-pink-300', border: 'border-pink-800' },
  };

  const openQuiz = (node: DAGNode) => {
    if (!node.isUnlocked) return;
    setSelectedNode(node);
    setActiveQuizQuestionIndex(0);
    setSelectedOptionIndex(null);
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleAnswerSubmit = () => {
    if (selectedOptionIndex === null || !selectedNode) return;
    setQuizSubmitted(true);

    const question = selectedNode.questions[activeQuizQuestionIndex];
    const isCorrect = selectedOptionIndex === question.correctIndex;

    if (isCorrect) {
      const newScore = Math.min(100, selectedNode.masteryPercentage + 15);
      setQuizScore(newScore);

      // Trigger celebratory confetti
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      // Update node in DAG
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === selectedNode.id) {
            return { ...n, masteryPercentage: newScore };
          }
          // Unlock dependents if prerequisite met
          if (n.prerequisites.includes(selectedNode.id) && newScore >= 70) {
            return { ...n, isUnlocked: true };
          }
          return n;
        })
      );
    }
  };

  const overallMastery = Math.round(
    nodes.reduce((acc, curr) => acc + curr.masteryPercentage, 0) / nodes.length
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-purple-950 border border-purple-800/60 text-purple-300 text-xs px-2.5 py-0.5 rounded-md font-semibold">
              Cognitive Depth Progression
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Bloom's Taxonomy Framework (Remember &rarr; Create)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-sans">
            Curriculum Prerequisite Directed Acyclic Graph (DAG)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            STEM mastery is non-linear. Complete diagnostic assessments to increase node proficiency, satisfy mathematical prerequisites, and unlock advanced research topics.
          </p>
        </div>

        {/* Global Mastery Metric */}
        <div className="bg-[#12192c] border border-slate-700/80 rounded-2xl p-4 flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Curriculum Mastery</div>
            <div className="text-2xl font-bold text-white">
              {overallMastery}%
            </div>
          </div>
        </div>
      </div>

      {/* Bloom's Hierarchy Legend Ribbon */}
      <div className="bg-[#090d16] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
          Cognitive Levels:
        </span>
        {Object.entries(bloomColorMap).map(([level, style]) => (
          <div
            key={level}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border ${style.bg} ${style.border} ${style.text} font-medium`}
          >
            <span className="w-2 h-2 rounded-full bg-current opacity-80" />
            <span>{level}</span>
          </div>
        ))}
      </div>

      {/* Interactive Node Graph Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node) => {
          const style = bloomColorMap[node.bloomLevel] || bloomColorMap.Remember;
          return (
            <div
              key={node.id}
              onClick={() => openQuiz(node)}
              className={`rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between ${
                node.isUnlocked
                  ? 'bg-[#0e1424] border-slate-800 hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer'
                  : 'bg-[#0a0e19] border-slate-900 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="space-y-3">
                {/* Node Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}>
                    Level: {node.bloomLevel}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {node.isUnlocked ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                        <Unlock className="w-3.5 h-3.5" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        <Lock className="w-3.5 h-3.5" />
                        Prereq Required
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {node.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {node.summary}
                  </p>
                </div>

                {/* Key Equation */}
                <div className="bg-[#070b14] border border-slate-800/80 rounded-lg p-2.5 my-1">
                  <MathView math={node.keyFormula} block />
                </div>
              </div>

              {/* Progress Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Mastery Score</span>
                  <span className="font-mono font-bold text-white">
                    {node.masteryPercentage}%
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      node.masteryPercentage >= 80
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : node.masteryPercentage >= 60
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-400'
                        : 'bg-gradient-to-r from-amber-500 to-orange-400'
                    }`}
                    style={{ width: `${node.masteryPercentage}%` }}
                  />
                </div>

                {node.isUnlocked && (
                  <div className="text-[11px] text-purple-300 flex items-center justify-end gap-1 pt-1 font-medium">
                    Take Bloom Quiz <ChevronRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bloom Diagnostic Quiz Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e1424] border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4 p-6">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/50">
                  Bloom Level: {selectedNode.bloomLevel}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedNode.title} Diagnostic
                </h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedNode.questions.length > 0 ? (
              <div className="space-y-4">
                {(() => {
                  const q = selectedNode.questions[activeQuizQuestionIndex];
                  return (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-200 font-medium">
                        {q.prompt}
                      </p>

                      {q.latex && (
                        <div className="bg-[#070b14] border border-slate-800 rounded-xl p-3 my-2">
                          <MathView math={q.latex} block />
                        </div>
                      )}

                      {/* Options */}
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedOptionIndex === oIdx;
                          let optStyle = 'bg-[#12192c] border-slate-700 text-slate-200 hover:border-slate-600';

                          if (quizSubmitted) {
                            if (oIdx === q.correctIndex) {
                              optStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold';
                            } else if (isSelected) {
                              optStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                            }
                          } else if (isSelected) {
                            optStyle = 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-sm';
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={quizSubmitted}
                              onClick={() => setSelectedOptionIndex(oIdx)}
                              className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition flex items-center justify-between ${optStyle}`}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && oIdx === q.correctIndex && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Feedback Explanation */}
                      {quizSubmitted && (
                        <div className="bg-[#090d16] border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            Diagnostic Feedback:
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            {q.explanation}
                          </p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2">
                        {!quizSubmitted ? (
                          <button
                            onClick={handleAnswerSubmit}
                            disabled={selectedOptionIndex === null}
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition"
                          >
                            Submit Answer
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedNode(null)}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition"
                          >
                            Close & Apply Mastery
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No questions configured for this node yet.</p>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
