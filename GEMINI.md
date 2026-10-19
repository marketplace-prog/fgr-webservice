# GEMINI.md

> Diretrizes para Gemini / Antigravity ao trabalhar no repositório **fgr-webservice**.

A fonte única de verdade sobre arquitetura, convenções, stack e regras do projeto está no arquivo:
👉 **[AGENTS.md](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/AGENTS.md)**

---

## ⚡ Comandos e Regras Rápidas

- **Ambiente & Runtime:** Este projeto é executado com **Bun** sobre **Nuxt 4** e **Vue 3.5**.
  - Execute comandos somente com `bun` (`bun run dev`, `bun run build`, `bun run typecheck`, `bun run lint:fix`).
  - Nunca rode `npm`, `yarn` ou `pnpm` (quebraria o `bun.lock`).
- **Segurança no Supabase:**
  - NUNCA exponha chaves `service_role` ou segredos no frontend.
  - Toda tabela criada no PostgreSQL deve possuir RLS (Row Level Security) ativado e policies explícitas.
- **Padrão de Componentes:**
  - Em arquivos `.vue`, use `<script setup lang="ts">`.
  - Respeite a ordem de blocos: script, template e style.
  - Combine classes Tailwind com `cn()` de `~/lib/utils`.
- **Rotas de Servidor & Nitro:**
  - O backend do Nitro reside em `server/api/`.
  - Consulte [docs/PITFALLS.md](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/docs/PITFALLS.md) para verificar a discrepância do arquivo `app/server/api/cron/check-stock.ts`.
- **Regras de IA:** Regras temáticas granulares estão disponíveis em [`.agents/rules/`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/.agents/rules).
