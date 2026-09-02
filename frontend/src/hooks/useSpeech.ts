import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveSpeechLang, speakText } from '../utils/speech';

export function useSpeech(language: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const play = useCallback(
    (text: string | undefined) => {
      if (!text) return;
      setIsPlaying(true);
      speakText(text, language, {
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    },
    [language],
  );

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  return { isPlaying, play, stop, lang: resolveSpeechLang(language) };
}