// src/lib/ads.js
//
// Só funciona dentro do app nativo empacotado com Capacitor (Android/iOS) —
// em navegador (incluindo o preview do Claude.ai), Capacitor.isNativePlatform()
// retorna false e estas funções não fazem nada, de propósito.
//
// Troque pelos seus IDs reais do painel do AdMob antes de publicar.
// Os valores abaixo (ca-app-pub-3940256099942544/...) são os IDs OFICIAIS DE
// TESTE do próprio Google — use-os enquanto desenvolve, para não arriscar sua
// conta AdMob por clique acidental em anúncio real.

import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

// Vite expõe isso automaticamente; ajuste esta linha se usar outro bundler (ex. Next.js: process.env.NODE_ENV !== 'production').
const __DEV__ = typeof import.meta !== 'undefined' ? import.meta.env.DEV : true;

const AD_UNIT_ID_BANNER = __DEV__
  ? 'ca-app-pub-3940256099942544/6300978111' // ID de teste oficial do Google (banner Android)
  : 'SEU_AD_UNIT_ID_BANNER_AQUI';

let initialized = false;

export async function initAds() {
  if (!Capacitor.isNativePlatform()) return; // navegador/preview: não faz nada
  if (initialized) return;

  await AdMob.initialize({
    initializeForTesting: __DEV__,
  });

  // Consentimento de anúncios (UMP do Google) — complementa, mas não substitui,
  // o consentimento LGPD específico que já existe em "Meus Dados" no app.
  const consentInfo = await AdMob.requestConsentInfo();
  if (consentInfo.isConsentFormAvailable && consentInfo.status === 'REQUIRED') {
    await AdMob.showConsentForm();
  }

  initialized = true;
}

export async function showBanner() {
  if (!Capacitor.isNativePlatform()) return;
  await initAds();
  await AdMob.showBanner({
    adId: AD_UNIT_ID_BANNER,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    isTesting: __DEV__,
  });
}

export async function hideBanner() {
  if (!Capacitor.isNativePlatform()) return;
  await AdMob.hideBanner();
}

export async function removeBanner() {
  if (!Capacitor.isNativePlatform()) return;
  await AdMob.removeBanner();
}
