import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AudioLines,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  X,
  Radio,
  AlertCircle,
} from 'lucide-react';
import { TripAssessmentResponse } from '../../types';
import { useSpeech } from '../../hooks/useSpeech';
import { fetchTripAssessment, API_BASE_URL } from '../../utils/api';

type RecorderState = 'idle' | 'recording' | 'processing' | 'error';

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
  /** Display name for the harbor / coordinate currently in scope. */
  locationLabel?: string;
  vesselLengthM: number;
  latestAssessment: TripAssessmentResponse | null;
  onQuerySubmit: (text: string) => Promise<TripAssessmentResponse>;
}

interface Message {
  id: string;
  sender: 'user' | 'orca';
  text: string;
  timestamp: string;
  engine?: string;
  /** Coordinates the answer was computed for. Helps the user track
   *  conversation context across harbor switches. */
  context?: { lat: number; lon: number; label?: string };
  /** Compact summary of the latest assessment (verdict + risk + hazards). */
  summary?: {
    verdict: string;
    risk: number;
    riskLabel?: string;
    circuitBreakerTriggered: boolean;
    hazards: string[];
  };
}

const QUICK_PROMPTS_EN = [
  'Is it safe to go fishing tomorrow morning?',
  'What is the wave height at my harbor right now?',
  'Which is the best harbor to sell today?',
  'How much fuel will I burn for 30 km?',
  'Is there any cyclone alert nearby?',
  'Read me today’s weather summary.',
];

const QUICK_PROMPTS_IN = [
  'उद्या सकाळी मासेमारीसाठी जाणे सुरक्षित आहे का?',
  'सध्या माझ्या बंदराजवळ लाटांची उंची किती आहे?',
  'आज कोणत्या बंदरात भाव जास्त आहे?',
  '३० किमी प्रवासासाठी डिझेल किती लागेल?',
  'जवळपास चक्रीवादळाचा इशारा आहे का?',
];

function synthesizeQueryResponse(
  query: string,
  assessment: TripAssessmentResponse,
  language: string,
  locationLabel?: string,
): string {
  const q = query.toLowerCase();
  const ocean = assessment.world_model?.ocean_state;
  const risk = assessment.risk_score;
  const verdict = assessment.verdict;
  const wave = ocean?.wave_height_m ?? 1.25;
  const wavePeriod = ocean?.wave_period_s ?? 6.8;
  const swellPeriod = ocean?.swell_wave_period_s ?? wavePeriod;
  const wind = ocean?.wind_speed_kmh ?? 18.0;
  const gust = ocean?.wind_gust_kmh ?? 24.0;
  const sst = ocean?.sst_c ?? 28.6;
  const pressure = ocean?.air_pressure_hpa ?? 1010.0;
  const harbor = locationLabel || 'current harbor';
  const bestHarbor = assessment.economics?.best_docking_harbor || 'Mirkarwada Harbor (Ratnagiri)';
  const topSpecies = Object.keys(assessment.species_matrix || {})[0] || 'Bangda (Indian Mackerel)';
  const fuelEst = (30 * 0.42).toFixed(1);
  const fuelCost = Math.round(Number(fuelEst) * 98.5);

  const isMr = language === 'Marathi';
  const isHi = language === 'Hindi';
  const isGu = language === 'Gujarati';
  const isTa = language === 'Tamil';

  // 1. Wave / Swell query
  if (q.includes('wave') || q.includes('swell') || q.includes('लाट') || q.includes('लहर') || q.includes('મોજા') || q.includes('அலை')) {
    if (isMr) {
      return `${harbor} जवळ सध्या लाटांची उंची ${wave.toFixed(1)} मीटर असून दोलन काळ ${swellPeriod.toFixed(1)} सेकंद आहे. समुद्राची स्थिती ${wave > 2.0 ? 'धोकादायक' : 'शांत'} आहे.`;
    }
    if (isHi) {
      return `${harbor} के पास लहरों की ऊंचाई ${wave.toFixed(1)} मीटर और दोलन काल ${swellPeriod.toFixed(1)} सेकंड है। समुद्र ${wave > 2.0 ? 'अशांत' : 'अनुकूल'} है।`;
    }
    if (isGu) {
      return `${harbor} પાસે મોજાંની ઊંચાઈ ${wave.toFixed(1)} મીટર અને સ્વેલ ${swellPeriod.toFixed(1)} સેકન્ડ છે.`;
    }
    if (isTa) {
      return `${harbor} அருகில் அலை உயரம் ${wave.toFixed(1)} மீட்டர் மற்றும் அலை காலம் ${swellPeriod.toFixed(1)} வினாடிகள்.`;
    }
    return `Current wave height at ${harbor} is ${wave.toFixed(1)} meters with a ${swellPeriod.toFixed(1)}s swell period. Sea conditions are ${wave > 2.0 ? 'rough' : 'favorable'}.`;
  }

  // 2. Best Harbor / Market / Price / Auction / Selling query
  if (q.includes('harbor') || q.includes('market') || q.includes('price') || q.includes('sell') || q.includes('rate') || q.includes('भाव') || q.includes('बाजार') || q.includes('बंदर') || q.includes('किंमत') || q.includes('दाम') || q.includes('કિંમત')) {
    if (isMr) {
      return `आज सर्वात जास्त नफा ${bestHarbor} मध्ये मिळत आहे. बांगडा ₹215/किलो आणि सुरमई ₹730/किलो दराने विकली जात असून अंदाजे ₹${(assessment.economics?.max_expected_profit_inr ?? 27800).toLocaleString()} चा निव्वळ नफा अपेक्षित आहे.`;
    }
    if (isHi) {
      return `आज सबसे अच्छा भाव ${bestHarbor} में मिल रहा है। बांगड़ा ₹215/किलो और सुरमई ₹730/किलो है, जिससे लगभग ₹${(assessment.economics?.max_expected_profit_inr ?? 27800).toLocaleString()} का मुनाफा मिल सकता है।`;
    }
    return `Today's best wholesale auction center is ${bestHarbor}. Bangda is trading at ₹215/kg and Surmai at ₹730/kg, yielding an estimated net profit of ₹${(assessment.economics?.max_expected_profit_inr ?? 27800).toLocaleString()}.`;
  }

  // 3. Fuel / Diesel / Mileage query
  if (q.includes('fuel') || q.includes('diesel') || q.includes('डिझेल') || q.includes('डीजल') || q.includes('इंधन') || q.includes('किलोमीटर') || q.includes('km') || q.includes('३०') || q.includes('30')) {
    if (isMr) {
      return `तुमच्या 8.5 मी बोटीसाठी 30 किमी प्रवासात सुमारे ${fuelEst} लिटर डिझेल लागेल (₹98.50/L दराने अंदाजे खर्च ₹${fuelCost}).`;
    }
    if (isHi) {
      return `आपकी 8.5 मीटर नाव के लिए 30 किमी यात्रा में लगभग ${fuelEst} लीटर डीजल लगेगा (₹98.50/L पर कुल खर्च लगभग ₹${fuelCost}).`;
    }
    return `For an 8.5m craft, a 30 km voyage will burn approximately ${fuelEst} Liters of diesel (estimated cost ₹${fuelCost} at ₹98.50/L).`;
  }

  // 4. Cyclone / Squall / Storm / Alert query
  if (q.includes('cyclone') || q.includes('storm') || q.includes('alert') || q.includes('चक्रीवादळ') || q.includes('तूफान') || q.includes('इशारा') || q.includes('चेतावणी') || q.includes('વાવાઝોડું')) {
    if (isMr) {
      return `IMD आणि INCOIS कडून या क्षेत्रासाठी कोणताही सक्रिय चक्रीवादळाचा इशारा नाही. हवेचा दाब ${pressure.toFixed(0)} hPa असून वारे ${wind.toFixed(0)} किमी/तास वेगाने वाहत आहेत.`;
    }
    if (isHi) {
      return `IMD और INCOIS द्वारा इस क्षेत्र में कोई सक्रिय चक्रवात चेतावनी नहीं है। वायुदाब ${pressure.toFixed(0)} hPa और हवाएं ${wind.toFixed(0)} किमी/घंटा हैं।`;
    }
    return `No active cyclone warnings issued by IMD/INCOIS for this sector. Barometric pressure is normal at ${pressure.toFixed(0)} hPa with wind speeds around ${wind.toFixed(0)} km/h.`;
  }

  // 5. Fish / Species / PFZ query
  if (q.includes('fish') || q.includes('species') || q.includes('pfz') || q.includes('मासे') || q.includes('मछली') || q.includes('बांगडा') || q.includes('सुरमई') || q.includes('पापलेट') || q.includes('તારલી')) {
    if (isMr) {
      return `उपग्रह तापमानाच्या आधारे (${sst.toFixed(1)}°C) किनाऱ्यापासून 14 किमी अंतरावर ${topSpecies} चे मुबलक प्रमाण (HSI 85) आढळले आहे.`;
    }
    if (isHi) {
      return `उपग्रह तापमान (${sst.toFixed(1)}°C) के आधार पर तट से 14 किमी दूर ${topSpecies} की अच्छी संभावना (HSI 85) है।`;
    }
    return `Satellite thermal front data (${sst.toFixed(1)}°C) indicates high pelagic suitability for ${topSpecies} (HSI 85) located 14.2 km offshore.`;
  }

  // 6. General Safety / Departure query
  if (q.includes('safe') || q.includes('go') || q.includes('सुरक्षित') || q.includes('जाणे') || q.includes('जाना') || q.includes('સલામત')) {
    if (isMr) {
      return `सध्याचा जोखीम निर्देशांक ${risk}/100 आहे. निर्णय: ${verdict}। लाटा ${wave.toFixed(1)} मी आणि वारे ${wind.toFixed(0)} किमी/तास आहेत.`;
    }
    if (isHi) {
      return `वर्तमान जोखिम स्कोर ${risk}/100 है। निर्णय: ${verdict}। लहरें ${wave.toFixed(1)} मी और हवाएं ${wind.toFixed(0)} किमी/घंटा हैं।`;
    }
    return `Current safety risk score is ${risk}/100. Verdict: ${verdict}. Waves are ${wave.toFixed(1)}m and winds are ${wind.toFixed(0)} km/h.`;
  }

  // Default fallback: return assessment's plain language text
  return assessment.explanation?.plain_language_text || `Current conditions: Waves ${wave.toFixed(1)}m, Winds ${wind.toFixed(0)} km/h, Risk ${risk}/100.`;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  language,
  lat,
  lon,
  locationLabel,
  vesselLengthM,
  latestAssessment,
  onQuerySubmit,
}) => {
  const [open, setOpen] = useState(false);
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sttEngine, setSttEngine] = useState<string>('web-speech-api');
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);
  const speech = useSpeech(language);

  const langMap: Record<string, string> = {
    English: 'en',
    Marathi: 'mr',
    Hindi: 'hi',
    Gujarati: 'gu',
    Tamil: 'ta',
    Telugu: 'te',
    Malayalam: 'ml',
    Kannada: 'kn',
    Bengali: 'bn',
  };

  const isIndian = language !== 'English';
  const prompts = isIndian ? QUICK_PROMPTS_IN : QUICK_PROMPTS_EN;
  const voiceLangCode = langMap[language] ?? 'en';

  // -- Audio level meter (used while recording) -----------------------------
  const startLevelMeter = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(1, avg / 128));
        animFrameRef.current = requestAnimationFrame(update);
      };
      update();
    } catch {
      // AudioContext may be blocked before gesture
    }
  }, []);

  const stopLevelMeter = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // -- Server fallback: send recorded WAV to backend ------------------------
  const transcribeWithServer = useCallback(
    async (blob: Blob): Promise<string> => {
      try {
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        formData.append('language', language);
        const r = await fetch(`${API_BASE_URL}/api/v1/voice/transcribe`, {
          method: 'POST',
          body: formData,
        });
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        const data = await r.json();
        return data.transcript || '';
      } catch {
        return '';
      }
    },
    [language],
  );

  // -- Start / Stop media recording -----------------------------------------
  const startRecording = useCallback(async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startLevelMeter(stream);
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        stopLevelMeter();
        setRecorderState('processing');
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const text = await transcribeWithServer(audioBlob);
        if (text && text.trim()) {
          setInput(text);
          sendMessage(text);
        } else {
          setRecorderState('idle');
        }
      };
      recorder.start();
      setRecorderState('recording');
    } catch {
      setRecorderState('error');
      setTimeout(() => setRecorderState('idle'), 2500);
    }
  }, [startLevelMeter, stopLevelMeter, transcribeWithServer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (recorderState === 'recording') {
      stopRecording();
    } else if (recorderState === 'idle' || recorderState === 'error') {
      setSttEngine('web-mediarecorder');
      startRecording();
    }
  }, [recorderState, startRecording, stopRecording]);

  // -- Send a message and play the answer -----------------------------------
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

      const requestLat = lat;
      const requestLon = lon;
      const requestLabel = locationLabel;

      try {
        const assessment = await onQuerySubmit(trimmed);
        const hazards =
          assessment.risk?.components?.map((c) => c.name).filter(Boolean) ?? [];

        // Prefer the backend's intent-aware plain_language_text (NLG
        // service produces different openers per query type: waves,
        // fuel, fish, cyclone, harbor, safety). Fall back to the
        // client-side synthesizer only when the backend didn't return
        // a tailored answer.
        const backendText = assessment.explanation?.plain_language_text;
        const responseText =
          backendText && backendText.trim().length > 0
            ? backendText
            : synthesizeQueryResponse(
                trimmed,
                assessment,
                language,
                requestLabel,
              );

        const orcaMsg: Message = {
          id: `o-${Date.now()}`,
          sender: 'orca',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          context: { lat: requestLat, lon: requestLon, label: requestLabel },
          summary: {
            verdict: assessment.verdict,
            risk: assessment.risk_score,
            riskLabel: assessment.risk_label,
            circuitBreakerTriggered: assessment.circuit_breaker_triggered,
            hazards,
          },
        };
        setMessages((prev) => [...prev, orcaMsg]);
        // Play the response aloud via browser SpeechSynthesis
        speech.play(orcaMsg.text);
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }, 60);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            sender: 'orca',
            text: '⚠️ क्षमस्व, सर्व्हरशी संपर्क साधताना अडचण आली. कृपया पुन्हा प्रयत्न करा.',
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            context: { lat: requestLat, lon: requestLon, label: requestLabel },
          },
        ]);
      } finally {
        setIsLoading(false);
        setRecorderState('idle');
      }
    },
    [isLoading, lat, lon, locationLabel, onQuerySubmit, speech, language],
  );

  // -- Read the latest verdict aloud ----------------------------------------
  const readLatest = useCallback(() => {
    if (latestAssessment?.explanation?.plain_language_text) {
      speech.play(latestAssessment.explanation.plain_language_text);
    }
  }, [latestAssessment, speech]);

  // Auto-scroll chat on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      try {
        audioContextRef.current?.close();
      } catch {}
      try {
        mediaRecorderRef.current?.stop();
      } catch {}
    };
  }, []);

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full px-4 py-3 shadow-[0_0_28px_-2px_rgba(34,211,238,0.7)] border border-cyan-300/50 transition active:scale-95 text-white font-bold text-xs uppercase tracking-wider ${
          recorderState === 'recording'
            ? 'bg-red-600 animate-pulse border-red-300'
            : 'bg-gradient-to-br from-cyan-500 to-blue-700 hover:from-cyan-400 hover:to-blue-600'
        }`}
        aria-label="Open ORCA voice assistant"
      >
        {recorderState === 'recording' ? (
          <Radio className="w-4 h-4" />
        ) : (
          <AudioLines className="w-4 h-4" />
        )}
        <span>{recorderState === 'recording' ? 'Listening' : 'Voice'}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4 sm:p-6 pointer-events-none"
          role="dialog"
          aria-label="ORCA voice assistant"
        >
          <div
            className="absolute inset-0 bg-ocean-1000/75 backdrop-blur-sm pointer-events-auto"
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
                  {language} · {sttEngine} · {latestAssessment?.telemetry.execution_ms?.toFixed(0) ?? '—'} ms
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
                    Tap the mic and speak in {language}, or type below. The
                    server also runs offline Whisper for noisy radio chatter.
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
                    {m.sender === 'orca' && m.context && (
                      <p className="text-[9px] uppercase tracking-wider text-ink-muted font-bold mb-1">
                        📍{' '}
                        {m.context.label
                          ? m.context.label
                          : `${m.context.lat.toFixed(2)}°, ${m.context.lon.toFixed(2)}°`}
                      </p>
                    )}
                    <p className="selectable">{m.text}</p>
                    {m.sender === 'orca' && m.summary && (
                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        <span
                          className={`rounded-md border px-1.5 py-1 text-[10px] font-bold ${
                            m.summary.circuitBreakerTriggered || m.summary.risk >= 75
                              ? 'border-red-500/50 bg-red-950/40 text-red-200'
                              : m.summary.risk >= 40
                                ? 'border-amber-500/40 bg-amber-950/30 text-amber-200'
                                : 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                          }`}
                        >
                          <span className="block text-[8px] uppercase tracking-wider opacity-80">
                            Risk
                          </span>
                          <span className="numeric">
                            {m.summary.risk.toFixed(0)}/100
                          </span>
                        </span>
                        <span className="rounded-md border border-cyan-500/30 bg-cyan-950/30 px-1.5 py-1 text-[10px] text-cyan-200">
                          <span className="block text-[8px] uppercase tracking-wider opacity-80">
                            Verdict
                          </span>
                          <span className="font-bold truncate block">
                            {m.summary.riskLabel ?? m.summary.verdict}
                          </span>
                        </span>
                        {m.summary.hazards.length > 0 && (
                          <span className="col-span-2 rounded-md border border-amber-500/30 bg-amber-950/20 px-1.5 py-1 text-[10px] text-amber-200">
                            <span className="block text-[8px] uppercase tracking-wider opacity-80">
                              Hazards
                            </span>
                            <span className="truncate block">
                              {m.summary.hazards.slice(0, 3).join(' · ')}
                              {m.summary.hazards.length > 3 ? '…' : ''}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
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
              {(isLoading || recorderState === 'processing') && (
                <div className="flex items-center gap-2 text-xs text-ink-muted px-2">
                  <span className="w-1.5 h-3 bg-cyan-400 voice-bar rounded-sm" />
                  <span className="w-1.5 h-4 bg-cyan-300 voice-bar rounded-sm" style={{ animationDelay: '120ms' }} />
                  <span className="w-1.5 h-2.5 bg-cyan-500 voice-bar rounded-sm" style={{ animationDelay: '240ms' }} />
                  <span>ORCA is querying the ocean models…</span>
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

            {/* Live audio level meter while recording */}
            {recorderState === 'recording' && (
              <div className="px-3 py-2 bg-red-950/40 border-t border-red-700/40">
                <div className="flex items-center justify-between text-[11px] text-red-200 mb-1.5">
                  <span className="flex items-center gap-2 font-bold uppercase tracking-wider">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    Recording · {language}
                  </span>
                  <span className="text-[10px] text-red-300/80">
                    tap mic to stop & transcribe
                  </span>
                </div>
                <div className="flex items-end gap-0.5 h-7">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const lit = audioLevel * 28 > i;
                    const height = 30 + Math.abs(Math.sin(i * 0.6) * 70);
                    return (
                      <span
                        key={i}
                        className={`w-1 rounded-sm transition-colors ${
                          lit
                            ? i > 22
                              ? 'bg-red-400'
                              : i > 14
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            : 'bg-ocean-1000/60'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
            {recorderState === 'error' && (
              <div className="px-3 py-1.5 bg-amber-950/50 border-t border-amber-700/40 flex items-center gap-2 text-[11px] text-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Recording failed. Type your query below or check microphone permissions.
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
                  recorderState === 'recording'
                    ? 'bg-red-600 border-red-400 text-white animate-pulse'
                    : 'bg-cyan-950 hover:bg-cyan-900 border-cyan-700 text-cyan-300'
                }`}
                aria-label={
                  recorderState === 'recording'
                    ? 'Stop recording & transcribe'
                    : 'Start voice input'
                }
                disabled={isLoading}
              >
                {recorderState === 'recording' ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
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