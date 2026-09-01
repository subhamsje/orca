import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TodayView } from './components/TodayView';
import { LivingChart } from './components/LivingChart';
import { AskOrcaView } from './components/AskOrcaView';
import { AuthorityView } from './components/AuthorityView';
import { SystemDiagnostics } from './components/SystemDiagnostics';
import { VesselProfileModal } from './components/VesselProfileModal';
import { TripAssessmentResponse, VesselProfile } from './types';
import { fetchTripAssessment } from './utils/api';
import { ShieldCheck, Compass, Mic, Radio, Activity } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'chart' | 'ask' | 'authority' | 'diagnostics'>('today');
  const [language, setLanguage] = useState<string>('Marathi');
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isVesselModalOpen, setIsVesselModalOpen] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<TripAssessmentResponse | null>(null);

  const [vesselProfile, setVesselProfile] = useState<VesselProfile>({
    vessel_id: 'IND-MH-04-892',
    vessel_name: 'Malvan Craft-01',
    length_m: 8.5,
    engine_hp: 9.9,
    fuel_capacity_l: 60,
  });

  // Default coordinate: Malvan Coast, Maharashtra (16.0215, 73.4821)
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({
    lat: 16.0215,
    lon: 73.4821,
  });

  const loadAssessment = async () => {
    // Check URL parameters for stage demo triggers
    const urlParams = new URLSearchParams(window.location.search);
    const demoMode = urlParams.get('demo');

    let targetLat = coords.lat;
    let targetLon = coords.lon;
    let overrideQuery: string | undefined = undefined;

    if (demoMode === 'safe') {
      targetLat = 15.2993; // Goa Harbor
      targetLon = 73.8243;
    } else if (demoMode === 'danger') {
      targetLat = 18.922, // Mumbai Harbor
      targetLon = 72.8347;
    } else if (demoMode === 'cyclone') {
      targetLat = 20.2644; // Paradip Coast
      targetLon = 86.6715;
    }

    const data = await fetchTripAssessment(
      targetLat,
      targetLon,
      vesselProfile.length_m,
      language,
      overrideQuery
    );

    // If demoMode === 'cyclone', inject cyclone alert override
    if (demoMode === 'cyclone') {
      data.circuit_breaker_triggered = true;
      data.verdict = 'EXTREME DANGER / STAY ASHORE';
      data.risk_score = 100;
      data.override_reason = 'Official IMD Cyclone Advisory Override Active (Paradip Bay Sector)';
      data.explanation.plain_language_text = '⚠️ धोका इशारा! चक्रीवादळाचा इशारा लागू आहे. आज समुद्रात जाऊ नका.';
    }

    setAssessment(data);
  };

  useEffect(() => {
    loadAssessment();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [language, vesselProfile]);

  const handleQuerySubmit = async (queryText: string) => {
    const data = await fetchTripAssessment(
      coords.lat,
      coords.lon,
      vesselProfile.length_m,
      language,
      queryText
    );
    setAssessment(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-ocean-950 pb-20">
      <Header
        vesselProfile={vesselProfile}
        onOpenVesselModal={() => setIsVesselModalOpen(true)}
        language={language}
        onLanguageChange={setLanguage}
        isOffline={isOffline}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto">
        {activeTab === 'today' && (
          <TodayView
            assessment={assessment}
            language={language}
            onRefreshTrip={loadAssessment}
          />
        )}
        {activeTab === 'chart' && <LivingChart assessment={assessment} />}
        {activeTab === 'ask' && (
          <AskOrcaView
            language={language}
            onQuerySubmit={handleQuerySubmit}
            latestExplanation={assessment?.explanation.plain_language_text}
          />
        )}
        {activeTab === 'authority' && <AuthorityView />}
        {activeTab === 'diagnostics' && <SystemDiagnostics assessment={assessment} />}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-ocean-900/95 backdrop-blur-md border-t border-ocean-800 px-2 py-2.5 z-40">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center space-y-1 text-xs font-bold transition ${
              activeTab === 'today' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Today's Trip</span>
          </button>

          <button
            onClick={() => setActiveTab('chart')}
            className={`flex flex-col items-center space-y-1 text-xs font-bold transition ${
              activeTab === 'chart' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span>Living Map</span>
          </button>

          <button
            onClick={() => setActiveTab('ask')}
            className={`flex flex-col items-center space-y-1 text-xs font-bold transition ${
              activeTab === 'ask' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span>Ask ORCA</span>
          </button>

          <button
            onClick={() => setActiveTab('authority')}
            className={`flex flex-col items-center space-y-1 text-xs font-bold transition ${
              activeTab === 'authority' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-5 h-5" />
            <span>Authority</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex flex-col items-center space-y-1 text-xs font-bold transition ${
              activeTab === 'diagnostics' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>Diagnostics</span>
          </button>
        </div>
      </nav>

      {/* Vessel Profile Settings Modal */}
      <VesselProfileModal
        isOpen={isVesselModalOpen}
        onClose={() => setIsVesselModalOpen(false)}
        vesselProfile={vesselProfile}
        onSaveProfile={setVesselProfile}
      />
    </div>
  );
}

export default App;
