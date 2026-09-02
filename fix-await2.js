const fs = require('fs');
const path = 'C:\\Users\\HinG\\Documents\\fé diaria\\files\\Fe-Diaria-Projeto-Completo\\3-Codigo-do-App-Real\\src\\fe-diaria-app.jsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the useEffect - replace await import with .then()
content = content.replace(
  /useEffect\(\(\) => \{\s*const \{ subscribe, getLogs \} = \(await import\('\.\/lib\/debug\.js'\)\);/,
  "useEffect(() => {\n    import('./lib/debug.js').then(({ subscribe, getLogs }) => {"
);

// Fix the clearLogs function
content = content.replace(
  /const clearLogs = \(\) => \{\s*\(await import\('\.\/lib\/debug\.js'\)\)\.clearLogs\(\);\s*setLogs\(\[\]\);/,
  "const clearLogs = () => {\n    import('./lib/debug.js').then(m => { m.clearLogs(); setLogs([]); });"
);

// Fix the handleExport - it's already async so await is fine there
// Fix the clearLogs button onClick
content = content.replace(
  /onClick=\{clearLogs\}/g,
  "onClick={() => import('./lib/debug.js').then(m => { m.clearLogs(); setLogs([]); })}"
);

// Fix the exportLogsToFile button onClick
content = content.replace(
  /onClick=\{async \(\) => \{ const \{ exportLogsToFile \} = \(await import\('\.\/lib\/debug\.js'\)\); const r = await exportLogsToFile\(\); alert\(r\.ok \? `Logs salvos em: \${r\.path}` : 'Erro ao exportar'\); \}\}/g,
  "onClick={async () => { const { exportLogsToFile } = await import('./lib/debug.js'); const r = await exportLogsToFile(); alert(r.ok ? `Logs salvos em: ${r.path}` : 'Erro ao exportar'); }}"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');