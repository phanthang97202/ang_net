/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        josefin: ["'Josefin Sans'", 'sans-serif'],
        sourceSerif: ["'Source Serif 4'", 'sans-serif'],
      },
    },
  },
  plugins: [],
};
