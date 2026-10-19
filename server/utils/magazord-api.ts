export function createMagazordAuthorization(token: string, password: string): string {
  return `Basic ${btoa(`${token}:${password}`)}`
}

export function createMagazordApiUrl(apiUrl: string, endpoint: string): URL {
  let baseUrl: URL
  try {
    baseUrl = new URL(apiUrl)
  } catch {
    throw new Error('A URL da API Magazord é inválida.')
  }

  if (baseUrl.protocol !== 'https:') {
    throw new Error('A API Magazord deve ser acessada por HTTPS.')
  }

  return new URL(`${baseUrl.toString().replace(/\/+$/, '')}${endpoint}`)
}
