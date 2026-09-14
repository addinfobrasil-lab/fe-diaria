// src/lib/ads.js
//
// Só funciona dentro do app nativo empacotado com Capacitor (Android/iOS) —
// em navegador (incluindo o preview do Claude.ai), Capacitor.isNativePlatform()
// retorna false e estas funções não fazem nada, de propósito.
//
// Configuração dos anúncios reais (antes de publicar na Play Store):
//   .env.local / secrets do GitHub Actions:
//     VITE_ADMOB_BANNER_ID=ca-app-pub-XXXX/YYYY
//     VITE_ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXX/ZZZZ
//   IDs de produção configurados no app para evitar cliques acidentais em dev.
//   Sem as variáveis, usa IDs de teste oficiais do Google para desenvolvimento.

import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';
import { logAdMob } from './debug.js';

const __DEV__ = typeof import.meta !== 'undefined' ? import.meta.env.DEV : true;

// IDs reais vêm de variáveis de ambiente
// VITE_ADMOB_BANNER_ID=ca-app-pub-6150457068069435/6903738083
// VITE_ADMOB_INTERSTITIAL_ID=ca-app-pub-6150457068069435/XXXXXXXX
const AD_UNIT_ID_BANNER = import.meta.env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111';
const AD_UNIT_ID_INTERSTITIAL = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712';
const HAS_REAL_ADS = !!import.meta.env.VITE_ADMOB_BANNER_ID;

const APP_ID = 'ca-app-pub-6150457068069435~2560787521';

let initialized = false;
let interstitialLoaded = false;

export async function initAds() {
  if (!Capacitor.isNativePlatform()) { logAdMob('not native, skipping'); return; }
  if (initialized) { logAdMob('already initialized'); return; }

  logAdMob('initializing...', { HAS_REAL_ADS, AD_UNIT_ID_BANNER: AD_UNIT_ID_BANNER?.slice(0,20)+'...' });
  try {
    await AdMob.initialize({ 
      initializeForTesting: false, // PRODUÇÃO: anúncios reais
      applicationId: 'ca-app-pub-6150457068069435~2560787521'
    });
    logAdMob('initialized ok (production mode)');
    
    // Pré-carrega o intersticial
    await prepareInterstitial();
    
    initialized = true;
    logAdMob('fully initialized (production mode)');
  } catch (e) {
    logAdMob('init error', e);
  }
}

async function prepareInterstitial() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    logAdMob('preparing interstitial...');
    await AdMob.prepareInterstitial({ adId: 'ca-app-pub-6150457068069435/1033173712' });
    logAdMob('interstitial loaded');
  } catch (e) {
    logAdMob('interstitial load error', e);
  }
}

export async function showBanner() {
  if (!Capacitor.isNativePlatform()) { logAdMob('showBanner: not native'); return; }
  logAdMob('showBanner called');
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.showBanner({
      adId: 'ca-app-pub-6150457068069435/6903738083',
      adSize: 0, // ADAPTIVE_BANNER = 0
      position: 0, // BOTTOM_CENTER = 0
      isTesting: false, // PRODUÇÃO: anúncios reais
    });
    logAdMob('banner shown ok');
  } catch (e) {
    logAdMob('showBanner error', e);
  }
}

export async function hideBanner() {
  if (!Capacitor.isNativePlatform()) return;
  try { const { AdMob } = await import('@capacitor-community/admob'); await AdMob.hideBanner(); } 
  catch (e) { logAdMob('hideBanner error', e); }
}

export async function removeBanner() {
  if (!Capacitor.isNativePlatform()) return;
  try { const { AdMob } = await import('@capacitor-community/admob'); await AdMob.removeBanner(); } 
  catch (e) { logAdMob('removeBanner error', e); }
}

// NOVO: Anúncio intersticial (tela cheia) com botão de fechar
export async function showInterstitial() {
  if (!Capacitor.isNativePlatform()) { 
    logAdMob('showInterstitial: not native'); 
    return false; 
  }
  
  logAdMob('showInterstitial called');
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.showInterstitial();
    logAdMob('interstitial shown');
    return true;
  } catch (e) {
    logAdMob('showInterstitial error', e);
    return false;
  }
}

// Pré-carrega o intersticial para uso posterior
export async function preloadInterstitial() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.prepareInterstitial({ adId: 'ca-app-pub-6150457068069435/1033173712' });
  } catch (e) {
    logAdMob('preloadInterstitial error', e);
  }
}

// Verifica se deve mostrar intersticial (ex: a cada N telas)
let screenViewsSinceInterstitial = 0;
const INTERSTITIAL_INTERVAL = 3; // Mostra a cada 3 telas

export function trackScreenView() {
  if (!Capacitor.isNativePlatform()) return;
  screenViewsSinceInterstitial++;
  if (screenViewsSinceInterstitial >= 3) {
    screenViewsSinceInterstitial = 0;
    showInterstitial();
  }
}

export async function initAdsForProduction() {
  if (!Capacitor.isNativePlatform()) return;
  
  const { AdMob } = await import('@capacitor-community/admob');
  
  // Inicializa tudo para produção
  await AdMob.initialize({ 
    initializeForTesting: false, // PRODUÇÃO
    applicationId: 'ca-app-pub-6150457068069435~2560787521'
  });
  
  // Pré-carrega intersticial
  try {
    await AdMob.prepareInterstitial({ adId: 'ca-app-pub-6150457068069435/1033173712' });
  } catch (e) {
    logAdMob('preloadInterstitial error', e);
  }
  
  logAdMob('Production ads initialized');
}

export { HAS_REAL_ADS };