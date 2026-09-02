/**
 * Centralized speech synthesis + recognition helpers.
 * Returns a small subscription interface so views can show "playing" state.
 */

const LANGUAGE_TO_BCP47: Record<string, string> = {
  Marathi: 'mr-IN',
  Hindi: 'hi-IN',
  Gujarati: 'gu-IN',
  Tamil: 'ta-IN',
  Telugu: 'te-IN',
  Malayalam: 'ml-IN',
  Kannada: 'kn-IN',
  Bengali: 'bn-IN',
  English: 'en-US',
};

export const resolveSpeechLang = (language: string): string =>
  LANGUAGE_TO_BCP47[language] ?? 'en-US';

export function speakText(
  text: string,
  language: string,
  callbacks?: { onStart?: () => void; onEnd?: () => void; onError?: () => void },
) {
  if (!text || !('speechSynthesis' in window)) {
    callbacks?.onError?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = resolveSpeechLang(language);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => callbacks?.onStart?.();
    utterance.onend = () => callbacks?.onEnd?.();
    utterance.onerror = () => callbacks?.onError?.();

    window.speechSynthesis.speak(utterance);
  } catch {
    callbacks?.onError?.();
  }
}

export function isSpeechRecognitionSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

export function startVoiceRecognition(
  language: string,
  callbacks: {
    onResult: (transcript: string) => void;
    onError?: (err: string) => void;
    onEnd?: () => void;
  },
): { stop: () => void } | null {
  if (!isSpeechRecognitionSupported()) {
    callbacks.onError?.('unsupported');
    return null;
  }

  const SpeechRecognition =
    (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
      .SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = resolveSpeechLang(language);

  recognition.onresult = (event: any) => {
    const transcript = event.results?.[0]?.[0]?.transcript ?? '';
    callbacks.onResult(transcript);
  };

  recognition.onerror = (event: any) => {
    callbacks.onError?.(event.error ?? 'unknown');
    callbacks.onEnd?.();
  };

  recognition.onend = () => callbacks.onEnd?.();

  try {
    recognition.start();
  } catch {
    callbacks.onError?.('start-failed');
    return null;
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
  };
}