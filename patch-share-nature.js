const fs=require('fs');
let t=fs.readFileSync('3-Codigo-do-App-Real/src/fe-diaria-app.jsx','utf8');
const old = `async function shareText(text, title) {
  try {
    // 1) Native Capacitor Share (app nativo)
    if (typeof window !== "undefined" && window.Capacitor?.Plugins?.Share) {
      await window.Capacitor.Plugins.Share.share({ title, text });
      return;
    }
    // 2) Web Share API (PWA/navegador moderno)
    if (navigator.share) {
      await navigator.share({ title, text });
      return;
    }
    // 3) Fallback: clipboard
    await navigator.clipboard.writeText(text);
    alert("Texto copiado para compartilhar.");
  } catch { /* usuário cancelou ou sem suporte */ }
}`;
if(!t.includes(old)){ console.log('old not found'); process.exit(1); }
const neW = `async function shareText(text, title) {
  try {
    const brandedText = text + "\\r\\n\\r\\n— via Fé Diária";
    if (typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.()) {
      try {
        const { Share } = await import("@capacitor/share");
        const { Filesystem, Directory } = await import("@capacitor/filesystem");
        const canvas = document.createElement("canvas");
        canvas.width = 1080; canvas.height = 1350;
        const ctx = canvas.getContext("2d");
        const NATURE = [
          { bg: ["#0B3D2E","#1A5C3A","#2E7D32"], accent:"#A5D6A7", emoji:"🌿" },
          { bg: ["#FF7E5F","#FEB47B","#FFD194"], accent:"#FFF7E8", emoji:"🌅" },
          { bg: ["#0B2545","#13315C","#134074"], accent:"#89CFF0", emoji:"🌊" },
          { bg: ["#3E2723","#5D4037","#8D6E63"], accent:"#FFCC80", emoji:"⛰️" },
          { bg: ["#2E1A47","#6D597A","#B56576"], accent:"#FFC8A2", emoji:"🌸" },
          { bg: ["#004D40","#00695C","#26A69A"], accent:"#B2DFDB", emoji:"🍃" },
        ];
        const theme = NATURE[Math.floor(Math.random()*NATURE.length)];
        const grad = ctx.createLinearGradient(0, 0, 0, 1350);
        theme.bg.forEach((c,i)=> grad.addColorStop(i/(theme.bg.length-1), c));
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1350);
        ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fillRect(0,0,1080,1350);
        ctx.strokeStyle = theme.accent; ctx.lineWidth = 5; ctx.globalAlpha=0.6; ctx.strokeRect(28, 28, 1024, 1294); ctx.globalAlpha=1;
        ctx.font = "80px serif"; ctx.textAlign="center"; ctx.globalAlpha=0.18; ctx.fillText(theme.emoji,540,320); ctx.globalAlpha=1;
        ctx.fillStyle = theme.accent; ctx.font = "600 52px Fraunces, serif"; ctx.textAlign = "center";
        ctx.fillText("FÉ DIÁRIA", 540, 160);
        ctx.fillStyle = "#98A0C2"; ctx.font = "400 28px Work Sans, sans-serif";
        ctx.fillText(title || "Versículo do dia", 540, 210);
        ctx.fillStyle = "#F4ECDD"; ctx.font = "500 42px Fraunces, serif"; ctx.textAlign = "center";
        const words = brandedText.split(" "); let line = ""; let y = 500;
        for (let n = 0; n < words.length; n++) {
          const test = line + words[n] + " ";
          if (ctx.measureText(test).width > 900 && n > 0) { ctx.fillText(line, 540, y); line = words[n] + " "; y += 60; } else line = test;
        }
        ctx.fillText(line, 540, y);
        ctx.fillStyle = "#98A0C2"; ctx.font = "400 24px Work Sans, sans-serif";
        ctx.fillText("fediaria.app", 540, 1280);
        const base64 = canvas.toDataURL("image/png").split(",")[1];
        const fileName = "fediaria-share-" + Date.now() + ".png";
        await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
        const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
        await Share.share({ title: "Fé Diária", text: brandedText, files: [uri], dialogTitle: "Compartilhar via Fé Diária" });
        return;
      } catch (e) {}
    }
    if (navigator.share) { await navigator.share({ title, text: brandedText }); return; }
    await navigator.clipboard.writeText(brandedText);
    alert("Texto copiado para compartilhar.");
  } catch {}
}`;
t=t.replace(old, neW);
fs.writeFileSync('3-Codigo-do-App-Real/src/fe-diaria-app.jsx', t, 'utf8');
console.log('patched');
