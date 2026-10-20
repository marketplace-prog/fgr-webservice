<script setup lang="ts">
import { LandingFaq, LeadCaptureForm } from '@/components/landing'

definePageMeta({
  layout: 'no-sidebar',
})

const route = useRoute()
const requestUrl = useRequestURL()
const supportedSlug = 'redes-de-futebol'
const slug = computed(() => String(route.params.slug ?? ''))
const isEmbed = computed(() => route.query.embed === '1')
const canonicalUrl = computed(() => new URL(route.path, requestUrl.origin).toString())
const pageTitle = 'Rede para Trave de Futebol Sob Medida | FGR Sports'
const pageDescription =
  'Peça seu orçamento de par de redes para futebol. Personalize medidas, cor, fio e malha em poliéster virgem. Fabricação em até 8 dias úteis.'
const pageKeywords =
  'rede para trave de futebol, rede de futebol sob medida, par de redes para gol, rede para campo, rede society, rede de futsal, poliéster virgem'

if (slug.value !== supportedSlug) {
  throw createError({
    statusCode: 404,
    message: 'Landing page não encontrada.',
  })
}

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  robots: 'index, follow',
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogType: 'website',
  ogUrl: canonicalUrl,
  ogSiteName: 'FGR Sports',
  ogLocale: 'pt_BR',
  twitterCard: 'summary',
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
})

useHead({
  meta: [{ name: 'keywords', content: pageKeywords }],
  link: [{ rel: 'canonical', href: canonicalUrl }],
})

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+3:wght@400;500;600;700&display=swap',
    },
  ],
})

const pageRoot = useTemplateRef<HTMLElement>('pageRoot')
let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  if (!isEmbed.value || window.parent === window || !pageRoot.value) return

  const sendHeight = () => {
    window.parent.postMessage(
      { type: 'fgr-widget-resize', height: document.documentElement.scrollHeight },
      '*',
    )
  }
  resizeObserver = new ResizeObserver(sendHeight)
  resizeObserver.observe(pageRoot.value)
  sendHeight()
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <main
    ref="pageRoot"
    class="landing-page min-h-screen bg-background font-['Source_Sans_3',sans-serif] text-foreground"
    :class="{ 'is-embedded': isEmbed }"
  >
    <section
      class="mx-auto grid max-w-7xl items-center gap-10 px-5 pt-8 pb-16 sm:px-8 md:grid-cols-2 md:pt-12 md:pb-24"
    >
      <div>
        <span class="mb-5 block h-1.5 w-14 rounded-full bg-accent" aria-hidden="true"></span>
        <p class="mb-4 text-sm font-bold tracking-[0.2em] text-primary uppercase">
          Equipamentos esportivos FGR Sports
        </p>
        <p class="mb-4 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
          Rede sob medida para sua trave
        </p>
        <h1
          class="max-w-xl text-5xl leading-[0.98] font-black tracking-tight sm:text-6xl lg:text-7xl"
        >
          O par de redes certo para o seu campo.
        </h1>
        <p class="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
          Escolha a cor, a espessura do fio, a malha e informe as medidas da sua trave. Nossa equipe
          prepara um orçamento personalizado para você.
        </p>
        <a
          href="#orcamento"
          class="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-7 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Solicitar orçamento
        </a>
        <p class="mt-4 text-sm text-muted-foreground">
          Poliéster seda virgem importado · Fabricação em até 8 dias úteis
        </p>
      </div>

      <div
        class="flex aspect-[4/3] min-h-64 items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted p-8 text-center"
        role="img"
        aria-label="Espaço reservado para foto de uma trave de futebol com rede"
      >
        <div>
          <span
            class="mb-3 block text-sm font-bold tracking-[0.15em] text-muted-foreground uppercase"
          >
            Placeholder para foto
          </span>
          <p class="text-sm text-muted-foreground">Campo de futebol com trave e rede instalada</p>
        </div>
      </div>
    </section>

    <section class="border-y border-border bg-card">
      <div class="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:grid-cols-3 sm:px-8">
        <p class="font-semibold">Fio em poliéster seda virgem importado</p>
        <p class="font-semibold">Cores, espessuras e malhas à sua escolha</p>
        <p class="font-semibold">Medidas personalizáveis</p>
      </div>
    </section>

    <section id="orcamento" class="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <div v-if="isEmbed" class="mb-8">
        <h1 class="mt-2 text-4xl leading-tight font-black">Peça seu orçamento</h1>
        <p class="mt-3 text-muted-foreground">Configure a rede para as medidas da sua trave.</p>
      </div>
      <div v-else class="mb-8">
        <p class="text-sm font-semibold tracking-[0.18em] text-primary uppercase">Seu projeto</p>
        <h2 class="mt-2 text-3xl font-black sm:text-4xl">Conte para nós o que você precisa</h2>
        <p class="mt-3 text-muted-foreground">
          Preencha as especificações e seus dados. Depois de salvarmos seu pedido, você segue para o
          WhatsApp para conversar com nossa equipe.
        </p>
      </div>

      <div class="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <LeadCaptureForm :landing-slug="slug" :is-embed="isEmbed" />
      </div>
    </section>

    <section class="mx-auto max-w-4xl px-5 pb-14 sm:px-8 sm:pb-20">
      <LandingFaq />
    </section>
  </main>
</template>

<style scoped>
.landing-page {
  --primary: var(--fgr-blue);
  --primary-foreground: oklch(0.99 0 0);
  --accent: var(--fgr-orange);
  --accent-foreground: oklch(0.15 0 0);
  --ring: var(--fgr-blue);
  --font-sans: 'Source Sans 3', sans-serif;
}

.landing-page h1,
.landing-page h2 {
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 0.015em;
}

.landing-page.is-embedded {
  min-height: 0;
}

@media (prefers-reduced-motion: reduce) {
  .landing-page *,
  .landing-page *::before,
  .landing-page *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
