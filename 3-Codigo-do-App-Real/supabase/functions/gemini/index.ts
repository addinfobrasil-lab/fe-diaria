// supabase/functions/gemini/index.ts
//
// Edge Function que faz proxy para a Google Gemini API sem expor a chave
// no bundle do app (a chave fica apenas no servidor, como secret).
//
// Endpoints:
//   POST /generate  → gera conteúdo (usado na sugestão de passagem bíblica)
//   POST /moderate  → modera texto do mural
//
// Configuração (secrets do Supabase):
//   GEMINI_API_KEY = chave da API do Gemini (Google AI Studio / IAM)
//
// Deploy: supabase functions deploy gemini
// (com verify_jwt ativo por padrão — só o app autenticado acessa)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const geminiKey = Deno.env.get("GEMINI_API_KEY") || "";
const MODEL = "gemini-3.1-flash-lite";
const API_URL = "https://generativelanguage.googleapis.com/v1beta";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callGemini(prompt: string, maxTokens: number) {
  if (!geminiKey) throw new Error("GEMINI_API_KEY não configurada no servidor");
  const res = await fetch(`${API_URL}/models/${MODEL}:generateContent?key=${geminiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: "application/json", maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) throw new Error("Gemini API status " + res.status);
  const data = await res.json();
  const raw = (data?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("").replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.split("/").filter(Boolean).pop();

  if (req.method !== "POST") return json({ error: "método não permitido" }, 405);
  if (path !== "generate" && path !== "moderate") return json({ error: "rota não encontrada" }, 404);

  try {
    const body = await req.json();
    const text = String(body?.text || "");
    if (!text.trim()) return json({ error: "texto obrigatório" }, 400);

    if (path === "moderate") {
      const prompt = `Você é o moderador automático do mural público de um app cristão de devocional. Analise o texto abaixo e responda SOMENTE com um JSON válido, sem markdown e sem texto adicional, exatamente neste formato:
{"aprovado":true ou false,"motivo":"categoria curta em português caso reprovado (ex: discurso de ódio, assédio, conteúdo sexual, spam, golpe, dados pessoais expostos, violência), ou null se aprovado"}

Reprove apenas em casos claros de: discurso de ódio, assédio ou bullying, conteúdo sexual explícito, violência grave, spam ou propaganda comercial, golpes/phishing, ou exposição de dados pessoais de terceiros (telefone, endereço, CPF). Desabafos emocionais, tristeza, dúvidas de fé, pedidos de oração e discordância religiosa educada NÃO devem ser reprovados.

Texto: """${text}"""`;
      const result = await callGemini(prompt, 300);
      return json(result);
    }

    // default: generate (sugestão de passagem bíblica)
    const prompt = `Você é um assistente devocional gentil, acolhedor e prudente dentro de um app cristão. A pessoa escreveu livremente sobre como foi o seu dia. Leia com atenção e responda SOMENTE com um JSON válido — sem markdown, sem crases, sem texto antes ou depois — exatamente neste formato:
{"reflexao":"uma frase curta e acolhedora reconhecendo o que a pessoa viveu, sem julgar e sem diagnosticar nada, no máximo 2 frases","livro":"nome de um livro da Bíblia em português","capitulo":numero_do_capitulo_como_inteiro,"versiculo":"número ou intervalo de versículo, ou null se for o capítulo inteiro","motivo":"uma frase curta explicando por que essa passagem se conecta ao que a pessoa escreveu"}

Se o texto sugerir que a pessoa está em risco ou em crise, priorize acolhimento e, no campo "reflexao", gentilmente sugira que converse com alguém de confiança ou um profissional, mantendo ainda assim o formato JSON pedido.

Texto da pessoa:
"""${text}"""`;
    const result = await callGemini(prompt, 1000);
    return json(result);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "erro interno" }, 500);
  }
});