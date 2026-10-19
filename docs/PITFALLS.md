# Armadilhas Conhecidas e Cuidados Técnicos (Pitfalls)

> Este documento lista armadilhas reais, particularidades da stack e discrepâncias identificadas no código do `fgr-webservice`. Leia antes de realizar qualquer alteração estrutural.

---

## 1. Localização de Rotas de Servidor (`app/server` vs `server/`)

- **Armadilha:** O arquivo [`app/server/api/cron/check-stock.ts`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/app/server/api/cron/check-stock.ts) está dentro da pasta `app/server/`. No Nuxt 4 com configuração padrão do Nitro, as rotas de API residem na raiz `server/api/` (onde estão `server/api/webhook/` e `server/api/health.get.ts`).
- **Impacto:** O arquivo `vercel.json` agenda o cron para `/api/cron/check-stock`. Se o Nitro não escanear a pasta `app/server/` para rotas de API, o endpoint retornará **404 Not Found** em produção quando a Vercel acionar o cron.
- **Como evitar:**
  - _TODO: confirmar com o time_ se o arquivo deve ser movido para `server/api/cron/check-stock.ts`.

---

## 2. Dependência de `SUPABASE_SERVICE_KEY` no Ambiente

- **Armadilha:** A rota de cron usa `serverSupabaseServiceRole(event)` para ler a tabela `stock_monitors` bypassando o RLS.
- **Impacto:** Esse método exige a variável de ambiente `SUPABASE_SERVICE_KEY`. Nem o `.env` local nem o `.env.example` listavam essa chave originalmente. Se ela não for cadastrada nas variáveis de ambiente do projeto na Vercel, qualquer execução do cron falhará com erro 500 no runtime da Vercel.
- **Como evitar:**
  - Cadastre `SUPABASE_SERVICE_KEY` no painel de Environment Variables da Vercel e no `.env` local para desenvolvimento.

---

## 3. Duplicação de Módulo no `nuxt.config.ts`

- **Armadilha:** No arquivo [`nuxt.config.ts`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/nuxt.config.ts#L25), o array `modules` possui o módulo `"shadcn-nuxt"` duplicado:
  ```ts
  modules: ["shadcn-nuxt", '@nuxt/eslint', 'shadcn-nuxt', "@nuxtjs/supabase"],
  ```
- **Impacto:** Pode gerar alertas de warning ou execução duplicada de hooks de build durante o `nuxt build`.
- **Como evitar:** Mantenha apenas uma ocorrência do módulo ao editar a configuração no futuro.

---

## 4. Caminho Incorreto de Folha de Estilos no `.prettierrc`

- **Armadilha:** O arquivo [`.prettierrc`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/.prettierrc#L9) aponta:
  ```json
  "tailwindStylesheet": "./app/assets/css/main.css"
  ```
  Contudo, o arquivo CSS real do projeto é [`./app/assets/css/tailwind.css`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/app/assets/css/tailwind.css).
- **Impacto:** O plugin `prettier-plugin-tailwindcss` pode não carregar a árvore de tokens do Tailwind v4 (`@theme`) ao formatar classes, gerando ordenação incompleta.

---

## 5. Formato de Data da API Magazord e Timezones

- **Armadilha:** A Magazord costuma enviar timestamps sem os dois dígitos de minutos no offset de fuso horário brasileiro (ex: `"2026-10-19 14:30:00-03"` em vez de `"-03:00"`).
- **Impacto:** `new Date("2026-10-19 14:30:00-03")` resulta em `Invalid Date` no motor V8/Node.js e no Bun, gerando `NaN` ou quebrando a geração de embeds no Discord (`timestamp: Invalid Date`).
- **Como evitar:**
  - **SEMPRE** utilize a função utilitária [`parseMagazordDate(raw)`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/shared/utils/magazord.ts#L38). Ela substitui o espaço por `T`, normaliza o offset para `...-03:00` e retorna um objeto `Date` válido com fallback para a data atual.

---

## 6. Limites Estritos de Tamanho nos Embeds do Discord

- **Armadilha:** A API do Discord impõe limites rígidos para objetos Embed:
  - `embed.title`: máximo de 256 caracteres.
  - `embed.description`: máximo de 4096 caracteres.
  - `field.value`: máximo de **1024 caracteres**.
  - `footer.text`: máximo de 2048 caracteres.
- **Impacto:** Se a lista de produtos de um pedido for muito longa ou se o endereço tiver muitas instruções, o Discord rejeitará o payload com `HTTP 400 Bad Request`. No Nitro, isso é capturado e disparará um `HTTP 502 Bad Gateway`.
- **Como evitar:**
  - Passe todos os textos dinâmicos pela função [`truncate(texto, max)`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/shared/utils/magazord.ts#L27).

---

## 7. Formato Variável de Payload em Webhooks Magazord

- **Armadilha:** Dependendo de como a URL de webhook é cadastrada no painel da Magazord, o JSON pode ser enviado:
  - Diretamente na raiz: `{ id: 123, codigo: "1001", ... }`
  - Envelopado em um nó: `{ payload: { id: 123, codigo: "1001", ... } }`
- **Impacto:** Tentar ler `body.codigo` diretamente falhará com `undefined` se o webhook enviar envelopado.
- **Como evitar:**
  - Mantenha sempre o padrão defensivo já implementado:
    ```ts
    const rawBody = await readBody<MagazordPedidoPayload | { payload: MagazordPedidoPayload }>(
      event,
    )
    const pedido = rawBody && 'payload' in rawBody ? rawBody.payload : rawBody
    ```

---

## 8. Tree-Shaking no `@tanstack/vue-table` v9

- **Armadilha:** Ao contrário de versões anteriores onde a tabela carregava todas as funcionalidades, a versão 9 exige que as features sejam registradas explicitamente via `tableFeatures({ ... })`.
- **Impacto:** Se um desenvolvedor tentar usar ordenação (`getSortedRowModel()`) ou paginação sem que ela esteja registrada em [`features.ts`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/app/components/monitored-inventory/features.ts), o código apresentará erros de tipo ou falhará silenciosamente em runtime.
- **Como evitar:** Qualquer nova funcionalidade de tabela (ex: seleção múltipla, filtros por coluna) deve primeiro ser adicionada ao `features.ts`.

---

## 9. Timeout de Serverless Functions da Vercel em Crons

- **Armadilha:** No plano Hobby da Vercel, o tempo limite de execução de uma Serverless Function é de **10 segundos** (no plano Pro varia entre 60s e 300s).
- **Impacto:** O cron [`check-stock.ts`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/app/server/api/cron/check-stock.ts) itera sobre todos os monitores sequencialmente via `for of`. Cada iteração fará chamadas HTTP para a API da Magazord e, se necessário, para o Discord. Com 20+ produtos monitorados, o tempo total ultrapassará 10 segundos, resultando em cancelamento abrupto da função pela Vercel (`FUNCTION_INVOCATION_TIMEOUT`).
- **Como evitar:**
  - Agrupe requisições em lotes paralelos (`Promise.allSettled`) limitando a concorrência com `p-limit` ou similar.
  - Implemente cursor/offset para dividir a auditoria entre diferentes execuções.

---

## 10. Uso Estrito de Bun e Integridade do Lockfile

- **Armadilha:** O repositório possui [`bun.lock`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/bun.lock). Executar `npm install` ou `yarn` cria arquivos de lock concorrentes (`package-lock.json`, `yarn.lock`), dessincronizando resoluções de dependências.
- **Impacto:** Builds quebrados na Vercel ou comportamentos divergentes entre desenvolvimento local e produção.
- **Como evitar:** Execute unicamente comandos com o `bun` (`bun install`, `bun run ...`).

---

## 11. Restrição de Genérico `TData` no `@tanstack/vue-table` v9

- **Armadilha:** Na versão 9 do TanStack Table, a interface `ColumnDef` exige que o tipo de dados satisfaça a restrição `RowData` (`type RowData = any[] | Record<string, any>`). Declarar apenas `<script setup lang="ts" generic="TData">` faz com que o TypeScript considere `TData` não compatível com `RowData`.
- **Impacto:** Falha de tipagem no `vue-tsc` / `nuxt typecheck`: `error TS2344: Type 'TData' does not satisfy the constraint 'RowData'`.
- **Como evitar:** Declare o genérico restringindo a `RowData`:
  ```vue
  <script setup lang="ts" generic="TData extends import('@tanstack/vue-table').RowData">
  ```

---

## 12. Localização dos Tipos do Supabase (`database.types.ts`)

- **Armadilha:** O módulo `@nuxtjs/supabase` procura por padrão os tipos de banco gerados em `~/types/database.types.ts` (ou seja, `app/types/database.types.ts` no Nuxt 4), enquanto o ESLint ignora `shared/types/database.types.ts`.
- **Impacto:** Warning no build/typecheck: `[@nuxt/supabase] WARN Database types configured at "~/types/database.types.ts" but file not found`.
- **Como evitar:** Configure explicitamente `supabase.types` no `nuxt.config.ts` apontando para `~~/shared/types/database.types.ts` ou gere o arquivo no local padrão.
