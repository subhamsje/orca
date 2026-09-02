import React, { useCallback, useRef, useState } from 'react';
import { AudioLines, Mic, MicOff, Send, Sparkles, Volume2, X } from 'lucide-react';
import { TripAssessmentResponse } from '../../types';
import { useSpeech } from '../../hooks/useSpeech';
import { fetchTripAssessment } from '../../utils/api';

// Minimal SpeechRecognition typings (DOM lib does not include them in TS yet).
type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  start: () => void;
  stop: () => void;
};

interface VoiceAssistantProps {
  language: string;
  lat: number;
  lon: number;
  vesselLengthM: number;
  latestAssessment: TripAssessmentResponse | null;
  onQuerySubmit: (text: string) => Promise<TripAssessmentResponse>;
  onOpenFull?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'orca';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Is it safe to go fishing tomorrow morning?',
  'What is the wave height at my harbor right now?',
  'Which is the best harbor to sell today?',
  'How much fuel will I burn for 30 km?',
  'Is there any cyclone alert nearby?',
];

const MARATHI_PROMPTS = [
  'उद्या सकाळी मासेमारीसाठी जाणे सुरक्षित आहे का?',
  'सध्या माझ्या बंदराजवळ लाटांची उंची किती आहे?',
  'आज कोणत्या बंदरात भाव जास्त आहे?',
  '३० किमी प्रवासासाठी डिझेल किती लागेल?',
];

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  language,
  lat,
  lon,
  vesselLengthM,
  latestAssessment,
  onQuerySubmit,
}) => {
  const [open, setOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const speech = useSpeech(language);

  const prompts =
    language.toLowerCase().includes('marathi') || language.toLowerCase().includes('hindi')
      ? MARATHI_PROMPTS
      : QUICK_PROMPTS;

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
      const userMsg: Message = {
        id: `u-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const assessment =
          (await onQuerySubmit(trimmed)) ??
          (await fetchTripAssessment(lat, lon, vesselLengthM, language, trimmed));
        const orcaMsg: Message = {
          id: `o-${Date.now()}`,
          sender: 'orca',
          text: assessment.explanation.plain_language_text,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages((prev) => [...prev, orcaMsg]);
        speech.play(orcaMsg.text);
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }, 60);
      } catch (err) {
        const errorMsg: Message = {
          id: `o-${Date.now()}`,
          sender: 'orca',
          text: '⚠️ क्षमस्व, सर्व्हरशी संपर्क साधताना अडचण आली. कृपया पुन्हा प्रयत्न करा.',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, onQuerySubmit, lat, lon, vesselLengthM, language, speech],
  );

  const toggleRecording = useCallback(() => {
    const SRConstructor =
      (window as unknown as { SpeechRecognition?: new () => SR })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SR })
        .webkitSpeechRecognition;
    if (!SRConstructor) {
      alert('Voice recognition not supported in this browser. Please type your query.');
      return;
    }
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    const recognition = new SRConstructor();
    recognition.continuous = false;
    recognition.interimResults = false;
    const langMap: Record<string, string> = {
      English: 'en-IN',
      Marathi: 'mr-IN',
      Hindi: 'hi-IN',
      Gujarati: 'gu-IN',
      Tamil: 'ta-IN',
      Telugu: 'te-IN',
      Malayalam: 'ml-IN',
      Kannada: 'kn-IN',
      Bengali: 'bn-IN',
    };
    recognition.lang = langMap[language] ?? 'en-IN';
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };
    recognition.start();
  }, [isRecording, language, sendMessage]);

  const readLatest = useCallback(() => {
    if (latestAssessment?.explanation?.plain_language_text) {
      speech.play(latestAssessment.explanation.plain_language_text);
    }
  }, [latestAssessment, speech]);

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 hover:from-cyan-400 hover:to-blue-600 text-white px-4 py-3 shadow-[0_0_28px_-2px_rgba(34,211,238,0.6)] border border-cyan-300/40 transition active:scale-95"
        aria-label="Open ORCA voice assistant"
      >
        <AudioLines className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Voice</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4 sm:p-6 pointer-events-none"
          role="dialog"
          aria-label="ORCA voice assistant"
        >
          <div
            className="absolute inset-0 bg-ocean-1000/70 backdrop-blur-sm pointer-events-auto"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md h-[80vh] sm:h-[640px] glass-strong rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 pointer-events-auto">
            <header className="px-4 py-3 border-b border-cyan-500/15 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center">
                <AudioLines className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="flex-1 leading-tight">
                <p className="text-sm font-bold text-white">Ask ORCA · Voice-first</p>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted font-bold">
                  {language} · {latestAssessment?.telemetry.execution_ms?.toFixed(0) ?? '—'} ms
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-ink-muted hover:text-white hover:bg-ocean-800/60"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-2.5"
            >
              {messages.length === 0 && (
                <div className="text-center py-8 px-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-cyan-950 border border-cyan-700/40 flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5 text-cyan-300" />
                  </div>
                  <p className="text-sm font-bold text-white mb-1">
                    Ask me anything about your trip
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    Speak or type in {language}. I&apos;ll query the ocean models and answer out loud.
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-cyan-950/70 border border-cyan-700/50 text-cyan-100 rounded-tr-sm'
                        : 'bg-ocean-1000/70 border border-cyan-500/15 text-slate-100 rounded-tl-sm'
                    }`}
                  >
                    <p className="selectable">{m.text}</p>
                    <div className="flex items-center justify-between mt-1.5 text-[9px] text-ink-muted">
                      <span>{m.timestamp}</span>
                      {m.sender === 'orca' && (
                        <button
                          onClick={() => speech.play(m.text)}
                          className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                        >
                          <Volume2 className="w-3 h-3" /> listen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-ink-muted px-2">
                  <span className="w-1.5 h-3 bg-cyan-400 voice-bar rounded-sm" />
                  <span className="w-1.5 h-4 bg-cyan-300 voice-bar rounded-sm" style={{ animationDelay: '120ms' }} />
                  <span className="w-1.5 h-2.5 bg-cyan-500 voice-bar rounded-sm" style={{ animationDelay: '240ms' }} />
                  <span>ORCA reasoning engine is querying the ocean…</span>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div className="px-3 py-2 border-t border-cyan-500/10 flex items-center gap-1.5 overflow-x-auto">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              {prompts.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(p)}
                  className="shrink-0 text-[10px] bg-ocean-1000/60 hover:bg-cyan-950/60 border border-cyan-500/15 hover:border-cyan-500/40 rounded-full px-2.5 py-1 text-cyan-200 transition"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Voice recording strip */}
            {isRecording && (
              <div className="px-3 py-2 bg-red-950/40 border-t border-red-700/40 flex items-center justify-between text-[11px] text-red-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="font-bold uppercase tracking-wider">Listening · {language}</span>
                </div>
                <div className="flex items-end gap-0.5 h-5">
                  <div className="w-1 h-3 bg-red-400 voice-bar rounded-sm" />
                  <div className="w-1 h-5 bg-red-300 voice-bar rounded-sm" style={{ animationDelay: '100ms' }} />
                  <div className="w-1 h-2.5 bg-red-500 voice-bar rounded-sm" style={{ animationDelay: '200ms' }} />
                  <div className="w-1 h-4 bg-red-400 voice-bar rounded-sm" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Input row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="p-3 border-t border-cyan-500/15 flex items-center gap-2 bg-ocean-1000/50"
            >
              <button
                type="button"
                onClick={toggleRecording}
                className={`shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center transition ${
                  isRecording
                    ? 'bg-red-600 border-red-400 text-white animate-pulse'
                    : 'bg-cyan-950 hover:bg-cyan-900 border-cyan-700 text-cyan-300'
                }`}
                aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Type or speak in ${language}…`}
                className="flex-1 bg-ocean-1000/80 border border-cyan-500/20 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-ink-subtle focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="shrink-0 w-11 h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white flex items-center justify-center transition shadow-lg"
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <button
              type="button"
              onClick={readLatest}
              className="m-3 mt-0 rounded-xl border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/60 px-3 py-2 text-[11px] font-bold text-cyan-200 transition flex items-center justify-center gap-2"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Read latest verdict aloud
            </button>
          </div>
        </div>
      )}
    </>
  );
};