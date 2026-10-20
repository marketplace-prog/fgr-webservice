const slug = 'redes-de-futebol'
const defaultHeight = 1700
const minHeight = 900
const maxHeight = 3000
const script = document.currentScript as HTMLScriptElement | null
const scriptBaseUrl = script?.src ? new URL(script.src).origin : window.location.origin

class FgrLandingWidget extends HTMLElement {
  private readonly frame: HTMLIFrameElement
  private readonly frameOrigin: string

  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })
    const baseUrl = this.getAttribute('base-url') || scriptBaseUrl
    const pageUrl = new URL(`/lp/${slug}?embed=1`, baseUrl)
    const hostQuery = new URLSearchParams(window.location.search)
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      const value = hostQuery.get(key)
      if (value) pageUrl.searchParams.set(key, value.slice(0, 200))
    }
    this.frameOrigin = pageUrl.origin

    const style = document.createElement('style')
    style.textContent = `
      :host { display: block; width: 100%; }
      iframe { display: block; width: 100%; height: ${defaultHeight}px; border: 0; }
    `

    this.frame = document.createElement('iframe')
    this.frame.src = pageUrl.toString()
    this.frame.title = 'Formulário para orçamento de redes de futebol'
    this.frame.loading = 'lazy'
    this.frame.referrerPolicy = 'strict-origin-when-cross-origin'
    this.frame.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin')

    shadow.append(style, this.frame)
  }

  connectedCallback() {
    window.addEventListener('message', this.handleMessage)
  }

  disconnectedCallback() {
    window.removeEventListener('message', this.handleMessage)
  }

  private readonly handleMessage = (event: MessageEvent) => {
    if (event.source !== this.frame.contentWindow || event.origin !== this.frameOrigin) return
    if (!event.data || typeof event.data !== 'object') return

    if (event.data.type === 'fgr-widget-resize') {
      const height = Number(event.data.height)
      if (Number.isFinite(height)) {
        this.frame.style.height = `${Math.max(minHeight, Math.min(maxHeight, height))}px`
      }
      return
    }

    if (event.data.type === 'fgr-lead-submitted' && this.isWhatsAppUrl(event.data.whatsappUrl)) {
      window.location.assign(event.data.whatsappUrl)
    }
  }

  private isWhatsAppUrl(value: unknown): value is string {
    if (typeof value !== 'string') return false

    try {
      const url = new URL(value)
      return (
        url.protocol === 'https:' && url.hostname === 'wa.me' && url.pathname === '/554792154477'
      )
    } catch {
      return false
    }
  }
}

if (!customElements.get(slug)) {
  customElements.define(slug, FgrLandingWidget)
}
