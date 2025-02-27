/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        marquee: ['Marquee', 'Playfair Display', 'serif'],
      },
      colors: {
        'theater-red': 'var(--theater-red)',
        'theater-gold': 'var(--theater-gold)',
      },
      container: {
        center: true,
        padding: '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'), // <--- Plugin aggiunto
  ],
};
