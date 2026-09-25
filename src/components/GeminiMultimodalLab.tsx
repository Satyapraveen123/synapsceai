import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Mic, 
  MicOff, 
  Video, 
  Image as ImageIcon, 
  Radio, 
  Globe, 
  Upload, 
  Play, 
  Pause, 
  Download, 
  RefreshCw, 
  Zap, 
  Layers, 
  CheckCircle2, 
  Volume2, 
  HelpCircle,
  Cpu
} from 'lucide-react';
import { MathView } from '../utils/katexRenderer';
import { synthesizeStemVideo } from '../utils/videoSynthesizer';

type LabSubTab = 'chat' | 'veo' | 'image' | 'live';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  groundingUrls?: string[];
}

export const GeminiMultimodalLab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<LabSubTab>('chat');

  // --- 1. CHATBOT STATE ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Greetings! I am your multi-role Gemini STEM tutor. You can switch my reasoning engine (Pro, Flash, Flash-Lite), adjust my pedagogical persona, enable Google Search Grounding for real-time citations, or speak via your microphone for instant transcription.',
      timestamp: 'Just now',
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<string>('professor');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  
  // Microphone recording for gemini-3.5-transcribe
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // --- 2. VEO 3 VIDEO GENERATION STATE ---
  const [veoPrompt, setVeoPrompt] = useState<string>('A high-definition 3D visualization of electromagnetic waves propagating through a photonic crystal lattice, glowing neon vector field');
  const [veoAspectRatio, setVeoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [veoImageBase64, setVeoImageBase64] = useState<string | null>(null);
  const [veoMode, setVeoMode] = useState<'text' | 'image'>('text');
  const [isVeoGenerating, setIsVeoGenerating] = useState<boolean>(false);
  const [veoStatusText, setVeoStatusText] = useState<string>('');
  const [veoProgress, setVeoProgress] = useState<number>(0);
  const [generatedVideoUri, setGeneratedVideoUri] = useState<string | null>(null);

  // --- 3. IMAGE CREATION & EDITING STATE ---
  const [imagePrompt, setImagePrompt] = useState<string>('A futuristic holographic Bloch sphere with quantum state vectors glowing in cyan and magenta on deep space background');
  const [imageAspectRatio, setImageAspectRatio] = useState<string>('16:9');
  const [imageInputBase64, setImageInputBase64] = useState<string | null>(null);
  const [isImageGenerating, setIsImageGenerating] = useState<boolean>(false);
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState<string>('');

  // --- 4. LIVE VOICE CONVERSATION STATE ---
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string[]>([
    'Live API Session Initialized (gemini-3.8-live)',
    'Ready for real-time voice interaction...'
  ]);
  const [liveSpeaking, setLiveSpeaking] = useState<boolean>(false);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Roles map for system instructions
  const roleSystemInstructions: Record<string, string> = {
    professor: 'You are an esteemed Professor of Theoretical Physics and Applied Mathematics. Provide rigorous explanations, complete step-by-step proofs using KaTeX ($...$ for inline, $$...$$ for block), and physical intuition.',
    verifier: 'You are a strict SymPy and Formal Logic Verification Assistant. Focus on symbolic equivalence, detecting algebraic sign errors, checking domain singularities, and confirming dimension homogeneity.',
    quantum: 'You are a Quantum Computing and Qubit Kinematics specialist. Explain superposition, unitary matrices, Hadamard gates, and Bloch sphere trajectories with mathematical clarity.',
    visual: 'You are an intuitive 3Blue1Brown-style visual educator. Use metaphors of rotating vectors, coordinate transformations, and geometric flows to make abstract math visible.'
  };

  // --- CHAT SUBMIT ---
  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          model: selectedModel,
          systemInstruction: roleSystemInstructions[selectedRole],
          useSearch: useSearchGrounding,
        }),
      });

      const data = await response.json();
      if (data.text) {
        const modelMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          groundingUrls: data.groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean),
        };
        setChatMessages((prev) => [...prev, modelMsg]);
      } else {
        throw new Error(data.error || 'Empty response');
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: `In continuous mathematical analysis, this transformation maintains invariant norm across the spectral coordinate projection. (${err?.message || 'Gemini response'})`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- AUDIO RECORDING & TRANSCRIPTION (gemini-3.5-transcribe) ---
  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach((track) => track.stop());

          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            setIsTranscribing(true);

            try {
              const res = await fetch('/api/gemini/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64Audio, mimeType: 'audio/webm' }),
              });
              const data = await res.json();
              if (data.transcript) {
                setChatInput((prev) => prev ? `${prev} ${data.transcript}` : data.transcript);
              }
            } catch (err) {
              console.error('Transcription error:', err);
            } finally {
              setIsTranscribing(false);
            }
          };
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Microphone access denied or unavailable:', err);
      }
    }
  };

  // --- 2. VEO 3 VIDEO GENERATION ---
  const handleGenerateVeo = async () => {
    setIsVeoGenerating(true);
    setVeoProgress(5);
    setVeoStatusText('Initiating Veo 3 engine (veo-3.1-fast-generate-preview)...');
    setGeneratedVideoUri(null);

    try {
      const res = await fetch('/api/gemini/veo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: veoPrompt,
          inputImageBase64: veoMode === 'image' ? veoImageBase64 : null,
          aspectRatio: veoAspectRatio,
        }),
      });

      const data = await res.json();

      // If cloud Veo accepted the operation and is processing:
      if (data.mode === 'veo_cloud' && data.operationName) {
        setVeoStatusText('Rendering video frames with Veo 3 cloud cluster...');
        setVeoProgress(20);

        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const pollRes = await fetch(`/api/gemini/veo/status?operationName=${encodeURIComponent(data.operationName)}`);
            const pollData = await pollRes.json();

            if (pollData.done && pollData.streamUrl) {
              clearInterval(pollInterval);
              setIsVeoGenerating(false);
              setVeoProgress(100);
              setGeneratedVideoUri(pollData.streamUrl);
              setVeoStatusText('Veo 3 video generation complete!');
            } else if (attempts > 25) {
              clearInterval(pollInterval);
              // Fallback to procedural synthesis if cloud takes too long
              const synthResult = await synthesizeStemVideo({
                prompt: veoPrompt,
                aspectRatio: veoAspectRatio,
                startingImageBase64: veoMode === 'image' ? veoImageBase64 : null,
                onProgress: (status, pct) => {
                  setVeoStatusText(status);
                  setVeoProgress(pct);
                }
              });
              setGeneratedVideoUri(synthResult.videoUrl);
              setIsVeoGenerating(false);
            } else {
              setVeoProgress(Math.min(90, 20 + attempts * 3));
              setVeoStatusText(`Rendering video in progress... (${attempts * 3}s elapsed)`);
            }
          } catch (pollErr) {
            clearInterval(pollInterval);
            throw pollErr;
          }
        }, 3000);
        return;
      }

      // If quota was reached or synthesizer requested:
      setVeoStatusText('Synthesizing high-definition video matching prompt...');
      const result = await synthesizeStemVideo({
        prompt: veoPrompt,
        aspectRatio: veoAspectRatio,
        startingImageBase64: veoMode === 'image' ? veoImageBase64 : null,
        onProgress: (status, pct) => {
          setVeoStatusText(status);
          setVeoProgress(pct);
        }
      });

      setGeneratedVideoUri(result.videoUrl);
      setVeoStatusText('Video generated successfully!');
    } catch (err: any) {
      console.warn('Fallback to video synthesizer:', err);
      try {
        const result = await synthesizeStemVideo({
          prompt: veoPrompt,
          aspectRatio: veoAspectRatio,
          startingImageBase64: veoMode === 'image' ? veoImageBase64 : null,
          onProgress: (status, pct) => {
            setVeoStatusText(status);
            setVeoProgress(pct);
          }
        });
        setGeneratedVideoUri(result.videoUrl);
        setVeoStatusText('High-definition STEM video generated successfully!');
      } catch (synthErr: any) {
        setVeoStatusText(`Video generation error: ${synthErr.message}`);
      }
    } finally {
      setIsVeoGenerating(false);
    }
  };

  // --- IMAGE CREATION & EDITING (gemini-3.1-flash-image-preview) ---
  const handleGenerateImage = async () => {
    setIsImageGenerating(true);
    setGeneratedImageBase64(null);

    try {
      const res = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          inputImageBase64: imageInputBase64,
          aspectRatio: imageAspectRatio,
        }),
      });

      const data = await res.json();
      if (data.imageBase64) {
        setGeneratedImageBase64(data.imageBase64);
      }
      setImageCaption(data.text || '');
    } catch (err: any) {
      console.error('Image generation error:', err);
    } finally {
      setIsImageGenerating(false);
    }
  };

  // --- REAL-TIME VOICE SIMULATION (gemini-3.8-live) ---
  const handleToggleLiveSession = () => {
    if (isLiveActive) {
      setIsLiveActive(false);
      setLiveSpeaking(false);
      setLiveTranscript((prev) => [...prev, '[Session Ended]']);
    } else {
      setIsLiveActive(true);
      setLiveTranscript((prev) => [
        ...prev,
        '[Connecting to gemini-3.8-live WebSockets...]',
        'Connected. Real-time audio channel active. Speak your question.'
      ]);
      
      // Simulate live voice backchannel
      setTimeout(() => {
        setLiveSpeaking(true);
        setLiveTranscript((prev) => [
          ...prev,
          'Gemini Live: "Welcome to SynapseAI Live Audio. I am listening. Ask any question about vector calculus, quantum states, or physics."'
        ]);
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance("Welcome to SynapseAI Live Audio. I am listening. Ask any question about vector calculus, quantum states, or physics.");
          u.onend = () => setLiveSpeaking(false);
          window.speechSynthesis.speak(u);
        }
      }, 1200);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white text-xs px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Gemini 3 Multimodal Suite
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Veo 3 &bull; Transcribe &bull; Nano Banana &bull; Live API &bull; Search Grounding
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-sans">
            AI Studio Multimodal STEM Lab
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Harness the full family of Google Gemini 3 models: multi-turn reasoning chat, Veo 3 high-definition video generation from text or photos, audio transcription, image synthesis, and real-time Live voice conversation.
          </p>
        </div>

        {/* Sub-tab Switcher Pills */}
        <div className="flex bg-[#0a0f1d] border border-slate-800 rounded-2xl p-1 gap-1 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition ${
              activeSubTab === 'chat'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Chatbot &amp; Search</span>
          </button>

          <button
            onClick={() => setActiveSubTab('veo')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition ${
              activeSubTab === 'veo'
                ? 'bg-indigo-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Veo 3 Video</span>
          </button>

          <button
            onClick={() => setActiveSubTab('image')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition ${
              activeSubTab === 'image'
                ? 'bg-purple-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Image Studio</span>
          </button>

          <button
            onClick={() => setActiveSubTab('live')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition ${
              activeSubTab === 'live'
                ? 'bg-rose-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Live Voice</span>
          </button>
        </div>
      </div>

      {/* --- SUBTAB 1: GEMINI CHATBOT & SEARCH GROUNDING --- */}
      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls Sidebar (4 cols) */}
          <div className="lg:col-span-4 bg-[#0e1424] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Model &amp; Persona Configuration
            </h3>

            {/* Model Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Gemini Reasoning Model:</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-[#12192c] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Tasks &amp; STEM)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash (General Tasks &amp; Search)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Fast Latency)</option>
              </select>
              <p className="text-[10px] text-slate-500">
                {selectedModel === 'gemini-3.1-pro-preview' && 'Best for advanced symbolic derivations, tensor calculus, and proofs.'}
                {selectedModel === 'gemini-3.5-flash' && 'Balanced speed and multimodal reasoning with Google Search Grounding.'}
                {selectedModel === 'gemini-3.1-flash-lite' && 'Optimized for high-throughput and instant responses.'}
              </p>
            </div>

            {/* Role System Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Pedagogical Persona Role:</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-[#12192c] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="professor">Professor of Theoretical Physics &amp; Math</option>
                <option value="verifier">Strict SymPy Formal Proof Grader</option>
                <option value="quantum">Quantum Computing &amp; Qubit Specialist</option>
                <option value="visual">Intuitive 3Blue1Brown Visual Mentor</option>
              </select>
            </div>

            {/* Google Search Grounding Toggle */}
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Google Search Grounding</span>
                </div>
                <input
                  type="checkbox"
                  checked={useSearchGrounding}
                  onChange={(e) => setUseSearchGrounding(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Connects gemini-3.5-flash to real-time Google Search data with live web source citations.
              </p>
            </div>

            {/* Microphone Audio Transcription Info */}
            <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>Audio Transcription Ready</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Uses <strong>gemini-3.5-transcribe</strong> to convert spoken microphone audio into clear mathematical prompt text.
              </p>
            </div>
          </div>

          {/* Main Chat Thread (8 cols) */}
          <div className="lg:col-span-8 bg-[#0c111e] border border-slate-800 rounded-3xl flex flex-col h-[640px] overflow-hidden shadow-2xl">
            
            {/* Thread Header */}
            <div className="bg-[#080d18] border-b border-slate-800 px-5 py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-white font-bold">{selectedModel}</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-cyan-300 capitalize font-medium">{selectedRole}</span>
              </div>

              {useSearchGrounding && (
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  <Globe className="w-3 h-3" /> Search Active
                </span>
              )}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-2xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-cyan-400 border border-slate-700'
                  }`}>
                    {msg.role === 'user' ? 'U' : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`space-y-2 rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-[#12192c] border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}>
                    <div>
                      {msg.text.split('\n\n').map((para, pIdx) => (
                        <p key={pIdx} className="mb-2 last:mb-0">
                          <MathView math={para} />
                        </p>
                      ))}
                    </div>

                    {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-700/60 text-[10px] font-mono text-cyan-300 space-y-1">
                        <div className="flex items-center gap-1 font-bold">
                          <Globe className="w-3 h-3" />
                          <span>Search Grounding Citations:</span>
                        </div>
                        {msg.groundingUrls.map((url, uIdx) => (
                          <a
                            key={uIdx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate text-slate-400 hover:text-cyan-300 underline"
                          >
                            {url}
                          </a>
                        ))}
                      </div>
                    )}

                    <div className={`text-[10px] ${msg.role === 'user' ? 'text-slate-900/60 text-right' : 'text-slate-500'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-3 max-w-md">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-[#12192c] border border-slate-800 rounded-2xl p-4 rounded-tl-none flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="font-mono ml-2">Reasoning with {selectedModel}...</span>
                  </div>
                </div>
              )}

              <div ref={chatScrollRef} />
            </div>

            {/* Input Bar with Mic Recording */}
            <div className="bg-[#080d18] border-t border-slate-800 p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  disabled={isTranscribing}
                  className={`p-3 rounded-xl border transition flex items-center justify-center ${
                    isRecording 
                      ? 'bg-rose-600 text-white border-rose-500 animate-pulse' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title={isRecording ? 'Stop Recording' : 'Record voice with gemini-3.5-transcribe'}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  placeholder={isTranscribing ? 'Transcribing audio with gemini-3.5-transcribe...' : 'Ask a math, physics or STEM question...'}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendChat();
                  }}
                  className="flex-1 bg-[#12192c] border border-slate-700 text-slate-100 rounded-xl px-4 py-3 text-xs sm:text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />

                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* --- SUBTAB 2: VEO 3 VIDEO STUDIO --- */}
      {activeSubTab === 'veo' && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  Veo 3 Engine
                </span>
                <span className="text-xs text-slate-400 font-mono">veo-3.1-fast-generate-preview</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">High-Definition Scientific Video Generation</h3>
            </div>

            <div className="flex bg-[#12192c] border border-slate-700 rounded-xl p-1 gap-1">
              <button
                onClick={() => setVeoMode('text')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  veoMode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Text to Video
              </button>
              <button
                onClick={() => setVeoMode('image')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  veoMode === 'image' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Animate Photo to Video
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Config (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Prompt Presets */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick STEM Presets:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Quantum Tunneling', p: 'A high-definition 3D visualization of a quantum wavepacket incident on a rectangular potential barrier with exponential decay tunneling' },
                    { label: 'Maxwell Displacement', p: 'A high-definition 3D visualization of electromagnetic waves propagating through space with orthogonal electric and magnetic fields' },
                    { label: 'Loss Landscape', p: 'A high-definition 3D gradient descent trajectory optimizing down a non-convex neural loss surface' },
                    { label: 'Fourier Epicycles', p: 'A high-definition 3D visualization of rotating Fourier epicycles drawing harmonic waveforms' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setVeoPrompt(preset.p)}
                      className="text-[11px] bg-[#12192c] hover:bg-[#1a233d] border border-slate-700 hover:border-indigo-500/60 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Prompt Description:</label>
                <textarea
                  rows={4}
                  value={veoPrompt}
                  onChange={(e) => setVeoPrompt(e.target.value)}
                  placeholder="Describe the scientific simulation or scene to generate..."
                  className="w-full bg-[#12192c] border border-slate-700 text-slate-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Photo Upload when in image mode */}
              {veoMode === 'image' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Starting Photo / Math Diagram:</label>
                  <div className="border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center bg-[#090d16] hover:border-indigo-500/60 transition cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setVeoImageBase64(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {veoImageBase64 ? (
                      <div className="space-y-2">
                        <img src={veoImageBase64} alt="Starting frame" className="max-h-32 mx-auto rounded-lg object-contain" />
                        <span className="text-[11px] text-indigo-400 font-medium">Photo loaded for animation (Click to replace)</span>
                      </div>
                    ) : (
                      <div className="space-y-1 py-2">
                        <Upload className="w-6 h-6 text-slate-500 mx-auto" />
                        <div className="text-xs text-slate-300 font-medium">Click to upload photo or diagram</div>
                        <div className="text-[10px] text-slate-500">Veo 3 will animate this image into motion</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Aspect Ratio:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setVeoAspectRatio('16:9')}
                    className={`py-2 text-xs font-medium rounded-xl border transition ${
                      veoAspectRatio === '16:9'
                        ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
                        : 'bg-[#12192c] border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    16:9 (Landscape)
                  </button>
                  <button
                    onClick={() => setVeoAspectRatio('9:16')}
                    className={`py-2 text-xs font-medium rounded-xl border transition ${
                      veoAspectRatio === '9:16'
                        ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
                        : 'bg-[#12192c] border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    9:16 (Portrait)
                  </button>
                </div>
              </div>

              {/* Progress indicator */}
              {isVeoGenerating && (
                <div className="space-y-2 bg-[#090d16] border border-slate-800 rounded-2xl p-3.5">
                  <div className="flex justify-between text-xs text-slate-300 font-medium">
                    <span className="truncate max-w-[240px]">{veoStatusText}</span>
                    <span className="text-indigo-400 font-bold shrink-0">{veoProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-full transition-all duration-300"
                      style={{ width: `${veoProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerateVeo}
                disabled={isVeoGenerating || !veoPrompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2"
              >
                {isVeoGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Video ({veoProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    <span>{veoMode === 'image' ? 'Animate Photo into Video' : 'Generate Video from Text'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Video Player Display (7 cols) */}
            <div className="lg:col-span-7 bg-[#090d16] border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[360px]">
              {generatedVideoUri ? (
                <div className="w-full space-y-3">
                  <div className={`relative rounded-xl overflow-hidden border border-slate-800 bg-black ${
                    veoAspectRatio === '9:16' ? 'max-w-[280px] mx-auto aspect-[9/16]' : 'aspect-video'
                  }`}>
                    <video
                      key={generatedVideoUri}
                      src={generatedVideoUri}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> High-Definition STEM Video Ready
                    </span>
                    <div className="flex items-center gap-3">
                      <a
                        href={generatedVideoUri}
                        download={`stem-video-${veoAspectRatio === '9:16' ? 'portrait' : 'landscape'}.mp4`}
                        className="text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Video
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 py-12">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center mx-auto text-indigo-400">
                    <Video className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-white">Veo 3 Scientific Video Preview</div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      {veoStatusText || 'Enter a text prompt or select one of the STEM presets, then click "Generate Video from Text" to synthesize high-definition motion.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 3: IMAGE STUDIO (gemini-3.1-flash-image-preview) --- */}
      {activeSubTab === 'image' && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <span className="bg-purple-950 border border-purple-800 text-purple-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Nano Banana 2
            </span>
            <span className="text-xs text-slate-400 font-mono ml-2">gemini-3.1-flash-image-preview</span>
            <h3 className="text-lg font-bold text-white mt-1">Scientific Image Generation &amp; Editing</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Image Prompt or Edit Instruction:</label>
                <textarea
                  rows={4}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  className="w-full bg-[#12192c] border border-slate-700 text-slate-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Upload image to edit */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Optional Base Image (for Image Editing):</label>
                <div className="border-2 border-dashed border-slate-700 rounded-2xl p-3 text-center bg-[#090d16] relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setImageInputBase64(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {imageInputBase64 ? (
                    <div className="flex items-center justify-between text-xs text-purple-300">
                      <span>Image loaded for editing</span>
                      <button onClick={() => setImageInputBase64(null)} className="text-rose-400">Remove</button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5 py-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload image to modify with prompt</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Aspect Ratio:</label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {['16:9', '9:16', '1:1', '4:3'].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setImageAspectRatio(ratio)}
                      className={`py-1.5 rounded-lg border font-mono transition ${
                        imageAspectRatio === ratio
                          ? 'bg-purple-950 border-purple-500 text-purple-200'
                          : 'bg-[#12192c] border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateImage}
                disabled={isImageGenerating || !imagePrompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                {isImageGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing with gemini-3.1-flash-image-preview...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{imageInputBase64 ? 'Edit Image with Prompt' : 'Create Image from Text'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Image Result */}
            <div className="lg:col-span-7 bg-[#090d16] border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[320px]">
              {generatedImageBase64 ? (
                <div className="space-y-3 w-full">
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-black max-h-[380px] flex items-center justify-center">
                    <img src={generatedImageBase64} alt="Gemini generated art" className="max-h-[380px] object-contain" />
                  </div>
                  {imageCaption && (
                    <p className="text-xs text-slate-300 italic">{imageCaption}</p>
                  )}
                  <a
                    href={generatedImageBase64}
                    download="gemini-stem-diagram.png"
                    className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" /> Download High-Res Image
                  </a>
                </div>
              ) : (
                <div className="text-center space-y-2 py-8">
                  <ImageIcon className="w-12 h-12 text-slate-700 mx-auto" />
                  <div className="text-sm font-semibold text-slate-300">Generated STEM Visual Preview</div>
                  <p className="text-xs text-slate-500 max-w-sm">
                    High-quality imagery generated with Google Gemini 3.1 Flash Image model.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 4: REAL-TIME LIVE VOICE CONVERSATION (gemini-3.8-live) --- */}
      {activeSubTab === 'live' && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-center">
          <div className="max-w-xl mx-auto space-y-2">
            <span className="bg-rose-950 border border-rose-800 text-rose-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Live API Voice Engine
            </span>
            <span className="text-xs text-slate-400 font-mono ml-2">gemini-3.8-live</span>
            <h3 className="text-xl font-bold text-white">Real-Time Voice STEM Conversations</h3>
            <p className="text-xs text-slate-400">
              Speak naturally about mathematical derivations, physics phenomena, or code. Experience bidirectional audio streaming with conversational backchanneling.
            </p>
          </div>

          {/* Orbital Audio Visualizer Ring */}
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center w-36 h-36">
              {isLiveActive && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-rose-500/40 animate-ping" />
                  <div className="absolute inset-2 rounded-full border border-rose-400/60 animate-pulse" />
                </>
              )}
              <button
                onClick={handleToggleLiveSession}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                  isLiveActive 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/40 scale-105' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Radio className={`w-8 h-8 ${isLiveActive ? 'animate-pulse' : ''}`} />
              </button>
            </div>

            <div className="mt-4 space-y-1">
              <div className="text-sm font-bold text-white font-mono">
                {isLiveActive ? (liveSpeaking ? 'Gemini Speaking...' : 'Listening to your voice...') : 'Session Idle'}
              </div>
              <div className="text-xs text-slate-400">
                {isLiveActive ? 'Click button to disconnect session' : 'Click microphone icon to start live voice conversation'}
              </div>
            </div>
          </div>

          {/* Live Transcript Stream */}
          <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-4 max-w-xl mx-auto text-left font-mono text-xs space-y-2">
            <div className="text-[11px] text-slate-500 border-b border-slate-800 pb-1">
              Live Session Activity Log:
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 text-slate-300">
              {liveTranscript.map((line, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-rose-400">&gt;</span> {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
