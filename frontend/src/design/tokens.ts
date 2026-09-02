/**
 * ORCA design tokens — pure TypeScript constants used by components.
 * Tailwind utilities still handle layout, but where rules need to be
 * programmatic (motion, focus rings, breakpoints) these tokens are the
 * single source of truth.
 *
 * Naming: token names mirror the design-language philosophy — concise,
 * descriptive, never tied to a specific brand colour name.
 */

export const tokens = {
  motion: {
    duration: {
      instant: 0,
      fast: 120,
      base: 200,
      slow: 320,
      deliberate: 480,
    },
    easing: {
      standard: 'cubic-bezier(0.16, 1, 0.3, 1)',
      enter: 'cubic-bezier(0, 0, 0.2, 1)',
      exit: 'cubic-bezier(0.4, 0, 1, 1)',
    },
    reducedMotionFallback: '0.01ms',
  },
  layout: {
    shellMaxWidth: '1440px',
    workspaceMaxWidth: '1280px',
    gutterMobile: '1rem',
    gutterTablet: '1.25rem',
    gutterDesktop: '1.5rem',
  },
  focus: {
    ringWidth: 2,
    ringOffset: 2,
    /** Tailwind class for the standard focus ring on dark surfaces. */
    ringClass:
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-975',
  },
  breakpoint: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1440,
  },
  zIndex: {
    base: 0,
    raised: 10,
    sticky: 30,
    nav: 40,
    drawer: 45,
    modal: 50,
    toast: 60,
    tooltip: 70,
  },
} as const;

export type Tokens = typeof tokens;