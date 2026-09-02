const fs = require('fs');
const path = 'C:\\Users\\HinG\\Documents\\fé diaria\\files\\Fe-Diaria-Projeto-Completo\\3-Codigo-do-App-Real\\src\\fe-diaria-app.jsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the DebugPanel component - replace await in useEffect with .then()
content = content.replace(
  /useEffect\(\(\) => \{\s*const \{ subscribe, getLogs \\} = \(await import\('\.\/lib\/debug\.js'\)\);/g,
  "useEffect(() => {\n    import('./lib/debug.js').then(({ subscribe, getLogs }) => {"
);

// Fix the clearLogs function
content = content.replace(
  /const clearLogs = \(\) => \{\s*\(await import\('\.\/lib\/debug\.js'\)\)\.clearLogs\(\);\s*setLogs\(\[\]\);/g,
  "const clearLogs = () => {\n    import('./lib/debug.js').then(m => { m.clearLogs(); setLogs([]); });"
);

// Fix the handleExport function - it's already async so await is fine there
// Fix the clearLogs button onClick
content = content.replace(
  /onClick=\{clearLogs\}/g,
  "onClick={() => import('./lib/debug.js').then(m => { m.clearLogs(); setLogs([]); })}"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');