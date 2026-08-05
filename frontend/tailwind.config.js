/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        'crm': '12px',
      }
    },
  },
  plugins: [],
}
