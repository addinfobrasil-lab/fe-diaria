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
    // SEMPRE inicializa em modo teste primeiro; se tiver ID real, tenta produção depois
    await AdMob.initialize({
      initializeForTesting: true, // SEMPRE teste primeiro para não crashar
    });
    console.log('[AdMob] initialized ok (test mode)');

    // Pula consentimento UMP por enquanto — pode travar em alguns dispositivos
    // TODO: reativar quando testado em dispositivo real
    // const consentInfo = await AdMob.requestConsentInfo();
    // if (consentInfo.isConsentFormAvailable && consentInfo.status === 'REQUIRED') {
    //   await AdMob.showConsentForm();
    // }

    initialized = true;
    console.log('[AdMob] fully initialized (test mode)');
  } catch (e) {
    console.error('[AdMob] init error:', e);
    // NÃO propaga erro — permite que app continue funcionando
  }
}

export async function showBanner() {
  if (!Capacitor.isNativePlatform()) { console.log('[AdMob] showBanner: not native'); return; }
  console.log('[AdMob] showBanner called');
  try {
    await initAds();
    // USA SEMPRE ID DE TESTE se não tiver ID real válido
    const bannerId = HAS_REAL_ADS && AD_UNIT_ID_BANNER?.startsWith('ca-app-pub-') && !AD_UNIT_ID_BANNER.includes('3940256099942544')
      ? AD_UNIT_ID_BANNER
      : 'ca-app-pub-3940256099942544/6300978111'; // ID oficial de teste do Google
    const isTesting = !HAS_REAL_ADS || AD_UNIT_ID_BANNER?.includes('3940256099942544');

    console.log('[AdMob] showing banner...', { adId: AD_UNIT_ID_BANNER?.slice(0,20)+'...', usingTestId: isTesting });
    await AdMob.showBanner({
      adId: bannerId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: true, // SEMPRE true para não quebrar em produção sem fill
    });
    console.log('[AdMob] banner shown ok');
  } catch (e) {
    console.error('[AdMob] showBanner error:', e);
    // NÃO propaga — app continua funcionando
  }
}

export async function hideBanner() {
  if (!Capacitor.isNativePlatform()) return;
  try { await AdMob.hideBanner(); } catch (e) { console.error('[AdMob] hideBanner error:', e); }
}

export async function removeBanner() {
  if (!Capacitor.isNativePlatform()) return;
  try { await AdMob.removeBanner(); } catch (e) { console.error('[AdMob] removeBanner error:', e); }
}
