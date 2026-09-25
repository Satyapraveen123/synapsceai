import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle2, 
  Network, 
  FileUp, 
  Code2, 
  MessageSquare,
  Sparkles,
  Cpu,
  User,
  Database
} from 'lucide-react';
import { auth, signInWithGoogle } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';

export type ActiveTab = 'player' | 'verifier' | 'tutor' | 'mastery' | 'upload' | 'ai_lab' | 'architecture';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeLessonTitle: string;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeLessonTitle,
  onOpenAuthModal,
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'player', label: 'Lesson Studio', icon: <Play className="w-4 h-4" /> },
    { id: 'ai_lab', label: 'Gemini AI Lab', icon: <Sparkles className="w-4 h-4 text-purple-400" />, badge: 'Multimodal' },
    { id: 'verifier', label: 'SymPy Verifier', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
    { id: 'tutor', label: 'Grounded RAG Tutor', icon: <MessageSquare className="w-4 h-4 text-cyan-400" /> },
    { id: 'mastery', label: "Bloom's Mastery DAG", icon: <Network className="w-4 h-4 text-indigo-400" /> },
    { id: 'upload', label: 'Ingestion Pipeline', icon: <FileUp className="w-4 h-4 text-amber-400" /> },
    { id: 'architecture', label: 'System Code & Arch', icon: <Code2 className="w-4 h-4 text-blue-400" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#0a0d14]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('player')}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/10">
            <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0c101a]">
              <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">
                SYNAPSE<span className="text-cyan-400">AI</span>
              </span>
              <span className="rounded-full bg-cyan-950/70 border border-cyan-800/50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-cyan-300">
                v1.0 CE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[260px]">
              Autonomous STEM Video &amp; SymPy Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800/90 text-cyan-300 shadow-sm shadow-cyan-500/20 border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="rounded bg-purple-900/60 text-purple-300 text-[10px] px-1.5 py-0.2 font-medium">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <div className="absolute -bottom-[9px] left-2 right-2 h-[2px] bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Firebase Auth Profile Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAuthModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
              currentUser
                ? 'bg-[#12192c] border-cyan-500/50 text-cyan-200 hover:border-cyan-400'
                : 'bg-[#12192c] border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
            }`}
            title={currentUser ? `Signed in as ${currentUser.displayName || currentUser.email}` : 'Sign in with Google (Firebase)'}
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="w-5 h-5 rounded-full object-cover border border-cyan-400"
              />
            ) : (
              <User className="w-4 h-4 text-cyan-400" />
            )}
            <span className="hidden sm:inline text-[11px] font-medium">
              {currentUser ? (currentUser.displayName?.split(' ')[0] || 'Account') : 'Sign In'}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};
