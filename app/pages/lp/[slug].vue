<script setup lang="ts">
import { Pause, Play } from '@lucide/vue'
import { LandingFaq, LeadCaptureForm } from '@/components/landing'

definePageMeta({
  layout: 'no-sidebar',
})

const gallerySlides = [
  {
    src: 'https://fgrsports.cdn.magazord.com.br/img/2022/10/produto/6337/01-modelo-trave-futebol-normal.jpg',
    alt: 'Trave de futebol padrão com rede instalada',
  },
  {
    src: 'https://fgrsports.cdn.magazord.com.br/img/2023/05/produto/7473/rede-de-protecao-esportiva-e-cobertura-fio-4-0mm-poliester-virgem-futebol.jpg',
    alt: 'Rede de proteção esportiva e cobertura em poliéster para futebol',
  },
  {
    src: 'https://fgrsports.cdn.magazord.com.br/img/2026/07/produto/14463/rede-para-trave-futebol-campo-padrao-europeu-tipo-caixote-macro.jpg',
    alt: 'Detalhe da malha da rede para trave de campo padrão europeu tipo caixote',
  },
  {
    src: 'https://fgrsports.cdn.magazord.com.br/img/2026/07/produto/14464/rede-para-trave-futebol-campo-padrao-europeu-tipo-caixote-principal.jpg',
    alt: 'Vista principal da rede para trave de campo padrão europeu tipo caixote',
  },
] as const
const activeSlide = ref(0)
const currentSlide = computed(() => gallerySlides[activeSlide.value] ?? gallerySlides[0])
const isHovered = ref(false)
const hasFocus = ref(false)
const isPausedByUser = ref(false)
const prefersReducedMotion = ref(false)
const isSlideshowPaused = computed(
  () => isHovered.value || hasFocus.value || isPausedByUser.value || prefersReducedMotion.value,
)
let reducedMotionQuery: MediaQueryList | undefined

function showNextSlide() {
  activeSlide.value = (activeSlide.value + 1) % gallerySlides.length
}

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
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = reducedMotionQuery.matches
  reducedMotionQuery.addEventListener('change', onReducedMotionChange)

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

function onReducedMotionChange(event: MediaQueryListEvent) {
  prefersReducedMotion.value = event.matches
}

function onCarouselFocusout(event: FocusEvent) {
  const carousel = event.currentTarget
  hasFocus.value =
    carousel instanceof HTMLElement &&
    event.relatedTarget instanceof Node &&
    carousel.contains(event.relatedTarget)
}

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  reducedMotionQuery?.removeEventListener('change', onReducedMotionChange)
})
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
        class="relative isolate aspect-[4/3] min-h-64 overflow-hidden rounded-3xl border border-border bg-card shadow-lg"
        role="region"
        aria-label="Fotos de redes e traves de futebol"
        aria-roledescription="carrossel"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
        @focusin="hasFocus = true"
        @focusout="onCarouselFocusout"
      >
        <Transition name="gallery-fade" mode="out-in">
          <div
            :key="activeSlide"
            class="absolute inset-0"
            role="group"
            aria-roledescription="slide"
            aria-live="polite"
            :aria-label="`Imagem ${activeSlide + 1} de ${gallerySlides.length}: ${currentSlide.alt}`"
          >
            <img
              :src="currentSlide.src"
              :alt="currentSlide.alt"
              class="size-full object-cover"
              width="1200"
              height="900"
              :fetchpriority="activeSlide === 0 ? 'high' : 'auto'"
            />
          </div>
        </Transition>

        <div
          class="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/65 to-transparent px-4 pt-8 pb-3"
        >
          <button
            type="button"
            class="grid size-11 shrink-0 place-items-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
            :aria-label="
              isPausedByUser ? 'Retomar apresentação automática' : 'Pausar apresentação automática'
            "
            :aria-pressed="isPausedByUser"
            @click="isPausedByUser = !isPausedByUser"
          >
            <Play v-if="isPausedByUser" aria-hidden="true" />
            <Pause v-else aria-hidden="true" />
          </button>
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/40" aria-hidden="true">
            <div
              :key="activeSlide"
              class="gallery-progress h-full rounded-full bg-white"
              :class="{ 'is-paused': isSlideshowPaused }"
              @animationend="showNextSlide"
            ></div>
          </div>
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

.gallery-fade-enter-active,
.gallery-fade-leave-active {
  transition: opacity 400ms ease;
}

.gallery-fade-enter-from,
.gallery-fade-leave-to {
  opacity: 0;
}

.gallery-progress {
  animation: gallery-progress-fill 5s linear forwards;
}

.gallery-progress.is-paused {
  animation-play-state: paused;
}

@keyframes gallery-progress-fill {
  from {
    width: 0;
  }

  to {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-page *,
  .landing-page *::before,
  .landing-page *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }

  .gallery-progress {
    animation: none;
  }
}
</style>
