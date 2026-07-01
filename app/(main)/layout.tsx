import { SocketProvider } from '@/providers/SocketProvider'
import { getPublicEnv } from '@/lib/publicEnv'
import React from 'react'

// Read env per request (runtime), not at build — so the injected config can change via env
// without rebuilding. Keeps this segment dynamic; the static landing page (/) is unaffected.
export const dynamic = 'force-dynamic'

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const publicEnv = getPublicEnv()

  return (
    <>
      {/* Inject public runtime config before hydration; client reads it via clientEnv().
          .replace(/</) escapes </script> to prevent injection. */}
      <script
        id="__peernex_env__"
        dangerouslySetInnerHTML={{
          __html: `window.PEER_NEX=${JSON.stringify(publicEnv).replace(/</g, '\\u003c')}`,
        }}
      />
      <SocketProvider>
        {children}
      </SocketProvider>
    </>
  )
}

export default MainLayout
