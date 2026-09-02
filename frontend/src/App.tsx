import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { BottomNav, TabKey } from './components/BottomNav';
import { TodayView } from './components/TodayView';
import { LivingChart } from './components/LivingChart';
import { AskOrcaView } from './components/AskOrcaView';
import { AuthorityView } from './components/AuthorityView';
import { OsintView } from './components/OsintView';
import { SystemDiagnostics } from './components/SystemDiagnostics';
import { VesselProfileModal } from './components/VesselProfileModal';
import { TripAssessmentResponse, VesselProfile } from './types';
import { fetchTripAssessment } from './utils/api';
import { HarborLocation, INDIAN_HARBORS } from './utils/harbors';

const DEMO_COORDS: Record<string, { lat: number; lon: number }> = {
  safe: { lat: 15.2993, lon: 73.8243 },
  danger: { lat: 18.922, lon: 72.8347 },
  cyclone: { lat: 20.2644, lon: 86.6715 },
};

export function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [language, setLanguage] = useState<string>('Marathi');
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isVesselModalOpen, setIsVesselModalOpen] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<TripAssessmentResponse | null>(null);
  const [isLoadingAssessment, setIsLoadingAssessment] = useState<boolean>(false);
  const [selectedHarbor, setSelectedHarbor] = useState<HarborLocation>(INDIAN_HARBORS[0]);

  const [vesselProfile, setVesselProfile] = useState<VesselProfile>({
    vessel_id: 'IND-MH-04-892',
    vessel_name: 'Malvan Craft-01',
    length_m: 8.5,
    engine_hp: 9.9,
    fuel_capacity_l: 60,
  });

  const loadAssessment = useCallback(
    async (overrideScenario?: string, targetHarbor?: HarborLocation) => {
      const harbor = targetHarbor ?? selectedHarbor;
      const urlParams = new URLSearchParams(window.location.search);
      const demoMode = overrideScenario ?? urlParams.get('demo');

      const coords = demoMode && DEMO_COORDS[demoMode]
        ? DEMO_COORDS[demoMode]
        : { lat: harbor.lat, lon: harbor.lon };

      setIsLoadingAssessment(true);
      const data = await fetchTripAssessment(
        coords.lat,
        coords.lon,
        vesselProfile.length_m,
        language,
      );

      if (demoMode === 'cyclone') {
        data.circuit_breaker_triggered = true;
        data.verdict = 'EXTREME DANGER / STAY ASHORE';
        data.risk_score = 100;
        data.override_reason = 'Official IMD Cyclone Advisory Override Active (Paradip Sector)';
        data.explanation.plain_language_text =
          '⚠️ धोका इशारा! चक्रीवादळाचा इशारा लागू आहे. आज समुद्रात जाऊ नका.';
      }

      setAssessment(data);
      setIsLoadingAssessment(false);
    },
    [language, selectedHarbor, vesselProfile.length_m],
  );

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
  }, [loadAssessment]);

  const handleHarborSelect = (harbor: HarborLocation) => {
    setSelectedHarbor(harbor);
    loadAssessment(undefined, harbor);
  };

  const handleQuerySubmit = async (queryText: string) => {
    const data = await fetchTripAssessment(
      selectedHarbor.lat,
      selectedHarbor.lon,
      vesselProfile.length_m,
      language,
      queryText,
    );
    setAssessment(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-ocean-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-cyan-700 focus:text-white focus:px-3 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>

      <Header
        vesselProfile={vesselProfile}
        onOpenVesselModal={() => setIsVesselModalOpen(true)}
        language={language}
        onLanguageChange={setLanguage}
        isOffline={isOffline}
        isDemoMode
        onSelectDemoPreset={(scenario) => loadAssessment(scenario)}
        selectedHarbor={selectedHarbor}
        onSelectHarbor={handleHarborSelect}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-5xl w-full mx-auto px-4 pt-4 pb-28"
      >
        {activeTab === 'today' && (
          <TodayView
            assessment={assessment}
            language={language}
            isLoading={isLoadingAssessment}
            onRefreshTrip={() => loadAssessment()}
          />
        )}
        {activeTab === 'chart' && (
          <LivingChart
            assessment={assessment}
            onSelectHarbor={handleHarborSelect}
            vesselProfile={vesselProfile}
          />
        )}
        {activeTab === 'ask' && (
          <AskOrcaView
            language={language}
            onQuerySubmit={handleQuerySubmit}
            latestExplanation={assessment?.explanation.plain_language_text}
          />
        )}
        {activeTab === 'authority' && <AuthorityView />}
        {activeTab === 'osint' && <OsintView />}
        {activeTab === 'diagnostics' && (
          <SystemDiagnostics assessment={assessment} />
        )}
      </main>

      <BottomNav active={activeTab} onSelect={setActiveTab} />

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