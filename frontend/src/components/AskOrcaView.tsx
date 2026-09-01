import React, { useState } from 'react';
import { Mic, Send, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { listenVoice, speakText } from '../utils/voiceSpeech';

interface AskOrcaViewProps {
  language: string;
  onQuerySubmit: (query: string) => void;
  latestExplanation?: string;
}

export const AskOrcaView: React.FC<AskOrcaViewProps> = ({
  language,
  onQuerySubmit,
  latestExplanation,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');

  const handleMicClick = () => {
    setIsListening(true);
    listenVoice(
      (transcript) => {
        setIsListening(false);
        setInputText(transcript);
        onQuerySubmit(transcript);
      },
      (err) => {
        setIsListening(false);
        console.warn('Voice error:', err);
      },
      language
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onQuerySubmit(inputText);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Big One-Tap Voice Assistant Button */}
      <div className="bg-ocean-900/90 border border-ocean-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
        <div className="flex justify-center">
          <button
            onClick={handleMicClick}
            className={`w-28 h-28 rounded-full flex items-center justify-center transition shadow-2xl ${
              isListening
                ? 'bg-red-600 animate-ping text-white'
                : 'bg-gradient-to-tr from-cyan-600 to-emerald-500 hover:scale-105 text-white'
            }`}
          >
            <Mic className="w-12 h-12" />
          </button>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">
            {isListening
              ? language === 'Marathi'
                ? 'ऐकत आहे... बोला'
                : 'Listening... Speak Now'
              : language === 'Marathi'
              ? 'बोलून विचारा (मराठी / Koli)'
              : 'Tap to Ask Orca in Native Dialect'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Example: "उद्या सकाळी ६ वाजता मासेमारीसाठी जाणे सुरक्षित आहे का?"
          </p>
        </div>
      </div>

      {/* Text Query Input Form */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            language === 'Marathi'
              ? 'येथे प्रश्न टाईप करा...'
              : 'Type your trip query here...'
          }
          className="flex-1 bg-ocean-900 border border-ocean-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-500"
        />
        <button
          type="submit"
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center space-x-2 shadow-lg transition"
        >
          <span>Ask</span>
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Answer Output Card */}
      {latestExplanation && (
        <div className="bg-ocean-900/80 border border-ocean-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1">
              <Sparkles className="w-4 h-4" />
              <span>ORCA Dialect Response</span>
            </span>
            <button
              onClick={() => speakText(latestExplanation, language)}
              className="text-xs bg-ocean-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-ocean-700 flex items-center space-x-1"
            >
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Replay Audio</span>
            </button>
          </div>
          <p className="text-base text-slate-100 font-semibold leading-relaxed">
            "{latestExplanation}"
          </p>
        </div>
      )}
    </div>
  );
};
