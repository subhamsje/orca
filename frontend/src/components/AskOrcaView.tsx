import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, Sparkles, Bot, User, RefreshCw } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { fetchTripAssessment } from '../utils/api';
import { TripAssessmentResponse } from '../types';

interface Message { id: string; sender: 'user' | 'orca'; text: string; timestamp: string; assessment?: TripAssessmentResponse; }
interface AskOrcaViewProps { language: string; onQuerySubmit: (queryText: string) => void; latestExplanation?: string; }

/* SVG Voice Waveform Visualizer */
const VoiceWaveform: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const bars = 24;
  return (
    <div className="flex items-center justify-center gap-[2px] h-12 px-4">
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i}
          className={`w-1 rounded-full transition-all ${isActive ? 'bg-gradient-to-t from-cyan-600 to-cyan-300' : 'bg-ocean-800'}`}
          style={{
            height: isActive ? `${20 + Math.sin(i * 0.7) * 60}%` : '15%',
            animation: isActive ? `voiceBar ${0.4 + (i % 5) * 0.1}s ease-in-out ${i * 0.03}s infinite alternate` : 'none',
            opacity: isActive ? 0.7 + Math.random() * 0.3 : 0.3,
            filter: isActive ? 'drop-shadow(0 0 3px rgba(34,211,238,0.5))' : 'none',
          }}
        />
      ))}
    </div>
  );
};

export const AskOrcaView: React.FC<AskOrcaViewProps> = ({ language, onQuerySubmit, latestExplanation }) => {
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome_msg', sender: 'orca',
    text: latestExplanation || 'नमस्कार! मी ओर्का सागरी एआय सहाय्यक आहे. समुद्रातील हवामान, मासेमारी क्षेत्र किंवा सुरक्षा याविषयी मला प्रश्न विचारा.',
    timestamp: 'Just now',
  }]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speech = useSpeech(language);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleToggleRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported.'); return; }
    if (isRecording) { setIsRecording(false); return; }
    const recognition = new SR();
    recognition.continuous = false; recognition.interimResults = false;
    recognition.lang = language.includes('Marathi') ? 'mr-IN' : language.includes('Hindi') ? 'hi-IN' : 'en-IN';
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognition.onresult = (event: any) => { const t = event.results[0][0].transcript; setInputText(t); handleSendMessage(t); };
    recognition.start();
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;
    setMessages((prev) => [...prev, { id: `user_${Date.now()}`, sender: 'user', text: text.trim(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInputText(''); setIsLoading(true);
    try {
      onQuerySubmit(text);
      const a = await fetchTripAssessment(16.0500, 73.4667, 8.5, language, text);
      setMessages((prev) => [...prev, { id: `orca_${Date.now()}`, sender: 'orca', text: a.explanation.plain_language_text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), assessment: a }]);
      speech.play(a.explanation.plain_language_text);
    } catch { setMessages((prev) => [...prev, { id: `orca_${Date.now()}`, sender: 'orca', text: '⚠️ क्षमस्व, सर्व्हरशी संपर्क साधताना अडचण आली.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]); }
    finally { setIsLoading(false); }
  };

  const quickPrompts = [
    'उद्या सकाळी मासेमारीसाठी जाणे सुरक्षित आहे का?',
    'मालवण किनाऱ्याजवळ बांगडा मासे कुठे मिळतील?',
    'रत्नागिरी जवळील IMBL सीमेपासून अंतर किती आहे?',
    '३० किमी प्रवासासाठी डिझेल किती लागेल?',
  ];

  return (
    <div className="flex flex-col h-[650px] md:h-[700px] glass-panel rounded-2xl overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/10 glass-dark flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-800 text-white neon-glow-cyan">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              <span className="gradient-text-ocean">Ask ORCA AI</span>
              <span className="text-[8px] bg-emerald-950/60 text-emerald-300 border border-emerald-700/40 px-1.5 py-0.5 rounded-full font-bold">
                LIVE
              </span>
            </h2>
            <p className="text-[10px] text-slate-500">Voice-First Maritime Reasoning ({language})</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`p-1.5 rounded-lg border shrink-0 ${msg.sender === 'user' ? 'bg-cyan-950/60 border-cyan-700/30 text-cyan-300' : 'glass-card text-slate-400'}`}>
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-cyan-400" />}
            </div>
            <div className={`max-w-xl p-3.5 rounded-2xl border text-xs leading-relaxed space-y-2 ${
              msg.sender === 'user'
                ? 'bg-cyan-950/40 border-cyan-700/20 text-cyan-100 rounded-tr-sm backdrop-blur-sm'
                : 'glass-card text-slate-200 rounded-tl-sm'
            }`}>
              <p className="font-medium text-[13px]">{msg.text}</p>
              {msg.assessment && (
                <div className="glass-dark rounded-xl p-3 mt-2 space-y-1 font-mono text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400">Verdict: {msg.assessment.verdict}</span>
                    <span className="text-amber-400 font-bold">Risk: {msg.assessment.risk_score}/100</span>
                  </div>
                  {msg.assessment.pfz_grounds[0] && (
                    <span className="text-emerald-400 block">📍 {msg.assessment.pfz_grounds[0].name} ({msg.assessment.pfz_grounds[0].hsi} HSI)</span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-ocean-800/30">
                <span>{msg.timestamp}</span>
                {msg.sender === 'orca' && (
                  <button onClick={() => speech.play(msg.text)} className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition">
                    <Volume2 className="w-3 h-3" /><span>Listen</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 glass-card p-3 rounded-xl max-w-xs">
            <div className="relative w-5 h-5">
              <span className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-sonar-ping" />
              <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
            </div>
            <span>Analyzing ocean parameters…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 glass-dark border-t border-ocean-800/30 flex items-center gap-2 overflow-x-auto text-xs">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
        {quickPrompts.map((prompt, idx) => (
          <button key={idx} onClick={() => { setInputText(prompt); handleSendMessage(prompt); }}
            className="glass-card hover:border-cyan-500/30 text-slate-400 hover:text-cyan-300 px-3 py-1.5 rounded-xl shrink-0 transition-all text-[10px]"
          >{prompt}</button>
        ))}
      </div>

      {/* Voice Waveform */}
      {isRecording && (
        <div className="px-4 py-3 bg-cyan-950/60 border-t border-cyan-700/30 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
              <span className="font-bold">Listening... Speak in {language}</span>
            </div>
          </div>
          <VoiceWaveform isActive={isRecording} />
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 border-t border-cyan-500/10 glass-dark flex items-center gap-2">
        <button onClick={handleToggleRecording} title={isRecording ? 'Stop Recording' : 'Voice Input'}
          className={`p-3 rounded-xl border transition-all duration-300 ${
            isRecording ? 'bg-red-600/80 border-red-400/60 text-white animate-pulse neon-glow-red' : 'glass-card text-cyan-400 hover:neon-glow-cyan'
          }`}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex-1 flex items-center gap-2">
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type your query in ${language}...`}
            className="flex-1 bg-ocean-950/60 border border-ocean-800/60 text-slate-100 text-xs rounded-xl px-4 py-3 outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)] transition backdrop-blur-sm"
          />
          <button type="submit" disabled={!inputText.trim() || isLoading}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-40 text-white p-3 rounded-xl font-bold transition-all shadow-lg neon-glow-cyan flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};