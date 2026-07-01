// Shape of the public, browser-exposed runtime config injected into window.PEER_NEX.
// Everything here is world-readable in the browser — keep it to non-secret values only.
export type PublicEnv = {
  SOCKET_URL: string
}

declare global {
  interface Window {
    PEER_NEX?: PublicEnv
  }
}

// Read injected runtime config from any client component, synchronously.
// e.g. clientEnv().SOCKET_URL
export function clientEnv(): Partial<PublicEnv> {
  if (typeof window === 'undefined') return {}
  return window.PEER_NEX ?? {}
}
