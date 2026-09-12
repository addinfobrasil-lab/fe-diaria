const fs=require('fs');
let t=fs.readFileSync('3-Codigo-do-App-Real/src/fe-diaria-app.jsx','utf8');
const needle=`        const grad = ctx.createLinearGradient(0, 0, 0, 1350);
        grad.addColorStop(0, "#0B0E17"); grad.addColorStop(1, "#1B2333");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1350);
        ctx.strokeStyle = "#E3A857"; ctx.lineWidth = 6; ctx.strokeRect(20, 20, 1040, 1310);`;
const repl=`        // 6 fundos natureza aleatórios - transmitem paz
        const NATURE = [
          { bg: ["#0B3D2E","#1A5C3A","#2E7D32"], accent:"#A5D6A7", emoji:"🌿" }, // floresta
          { bg: ["#FF7E5F","#FEB47B","#FFD194"], accent:"#FFF7E8", emoji:"🌅" }, // pôr do sol
          { bg: ["#0B2545","#13315C","#134074"], accent:"#89CFF0", emoji:"🌊" }, // oceano
          { bg: ["#3E2723","#5D4037","#8D6E63"], accent:"#FFCC80", emoji:"⛰️" }, // montanha
          { bg: ["#2E1A47","#6D597A","#B56576"], accent:"#FFC8A2", emoji:"🌸" }, // lavanda
          { bg: ["#004D40","#00695C","#26A69A"], accent:"#B2DFDB", emoji:"🍃" }, // folhagem
        ];
        const theme = NATURE[Math.floor(Math.random()*NATURE.length)];
        const grad = ctx.createLinearGradient(0, 0, 0, 1350);
        theme.bg.forEach((c,i)=> grad.addColorStop(i/(theme.bg.length-1), c));
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1350);
        // véu escuro para legibilidade
        ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fillRect(0,0,1080,1350);
        ctx.strokeStyle = theme.accent; ctx.lineWidth = 5; ctx.globalAlpha=0.6; ctx.strokeRect(28, 28, 1024, 1294); ctx.globalAlpha=1;
        // emoji natureza sutil no topo
        ctx.font = "80px serif"; ctx.textAlign="center"; ctx.globalAlpha=0.18; ctx.fillText(theme.emoji,540,320); ctx.globalAlpha=1;`;
if(!t.includes(needle)){console.log('needle not found');process.exit(1);}
t=t.replace(needle, repl);
// também troca o accent fixo por theme.accent no título
t=t.replace('ctx.fillStyle = "#E3A857"; ctx.font = "600 48px Fraunces, serif";', 'ctx.fillStyle = theme.accent; ctx.font = "600 52px Fraunces, serif";');
fs.writeFileSync('3-Codigo-do-App-Real/src/fe-diaria-app.jsx',t,'utf8');
console.log('done');