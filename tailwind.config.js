/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blackCustom: '#111518', 
        whiteCustom: '#f8f9fa', 
        black100: '#1D232A',
        black200: '#191E24',
        black300: '#15191E',
      },
    },
  },
  plugins: [],
};
