# Fé Diária — Devocional App

## Stack
- React 18 + Vite 5
- Google Gemini 3.1 Flash Lite (IA grátis)
- Google AdMob (anúncios nativos)
- Capacitor 6 (Android/iOS)
- Supabase (Postgres + RLS + Auth Google + Edge Functions)

## Comandos
```bash
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção -> dist/
npm run preview  # preview do build
npm run lint     # eslint (0 erros)
npx cap sync android   # copia dist/ para o projeto Android
```

## Variáveis de Ambiente (.env.local)
```env
VITE_GEMINI_API_KEY=    # aistudio.google.com/apikey
VITE_SUPABASE_URL=      # Supabase Project URL
VITE_SUPABASE_ANON_KEY= # Supabase anon key
# Google OAuth é configurado no Supabase Auth (não via env)
```

## Estrutura
- `src/fe-diaria-app.jsx` — componente App principal (~1920 linhas)
- `src/lib/supabaseClient.js` — cliente Supabase
- `src/data/bible-fallback.js` — fallback offline da Bíblia (70+ capítulos)
- `1-App-Prototipo/` — protótipo original
- `2-Backend-Banco-de-Dados/` — schema SQL + Edge Functions

## Estado Atual
- **Auth Google** via Supabase Auth (supabase.auth.signInWithOAuth) com deep link nativo `com.fediaria.app://` (plugin @capacitor/app)
- **Mural** compartilhado via Supabase (tabela `posts` com RLS), com fallback localStorage
- **Bíblia** com fallback offline completo
- **Estado pessoal** (progresso, diário, favoritos) permanece em localStorage
- Login convidado (nome digitado) funciona sem Supabase
- **Lint**: `npm run lint` passa com 0 erros e 0 warnings
- Código morto removido (PostText, DMThread, Avatar, EmojiPicker e helpers órfãos)
- ESLint 9 flat config (`eslint.config.js`); regras experimentais `set-state-in-effect`/`immutability` desabilitadas

## Para Publicar
1. Rodar `supabase-schema-clean.sql` no SQL Editor do Supabase
2. Configurar Google Auth (Providers → Google) com Client ID + Client Secret
3. Adicionar redirect URI no Google Cloud Console: `https://PROJETO.supabase.co/auth/v1/callback`
4. npm run build && deploy do diretório `dist/` (Vercel/Netlify)
