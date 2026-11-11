// Lint mínimo: detecta errores reales (variables sin definir, código inalcanzable, duplicados), no impone estilo.
const globals = require('globals');

module.exports = [
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        BD: 'writable',
        // librerías cargadas desde CDN bajo demanda
        Chart: 'readonly', JSZip: 'readonly', pdfjsLib: 'readonly', PDFLib: 'readonly', Tesseract: 'readonly', qrcode: 'readonly', LanguageModel: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    files: ['sw.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: globals.serviceworker },
  },
];
