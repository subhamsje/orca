import React from 'react';
import { TripAssessmentResponse } from '../types';
import { HarborLocation } from '../utils/harbors';
import { MarineMapWorkspace } from '../map/components/MarineMapWorkspace';

interface LivingChartProps {
  assessment: TripAssessmentResponse | null;
  onSelectHarbor?: (harbor: HarborLocation) => void;
}

export const LivingChart: React.FC<LivingChartProps> = ({ assessment, onSelectHarbor }) => {
  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      <MarineMapWorkspace assessment={assessment} onSelectHarbor={onSelectHarbor} />
    </div>
  );
};