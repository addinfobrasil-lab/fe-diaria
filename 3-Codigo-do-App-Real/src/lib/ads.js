// src/lib/ads.js
//
// Só funciona dentro do app nativo empacotado com Capacitor (Android/iOS) —
// em navegador (incluindo o preview do Claude.ai), Capacitor.isNativePlatform()
// retorna false e estas funções não fazem nada, de propósito.
//
// Configuração dos anúncios reais (antes de publicar na Play Store):
//   .env.local / secrets do GitHub Actions:
//     VITE_ADMOB_BANNER_ID=ca-app-pub-XXXX/YYYY
//   Sem a variável, o app usa os IDs OFICIAIS DE TESTE do Google
//   (ca-app-pub-3940256099942544/...), seguros para desenvolvimento — evita
//   risco à sua conta AdMob por clique acidental em anúncio real.

import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

// Vite expõe isso automaticamente; ajuste esta linha se usar outro bundler (ex. Next.js: process.env.NODE_ENV !== 'production').
const __DEV__ = typeof import.meta !== 'undefined' ? import.meta.env.DEV : true;

// IDs reais vêm de variáveis de ambiente (VITE_ADMOB_BANNER_ID e
// VITE_ADMOB_INTERSTITIAL_ID). Sem elas, usa os IDs OFICIAIS DE TESTE do
// próprio Google, seguros para desenvolvimento.
const AD_UNIT_ID_BANNER = import.meta.env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111';
const HAS_REAL_ADS = !!import.meta.env.VITE_ADMOB_BANNER_ID;

let initialized = false;

export async function initAds() {
  if (!Capacitor.isNativePlatform()) { console.log('[AdMob] not native, skipping'); return; }
  if (initialized) { console.log('[AdMob] already initialized'); return; }

  console.log('[AdMob] initializing...', { HAS_REAL_ADS, AD_UNIT_ID_BANNER: AD_UNIT_ID_BANNER?.slice(0,20)+'...' });
  try {
    await AdMob.initialize({
      initializeForTesting: !HAS_REAL_ADS,
    });
    console.log('[AdMob] initialized ok');

    const consentInfo = await AdMob.requestConsentInfo();
    console.log('[AdMob] consent info:', consentInfo);
    if (consentInfo.isConsentFormAvailable && consentInfo.status === 'REQUIRED') {
      await AdMob.showConsentForm();
      console.log('[AdMob] consent form shown');
    }

    initialized = true;
    console.log('[AdMob] fully initialized');
  } catch (e) {
    console.error('[AdMob] init error:', e);
    throw e;
  }
}

export async function showBanner() {
  if (!Capacitor.isNativePlatform()) { console.log('[AdMob] showBanner: not native'); return; }
  console.log('[AdMob] showBanner called');
  try {
    await initAds();
    console.log('[AdMob] showing banner...', { adId: AD_UNIT_ID_BANNER?.slice(0,20)+'...' });
    await AdMob.showBanner({
      adId: AD_UNIT_ID_BANNER,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: !HAS_REAL_ADS,
    });
    console.log('[AdMob] banner shown ok');
  } catch (e) {
    console.error('[AdMob] showBanner error:', e);
  }
}

export async function hideBanner() {
  if (!Capacitor.isNativePlatform()) return;
  await AdMob.hideBanner();
}

export async function removeBanner() {
  if (!Capacitor.isNativePlatform()) return;
  await AdMob.removeBanner();
}
