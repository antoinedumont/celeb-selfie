/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vibrant gradient palette inspired by PhotoAI
        brand: {
          orange: '#f79533',
          coral: '#f37055',
          pink: '#ef4e7b',
          purple: '#a166ab',
          blue: '#5073b8',
          cyan: '#1098ad',
          teal: '#07b39b',
          green: '#6fba82',
        },
        // Accent colors
        accent: {
          fire: '#f47353',
          lime: '#2bde73',
          gold: '#ffc924',
        },
        // Pure Apple palette
        apple: {
          bg: '#F5F5F7',      // Alabaster White
          black: '#000000',   // Pure Black
          glass: 'rgba(255, 255, 255, 0.7)', // Glass base
        }
      },
      fontFamily: {
        display: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        inter: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'pixel': '4px 4px 0px #000',
        'pixel-sm': '2px 2px 0px #000',
        'pixel-lg': '6px 6px 0px #000',
        'apple': '0 10px 40px rgba(0, 0, 0, 0.04)',
        'apple-sm': '0 4px 16px rgba(0, 0, 0, 0.03)',
        'apple-lg': '0 20px 60px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'gradient-rotate': 'gradient-rotate 6s ease infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'spin-slow': 'spin 5s linear infinite',
      },
      keyframes: {
        'gradient-rotate': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
