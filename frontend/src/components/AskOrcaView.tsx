import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, Sparkles, Compass, ShieldAlert, Fish, Bot, User, RefreshCw } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { fetchTripAssessment } from '../utils/api';
import { TripAssessmentResponse } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'orca';
  text: string;
  timestamp: string;
  assessment?: TripAssessmentResponse;
}

interface AskOrcaViewProps {
  language: string;
  onQuerySubmit: (queryText: string) => void;
  latestExplanation?: string;
}

export const AskOrcaView: React.FC<AskOrcaViewProps> = ({
  language,
  onQuerySubmit,
  latestExplanation,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_msg',
      sender: 'orca',
      text: latestExplanation || 'नमस्कार! मी ओर्का सागरी एआय सहाय्यक आहे. समुद्रातील हवामान, मासेमारी क्षेत्र किंवा सुरक्षा याविषयी मला प्रश्न विचारा.',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speech = useSpeech(language);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Speech Recognition Input
  const handleToggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language.includes('Marathi') ? 'mr-IN' : language.includes('Hindi') ? 'hi-IN' : 'en-IN';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      handleSendMessage(transcript);
    };

    recognition.start();
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      onQuerySubmit(text);
      // Fetch dynamic decision from backend API
      const assessmentData = await fetchTripAssessment(16.0500, 73.4667, 8.5, language, text);

      const orcaMsg: Message = {
        id: `orca_${Date.now()}`,
        sender: 'orca',
        text: assessmentData.explanation.plain_language_text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        assessment: assessmentData,
      };

      setMessages((prev) => [...prev, orcaMsg]);
      speech.play(assessmentData.explanation.plain_language_text);
    } catch (err) {
      const errorMsg: Message = {
        id: `orca_${Date.now()}`,
        sender: 'orca',
        text: '⚠️ क्षमस्व, सर्व्हरशी संपर्क साधताना अडचण आली. कृपया पुन्हा प्रयत्न करा.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'उद्या सकाळी मासेमारीसाठी जाणे सुरक्षित आहे का?',
    'मालवण किनाऱ्याजवळ बांगडा मासे कुठे मिळतील?',
    'रत्नागिरी जवळील IMBL सीमेपासून अंतर किती आहे?',
    '३० किमी प्रवासासाठी डिझेल किती लागेल?',
  ];

  return (
    <div className="flex flex-col h-[650px] md:h-[700px] bg-ocean-950 border border-ocean-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl relative">
      {/* Header */}
      <div className="p-4 border-b border-ocean-800 bg-ocean-900/90 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-950 border border-cyan-800 rounded-xl text-cyan-400 shadow-inner">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Ask ORCA AI Voice Assistant</span>
              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                ONLINE (ISRO Multi-Agent)
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Voice-First Maritime Natural Language Reasoning ({language})</p>
          </div>
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div
              className={`p-2 rounded-xl border shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-cyan-950 border-cyan-800 text-cyan-300'
                  : 'bg-ocean-900 border-ocean-800 text-slate-300'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-cyan-400" />}
            </div>

            <div
              className={`max-w-xl p-4 rounded-2xl border text-xs leading-relaxed space-y-2 shadow-lg ${
                msg.sender === 'user'
                  ? 'bg-cyan-950/80 border-cyan-800 text-cyan-100 rounded-tr-none'
                  : 'bg-ocean-900/90 border-ocean-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <p className="font-sans font-medium text-sm">{msg.text}</p>

              {/* Assessment Quick Badge Card if attached */}
              {msg.assessment && (
                <div className="bg-ocean-950 p-3 rounded-xl border border-ocean-800 mt-2 space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-cyan-400">Verdict: {msg.assessment.verdict}</span>
                    <span className="text-amber-400 font-bold">Risk: {msg.assessment.risk_score}/100</span>
                  </div>
                  {msg.assessment.pfz_grounds[0] && (
                    <span className="text-emerald-400 block text-[10px]">
                      📍 Top Ground: {msg.assessment.pfz_grounds[0].name} ({msg.assessment.pfz_grounds[0].hsi} HSI)
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-ocean-800/40">
                <span>{msg.timestamp}</span>
                {msg.sender === 'orca' && (
                  <button
                    onClick={() => speech.play(msg.text)}
                    className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-ocean-900/60 p-3 rounded-xl border border-ocean-800 max-w-xs">
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>ORCA Reasoning Engine is analyzing ocean parameters…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-4 py-2 bg-ocean-900/40 border-t border-ocean-900 flex items-center space-x-2 overflow-x-auto text-xs">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputText(prompt);
              handleSendMessage(prompt);
            }}
            className="bg-ocean-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-xl border border-ocean-800 shrink-0 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Voice Recording Waveform Bar */}
      {isRecording && (
        <div className="px-4 py-2 bg-cyan-950 border-t border-cyan-800 flex items-center justify-between text-xs text-cyan-300">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-bold">Listening... Speak now in {language}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1 h-4 bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-6 bg-cyan-300 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-3 bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            <div className="w-1 h-5 bg-cyan-400 animate-bounce" style={{ animationDelay: '450ms' }} />
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 border-t border-ocean-800 bg-ocean-900/90 flex items-center space-x-2">
        <button
          onClick={handleToggleRecording}
          title={isRecording ? 'Stop Recording' : 'Voice Input'}
          className={`p-3 rounded-xl border shadow-lg transition ${
            isRecording
              ? 'bg-red-600 border-red-400 text-white animate-pulse'
              : 'bg-cyan-950 hover:bg-cyan-900 border-cyan-800 text-cyan-400'
          }`}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex-1 flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type your query in ${language} or English...`}
            className="flex-1 bg-ocean-950 border border-ocean-800 text-slate-100 text-xs rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white p-3 rounded-xl font-bold transition shadow-lg flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};