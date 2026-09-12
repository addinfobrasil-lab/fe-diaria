const fs=require('fs');
const f='3-Codigo-do-App-Real/dist/assets/index-BZyBbzcv.js';
if(!fs.existsSync(f)){ console.log('dist missing'); process.exit(0);}
const t=fs.readFileSync(f,'utf8');
console.log('bad count', (t.match(/�/g)||[]).length);
console.log('has Terça?', t.includes('Terça-feira'));
console.log('has FFFD?', t.includes('\uFFFD'));
console.log('weekdays', (t.match(/Domingo[^"]{0,60}/g)||[])[0]?.slice(0,80));