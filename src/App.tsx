import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { LessonPlayer } from './components/LessonPlayer';
import { GeminiMultimodalLab } from './components/GeminiMultimodalLab';
import { StepVerifier } from './components/StepVerifier';
import { TutorChat } from './components/TutorChat';
import { MasteryGraph } from './components/MasteryGraph';
import { UploadPipeline } from './components/UploadPipeline';
import { ArchitectureExplorer } from './components/ArchitectureExplorer';
import { AuthProfileModal } from './components/AuthProfileModal';
import { SAMPLE_LESSONS } from './data/lessonsData';
import { LessonData } from './types';
import { Sparkles, Terminal, BookOpen, Layers, ShieldCheck } from 'lucide-react';

export default function App() {
  const [lessons, setLessons] = useState<LessonData[]>(SAMPLE_LESSONS);
  const [activeLessonId, setActiveLessonId] = useState<string>(SAMPLE_LESSONS[0].id);
  const [activeTab, setActiveTab] = useState<ActiveTab>('player');
  const [verifierLatex, setVerifierLatex] = useState<string | undefined>();
  const [tutorQuery, setTutorQuery] = useState<string | undefined>();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const currentLesson = lessons.find((l) => l.id === activeLessonId) || lessons[0];

  const handleLessonCreated = (newLesson: LessonData) => {
    setLessons((prev) => [newLesson, ...prev]);
    setActiveLessonId(newLesson.id);
    setActiveTab('player');
  };

  const handleOpenVerifierForStep = (latex: string) => {
    setVerifierLatex(latex);
    setActiveTab('verifier');
  };

  const handleOpenTutorForLesson = (query: string) => {
    setTutorQuery(query);
    setActiveTab('tutor');
  };

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeLessonTitle={currentLesson.title}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'player' && (
          <LessonPlayer
            lesson={currentLesson}
            allLessons={lessons}
            onSelectLesson={setActiveLessonId}
            onOpenVerifierForStep={handleOpenVerifierForStep}
            onOpenTutorForLesson={handleOpenTutorForLesson}
          />
        )}

        {activeTab === 'ai_lab' && (
          <GeminiMultimodalLab />
        )}

        {activeTab === 'verifier' && (
          <StepVerifier initialLatex={verifierLatex} />
        )}

        {activeTab === 'tutor' && (
          <TutorChat
            currentLesson={currentLesson}
            onJumpToVideoTime={(sec) => {
              setActiveTab('player');
            }}
            presetQuery={tutorQuery}
          />
        )}

        {activeTab === 'mastery' && (
          <MasteryGraph />
        )}

        {activeTab === 'upload' && (
          <UploadPipeline onLessonCreated={handleLessonCreated} />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureExplorer />
        )}
      </main>

      {/* Auth & Profile Modal */}
      <AuthProfileModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentLesson={currentLesson}
      />

      {/* Global Tech Banner Footer */}
      <footer className="border-t border-slate-900 bg-[#06080e] py-6 px-4 sm:px-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-300">
              SYNAPSE<span className="text-cyan-400">AI</span>
            </span>
            <span className="text-slate-600">&bull;</span>
            <span>Autonomous STEM Video, Manim CE &amp; SymPy Verification Engine</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              LangGraph StateGraph
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Deterministic SymPy
            </span>
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-amber-400" />
              Manim CE 0.18.1
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
