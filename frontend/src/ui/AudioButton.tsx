import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioButtonProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop?: () => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
  variant?: 'cyan' | 'emerald' | 'amber';
  className?: string;
}

const VARIANT_CLASSES = {
  cyan: {
    idle: 'bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border-cyan-800',
    playing: 'bg-emerald-950 text-emerald-200 border-emerald-700',
  },
  emerald: {
    idle: 'bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border-emerald-800',
    playing: 'bg-emerald-950 text-emerald-200 border-emerald-700',
  },
  amber: {
    idle: 'bg-amber-950 hover:bg-amber-900 text-amber-200 border-amber-800',
    playing: 'bg-emerald-950 text-emerald-200 border-emerald-700',
  },
} as const;

const SIZE_CLASSES = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
} as const;

export const AudioButton: React.FC<AudioButtonProps> = ({
  isPlaying,
  onPlay,
  onStop,
  disabled = false,
  label = 'Listen',
  size = 'sm',
  variant = 'cyan',
  className = '',
}) => {
  const tone = isPlaying ? VARIANT_CLASSES[variant].playing : VARIANT_CLASSES[variant].idle;

  return (
    <button
      type="button"
      onClick={isPlaying ? onStop : onPlay}
      disabled={disabled}
      aria-pressed={isPlaying}
      aria-label={isPlaying ? `Stop ${label}` : label}
      className={[
        'inline-flex items-center justify-center font-bold rounded-xl border transition',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        SIZE_CLASSES[size],
        tone,
        className,
      ].join(' ')}
    >
      {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      <span>{isPlaying ? 'Stop' : label}</span>
    </button>
  );
};