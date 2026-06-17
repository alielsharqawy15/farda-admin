/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#121212',
        secondary: '#F5F5F5',
        tertiary: '#707070',
        sale: '#C41E3A',
        success: '#2E7D32',
      },
    },
  },
  plugins: [],
};
