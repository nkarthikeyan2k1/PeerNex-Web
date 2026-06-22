'use client'

import { useState, useEffect } from 'react'

/**
 * Tracks whether the viewport is at or below a breakpoint (default 640px).
 * Starts `false` so SSR/first paint match desktop, then corrects after mount.
 */
export const useIsMobile = (breakpoint = 640) => {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpoint - 0.02}px)`)
        const update = () => setIsMobile(mq.matches)
        update()
        mq.addEventListener('change', update)
        return () => mq.removeEventListener('change', update)
    }, [breakpoint])

    return isMobile
}
