<script setup lang="ts">
import {
  landingPageLeadSchema,
  type LandingPageLeadInput,
} from '~~/shared/schemas/landing-page-lead.schema'
import { makeLandingLeadWhatsAppMessage } from '~~/shared/utils/landing-page-whatsapp'
import { formatBrazilianPhone } from '~~/shared/utils/phone'

const props = defineProps<{
  landingSlug: string
  isEmbed?: boolean
}>()

const route = useRoute()
const isSubmitting = ref(false)
const formError = ref('')
const fieldErrors = ref<Record<string, string>>({})

const form = reactive({
  name: '',
  email: '',
  phone: '',
  threadColor: '',
  threadThicknessMm: '',
  meshSizeCm: '',
  lengthCm: '',
  heightCm: '',
  upperRecessCm: '',
  lowerRecessCm: '',
  consent: false,
  website: '',
})

const colors = [
  { label: 'Preta', value: 'preta' },
  { label: 'Branca', value: 'branca' },
  { label: 'Azul', value: 'azul' },
  { label: 'Verde', value: 'verde' },
]
const thicknesses = [3, 4, 6]
const meshes = [10, 12, 13, 15, 16]
const measurements = [
  { id: 'lengthCm', label: 'Comprimento', hint: 'Largura da trave de um lado ao outro' },
  { id: 'heightCm', label: 'Altura', hint: 'Do chão até a parte superior da trave' },
  { id: 'upperRecessCm', label: 'Recuo superior', hint: 'Profundidade da parte superior' },
  { id: 'lowerRecessCm', label: 'Recuo inferior', hint: 'Profundidade da parte inferior' },
] as const

function updatePhone(event: Event) {
  const input = event.target as HTMLInputElement
  form.phone = formatBrazilianPhone(input.value)
}

function getError(name: string) {
  return fieldErrors.value[name]
}

function collectTracking() {
  const query = route.query
  const getValue = (key: string) => {
    const value = query[key]
    return typeof value === 'string' ? value.slice(0, 200) : ''
  }
  let referrer = ''

  if (document.referrer) {
    try {
      referrer = new URL(document.referrer).origin
    } catch {
      referrer = ''
    }
  }

  return {
    utmSource: getValue('utm_source'),
    utmMedium: getValue('utm_medium'),
    utmCampaign: getValue('utm_campaign'),
    utmTerm: getValue('utm_term'),
    utmContent: getValue('utm_content'),
    referrer,
  }
}

function buildLeadPayload(): unknown {
  return {
    landingSlug: props.landingSlug,
    name: form.name,
    email: form.email,
    phone: form.phone,
    threadColor: form.threadColor,
    threadThicknessMm: Number(form.threadThicknessMm),
    meshSizeCm: Number(form.meshSizeCm),
    lengthCm: form.lengthCm,
    heightCm: form.heightCm,
    upperRecessCm: form.upperRecessCm,
    lowerRecessCm: form.lowerRecessCm,
    consent: form.consent,
    website: form.website,
    ...collectTracking(),
  }
}

function formatFieldErrors(error: ReturnType<typeof landingPageLeadSchema.safeParse>) {
  if (error.success) return {}
  const errors: Record<string, string> = {}

  for (const issue of error.error.issues) {
    const field = String(issue.path[0] ?? 'form')
    errors[field] ??= issue.message
  }

  return errors
}

function makeWhatsAppUrl(lead: LandingPageLeadInput) {
  const message = makeLandingLeadWhatsAppMessage(lead)
  return `https://wa.me/554792154477?text=${encodeURIComponent(message)}`
}

async function submitLead() {
  formError.value = ''
  fieldErrors.value = {}
  const parsed = landingPageLeadSchema.safeParse(buildLeadPayload())

  if (!parsed.success) {
    fieldErrors.value = formatFieldErrors(parsed)
    formError.value = 'Confira os campos destacados antes de continuar.'
    document.querySelector('[aria-invalid="true"]')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center',
    })
    return
  }

  isSubmitting.value = true

  try {
    await $fetch('/api/public/landing-leads', {
      method: 'POST',
      body: parsed.data,
    })
    const whatsappUrl = makeWhatsAppUrl(parsed.data)

    if (props.isEmbed && window.parent !== window) {
      window.parent.postMessage({ type: 'fgr-lead-submitted', whatsappUrl }, '*')
    } else {
      await navigateTo(whatsappUrl, { external: true })
    }
  } catch (error) {
    console.error('[Landing page] Falha ao enviar o pedido de orçamento:', error)
    formError.value =
      'Não foi possível salvar seu pedido. Seus dados não foram enviados ao WhatsApp; tente novamente.'
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => [
    form.name,
    form.email,
    form.phone,
    form.threadColor,
    form.threadThicknessMm,
    form.meshSizeCm,
    form.lengthCm,
    form.heightCm,
    form.upperRecessCm,
    form.lowerRecessCm,
    form.consent,
  ],
  () => {
    if (formError.value) formError.value = ''
  },
)
</script>

<template>
  <form class="flex flex-col gap-8" novalidate @submit.prevent="submitLead">
    <div class="absolute -left-[9999px]" aria-hidden="true">
      <label for="website">Website</label>
      <input id="website" v-model="form.website" tabindex="-1" autocomplete="off" />
    </div>

    <section aria-labelledby="specifications-heading" class="space-y-5">
      <div>
        <p class="text-sm font-semibold tracking-[0.18em] text-primary uppercase">
          01 / Preferências
        </p>
        <h2 id="specifications-heading" class="mt-2 text-2xl font-bold">
          Como você quer sua rede?
        </h2>
      </div>

      <div class="grid gap-5 sm:grid-cols-3">
        <div class="space-y-2">
          <label for="thread-color" class="text-sm font-semibold">Cor do fio</label>
          <select
            id="thread-color"
            v-model="form.threadColor"
            class="h-12 w-full rounded-lg border border-input bg-background px-3"
            :aria-invalid="!!getError('threadColor')"
            required
          >
            <option disabled value="">Selecione uma cor</option>
            <option v-for="color in colors" :key="color.value" :value="color.value">
              {{ color.label }}
            </option>
          </select>
          <p v-if="getError('threadColor')" class="text-sm text-destructive" role="alert">
            {{ getError('threadColor') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="thread-thickness" class="text-sm font-semibold">Espessura do fio</label>
          <select
            id="thread-thickness"
            v-model="form.threadThicknessMm"
            class="h-12 w-full rounded-lg border border-input bg-background px-3"
            :aria-invalid="!!getError('threadThicknessMm')"
            required
          >
            <option disabled value="">Selecione</option>
            <option v-for="thickness in thicknesses" :key="thickness" :value="String(thickness)">
              {{ thickness }} mm
            </option>
          </select>
          <p v-if="getError('threadThicknessMm')" class="text-sm text-destructive" role="alert">
            {{ getError('threadThicknessMm') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="mesh-size" class="text-sm font-semibold">Tamanho da malha</label>
          <select
            id="mesh-size"
            v-model="form.meshSizeCm"
            class="h-12 w-full rounded-lg border border-input bg-background px-3"
            :aria-invalid="!!getError('meshSizeCm')"
            required
          >
            <option disabled value="">Selecione</option>
            <option v-for="mesh in meshes" :key="mesh" :value="String(mesh)">
              {{ mesh }} × {{ mesh }} cm
            </option>
          </select>
          <p v-if="getError('meshSizeCm')" class="text-sm text-destructive" role="alert">
            {{ getError('meshSizeCm') }}
          </p>
        </div>
      </div>

      <p class="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
        Fio em poliéster seda virgem importado. As medidas são personalizáveis.
      </p>
    </section>

    <section aria-labelledby="measurements-heading" class="space-y-5">
      <div>
        <p class="text-sm font-semibold tracking-[0.18em] text-primary uppercase">02 / Medidas</p>
        <h2 id="measurements-heading" class="mt-2 text-2xl font-bold">
          Informe as medidas da trave
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Preencha em centímetros. Você pode usar casas decimais.
        </p>
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <div v-for="measurement in measurements" :key="measurement.id" class="space-y-2">
          <label :for="measurement.id" class="text-sm font-semibold"
            >{{ measurement.label }} (cm)</label
          >
          <input
            :id="measurement.id"
            v-model="form[measurement.id]"
            type="number"
            inputmode="decimal"
            min="0.01"
            max="100000"
            step="0.01"
            placeholder="Ex.: 740"
            class="h-12 w-full rounded-lg border border-input bg-background px-3"
            :aria-invalid="!!getError(measurement.id)"
            required
          />
          <p class="text-xs text-muted-foreground">{{ measurement.hint }}</p>
          <p v-if="getError(measurement.id)" class="text-sm text-destructive" role="alert">
            {{ getError(measurement.id) }}
          </p>
        </div>
      </div>
    </section>

    <section aria-labelledby="contact-heading" class="space-y-5">
      <div>
        <p class="text-sm font-semibold tracking-[0.18em] text-primary uppercase">03 / Contato</p>
        <h2 id="contact-heading" class="mt-2 text-2xl font-bold">
          Para onde enviamos seu orçamento?
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Informe pelo menos um contato: e-mail ou telefone.
        </p>
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <div class="space-y-2 sm:col-span-2">
          <label for="lead-name" class="text-sm font-semibold">Nome</label>
          <input
            id="lead-name"
            v-model="form.name"
            type="text"
            autocomplete="name"
            maxlength="120"
            placeholder="Seu nome"
            class="h-12 w-full rounded-lg border border-input bg-background px-3"
            :aria-invalid="!!getError('name')"
            required
          />
          <p v-if="getError('name')" class="text-sm text-destructive" role="alert">
            {{ getError('name') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="lead-email" class="text-sm font-semibold">E-mail</label>
          <input
            id="lead-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            maxlength="254"
            placeholder="voce@exemplo.com"
            class="h-12 w-full rounded-lg border border-input bg-background px-3"
            :aria-invalid="!!getError('email')"
          />
          <p v-if="getError('email')" class="text-sm text-destructive" role="alert">
            {{ getError('email') }}
          </p>
        </div>

        <div class="space-y-2">
          <label for="lead-phone" class="text-sm font-semibold">Telefone / WhatsApp</label>
          <input
            id="lead-phone"
            :value="form.phone"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            placeholder="(47) 9215-4477"
            class="h-12 w-full rounded-lg border border-input bg-background px-3"
            :aria-invalid="!!getError('phone')"
            @input="updatePhone"
          />
          <p v-if="getError('phone')" class="text-sm text-destructive" role="alert">
            {{ getError('phone') }}
          </p>
        </div>
      </div>

      <div class="space-y-3">
        <label class="flex cursor-pointer items-start gap-3 text-sm leading-6">
          <input
            v-model="form.consent"
            type="checkbox"
            class="mt-1 size-4 accent-primary"
            :aria-invalid="!!getError('consent')"
          />
          <span>
            Autorizo o uso dos meus dados para contato e atendimento deste pedido de orçamento.
          </span>
        </label>
        <p v-if="getError('consent')" class="text-sm text-destructive" role="alert">
          {{ getError('consent') }}
        </p>
      </div>
    </section>

    <div
      v-if="formError"
      class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm"
      role="alert"
    >
      {{ formError }}
    </div>

    <button
      type="submit"
      class="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="isSubmitting"
    >
      {{ isSubmitting ? 'Enviando solicitação...' : 'Solicitar orçamento pelo WhatsApp' }}
    </button>
    <p class="-mt-5 text-center text-xs text-muted-foreground">
      Fabricação em até 8 dias úteis. Prazo de transporte informado à parte.
    </p>
  </form>
</template>

<style scoped>
input:not([type='checkbox']):focus-visible,
select:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
</style>
