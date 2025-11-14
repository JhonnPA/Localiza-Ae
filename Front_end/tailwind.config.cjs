/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#0A2463',
          blue600: '#1E3A8A',
          blue2: '#3E92CC',
          yellow: '#FFD60A',
          yellow600: '#FFC300',
          bg: '#F6FAFF',
          dark: '#0F172A'
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(10,36,99,0.08)',
      },
      borderRadius: {
        '2xl': '1.25rem'
      }
    }
  },
  plugins: []
}
