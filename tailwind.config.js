/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(to right, var(--brand-primary), var(--brand-secondary), var(--brand-accent))',
      },
    },
  },
  plugins: [],
}
