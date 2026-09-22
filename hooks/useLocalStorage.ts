'use client'

import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(key: string, defaultValue: T) {
    const [value, setValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            return defaultValue
        }
        try {
            const storedValue = localStorage.getItem(key)
            return storedValue ? (JSON.parse(storedValue) as T) : defaultValue
        } catch {
            // Stored value is missing or not valid JSON — fall back cleanly
            return defaultValue
        }
    })

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch {
            // Ignore write failures (quota exceeded, private mode, etc.)
        }
    }, [key, value])

    const removeValue = useCallback(() => {
        try {
            localStorage.removeItem(key)
        } catch {
            // Ignore
        }
        setValue(defaultValue)
    }, [key, defaultValue])

    return [value, setValue, removeValue] as const
}
