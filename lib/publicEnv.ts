import type { PublicEnv } from './clientEnv'

// Server-only. Builds the public runtime config that gets injected into window.PEER_NEX.
// Read at REQUEST time (see app/(main)/layout.tsx), so a single build/image is re-pointed
// via env without rebuilding.
//
// SECURITY: window.PEER_NEX is world-readable in the browser. Add ONLY browser-safe values
// here — never spread process.env, or you leak secrets to every visitor.
export function getPublicEnv(): PublicEnv {
  return {
    SOCKET_URL: process.env.SOCKET_BACKEND_URL ?? '',
  }
}
