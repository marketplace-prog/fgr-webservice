# Regra: Integrações, Webhooks e Crons

> Fonte detalhada: [docs/INTEGRATIONS-AND-CRONS.md](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/docs/INTEGRATIONS-AND-CRONS.md) e [docs/PITFALLS.md](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/docs/PITFALLS.md)

- **Rotas de Servidor Nitro:** Handlers residem em `server/api/` (atenção para `app/server/api/cron/check-stock.ts` que deve ser movido para a raiz `server/api/`).
- **Resiliência de Payload:** Webhooks Magazord podem vir diretos ou envelopados em `{ payload: { ... } }`. Sempre use fallback defensivo.
- **Parsing de Datas:** Use SEMPRE `parseMagazordDate(raw)` de `shared/utils/magazord.ts` para tratar offsets sem minutos (`-03`).
- **Limites do Discord:** Use SEMPRE `truncate(texto, max)` para impedir erros `400` causados por strings maiores que 1024 caracteres em campos de embed.
- **Timeouts da Vercel:** Handlers de cron têm limite estrito de 10s no plano Hobby. Evite loops HTTP síncronos longos sobre múltiplos SKUs sem paginação ou lotes.
- **Variáveis de Ambiente:** Webhooks dependem de `DISCORD_WEBHOOK_NOVOS_PEDIDOS` e `DISCORD_WEBHOOK_ATUALIZACOES`. Crons dependem de `SUPABASE_SERVICE_KEY`.
