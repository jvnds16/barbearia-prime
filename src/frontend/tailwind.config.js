/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          500: '#f59e0b',
          600: '#d97706',
        },
        zinc: {
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        }
      }
    },
  },
  plugins: [],
}