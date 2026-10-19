# Integrações, Webhooks e Tarefas Agendadas (Crons)

> Este é o documento operacional mais crítico do `fgr-webservice`. Ele especifica detalhadamente os contratos de entrada, processamento, efeitos colaterais e modos de teste de cada integração.

---

## 1. Tabela Resumo das Integrações

| Nome / Recurso                   | Rota / Arquivo                     | Método | Chamador                       | Autenticação                               | Efeito Colateral                                |
| :------------------------------- | :--------------------------------- | :----- | :----------------------------- | :----------------------------------------- | :---------------------------------------------- |
| **Novo Pedido Magazord**         | `/api/webhook/pedido-registrado`   | `POST` | Magazord Webhook Engine        | Aberta _(TODO: confirmar segredo)_         | Embed Discord (`DISCORD_WEBHOOK_NOVOS_PEDIDOS`) |
| **Atualização de Pedido**        | `/api/webhook/pedido-alterado`     | `POST` | Magazord Webhook Engine        | Aberta _(TODO: confirmar segredo)_         | Embed Discord (`DISCORD_WEBHOOK_ATUALIZACOES`)  |
| **Checagem de Estoque**          | `/api/cron/check-stock`            | `GET`  | Vercel Cron (`0 * * * *`)      | Bearer Token _(TODO: validar CRON_SECRET)_ | Alerta Discord do monitor cadastrado            |
| **Health Check**                 | `/api/health`                      | `GET`  | Monitoramento externo / Uptime | Nenhuma (Pública)                          | Retorna `{ status: 'ok', time }`                |
| **Rastreio de Frete Storefront** | `public/track-shipping-request.js` | N/A    | Script no browser do cliente   | Nenhuma                                    | Evento `calculate_shipping` no GA4 dataLayer    |

---

## 2. Webhook: Pedido Registrado (Magazord ➔ Discord)

- **Arquivo fonte:** [`server/api/webhook/pedido-registrado.post.ts`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/server/api/webhook/pedido-registrado.post.ts)
- **Endpoint:** `POST /api/webhook/pedido-registrado`
- **Origem da chamada:** Disparado pelos servidores da Magazord quando uma nova venda é concluída na loja ou marketplace.
- **Autenticação:** Atualmente não há validação de token ou assinatura HMAC no endpoint.
  > _TODO: confirmar com o time se a Magazord oferece headers de autorização ou token secreto para proteção contra chamadas não autorizadas._

### Payload Esperado

O endpoint aceita o payload enviado diretamente na raiz do JSON ou envelopado sob a propriedade `payload`:

```ts
MagazordPedidoPayload | { payload: MagazordPedidoPayload }
```

**Campos principais processados:**

- `codigo`: Código público do pedido (ex: `"11997"`).
- `dataHora`: Data e hora da compra (formato Magazord normalizado por `parseMagazordDate`).
- `pedidoSituacao`: ID numérico do status do pedido (mapeado para cor do Discord por `getStatusColor`).
- `pedidoSituacaoDescricao`: Descrição legível do status.
- `pessoaNome`: Nome do cliente (processado por `getFirstName` para privacidade).
- `bairro`, `cidadeNome`, `estadoSigla`: Destino simplificado.
- `formaPagamentoNome`, `condicaoPagamentoNome`, `condicaoPagamentoParcelas`: Dados do checkout.
- `valorProduto`, `valorFrete`, `valorDesconto`, `valorTotal`, `valorTotalFinal`: Totais monetários formatados por `formatCurrency`.
- `marketplaceNome`, `lojaMarketplaceNome`, `lojaNome`: Identificação do canal de venda.
- `arrayPedidoRastreio[0]`:
  - `valorFreteTransportadora`: Custo real cobrado pela transportadora.
  - `pedidoItem[]`: Lista de produtos (`quantidade`, `produtoNome`, `descricao`, `valorItem`).

### Lógica de Inteligência de Negócio (`generateInsights`)

O sistema analisa os dados financeiros e operacionais do pedido e monta um bloco analítico no Discord:

1. **Subsídio de Frete:** Alerta se a loja absorveu o frete (`valorFrete = 0` e `valorFreteTransportadora > 0`).
2. **Frete Deficitário:** Alerta se o valor pago pelo cliente for inferior ao custo real da etiqueta da transportadora.
3. **Desconto Agressivo:** Emite alerta se o desconto for superior a **15%** do valor dos produtos.
4. **Cupom de Desconto:** Registra qual cupom garantiu a conversão.
5. **Volume de Carrinho:** Identifica pedidos de apenas 1 item (oportunidade de cross-sell) ou cestas robustas ($\ge 4$ itens).
6. **Risco Financeiro / Liquidez:** Destaca vendas via PIX (liquidez imediata) ou compras em $\ge 6\times$ (atenção a custos de antecipação).

### Efeitos Colaterais & Notificação no Discord

- Despacha um embed HTTP POST via `$fetch` para a URL configurada em `DISCORD_WEBHOOK_NOVOS_PEDIDOS`.
- Campos formatados e protegidos com `truncate()` para respeitar o limite estrito de 1024 caracteres da API do Discord.

### Respostas HTTP e Tratamento de Erro

- `200 OK`: `{ success: true, message: 'Webhook do pedido #... encaminhado com sucesso.' }`
- `400 Bad Request`: Payload ausente ou sem o campo `codigo`.
- `500 Internal Server Error`: Variável `DISCORD_WEBHOOK_NOVOS_PEDIDOS` não configurada no `runtimeConfig`.
- `502 Bad Gateway`: Erro ao contatar a API do Discord.

### Teste Local via cURL

```bash
curl -X POST http://localhost:3000/api/webhook/pedido-registrado \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "TEST-1001",
    "dataHora": "2026-10-19 09:00:00-03",
    "pedidoSituacao": 4,
    "pedidoSituacaoDescricao": "Aprovado",
    "pessoaNome": "Alessandro Silva",
    "bairro": "Centro",
    "cidadeNome": "São Paulo",
    "estadoSigla": "SP",
    "formaPagamentoNome": "PIX",
    "condicaoPagamentoParcelas": 1,
    "valorProduto": "250.00",
    "valorFrete": "0.00",
    "valorDesconto": "0.00",
    "valorTotal": "250.00",
    "arrayPedidoRastreio": [
      {
        "valorFreteTransportadora": "22.50",
        "pedidoItem": [
          { "quantidade": 1, "produtoNome": "Camisa Oficial FGR", "valorItem": "250.00" }
        ]
      }
    ]
  }'
```

---

## 3. Webhook: Pedido Alterado / Status (Magazord ➔ Discord)

- **Arquivo fonte:** [`server/api/webhook/pedido-alterado.post.ts`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/server/api/webhook/pedido-alterado.post.ts)
- **Endpoint:** `POST /api/webhook/pedido-alterado`
- **Origem da chamada:** Disparado pela Magazord sempre que a situação de um pedido avança ou muda (ex: aprovado, faturado, em transporte, entregue, cancelado).
- **Autenticação:** Aberta _(TODO: confirmar com o time)_.
- **Efeito colateral:** Dispara embed no canal de atualizações do Discord (`DISCORD_WEBHOOK_ATUALIZACOES`).

### Campos Processados

- `codigo`: Código do pedido.
- `pedidoSituacaoDescricao` / `pedidoSituacaoDescricaoDetalhada`: Novo status.
- `pessoaNome`: Primeiro nome do comprador.
- `arrayPedidoRastreio[0]`: Extrai `codigoRastreio`, link de acompanhamento e nome da transportadora. Se houver link, formata como Markdown clicável.
- `valorTotalFinal` ou `valorTotal`: Valor final da transação.

### Teste Local via cURL

```bash
curl -X POST http://localhost:3000/api/webhook/pedido-alterado \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "TEST-1001",
    "dataHora": "2026-10-19 10:15:00-03",
    "pedidoSituacao": 7,
    "pedidoSituacaoDescricao": "Transporte",
    "pedidoSituacaoDescricaoDetalhada": "Mercadoria despachada na transportadora",
    "pessoaNome": "Alessandro Silva",
    "valorTotal": "250.00",
    "arrayPedidoRastreio": [
      {
        "codigoRastreio": "QB123456789BR",
        "link": "https://rastreamento.correios.com.br",
        "transportadoraNome": "Correios Sedex"
      }
    ]
  }'
```

---

## 4. Cron Job: Verificação de Estoque Mínimo (`check-stock`)

- **Arquivo fonte atual:** [`app/server/api/cron/check-stock.ts`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/app/server/api/cron/check-stock.ts)
- **Rota configurada no Vercel:** `/api/cron/check-stock`
  > [!WARNING]
  > **Divergência de Caminho:** No Nuxt 4, as rotas do Nitro residem em `server/api/`. O arquivo atual foi criado em `app/server/api/cron/check-stock.ts`. Para ser resolvido em `/api/cron/check-stock` pela Vercel, o arquivo deve residir na raiz em `server/api/cron/check-stock.ts`. Consulte [docs/PITFALLS.md](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/docs/PITFALLS.md).
- **Agendamento:** `0 * * * *` (a cada 1 hora, no minuto zero) definido em [vercel.json](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/vercel.json).
- **Chamador:** Vercel Cron Scheduler via requisição HTTP `GET`.
- **Autenticação:** A Vercel envia o cabeçalho `Authorization: Bearer <CRON_SECRET>`.
  > _TODO: confirmar com o time a adição da validação do header `CRON_SECRET` para impedir que terceiros invoquem o endpoint manualmente._

### Fluxo de Execução

1. **Acesso ao Banco via Supabase:**
   - Instancia o cliente com `serverSupabaseServiceRole(event)`.
   - Lê todos os monitores ativos na tabela `stock_monitors`:
     ```ts
     const { data: monitors } = await supabase
       .from('stock_monitors')
       .select('*')
       .eq('is_active', true)
     ```
2. **Consulta de Estoque Real no Magazord:**
   - Para cada monitor, invoca `fetchMagazordStock(monitor.sku)`.
   - _Status atual no código:_ Função mock retornando valor estático `5` _(TODO: integrar com endpoint de estoque oficial da API Magazord)_.
3. **Avaliação da Condição e Alerta:**
   - Se `currentStock !== null && currentStock <= monitor.min_quantity`, dispara `sendDiscordAlert()`.
   - Notifica via POST com embed vermelho para a URL de webhook específica cadastrada no monitor (`monitor.discord_webhook_url`).

### Timeout e Limites da Vercel

- Planos Hobby da Vercel possuem limite estrito de **10 segundos** de execução para Serverless Functions (planos Pro possuem 60s a 300s).
- **Risco:** O código atual itera os monitores com um loop sequencial `for (const monitor of monitors)`. Se o número de SKUs cadastrados crescer, a soma dos tempos de chamada HTTP à API Magazord estourará o timeout da Vercel.
- **Recomendação futura:** Processamento em lotes com `Promise.allSettled` ou paginação via query param `?cursor=...`.

---

## 5. Rastreamento de Frete no E-commerce (Storefront)

- **Arquivo fonte:** [`public/track-shipping-request.js`](file:///c:/Users/marke/OneDrive/Desktop/ale/fgr-webservice/public/track-shipping-request.js)
- **Local de execução:** No navegador do cliente final, dentro da vitrine/carrinho da loja virtual Magazord.
- **Funcionamento:**
  1. Sobrescreve `window.fetch` e `XMLHttpRequest.prototype.open / send`.
  2. Monitora chamadas cuja URL contenha `checkout/cart?operation=calculaFreteProduto`.
  3. Ao interceptar o cálculo de frete, analisa todas as agências e serviços retornados para descobrir a opção de frete de menor custo.
  4. Extrai os dados do produto ativo inspecionando o `window.dataLayer` (evento `view_item` nativo).
  5. Realiza o push para o `dataLayer` do Google Analytics 4 com o evento estruturado `calculate_shipping`:
     ```js
     window.dataLayer.push({
       'event': 'calculate_shipping',
       'shipping_cost': menorValor,
       'currency': 'BRL',
       'postal_code': cepFinal,
       'sku': skuProduto,
       'product_name': nomeProduto,
       'product_category': categoriaProduto,
       'product_price': precoProduto,
       'carrier': transportadora,
       'delivery_days': prazoDias
     });
     ```
