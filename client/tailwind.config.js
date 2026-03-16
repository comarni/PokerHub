/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        casino: {
          green: '#0B4D1C',
          felt: '#1a5c2e',
          gold: '#C9A84C',
          chip: {
            white: '#F5F5F5',
            red: '#C0392B',
            green: '#27AE60',
            black: '#2C3E50',
            blue: '#2980B9',
          }
        }
      },
      fontFamily: {
        casino: ['Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
