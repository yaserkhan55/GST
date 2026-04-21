/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif']
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      colors: {
        border: "hsl(214.3 31.8% 91.4%)", // Explicitly define for libraries/legacy
        input: "hsl(214.3 31.8% 91.4%)",
        ring: "hsl(240 5% 64.9%)",
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b2c5ff',
          400: '#849fff',
          500: '#6366f1', // Original Indigo
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b'
        },
        accent: {
          400: '#34d399',
          500: '#10b981', // Original Emerald
          600: '#059669'
        }
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #000 100%)',
        'mesh-light': 'radial-gradient(at 40% 20%, hsla(240,100%,95%,1) 0px, transparent 50%), radial-gradient(at 80% 80%, hsla(160,100%,95%,1) 0px, transparent 50%), radial-gradient(at 20% 80%, hsla(280,100%,95%,1) 0px, transparent 50%)',
        'mesh-dark': 'radial-gradient(at 40% 20%, hsla(240,60%,15%,1) 0px, transparent 50%), radial-gradient(at 80% 80%, hsla(160,60%,10%,1) 0px, transparent 50%), radial-gradient(at 20% 80%, hsla(280,60%,15%,1) 0px, transparent 50%)'
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glow-sm': '0 0 15px -3px rgba(99, 102, 241, 0.2)',
        'glow': '0 0 25px -5px rgba(99, 102, 241, 0.3)'
      }
    }
  },
  plugins: []
};
