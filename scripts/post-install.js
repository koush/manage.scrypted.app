const fs = require('fs');
const path = require('path');

const fontAwesomeProCss = path.resolve(__dirname, '../node_modules/@fortawesome/fontawesome-pro/css/all.css');
const indexTs = path.resolve(__dirname, 'font-awesome/index.ts');
if (!fs.existsSync(fontAwesomeProCss)) {
  fs.writeFileSync(indexTs, 'import "./free"');
}
else {
  fs.writeFileSync(indexTs, 'import "./pro"');
}
