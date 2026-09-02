const fs = require('fs');
const path = 'C:\\Users\\HinG\\Documents\\fé diaria\\files\\Fe-Diaria-Projeto-Completo\\3-Codigo-do-App-Real\\src\\fe-diaria-app.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace all require('./lib/debug.js') with dynamic import
content = content.replace(/require\('\.\/lib\/debug\.js'\)/g, "(await import('./lib/debug.js'))");
content = content.replace(/require\('\.\/lib\/debug\.js'\)\.clearLogs\(\)/g, "(await import('./lib/debug.js')).clearLogs()");

fs.writeFileSync(path, content, 'utf8');
console.log('Done');