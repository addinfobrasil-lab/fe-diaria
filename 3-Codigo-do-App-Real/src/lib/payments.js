// src/lib/payments.js
//
// Camada única de pagamento do Fé Diária. Três modos, nesta ordem de prioridade:
//  1) Google Play Billing via RevenueCat (@revenuecat/purchases-capacitor) —
//     usado quando o app roda nativo E a chave VITE_REVENUECAT_API_KEY existe.
//     Só funciona de verdade com o app publicado na Google Play (ou em teste
//     interno com licença de testador).
//  2) Stripe Checkout (Payment Link) — abre a página de pagamento do Stripe no
//     navegador, sem precisar de servidor próprio. Use quando o APK for
//     distribuído fora da Play Store (link direto, site, etc).
//  3) Demonstração — apenas simula a compra (padrão atual do protótipo).
//
// Configuração via .env.local / secrets do GitHub Actions:
//   VITE_REVENUECAT_API_KEY=publ_...
//   VITE_REVENUECAT_PRODUCT_ID=fe_diaria_premium
//   VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/...
//
// Enquanto nada estiver configurado, o app cai no modo demonstração.

const hasRCKey = () => !!import.meta.env.VITE_REVENUECAT_API_KEY;
const productId = () => import.meta.env.VITE_REVENUECAT_PRODUCT_ID || "fe_diaria_premium";
const stripeLink = () => import.meta.env.VITE_STRIPE_PAYMENT_LINK || "";

let purchases = null;
function getPurchases() {
  if (purchases) return purchases;
  purchases = import("@revenuecat/purchases-capacitor").then((m) => m.Purchases);
  return purchases;
}

export function getPayMode() {
  const isNative = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();
  if (isNative && hasRCKey()) return "play";
  if (stripeLink()) return "stripe";
  return "demo";
}

// Retorna true se o modo de pagamento real está ativo (Play ou Stripe).
export function isRealPaymentConfigured() {
  return getPayMode() !== "demo";
}

export async function buyPremium() {
  const mode = getPayMode();
  if (mode === "play") {
    const Purchases = await getPurchases();
    await Purchases.configure({
      apiKey: import.meta.env.VITE_REVENUECAT_API_KEY,
      appUserID: null,
    });
    const offerings = await Purchases.getOfferings();
    const pkg = offerings?.current?.availablePackages?.find((p) => p.storeProduct.identifier === productId())
      || offerings?.current?.availablePackages?.[0];
    if (!pkg) throw new Error("Produto Premium não encontrado na Google Play. Confira o ID do produto e o catálogo no RevenueCat.");
    await Purchases.purchasePackage(pkg);
    return { mode: "play" };
  }
  if (mode === "stripe") {
    if (typeof window !== "undefined" && window.open) {
      window.open(stripeLink(), "_blank", "noopener,noreferrer");
    } else {
      window.location.href = stripeLink();
    }
    return { mode: "stripe" };
  }
  return { mode: "demo" };
}

// Usado ao abrir o app/aba premium para saber se o usuário já tem a compra.
export async function checkEntitlement() {
  const mode = getPayMode();
  if (mode !== "play") return false;
  try {
    const Purchases = await getPurchases();
    await Purchases.configure({ apiKey: import.meta.env.VITE_REVENUECAT_API_KEY, appUserID: null });
    const info = await Purchases.getCustomerInfo();
    return !!info?.entitlements?.active?.premium;
  } catch {
    return false;
  }
}