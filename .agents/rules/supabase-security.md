# Regra: Segurança, Auth e Banco de Dados Supabase

> Fonte detalhada: [AGENTS.md](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/AGENTS.md#9-supabase-auth-client--seguran%C3%A7a)

- **Frontend Client:** Obtenha o cliente com `useSupabaseClient()` e o usuário com `useSupabaseUser()`.
- **Server Handlers:** Em rotas de usuário, use `serverSupabaseClient(event)`. Em rotas agendadas ou webhooks de background, use `serverSupabaseServiceRole(event)`.
- **Proteção de Chaves:** NUNCA exponha `NUXT_SUPABASE_SECRET_KEY` ou `NUXT_SUPABASE_SERVICE_KEY` no frontend ou em campos públicos do `runtimeConfig`.
- **RLS Obrigatório:** Toda tabela criada no PostgreSQL DEVE ter Row Level Security (RLS) habilitado com policies explícitas por operação (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
- **Tipos do Banco:** Tipos gerados do banco devem ser exportados em `shared/types/database.types.ts` (ignorado pelo ESLint conforme configurado em `eslint.config.mjs`).
