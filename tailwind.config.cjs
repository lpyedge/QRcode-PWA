const { join } = require('path');

const config = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    join(process.cwd(), '.svelte-kit/**/*.{html,js,svelte,ts}')
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#111826',
          light: '#1f2937'
        },
        accent: {
          DEFAULT: '#0ea5e9',
          soft: '#38bdf8'
        }
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};

module.exports = config;
