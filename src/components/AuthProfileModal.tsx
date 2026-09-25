import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  LogIn, 
  LogOut, 
  X, 
  CheckCircle2, 
  Cloud, 
  BookOpen, 
  ShieldCheck, 
  Sparkles,
  Database
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle, 
  signOutUser, 
  saveUserLesson, 
  getUserSavedLessons, 
  getUserVerifiedProofs 
} from '../firebase';
import { LessonData } from '../types';

interface AuthProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLesson?: LessonData;
}

export const AuthProfileModal: React.FC<AuthProfileModalProps> = ({
  isOpen,
  onClose,
  currentLesson,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [savedLessons, setSavedLessons] = useState<any[]>([]);
  const [verifiedProofs, setVerifiedProofs] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        const lessons = await getUserSavedLessons(user.uid);
        const proofs = await getUserVerifiedProofs(user.uid);
        setSavedLessons(lessons);
        setVerifiedProofs(proofs);
      } else {
        setSavedLessons([]);
        setVerifiedProofs([]);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.warn('Sign-in error:', err);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
  };

  const handleSaveCurrentLesson = async () => {
    if (!currentUser || !currentLesson) return;
    setIsSaving(true);
    try {
      await saveUserLesson(currentUser.uid, {
        id: currentLesson.id,
        title: currentLesson.title,
        category: currentLesson.category,
        bloomLevel: currentLesson.bloomLevel,
        primaryEquation: currentLesson.primaryEquation,
      });
      const updated = await getUserSavedLessons(currentUser.uid);
      setSavedLessons(updated);
      setSaveSuccessMsg(`"${currentLesson.title}" saved to your cloud Firestore library!`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Error saving lesson:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0e1424] border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-[#090d16] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                Firebase Cloud Account
                <span className="text-[10px] bg-orange-950 text-orange-300 border border-orange-800/60 px-2 py-0.5 rounded-full font-medium">
                  Firestore + Auth
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Secure Google Sign-In &bull; Persistent Cloud Storage
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {currentUser ? (
            <div className="space-y-5">
              
              {/* Profile Card */}
              <div className="bg-[#12192c] border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-12 h-12 rounded-full border border-cyan-500/60 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-lg">
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {currentUser.displayName || 'STEM Scholar'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {currentUser.email}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Authenticated via Google
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-rose-400 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Save Current Lesson Action */}
              {currentLesson && (
                <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">Save Current Lesson</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[240px]">
                      {currentLesson.title}
                    </div>
                  </div>
                  <button
                    onClick={handleSaveCurrentLesson}
                    disabled={isSaving}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Syncing...' : 'Save to Firestore'}</span>
                  </button>
                </div>
              )}

              {saveSuccessMsg && (
                <div className="bg-emerald-950/80 border border-emerald-500/80 rounded-xl p-3 text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Saved Cloud Data Sub-Lists */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  Your Cloud Saved Lessons ({savedLessons.length}):
                </div>

                {savedLessons.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-[#090d16] p-3 rounded-xl border border-slate-800">
                    No lessons saved to Firestore yet. Click &quot;Save to Firestore&quot; above to sync your progress!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {savedLessons.map((l, idx) => (
                      <div
                        key={idx}
                        className="bg-[#090d16] border border-slate-800 rounded-xl p-3 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white">{l.title}</div>
                          <div className="text-[10px] text-cyan-400">
                            {l.category} &bull; Bloom: {l.bloomLevel}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(l.savedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-600 to-indigo-600 p-[1px] mx-auto shadow-xl">
                <div className="w-full h-full rounded-[23px] bg-[#0c101a] flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-cyan-400" />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">Sign In to SynapseAI</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Connect via Google Firebase Authentication to persist your customized STEM lessons, SymPy mathematical proofs, and Bloom's mastery progress across sessions.
                </p>
              </div>

              <button
                onClick={handleSignIn}
                className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 mx-auto"
              >
                <LogIn className="w-4 h-4 text-slate-900" />
                <span>Sign In with Google</span>
              </button>

              <div className="text-[10px] font-mono text-slate-500 pt-2">
                Secured by Firebase Auth &bull; Project: starry-setup-36pck
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#090d16] border-t border-slate-800 px-6 py-3 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
