// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss,css}",
    "./front/**/*.{html,ts,scss,css}"
  ],
  theme: {
     extend: {
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },
      animation: {
        slideIn: 'slideIn 0.3s ease-out',
        fadeIn: 'fadeIn 0.3s ease-out'
      }
    }
  },
  plugins: [
    require('@tailwindcss/container-queries')
  ],
}