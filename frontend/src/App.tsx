import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CommandPalette,
  EconomicBoard,
  GlobalHarborDirectory,
  InterAgentStream,
  MapStage,
  MapStageHandle,
  MultiObjectiveRoutePicker,
  OceanVitals,
  OsintPanel,
  SpeciesMatrixPanel,
  TopBar,
  VerdictHero,
  VesselProfileModal,
  VoiceAssistant,
} from './ui/orca';
import { TripAssessmentResponse, VesselProfile, verdictTone } from './types';
import { fetchTripAssessment } from './utils/api';
import { GLOBAL_HARBORS, HarborLocation } from './utils/harbors';

function useMacLike(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

export function App() {
  const isMac = useMacLike();

  const [selectedHarbor, setSelectedHarbor] = useState<HarborLocation>(GLOBAL_HARBORS[3]); // Mumbai Sassoon Dock
  const [assessment, setAssessment] = useState<TripAssessmentResponse | null>(null);
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isVesselModalOpen, setVesselModalOpen] = useState(false);

  const [mapCenter, setMapCenter] = useState<[number, number]>([
    selectedHarbor.lat,
    selectedHarbor.lon,
  ]);
  const [mapZoom, setMapZoom] = useState(7);
  const flyNonceRef = useRef(0);
  const mapRef = useRef<MapStageHandle | null>(null);

  const [vesselProfile, setVesselProfile] = useState<VesselProfile>({
    vessel_id: 'IND-MH-04-892',
    vessel_name: 'Malvan Craft-01',
    length_m: 8.5,
    engine_hp: 9.9,
    fuel_capacity_l: 60,
  });

  const [language, setLanguage] = useState('English');

  // ---------- data fetching ----------
  const loadAssessment = useCallback(
    async (lat: number, lon: number) => {
      setIsLoadingAssessment(true);
      try {
        const data = await fetchTripAssessment(lat, lon, vesselProfile.length_m, language);
        setAssessment(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingAssessment(false);
      }
    },
    [vesselProfile.length_m, language],
  );

  // Reassess whenever harbor or language changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      loadAssessment(selectedHarbor.lat, selectedHarbor.lon);
    }, 100);
    return () => clearTimeout(t);
  }, [selectedHarbor, language, loadAssessment]);

  // First load
  useEffect(() => {
    loadAssessment(selectedHarbor.lat, selectedHarbor.lon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connectivity tracking
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ---------- keyboard shortcuts ----------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      if (cmd && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMac]);

  // ---------- handlers ----------
  const handleSelectHarbor = useCallback((h: HarborLocation) => {
    setSelectedHarbor(h);
    flyNonceRef.current += 1;
    mapRef.current?.flyTo(h.lat, h.lon, 9);
  }, []);

  const handleFlyToCoordinates = useCallback((lat: number, lon: number) => {
    flyNonceRef.current += 1;
    mapRef.current?.flyTo(lat, lon, 9);
    // Find closest harbor for the assessment pipeline
    let closest: HarborLocation = GLOBAL_HARBORS[0];
    let closestD = Infinity;
    for (const h of GLOBAL_HARBORS) {
      const d = haversine(lat, lon, h.lat, h.lon);
      if (d < closestD) {
        closestD = d;
        closest = h;
      }
    }
    setSelectedHarbor(closest);
  }, []);

  const handleRefresh = useCallback(() => {
    loadAssessment(selectedHarbor.lat, selectedHarbor.lon);
  }, [loadAssessment, selectedHarbor]);

  const handleVoiceQuery = useCallback(
    async (text: string): Promise<TripAssessmentResponse> => {
      const data = await fetchTripAssessment(
        selectedHarbor.lat,
        selectedHarbor.lon,
        vesselProfile.length_m,
        language,
        text,
      );
      setAssessment(data);
      return data;
    },
    [selectedHarbor, vesselProfile.length_m, language],
  );

  const onSelectHarborMap = handleSelectHarbor;

  const mapHarborTone = assessment
    ? verdictTone(assessment.risk_score, assessment.circuit_breaker_triggered)
    : null;

  return (
    <div className="relative h-screen w-screen overflow-hidden aurora text-slate-100">
      {/* Full-bleed map background */}
      <div className="absolute inset-0 z-0">
        <MapStage
          ref={mapRef}
          center={mapCenter}
          zoom={mapZoom}
          flyNonce={flyNonceRef.current}
          assessment={assessment}
          harbors={GLOBAL_HARBORS}
          selectedHarborId={selectedHarbor.id}
          onSelectHarbor={onSelectHarborMap}
          onViewportChange={(c, z) => {
            setMapCenter(c);
            setMapZoom(z);
          }}
        />
      </div>

      {/* Vignette overlay to keep UI readable on bright tiles */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 35%, rgba(1,7,15,0.55) 95%)',
        }}
      />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-30">
        <TopBar
          isOffline={isOffline}
          selectedHarbor={selectedHarbor}
          assessment={assessment}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onSelectHarbor={handleSelectHarbor}
          language={language}
          onLanguageChange={setLanguage}
          onOpenVessel={() => setVesselModalOpen(true)}
          vesselName={vesselProfile.vessel_name}
          vesselLengthM={vesselProfile.length_m}
        />
      </div>

      {/* Left intel rail */}
      <aside className="absolute left-3 top-[5.25rem] bottom-20 z-20 w-[22rem] max-w-[calc(100vw-1.5rem)] hidden xl:flex flex-col gap-3 pointer-events-none overflow-y-auto pr-1">
        <div className="pointer-events-auto">
          <VerdictHero
            assessment={assessment}
            language={language}
            isLoading={isLoadingAssessment}
            onRefresh={handleRefresh}
          />
        </div>
        <div className="pointer-events-auto">
          <OceanVitals assessment={assessment} />
        </div>
        <div className="pointer-events-auto">
          <MultiObjectiveRoutePicker
            routes={assessment?.multi_objective_routes}
            onFlyToWaypoints={(wps) => {
              flyNonceRef.current += 1;
              mapRef.current?.flyToWaypoints(wps);
            }}
          />
        </div>
        <div className="pointer-events-auto">
          <SpeciesMatrixPanel
            species={assessment?.species_matrix ?? {}}
            pfz={assessment?.pfz_grounds ?? []}
          />
        </div>
        <div className="pointer-events-auto">
          <EconomicBoard economic={assessment?.economics} />
        </div>
        <div className="pointer-events-auto">
          <OsintPanel intelligence={assessment?.osint_sector_intelligence} />
        </div>
        <div className="pointer-events-auto">
          <InterAgentStream events={assessment?.inter_agent_event_bus} />
        </div>
      </aside>

      {/* Right rail — global harbor directory */}
      <aside className="absolute right-3 top-[5.25rem] bottom-20 z-20 w-[18rem] max-w-[calc(100vw-1.5rem)] hidden 2xl:flex flex-col pointer-events-none">
        <div className="pointer-events-auto h-full">
          <GlobalHarborDirectory
            selectedHarborId={selectedHarbor.id}
            onSelect={handleSelectHarbor}
            assessmentForHarbor={(h) =>
              assessment && h.id === selectedHarbor.id
                ? {
                    verdict: assessment.verdict,
                    risk: assessment.risk_score,
                    tone: mapHarborTone ?? 'caution',
                  }
                : null
            }
            isLoading={isLoadingAssessment}
          />
        </div>
      </aside>

      {/* Bottom status chip — single floating element */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="glass rounded-full px-4 py-1.5 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] font-bold text-cyan-200">
          <span className="dot bg-emerald-400 animate-pulse-soft" />
          ORCA-MultiObjective-v4.0 · {assessment?.telemetry.execution_ms?.toFixed(0) ?? '—'} ms ·{' '}
          {assessment?.telemetry.services_triggered.length ?? 0} agents
        </div>
      </div>

      {/* Center floating summary card (visible at lg+ where rails aren't shown) */}
      <div className="absolute left-3 right-3 top-[5.25rem] z-20 xl:hidden pointer-events-none">
        <div className="pointer-events-auto max-w-md">
          <VerdictHero
            assessment={assessment}
            language={language}
            isLoading={isLoadingAssessment}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      {/* Mobile fallback: only show verdict + vitals as bottom drawer */}
      <div className="absolute inset-x-3 bottom-16 z-20 lg:hidden xl:hidden pointer-events-auto space-y-3 max-h-[60vh] overflow-y-auto pb-2">
        <OceanVitals assessment={assessment} />
        <MultiObjectiveRoutePicker
          routes={assessment?.multi_objective_routes}
          onFlyToWaypoints={(wps) => {
            flyNonceRef.current += 1;
            mapRef.current?.flyToWaypoints(wps);
          }}
        />
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectHarbor={handleSelectHarbor}
        onFlyToCoordinate={handleFlyToCoordinates}
      />

      <VesselProfileModal
        isOpen={isVesselModalOpen}
        onClose={() => setVesselModalOpen(false)}
        profile={vesselProfile}
        onSave={setVesselProfile}
      />

      <VoiceAssistant
        language={language}
        lat={selectedHarbor.lat}
        lon={selectedHarbor.lon}
        vesselLengthM={vesselProfile.length_m}
        latestAssessment={assessment}
        onQuerySubmit={handleVoiceQuery}
      />
    </div>
  );
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default App;