import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Send, Sparkles, AlertCircle } from 'lucide-react';

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
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const startVoiceInput = () => {
    setIsListening(true);
    // Web Speech API Voice Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'Marathi' ? 'mr-IN' : language === 'Hindi' ? 'hi-IN' : 'en-US';
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        onQuerySubmit(text);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      setTimeout(() => {
        const sampleQuery = 'गोव्याजवळ हवामान आणि मासेमारी कशी आहे?';
        setTranscript(sampleQuery);
        setIsListening(false);
        onQuerySubmit(sampleQuery);
      }, 1500);
    }
  };

  const playVoiceSynthesis = () => {
    if (!latestExplanation) return;
    setIsPlayingAudio(true);

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(latestExplanation);
      utterance.lang =
        language === 'Marathi'
          ? 'mr-IN'
          : language === 'Hindi'
          ? 'hi-IN'
          : language === 'Tamil'
          ? 'ta-IN'
          : language === 'Telugu'
          ? 'te-IN'
          : language === 'Gujarati'
          ? 'gu-IN'
          : 'en-US';

      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 3000);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-ocean-900 to-ocean-950 border border-cyan-800 rounded-2xl p-6 shadow-xl text-center space-y-3">
        <div className="inline-flex bg-cyan-900/80 p-3 rounded-full border border-cyan-700 text-cyan-300">
          <Sparkles className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Ask ORCA (Multilingual Voice AI)</h2>
        <p className="text-xs text-slate-300">
          Ask questions in 8 Indian coastal dialects • Real-Time ISRO Oceanography Synthesis
        </p>
      </div>

      {/* Voice Assistant Mic Button */}
      <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-8 shadow-xl text-center space-y-6">
        <div className="flex justify-center">
          <button
            onClick={startVoiceInput}
            className={`p-8 rounded-full shadow-2xl transition transform active:scale-95 flex items-center justify-center border-4 ${
              isListening
                ? 'bg-red-600 border-red-400 animate-ping text-white'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 hover:brightness-110 text-white'
            }`}
          >
            {isListening ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
          </button>
        </div>

        <p className="text-xs font-semibold text-slate-300">
          {isListening ? '🎙️ Listening... Speak your query clearly' : 'Tap the microphone to ask a voice question'}
        </p>

        {/* Text Input Fallback */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="or type your query here (e.g. 'Goa sea weather')..."
            className="flex-1 bg-ocean-950 border border-ocean-800 text-slate-200 text-xs rounded-xl px-4 py-3 outline-none focus:border-cyan-500 font-medium"
          />
          <button
            onClick={() => transcript.trim() && onQuerySubmit(transcript)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-xl shadow-md font-bold transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Explanation Output Card */}
      {latestExplanation && (
        <div className="bg-ocean-900 border border-cyan-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Synthesized Response ({language}):</span>
            </h3>
            <button
              onClick={playVoiceSynthesis}
              className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg font-bold border transition ${
                isPlayingAudio
                  ? 'bg-emerald-900 text-emerald-300 border-emerald-700 animate-pulse'
                  : 'bg-cyan-900 hover:bg-cyan-800 text-cyan-200 border-cyan-700'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingAudio ? 'Playing Audio...' : 'Listen Audio'}</span>
            </button>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed font-medium bg-ocean-950/60 p-4 rounded-xl border border-ocean-800">
            "{latestExplanation}"
          </p>
        </div>
      )}
    </div>
  );
};
