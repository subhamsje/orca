import React, { useState } from 'react';
import { Mic, MicOff, Send, Sparkles } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import {
  isSpeechRecognitionSupported,
  startVoiceRecognition,
} from '../utils/speech';
import { AudioButton, Button, Card, CardHeader, EmptyState, StatusBadge } from '../ui';

interface AskOrcaViewProps {
  language: string;
  onQuerySubmit: (queryText: string) => void;
  latestExplanation?: string;
}

const SAMPLE_QUERIES: Record<string, string> = {
  Marathi: 'गोव्याजवळ हवामान आणि मासेमारी कशी आहे?',
  Hindi: 'मुंबई के पास मछली पकड़ने के लिए आज मौसम कैसा है?',
  Gujarati: 'વેરાવળ પાસે આજે માછીમારી માટે હવામાન કેવું છે?',
  Tamil: 'சென்னை கடலில் இன்று மீன் பிடிக்க பாதுக்க safe?',
  Telugu: 'విశాఖపట్నం వద్దే ఈరోజు చేపలు పట్టడానికి వాతావరణం ఎలా ఉంది?',
  Malayalam: 'കൊച്ചിക്ക് സമീപം ഇന്ന് മത്സ്യബന്ധനത്തിന് കാലാവസ്ഥ എങ്ങനെ?',
  Kannada: 'ಮಂಗಳೂರಿನ ಬಳಿ ಇಂದು ಮೀನುಗಾರಿಕೆಗೆ ಹವಾಮಾನ ಹೇಗಿದೆ?',
  Bengali: 'পারাদ্বীপের কাছে আজ মাছ ধরার আবহাওয়া কেমন?',
  English: 'Is it safe to fish near Goa today?',
};

export const AskOrcaView: React.FC<AskOrcaViewProps> = ({
  language,
  onQuerySubmit,
  latestExplanation,
}) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const speech = useSpeech(language);

  const handleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setRecognitionError(null);
    setIsListening(true);

    const result = startVoiceRecognition(language, {
      onResult: (text) => {
        setTranscript(text);
        setIsListening(false);
        onQuerySubmit(text);
      },
      onError: (err) => {
        setIsListening(false);
        setRecognitionError(
          err === 'unsupported'
            ? 'Voice input is not supported in this browser.'
            : 'Could not capture audio. Try typing instead.',
        );
      },
      onEnd: () => setIsListening(false),
    });

    if (!result && !isSpeechRecognitionSupported()) {
      setIsListening(false);
    }
  };

  const handleSubmit = () => {
    const trimmed = transcript.trim();
    if (!trimmed) return;
    onQuerySubmit(trimmed);
  };

  const sample = SAMPLE_QUERIES[language] ?? SAMPLE_QUERIES.English;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Card padding="lg">
        <div className="text-center space-y-3">
          <div className="bg-cyan-950 border border-cyan-800 p-3 rounded-full inline-flex text-cyan-300">
            <Sparkles className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Ask ORCA</h2>
            <p className="text-xs text-ink-muted mt-1">
              Multilingual voice-first AI · 9 Indian coastal dialects
            </p>
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            <StatusBadge tone="info">{language}</StatusBadge>
            <StatusBadge tone={isListening ? 'caution' : 'neutral'}>
              {isListening ? 'Listening' : 'Ready'}
            </StatusBadge>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleMic}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            aria-pressed={isListening}
            className={[
              'p-7 rounded-full border-4 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/60',
              'active:scale-95',
              isListening
                ? 'bg-red-600 border-red-400 text-white'
                : 'bg-cyan-600 border-cyan-400 text-white hover:bg-cyan-500',
            ].join(' ')}
          >
            {isListening ? (
              <MicOff className="w-10 h-10" aria-hidden="true" />
            ) : (
              <Mic className="w-10 h-10" aria-hidden="true" />
            )}
          </button>
        </div>

        <p className="mt-3 text-xs text-center text-ink-muted">
          {isListening
            ? '🎙️ Listening — speak your question clearly'
            : 'Tap to speak, or type below'}
        </p>

        {recognitionError && (
          <p className="mt-2 text-xs text-center text-amber-300">{recognitionError}</p>
        )}

        <div className="mt-5 flex items-stretch gap-2">
          <label htmlFor="orca-query" className="sr-only">
            Ask ORCA
          </label>
          <input
            id="orca-query"
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={`Try "${sample}"`}
            className="flex-1 bg-ocean-950 border border-ocean-800 text-slate-100 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400"
          />
          <Button
            type="button"
            size="md"
            leadingIcon={<Send className="w-4 h-4" />}
            onClick={handleSubmit}
            disabled={!transcript.trim()}
          >
            Ask
          </Button>
        </div>

        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-wider text-ink-muted font-bold mb-2">
            Try a sample question
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(SAMPLE_QUERIES)
              .slice(0, 5)
              .map(([lang, query]) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setTranscript(query)}
                  className="text-[11px] font-medium text-slate-200 bg-ocean-800 hover:bg-ocean-700 border border-ocean-700 rounded-full px-3 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  {lang}
                </button>
              ))}
          </div>
        </div>
      </Card>

      {latestExplanation ? (
        <Card padding="md">
          <CardHeader
            title={`Latest response (${language})`}
            icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
            badge={
              <AudioButton
                isPlaying={speech.isPlaying}
                onPlay={() => speech.play(latestExplanation)}
                onStop={speech.stop}
                label="Listen"
                variant="cyan"
                size="sm"
              />
            }
          />
          <p className="mt-3 text-sm text-slate-100 leading-relaxed bg-ocean-950/60 p-4 rounded-xl border border-ocean-800">
            “{latestExplanation}”
          </p>
        </Card>
      ) : (
        <Card padding="md">
          <EmptyState
            icon={<Sparkles className="w-5 h-5" />}
            title="No response yet"
            description="Ask a question above to receive a plain-language explanation in your selected dialect."
          />
        </Card>
      )}
    </div>
  );
};