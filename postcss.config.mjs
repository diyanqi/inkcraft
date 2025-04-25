/** @type {import('postcss').Config} */
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    'autoprefixer': {},
    'postcss-preset-env': {
      features: {
        'nesting-rules': true
      },
      browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'not dead']
    }
  }
}
