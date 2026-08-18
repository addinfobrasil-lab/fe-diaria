// supabase/functions/stripe-purchase/index.ts
//
// Edge Function do Supabase que faz duas coisas:
//  1) WEBHOOK: recebe eventos do Stripe da assinatura mensal do Premium:
//       checkout.session.completed  → ativa a assinatura (status active)
//       customer.subscription.deleted → revoga o acesso (status cancelled)
//     e registra na tabela premium_purchases.
//  2) VERIFICACAO: endpoint /verify usado pelo app para confirmar se um e-mail
//     tem assinatura ATIVA (usado no fluxo "Já paguei" e na auto-verificação
//     ao abrir o app).
//
// Configuração (secrets do Supabase — Dashboard > Edge Functions > Secrets):
//   STRIPE_WEBHOOK_SECRET = secret de assinatura do webhook (Stripe Dashboard
//                           > Developers > Webhooks > seu endpoint > Signing secret)
//   ANON_PUBLIC_KEY = chave anon do projeto (usada para autorizar o /verify)
//   A função usa automaticamente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY,
//   que o Supabase já injeta por padrão.
//
// A função é deployada com --no-verify-jwt porque o webhook do Stripe não
// envia JWT. A rota /verify valida a chave anon manualmente no Authorization.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const anonPublicKey = Deno.env.get("ANON_PUBLIC_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Autorização manual da rota /verify: exige "Authorization: Bearer <anon key>".
function isAuthorized(req: Request) {
  if (!anonPublicKey) return false;
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${anonPublicKey}`;
}

// Ativa (ou reativa) a assinatura de um e-mail após pagamento confirmado.
async function activateSubscription(input: {
  email: string;
  stripeSessionId: string;
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  currentPeriodEnd?: string | null;
}) {
  const { error } = await supabase.from("premium_purchases").upsert(
    {
      email: input.email.toLowerCase(),
      stripe_session_id: input.stripeSessionId,
      stripe_customer_id: input.stripeCustomerId || null,
      subscription_id: input.subscriptionId || null,
      amount_total: input.amountTotal ?? null,
      currency: input.currency || "brl",
      status: "active",
      current_period_end: input.currentPeriodEnd ? new Date(input.currentPeriodEnd).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_session_id" },
  );
  return error;
}

// Revoga o acesso premium de todos os registros de um cliente (ex: cancelou/expirou).
async function cancelSubscription(stripeCustomerId: string) {
  const { error } = await supabase
    .from("premium_purchases")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("stripe_customer_id", stripeCustomerId);
  return error;
}

// Valida a assinatura do webhook do Stripe e retorna o evento (ou null).
async function constructEvent(rawBody: string, signature: string | null) {
  if (!signature) return null;
  // Implementação manual do HMAC (não depende do SDK Stripe no Deno).
  const parts = signature.split(",").reduce<Record<string, string>>((acc, p) => {
    const [k, v] = p.split("=");
    if (k && v) acc[k] = v;
    return acc;
  }, {});
  const timestamp = parts["t"];
  const providedSig = parts["v1"];
  if (!timestamp || !providedSig) return null;

  const signedPayload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(stripeWebhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const computed = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");

  // Comparação em tempo constante para evitar timing attacks.
  if (computed.length !== providedSig.length) return null;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ providedSig.charCodeAt(i);
  if (diff !== 0) return null;

  // Rejeita eventos antigos (>5 min) para evitar replay.
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - parseInt(timestamp, 10)) > 300) return null;

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  // ---- Endpoint de verificação: o app pergunta "este e-mail está ativo?" ----
  if (path === "verify" && req.method === "POST") {
    if (!isAuthorized(req)) return json({ error: "não autorizado" }, 401);
    try {
      const { email } = await req.json();
      if (!email || typeof email !== "string") return json({ error: "email obrigatório" }, 400);
      const normalized = email.trim().toLowerCase();
      const { data, error } = await supabase
        .from("premium_purchases")
        .select("email")
        .eq("email", normalized)
        .eq("status", "active")
        .limit(1);
      if (error) return json({ error: error.message }, 500);
      return json({ paid: (data?.length ?? 0) > 0 });
    } catch (e) {
      return json({ error: "requisição inválida" }, 400);
    }
  }

  // ---- Webhook do Stripe ----
  if (path === "webhook" && req.method === "POST") {
    const rawBody = await req.text();
    const event = await constructEvent(rawBody, req.headers.get("stripe-signature"));
    if (!event) return json({ error: "assinatura inválida" }, 400);

    // Pagamento inicial da assinatura concluído → ativa o Premium.
    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      const email = session?.customer_details?.email || session?.customer_email;
      if (!email) return json({ ok: true, skipped: "sem email" });
      const error = await activateSubscription({
        email: String(email),
        stripeSessionId: session.id,
        stripeCustomerId: session.customer,
        subscriptionId: session.subscription,
        amountTotal: session.amount_total,
        currency: session.currency,
      });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    // Criação de assinatura → também ativa (reforço, caso o checkout tenha vindo de outro fluxo).
    if (event.type === "customer.subscription.created") {
      const sub = event.data?.object;
      const email = sub?.metadata?.email || null;
      if (!email) return json({ ok: true, skipped: "sem email no metadata" });
      const error = await activateSubscription({
        email: String(email),
        stripeSessionId: sub.id, // fallback único para a sessão
        stripeCustomerId: sub.customer,
        subscriptionId: sub.id,
        currentPeriodEnd: sub.current_period_end ? String(sub.current_period_end * 1000) : null,
      });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    // Renovação/atualização → mantém ativo e atualiza o fim do período.
    if (event.type === "customer.subscription.updated") {
      const sub = event.data?.object;
      if (!sub?.customer) return json({ ok: true, skipped: "sem customer" });
      const { error } = await supabase
        .from("premium_purchases")
        .update({
          status: "active",
          subscription_id: sub.id,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", sub.customer);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    // Assinatura cancelada ou expirada → revoga o Premium.
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data?.object;
      if (!sub?.customer) return json({ ok: true, skipped: "sem customer" });
      const error = await cancelSubscription(sub.customer);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ ok: true, unhandled: event.type });
  }

  return json({ error: "rota não encontrada" }, 404);
});
