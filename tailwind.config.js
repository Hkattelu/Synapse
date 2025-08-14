/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Synapse brand colors using CSS variables
        synapse: {
          // Catppuccin Macchiato palette
          rosewater: 'var(--synapse-rosewater)',
          flamingo: 'var(--synapse-flamingo)',
          pink: 'var(--synapse-pink)',
          mauve: 'var(--synapse-mauve)',
          red: 'var(--synapse-red)',
          maroon: 'var(--synapse-maroon)',
          peach: 'var(--synapse-peach)',
          yellow: 'var(--synapse-yellow)',
          green: 'var(--synapse-green)',
          teal: 'var(--synapse-teal)',
          sky: 'var(--synapse-sky)',
          sapphire: 'var(--synapse-sapphire)',
          blue: 'var(--synapse-blue)',
          lavender: 'var(--synapse-lavender)',

          // Neutral colors
          text: 'var(--synapse-text)',
          subtext1: 'var(--synapse-subtext1)',
          subtext0: 'var(--synapse-subtext0)',
          overlay2: 'var(--synapse-overlay2)',
          overlay1: 'var(--synapse-overlay1)',
          overlay0: 'var(--synapse-overlay0)',
          surface2: 'var(--synapse-surface2)',
          surface1: 'var(--synapse-surface1)',
          surface0: 'var(--synapse-surface0)',
          base: 'var(--synapse-base)',
          mantle: 'var(--synapse-mantle)',
          crust: 'var(--synapse-crust)',

          // Semantic colors
          primary: {
            DEFAULT: 'var(--synapse-primary)',
            hover: 'var(--synapse-primary-hover)',
            active: 'var(--synapse-primary-active)',
          },
          background: {
            DEFAULT: 'var(--synapse-background)',
            alt: 'var(--synapse-background-alt)',
          },
          surface: {
            DEFAULT: 'var(--synapse-surface)',
            hover: 'var(--synapse-surface-hover)',
            active: 'var(--synapse-surface-active)',
          },
          border: {
            DEFAULT: 'var(--synapse-border)',
            hover: 'var(--synapse-border-hover)',
            focus: 'var(--synapse-border-focus)',
          },
          'text-primary': 'var(--synapse-text-primary)',
          'text-secondary': 'var(--synapse-text-secondary)',
          'text-muted': 'var(--synapse-text-muted)',
          'text-inverse': 'var(--synapse-text-inverse)',

          // Status colors
          success: 'var(--synapse-success)',
          warning: 'var(--synapse-warning)',
          error: 'var(--synapse-error)',
          info: 'var(--synapse-info)',

          // Creative tool colors
          timeline: {
            bg: 'var(--synapse-timeline-bg)',
            track: 'var(--synapse-timeline-track)',
          },
          clip: {
            video: 'var(--synapse-clip-video)',
            audio: 'var(--synapse-clip-audio)',
            text: 'var(--synapse-clip-text)',
            code: 'var(--synapse-clip-code)',
          },
          playhead: 'var(--synapse-playhead)',
        },
      },
      fontFamily: {
        mono: 'var(--synapse-font-mono)',
      },
      borderRadius: {
        'synapse-sm': 'var(--synapse-border-radius-sm)',
        synapse: 'var(--synapse-border-radius)',
        'synapse-lg': 'var(--synapse-border-radius-lg)',
        'synapse-xl': 'var(--synapse-border-radius-xl)',
      },
      boxShadow: {
        'synapse-sm': 'var(--synapse-shadow-sm)',
        'synapse-md': 'var(--synapse-shadow-md)',
        'synapse-lg': 'var(--synapse-shadow-lg)',
        'synapse-xl': 'var(--synapse-shadow-xl)',
      },
      transitionDuration: {
        'synapse-fast': 'var(--synapse-transition-fast)',
        'synapse-normal': 'var(--synapse-transition-normal)',
        'synapse-slow': 'var(--synapse-transition-slow)',
      },
    },
  },
  plugins: [],
};
