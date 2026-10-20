<script setup lang="ts">
const questions = [
  {
    question: 'Qual é o tamanho oficial do gol para cada modalidade de futebol?',
    answer: [
      {
        label: 'Futebol de campo',
        text: '7,40 m de largura por 2,40 m de altura.',
      },
      {
        label: 'Futebol society / suíço (Futebol 7)',
        text: 'As traves costumam ter 4,00 m ou 5,00 m de largura por 2,20 m de altura. Confirme as medidas do seu campo antes de solicitar.',
      },
      {
        label: 'Futsal / futebol de salão',
        text: '3,00 m de largura por 2,00 m de altura.',
      },
    ],
  },
  {
    question: 'O que é o formato caixote nas redes esportivas?',
    answer: [
      {
        text: 'É uma rede com recuos superiores e inferiores para envolver a parte de trás da trave. Em redes de campo, uma configuração comum é recuo superior de 80 cm e inferior de 2,00 m. Como as medidas são personalizáveis, informe os recuos da sua estrutura para confirmarmos o encaixe.',
      },
    ],
  },
  {
    question: 'Qual é a malha ideal para cada modalidade?',
    answer: [
      {
        label: 'Futebol de campo',
        text: 'A malha 16 × 16 cm é uma opção comum para retenção da bola.',
      },
      {
        label: 'Society / suíço',
        text: 'A malha 15 × 15 cm oferece o esquadro simétrico ideal para suportar a bola de futebol society / suíço.',
      },
      {
        label: 'Futsal',
        text: 'A malha 13 × 13 cm é uma opção indicada para a bola da modalidade.',
      },
      {
        text: 'A seleção do formulário inclui malhas 10 × 10, 12 × 12, 13 × 13, 15 × 15 e 16 × 16 cm. Para outras medidas, descreva sua necessidade no atendimento pelo WhatsApp.',
      },
    ],
  },
  {
    question: 'Qual é a diferença entre fio de 3 mm e de 4 mm?',
    answer: [
      {
        label: 'Fio 3 mm',
        text: 'Oferece uma combinação equilibrada entre resistência e custo-benefício, indicada para treinos e projetos com uso regular.',
      },
      {
        label: 'Fio 4 mm',
        text: 'É mais espesso e reforçado, recomendado para locais com uso intenso, como arenas, clubes e condomínios.',
      },
      {
        text: 'A FGR também trabalha com fio de 6 mm. A escolha deve considerar o uso, a estrutura e as medidas do local.',
      },
    ],
  },
  {
    question: 'O poliéster resiste à chuva e ao sol?',
    answer: [
      {
        text: 'As redes são confeccionadas em fio de seda de poliéster virgem importado. As fichas dos produtos informam proteção UV e resistência à umidade; a durabilidade depende também da instalação, exposição e conservação da rede.',
      },
    ],
  },
  {
    question: 'As redes são industrializadas ou feitas à mão?',
    answer: [
      {
        text: 'Os modelos descritos no catálogo têm confecção manual por rendeiras. A montagem nó a nó ajuda a manter o alinhamento das malhas e a firmeza das amarrações.',
      },
    ],
  },
  {
    question: 'Os produtos têm garantia e acompanham nota fiscal?',
    answer: [
      {
        text: 'Os produtos acompanham Nota Fiscal eletrônica. A garantia informada para os modelos catalogados é de 90 dias contra defeitos de fabricação; confirme as condições aplicáveis ao seu orçamento.',
      },
    ],
  },
  {
    question: 'Qual é o prazo de fabricação e envio?',
    answer: [
      {
        text: 'O prazo de fabricação pode chegar a 8 dias úteis, conforme o modelo e a personalização. O prazo de transporte é informado à parte e começa após a finalização da fabricação e a postagem.',
      },
    ],
  },
]
</script>

<template>
  <section aria-labelledby="landing-faq-heading" class="space-y-6">
    <div>
      <p class="text-sm font-semibold tracking-[0.18em] text-primary uppercase">
        Dúvidas frequentes
      </p>
      <h2 id="landing-faq-heading" class="mt-2 text-3xl font-black sm:text-4xl">
        Tudo sobre sua rede para trave
      </h2>
    </div>

    <div class="divide-y divide-border border-y border-border">
      <details v-for="(item, index) in questions" :key="item.question" class="group py-1">
        <summary
          class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden"
        >
          <span>{{ index + 1 }}. {{ item.question }}</span>
          <span
            class="text-xl text-primary transition-transform group-open:rotate-45"
            aria-hidden="true"
          >
            +
          </span>
        </summary>
        <div class="space-y-3 pr-8 pb-5 leading-7 text-muted-foreground">
          <p v-for="(paragraph, paragraphIndex) in item.answer" :key="paragraphIndex">
            <strong v-if="paragraph.label" class="text-foreground">{{ paragraph.label }}: </strong>
            {{ paragraph.text }}
          </p>
        </div>
      </details>
    </div>
  </section>
</template>
