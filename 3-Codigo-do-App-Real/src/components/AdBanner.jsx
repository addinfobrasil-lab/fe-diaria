// src/components/AdBanner.jsx
//
// Substitui o <AdBanner/> de placeholder do protótipo. Mostra o anúncio real
// do AdMob quando roda como app nativo (Capacitor); dentro de um navegador
// comum (inclusive o preview do Claude.ai) mostra uma reserva de espaço, já
// que anúncio nativo do AdMob não existe fora de app instalado.

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { showBanner, hideBanner } from "../lib/ads";

export default function AdBanner() {
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;
    showBanner();
    return () => { hideBanner(); }; // remove o anúncio ao sair da tela, evita sobrepor outra tela
  }, [isNative]);

  if (isNative) {
    // O AdMob desenha o banner nativamente por cima da webview — este espaço
    // reserva o lugar pra a tela não "pular" quando o anúncio real aparece.
    return <div style={{ height: 50 }} />;
  }

  // Fallback para navegador/preview (sem AdMob disponível)
  return (
    <div style={{
      margin: "12px 20px", borderRadius: 12, border: "1px dashed #38415C",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      padding: 12, fontSize: 12, color: "#98A0C2",
    }}>
      <span style={{ color: "#E3A857", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Anúncio</span>
      <span>Aparece aqui de verdade no app instalado</span>
    </div>
  );
}
