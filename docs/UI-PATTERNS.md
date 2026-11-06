# Padrões de interface

Este documento registra interações reutilizáveis da interface administrativa. Ao introduzir
comportamentos equivalentes em outra tela, reutilize as primitivas existentes e mantenha o padrão.

## Identidade visual FGR Sports

- O produto atende ao nicho de esporte e equipamentos esportivos.
- Use o azul FGR `#035096` como cor primária e o laranja `#fe3e00` como destaque, através dos tokens `primary` e `accent` definidos em `app/assets/css/tailwind.css`.
- Nas páginas públicas, use a assinatura horizontal oficial da marca hospedada na CDN Magazord; não substitua por texto estilizado.
- Os componentes de landing são exportados por `app/components/landing/index.ts`, com export default da coleção e exports nomeados para imports seletivos.
- Landing pages destinadas à incorporação como Web Component não renderizam cabeçalho nem rodapé; navegação e identidade global pertencem ao site hospedeiro. Dúvidas podem ser organizadas em elementos `<details>` acessíveis pelo teclado.
- A galeria de imagens da landing de redes para trave alterna imagens automaticamente com transição em fade e barra de progresso. Pause a troca ao receber foco ou ponteiro, respeite a preferência por movimento reduzido e mantenha um controle acessível para pausar/retomar.

## Navegação em landing pages incorporadas

Todas as landing pages públicas são exibidas no site hospedeiro dentro do iframe de um Web
Component. Portanto, links e CTAs que apontam para seções da própria landing não podem depender
apenas da navegação por fragmento (`href="#..."`) ou de `scrollIntoView()` no documento interno:
isso rola somente o iframe, não a página hospedeira.

- Mantenha um `href` semântico para acessibilidade e como comportamento padrão fora do iframe.
- Quando a página estiver incorporada, impeça a navegação local do CTA e envie ao pai uma mensagem
  com o identificador do evento e a posição vertical do destino no documento do iframe.
- No Web Component, aceite o pedido somente quando `event.source` for o `contentWindow` do iframe
  incorporado e `event.origin` corresponder à origem configurada. Valide o tipo e os limites dos
  dados antes de chamar `window.scrollTo()` na página hospedeira.
- Respeite `prefers-reduced-motion` na rolagem. Cliques com modificadores devem manter o
  comportamento nativo do link.
- Adicione testes para o cálculo/limites da rolagem e preserve o comportamento da página quando
  acessada diretamente, fora do iframe.

## Testes de features

- Toda feature nova ou alteração de comportamento deve incluir testes automatizados para o
  comportamento esperado e para regressões relevantes.
- Teste lógica isolada unitariamente e fluxos entre componentes/serviços por testes de integração.
- Mantenha os testes próximos ao código correspondente, com o sufixo `.test.ts`, e execute
  `bun run test` antes de concluir a alteração.

## Tabelas TanStack

Use `@tanstack/vue-table` e os componentes de tabela existentes. Registre explicitamente em
`features.ts` cada feature utilizada para preservar o tree-shaking.

### Escolha de colunas visíveis

- Disponibilize um menu "Colunas" junto à tabela usando `DropdownMenuCheckboxItem`.
- Liste apenas colunas com `getCanHide()` e vincule `model-value` a `getIsVisible()` e
  `update:model-value` a `toggleVisibility()`. O componente Reka UI usa `modelValue`, não `checked`.
- Marque colunas essenciais ou de ações com `enableHiding: false`.
- Use `getVisibleLeafColumns().length` para o `colspan` de estados vazios.
- Mantenha a ordenação nos cabeçalhos interativos e indique a direção atual com ícones e
  `aria-sort`.

### Copiar identificadores

- Exiba SKUs e identificadores copiáveis em um botão acessível, não em um elemento não interativo.
- Copie o valor exato usando `navigator.clipboard.writeText()` apenas após a ação do usuário.
- Dê feedback explícito via toast em sucesso e falha; registre o erro de cópia para diagnóstico.

### Ações de linha

- Agrupe as ações de cada linha em um `DropdownMenu` para reduzir ruído visual na tabela.
- Use um gatilho de ícone com nome acessível e mantenha os itens dentro de `DropdownMenuGroup`.
- Preserve regras de habilitação das ações e use a variante `destructive` para exclusões.

### Paginação e carregamento progressivo

- Toda lista tabular deve oferecer paginação com controles acessíveis para avançar e voltar.
- Permita escolher o tamanho da página; ao trocar a quantidade, volte à primeira página.
- Quando fizer sentido para a lista, ofereça também o modo opcional de carregamento progressivo ao
  rolar. Revele os registros em lotes do tamanho escolhido, preserve busca e ordenação e mantenha
  uma ação explícita de “Carregar mais” como alternativa ao observador de rolagem.
- Informe quantos registros estão visíveis e o total correspondente ao filtro atual.
