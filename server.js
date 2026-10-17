const { serveHTTP } = require('stremio-addon-sdk');
const addonInterface = require('./addon');

const PORT = process.env.PORT || 7000;

serveHTTP(addonInterface, { port: PORT }).then(({ url }) => {
  console.log('🌶️ Torrente-Full corriendo en: ' + url + 'manifest.json');
  console.log('Instala en Stremio abriendo esa URL.');
});
