import React from 'react';
import { TripAssessmentResponse, VesselProfile } from '../types';
import { HarborLocation } from '../utils/harbors';
import { MarineMapWorkspace } from '../map/components/MarineMapWorkspace';

interface LivingChartProps {
  assessment: TripAssessmentResponse | null;
  onSelectHarbor?: (harbor: HarborLocation) => void;
  vesselProfile?: VesselProfile;
}

/**
 * Living Chart tab — Phase 02 forwards to the ORCA Marine Operations Map
 * workspace. The legacy Leaflet-only renderer has been retired; the map
 * architecture lives under `src/map/`.
 */
export const LivingChart: React.FC<LivingChartProps> = ({
  assessment,
  onSelectHarbor,
  vesselProfile,
}) => {
  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      <MarineMapWorkspace
        assessment={assessment}
        onSelectHarbor={onSelectHarbor}
        context={{
          vesselId: vesselProfile?.vessel_id ?? null,
          vesselName: vesselProfile?.vessel_name ?? null,
          ownVesselRiskScore: assessment?.risk_score ?? null,
        }}
      />
    </div>
  );
};