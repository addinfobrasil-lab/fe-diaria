// src/lib/api.js
// Funções reais de acesso ao backend. Substituem as chamadas de window.storage
// usadas no protótipo do Claude.ai por chamadas de verdade ao Supabase.

import { supabase } from "./supabaseClient";

/* ---------- Autenticação (Google, de verdade) ---------- */
// Isto só completa o login quando rodando no domínio real do seu app —
// dentro do preview do Claude.ai o Google bloqueia o login por estar num iframe.
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session?.user ?? null));
  return () => data.subscription.unsubscribe();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

/* ---------- Perfil e foto ---------- */
export async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, { name, avatar_url }) {
  const { error } = await supabase.from("profiles").update({ name, avatar_url }).eq("id", userId);
  if (error) throw error;
}

// Upload real de foto para o Supabase Storage (bucket "photos" criado pelo schema.sql)
export async function uploadPhoto(userId, file) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("photos").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  return data.publicUrl;
}

/* ---------- Mural público (posts passam pela função de moderação) ---------- */
export async function fetchFeed(limit = 50) {
  const { data, error } = await supabase
    .from("posts_with_likes")
    .select("*")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// Chama a Edge Function — o servidor modera com IA e só grava se aprovado.
export async function createPost({ text, category, image_url }) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-post`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text, category, image_url }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Falha ao publicar");
  return result; // { approved: true, post } ou { approved: false, reason }
}

export async function deletePost(postId) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function toggleLike(postId, userId, currentlyLiked) {
  if (currentlyLiked) {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  } else {
    await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  }
}

// Atualiza a tela ao vivo quando qualquer pessoa publica ou curte (Supabase Realtime)
export function subscribeFeed(onChange) {
  const channel = supabase
    .channel("public-feed")
    .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

/* ---------- Mensagens privadas ----------
   Reais no sentido de que o Postgres/RLS impede QUALQUER outra pessoa de
   ler a linha — diferente da versão de protótipo, que só escondia a
   conversa na interface. Ainda assim, sem verificação de identidade forte
   e sem criptografia ponta-a-ponta, trate como "privado do público em
   geral", não como nível bancário. */
export async function fetchThread(myId, otherId) {
  const { data, error } = await supabase
    .from("dm_messages")
    .select("*")
    .or(`and(from_user.eq.${myId},to_user.eq.${otherId}),and(from_user.eq.${otherId},to_user.eq.${myId})`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function sendMessage(myId, otherId, text) {
  const { error } = await supabase.from("dm_messages").insert({ from_user: myId, to_user: otherId, text: text.slice(0, 500) });
  if (error) throw error;
}

export function subscribeThread(myId, otherId, onChange) {
  const channel = supabase
    .channel(`dm-${[myId, otherId].sort().join("-")}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages" }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

/* ---------- Estado pessoal (progresso, diário, favoritos — sincroniza entre aparelhos) ---------- */
export async function loadUserState(userId) {
  const { data, error } = await supabase.from("user_state").select("state").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data?.state ?? null;
}

export async function saveUserState(userId, state) {
  const { error } = await supabase.from("user_state").upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/* ---------- IA: sugestão de passagem a partir do diário (via Edge Function, chave protegida) ---------- */
export async function suggestPassage(journalText) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-passage`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ journalText }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Falha ao gerar sugestão");
  return result;
}

/* ---------- LGPD: direitos do titular (consentimento, portabilidade, exclusão) ---------- */
export async function logConsent(userId, { termsVersion, privacyVersion, sensitiveDataConsent, ageBracket, guardianConsent }) {
  const { error } = await supabase.from("consent_log").insert({
    user_id: userId, terms_version: termsVersion, privacy_version: privacyVersion,
    sensitive_data_consent: sensitiveDataConsent, age_bracket: ageBracket, guardian_consent: guardianConsent || false,
  });
  if (error) throw error;
}

export async function exportMyData() {
  const { data, error } = await supabase.rpc("export_my_data");
  if (error) throw error;
  return data; // mostre um botão "baixar" que vira isso em um arquivo .json no navegador
}

export async function deleteMyAccount() {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw error;
  await supabase.auth.signOut();
}

