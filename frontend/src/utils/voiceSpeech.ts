// Voice Speech Engine with Web Speech API & Offline Fallback
export function speakText(text: string, language: string = 'Marathi') {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  if (language === 'Marathi') {
    utterance.lang = 'mr-IN';
  } else if (language === 'Hindi') {
    utterance.lang = 'hi-IN';
  } else {
    utterance.lang = 'en-US';
  }

  utterance.rate = 0.95; // Slightly slower for clarity
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}

export function listenVoice(
  onResult: (transcript: string) => void,
  onError: (err: any) => void,
  language: string = 'Marathi'
) {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Voice recognition API not supported on this browser.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  
  if (language === 'Marathi') {
    recognition.lang = 'mr-IN';
  } else if (language === 'Hindi') {
    recognition.lang = 'hi-IN';
  } else {
    recognition.lang = 'en-US';
  }

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event: any) => {
    onError(event.error);
  };

  recognition.start();
}
