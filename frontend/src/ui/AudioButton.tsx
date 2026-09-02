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
    idle: 'bg-cyan-950/90 hover:bg-cyan-900 text-cyan-200 border-cyan-700/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]',
    playing: 'bg-emerald-950 text-emerald-200 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse',
  },
  emerald: {
    idle: 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border-emerald-700/80 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    playing: 'bg-emerald-950 text-emerald-200 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse',
  },
  amber: {
    idle: 'bg-amber-950/90 hover:bg-amber-900 text-amber-200 border-amber-700/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    playing: 'bg-emerald-950 text-emerald-200 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse',
  },
} as const;

const SIZE_CLASSES = {
  sm: 'text-xs px-3.5 py-2 gap-2 rounded-xl',
  md: 'text-sm px-4 py-2.5 gap-2.5 rounded-xl',
} as const;

export const AudioButton: React.FC<AudioButtonProps> = ({
  isPlaying,
  onPlay,
  onStop,
  disabled = false,
  label = 'Listen Voice Advisory',
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
        'inline-flex items-center justify-center font-bold border transition-all duration-300 backdrop-blur-md',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        SIZE_CLASSES[size],
        tone,
        className,
      ].join(' ')}
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-4 h-4 text-emerald-400 animate-spin-slow" />
          <span>Stop Voice</span>
          {/* Animated Equalizer Frequency Wave */}
          <div className="flex items-center space-x-0.5 ml-1">
            <span className="w-1 h-3 bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-4 bg-emerald-300 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-2 bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};