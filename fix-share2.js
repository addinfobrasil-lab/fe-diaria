const fs=require('fs');
let t=fs.readFileSync('3-Codigo-do-App-Real/src/fe-diaria-app.jsx','utf8');
const old=`async function shareText(text, title) {
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
const neW=`async function shareText(text, title) {
  try {
    const brandedText = text + "\\n\\n— via Fé Diária";
    if (typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.()) {
      try {
        const { Share } = await import("@capacitor/share");
        const { Filesystem, Directory } = await import("@capacitor/filesystem");
        const canvas = document.createElement("canvas");
        canvas.width = 1080; canvas.height = 1350;
        const ctx = canvas.getContext("2d");
        const grad = ctx.createLinearGradient(0, 0, 0, 1350);
        grad.addColorStop(0, "#0B0E17"); grad.addColorStop(1, "#1B2333");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1350);
        ctx.strokeStyle = "#E3A857"; ctx.lineWidth = 6; ctx.strokeRect(20, 20, 1040, 1310);
        ctx.fillStyle = "#E3A857"; ctx.font = "600 48px Fraunces, serif"; ctx.textAlign = "center";
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
if(!t.includes(old)) { console.log("old not found"); process.exit(1); }
fs.writeFileSync('3-Codigo-do-App-Real/src/fe-diaria-app.jsx', t.replace(old, neW), 'utf8');
console.log("done");