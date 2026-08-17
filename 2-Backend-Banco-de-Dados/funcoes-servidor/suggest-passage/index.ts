// supabase/functions/suggest-passage/index.ts
//
// Mesma lógica de segurança do moderate-post: a chave fica só aqui no
// servidor, nunca no navegador.
//
// IMPORTANTE sobre esta função especificamente: o diário do dia é o
// conteúdo mais pessoal do app. No nível gratuito do Gemini, o Google
// pode usar o texto enviado para melhorar os produtos deles — o que é
// aceitável para moderar posts públicos, mas é uma escolha mais delicada
// para o diário privado de alguém. Três caminhos possíveis:
//   1) Usar Gemini grátis mesmo assim (o que este arquivo faz), e avisar
//      isso claramente na tela do diário (já deixei o aviso no app).
//   2) Pagar pela API da Anthropic para esta função específica, que não
//      usa dados de clientes de API para treinar modelos por padrão.
//   3) Não oferecer a sugestão por IA no diário, só no mural (público).
// Deixei o código pronto para os dois provedores — troque comentando/
// descomentando o bloco que preferir.
//
// Variável de ambiente necessária: GEMINI_API_KEY (grátis, aistudio.google.com/apikey)

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = "gemini-3.1-flash-lite";

Deno.serve(async (req) => {
  try {
    const { journalText } = await req.json();
    if (!journalText || typeof journalText !== "string" || !journalText.trim()) {
      return new Response(JSON.stringify({ error: "Texto vazio." }), { status: 400 });
    }

    const prompt = `Você é um assistente devocional gentil, acolhedor e prudente dentro de um app cristão. A pessoa escreveu livremente sobre como foi o seu dia. Leia com atenção e responda SOMENTE com um JSON válido, exatamente neste formato:
{"reflexao":"uma frase curta e acolhedora reconhecendo o que a pessoa viveu, sem julgar e sem diagnosticar nada, no máximo 2 frases","livro":"nome de um livro da Bíblia em português","capitulo":numero_do_capitulo_como_inteiro,"versiculo":"número ou intervalo de versículo, ou null se for o capítulo inteiro","motivo":"uma frase curta explicando por que essa passagem se conecta ao que a pessoa escreveu"}

Se o texto sugerir que a pessoa está em risco ou em crise, priorize acolhimento e, no campo "reflexao", gentilmente sugira que converse com alguém de confiança ou um profissional, mantendo ainda assim o formato JSON pedido.

Texto da pessoa:
"""${journalText.trim().slice(0, 4000)}"""`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json", maxOutputTokens: 500 },
        }),
      }
    );
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Falha ao consultar a IA." }), { status: 502 });
    }
    const data = await res.json();
    const raw = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);
    return new Response(JSON.stringify(parsed), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

/* ---- Alternativa paga (Anthropic) — não usa seus dados para treinar por padrão:
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
async function callAnthropic(prompt: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 500, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json();
  return (data.content ?? []).map((b: { text?: string }) => b.text ?? "").join("").replace(/```json|```/g, "").trim();
}
*/

