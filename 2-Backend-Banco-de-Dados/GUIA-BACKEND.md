# Fé Diária — Guia de configuração do backend real

Este guia liga tudo: banco de dados, login com Google, fotos e moderação por IA.
Leva uns 30-40 minutos na primeira vez. Depois de pronto, é só usar.

**Importante antes de começar:** nada disto roda dentro do preview do Claude.ai
(o iframe do chat bloqueia o login do Google por segurança do próprio Google).
Isto é para quando você tiver seu projeto rodando no seu próprio domínio —
como um site publicado, um PWA instalado, ou um app empacotado com Capacitor.

---

## 1. Criar o projeto no Supabase (grátis, sem cartão)

1. Acesse **supabase.com** → crie uma conta → **New Project**.
2. Anote a **senha do banco** que você escolher.
3. Espere ~2 minutos até o projeto ficar pronto.
4. Vá em **Project Settings → API** e guarde dois valores: **Project URL** e **anon public key**.

Por que Supabase e não Firebase: pesquisei os dois agora. Desde fevereiro de 2026,
o Firebase passou a exigir o plano pago (Blaze, com cartão de crédito vinculado)
só para usar o Storage — mesmo dentro da cota gratuita. O Supabase inclui banco
(Postgres), login (com Google), 1 GB de armazenamento de arquivos e funções de
servidor tudo no plano grátis, sem cartão. A única pegadinha: projetos gratuitos
"pausam" depois de 7 dias sem uso (reativa com um clique; dá para evitar com um
ping automático — posso te ajudar a configurar isso se quiser).

## 2. Rodar o esquema do banco

1. No painel do Supabase, abra **SQL Editor**.
2. Cole o conteúdo inteiro de `supabase-schema.sql` (está nos arquivos que te enviei) e clique **Run**.
3. Confira em **Table Editor** se apareceram as tabelas: `profiles`, `posts`, `post_likes`, `dm_messages`, `user_state`.
4. Confira em **Storage** se o bucket `photos` foi criado.

## 3. Criar o Client ID do Google (você mesmo, na sua conta)

Sigo o que já te expliquei antes — recapitulando rápido:

1. **console.cloud.google.com** → crie um projeto.
2. **APIs e Serviços → Tela de permissão OAuth** → Externo → preencha e salve.
3. **Credenciais → Criar credenciais → ID do cliente OAuth** → tipo **Aplicativo Web**.
4. Em **Origens JavaScript autorizadas**, adicione o domínio real do seu app (ex: `https://seuapp.com`).
5. Em **URIs de redirecionamento autorizados**, adicione:
   `https://SEU-PROJETO.supabase.co/auth/v1/callback`
6. Copie o **Client ID** e o **Client Secret** gerados.

## 4. Conectar o Google ao Supabase (aqui a mágica acontece)

1. No Supabase: **Authentication → Providers → Google**.
2. Ative o provedor, cole o **Client ID** e o **Client Secret** do passo 3.
3. Salve. Pronto — o Supabase agora cuida de todo o fluxo OAuth por você;
   no código, fazer login vira uma linha (`signInWithGoogle()`, já no `api.js`).

## 5. Publicar as Edge Functions (moderação e sugestão de IA)

Isso roda no seu computador, uma vez:

```bash
npm install -g supabase
supabase login
supabase link --project-ref SEU-PROJETO-REF
supabase functions deploy moderate-post
supabase functions deploy suggest-passage
```

Depois, em **Edge Functions → Secrets**, adicione:
```
GEMINI_API_KEY = sua-chave-gratuita-do-gemini
```
Pegue essa chave em **aistudio.google.com/apikey** — é gratuita, sem cartão de
crédito (pesquisei e confirmei isso hoje). Limites atuais do nível grátis:
por volta de 15 requisições por minuto e 1.000 por dia (o Google pode mudar
isso a qualquer momento). Se o app crescer bastante e esse limite virar um
gargalo, dá para migrar para o plano pago do Gemini ou trocar para a Anthropic
— deixei o código das duas opções nos arquivos das funções, é só descomentar.

**Aviso sobre privacidade do diário:** no nível gratuito do Gemini, o Google
pode usar o texto enviado para melhorar os produtos deles. Para publicações
do mural (públicas por natureza) isso não é grande problema; para o diário
pessoal, é uma escolha mais delicada — deixei um aviso disso na própria tela
do diário no app, e documentei as três opções dentro do arquivo
`suggest-passage/index.ts`.

## 6. Ligar o front-end

1. Copie `.env.example` para `.env.local` e preencha com os valores do passo 1.
2. No seu projeto React (Vite recomendado): `npm install @supabase/supabase-js`.
3. Use os arquivos `src/lib/supabaseClient.js` e `src/lib/api.js` que te enviei —
   eles substituem as chamadas de `window.storage` do protótipo por chamadas reais.

## 7. Publicar de verdade (hospedagem do site)

Para o front-end (não confundir com o backend Supabase, que já está hospedado):
- **Vercel** ou **Netlify** — ambos têm plano grátis, deploy em minutos, HTTPS automático.
- Para virar app de Android/iOS de verdade: empacote com **Capacitor** (te mostro o passo a passo quando quiser) e publique nas lojas.

## 8. SEO (para aparecer no Google)

Enviei `index.html` (com meta tags, Open Graph, Twitter Card e dados
estruturados), `robots.txt` e `sitemap.xml`. Troque `SEU-DOMINIO.com` pelo
domínio real e crie uma imagem `og-image.png` (1200x630px) para as prévias
de compartilhamento.

**Limite técnico que preciso ser honesto sobre:** este app é uma SPA (React
que renderiza no navegador). O Google consegue indexar conteúdo em JavaScript
hoje em dia, mas de forma mais lenta e menos confiável do que páginas prontas
em HTML. Para SEO forte de verdade (aparecer bem no Google, especialmente
rápido para conteúdo novo), o caminho certo é migrar para um framework com
renderização no servidor — **Next.js** é a opção mais usada para isso hoje.
Isso é uma mudança de arquitetura maior, não algo que dá para simplesmente
adicionar por cima; me avise se quiser que eu comece essa migração.

Enquanto isso, o que já ajuda bastante mesmo em SPA: meta tags corretas (✅ feito),
sitemap (✅ feito), performance boa (o app já é leve), e conteúdo real e
único por página se você adicionar mais rotas no futuro.

## O que esperar com uso real (para não ser pego de surpresa)

- **Custo:** Supabase e hospedagem do site ficam em $0 dentro dos limites gratuitos.
  Com o Gemini no lugar da Anthropic, a IA (moderação + sugestões) também fica em
  $0 dentro do limite diário gratuito — o principal risco é esse limite (~1.000
  chamadas/dia) ficar apertado se o app crescer muito, já que moderação roda em
  toda publicação nova.
- **Limites do plano grátis do Supabase:** 500 MB de banco, 1 GB de arquivos,
  50 mil usuários ativos/mês, projeto pausa após 7 dias sem requisição.
- **LGPD:** por ter contas reais, fotos e mural público, isso já é uma aplicação
  real coletando dados pessoais — vale conversar com alguém que entenda de LGPD
  antes de lançar amplamente, além de revisar os Termos de Uso com um advogado.
- **Moderação:** a função automática cobre publicações novas. Denúncias de
  conteúdo antigo ou de borda ainda merecem um canal humano de contato.
