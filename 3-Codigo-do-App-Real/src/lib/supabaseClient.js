// src/lib/supabaseClient.js
//
// Este arquivo só funciona em um projeto React real (Vite, Next.js, etc.)
// rodando FORA do Claude.ai — ele precisa do pacote @supabase/supabase-js
// instalado via npm, o que não é possível dentro do preview de artifacts.
//
// Instalação no seu projeto real:
//   npm install @supabase/supabase-js
//
// As duas variáveis abaixo são PÚBLICAS por design (assim como o Client ID
// do Google) — pode deixá-las no código do front-end. Quem protege os dados
// de verdade são as regras de RLS que estão no supabase-schema.sql, não o
// segredo dessas chaves.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
