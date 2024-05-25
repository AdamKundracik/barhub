const path = require('path');

module.exports = {
  input: [
    'src/**/*.{js,jsx,ts,tsx}', // Adjust according to your source file types and directories
  ],
  output: './',
  options: {
    debug: true,
    func: {
      list: ['t', 'i18next.t'],
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    lngs: ['en', 'sk'], // List all your supported languages here
    defaultLng: 'en',
    defaultNs: 'translation',
    resource: {
      loadPath: path.join(__dirname, 'src/localization/translations/{{lng}}/{{ns}}.json'),
      savePath: 'src/localization/translations/{{lng}}/{{ns}}.json',
      jsonIndent: 2,
      lineEnding: '\n'
    },
    ns: [
      'translation'
    ],
    defaultValue: (lng, ns, key) => key,
    keySeparator: false,
    nsSeparator: false
  }
};