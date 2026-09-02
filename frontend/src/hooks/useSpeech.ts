import { useState, useEffect, useCallback } from 'react';

export interface UseSpeechResult {
  isPlaying: boolean;
  play: (text: string) => void;
  stop: () => void;
  isSupported: boolean;
}

export function useSpeech(language: string = 'Marathi'): UseSpeechResult {
  const [isPlaying, setIsPlaying] = useState(false);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, [isSupported]);

  const play = useCallback((text: string) => {
    if (!isSupported || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Language mapping
    if (language.includes('Marathi') || language.includes('Koli')) {
      utterance.lang = 'mr-IN';
    } else if (language.includes('Hindi')) {
      utterance.lang = 'hi-IN';
    } else if (language.includes('Gujarati')) {
      utterance.lang = 'gu-IN';
    } else if (language.includes('Tamil')) {
      utterance.lang = 'ta-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported, language]);

  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    isPlaying,
    play,
    stop,
    isSupported,
  };
}