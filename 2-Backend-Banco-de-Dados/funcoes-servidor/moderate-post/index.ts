// supabase/functions/moderate-post/index.ts
//
// O que este arquivo faz:
// Roda no servidor (Supabase Edge Function, não no navegador do usuário).
// Recebe o texto de uma publicação, pergunta para uma IA se é apropriado,
// e SÓ ENTÃO grava no banco — usando a service_role key, que nunca é
// exposta ao navegador. É isso que torna a moderação real: mesmo que
// alguém edite o app no navegador e tente pular a checagem, o servidor
// aplica a regra de qualquer jeito.
//
// IA usada: Google Gemini (gemini-3.1-flash-lite), que tem um nível
// gratuito de verdade — sem cartão de crédito — pesquisado e confirmado
// hoje. Limites atuais do nível grátis: ~15 requisições/minuto e ~1000
// por dia (Google pode mudar isso a qualquer momento, sem aviso). Se o
// app crescer muito, esse limite pode virar um gargalo — nesse caso dá
// pra subir pro plano pago do Gemini ou trocar para a Anthropic (deixei
// esse código comentado mais abaixo, comentando a troca).
//
// Ponto de atenção sobre privacidade: no nível gratuito do Gemini, o
// Google pode usar o conteúdo enviado para melhorar os produtos deles.
// Como este texto inclui publicações do mural (público por natureza,
// então tudo bem), tudo certo — mas não use este mesmo padrão para
// textos privados (como o diário) sem saber dessa condição.
//
// Variável de ambiente necessária (Supabase Dashboard -> Edge Functions -> Secrets):
//   GEMINI_API_KEY  -> pegue grátis em aistudio.google.com/apikey (sem cartão de crédito)

import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = "gemini-3.1-flash-lite";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function callGemini(prompt: string, maxTokens = 200) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json", maxOutputTokens: maxTokens },
      }),
    }
  );
  if (!res.ok) throw new Error("Gemini API status " + res.status);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  return text.replace(/```json|```/g, "").trim();
}

/* ---- Alternativa paga (Anthropic), caso prefira qualidade/limite maior:
async function callAnthropic(prompt: string, maxTokens = 200) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json();
  return (data.content ?? []).map((b: { text?: string }) => b.text ?? "").join("").replace(/```json|```/g, "").trim();
}
*/

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const userClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), { status: 401 });
    }
    const userId = userData.user.id;

    const { text, category, image_url } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "Texto vazio." }), { status: 400 });
    }
    const clean = text.trim().slice(0, 280);

    const prompt = `Você é o moderador automático do mural público de um app cristão de devocional. Analise o texto abaixo e responda SOMENTE com um JSON válido, exatamente neste formato:
{"aprovado":true ou false,"motivo":"categoria curta em português caso reprovado (ex: discurso de ódio, assédio, conteúdo sexual, spam, golpe, dados pessoais expostos, violência), ou null se aprovado"}

Reprove apenas em casos claros de: discurso de ódio, assédio ou bullying, conteúdo sexual explícito, violência grave, spam ou propaganda comercial, golpes/phishing, ou exposição de dados pessoais de terceiros. Desabafos emocionais, tristeza, dúvidas de fé, pedidos de oração e discordância religiosa educada NÃO devem ser reprovados.

Texto: """${clean}"""`;

    let raw: string;
    try {
      raw = await callGemini(prompt);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Falha ao consultar a IA de moderação." }), { status: 502 });
    }
    let verdict: { aprovado: boolean; motivo: string | null };
    try {
      verdict = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: "Resposta da IA inválida — publicação não realizada." }), { status: 502 });
    }

    if (!verdict.aprovado) {
      return new Response(JSON.stringify({ approved: false, reason: verdict.motivo }), { status: 200 });
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("posts")
      .insert({ user_id: userId, category: category || "encorajamento", text: clean, image_url: image_url || null, approved: true })
      .select()
      .single();

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ approved: true, post: inserted }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

