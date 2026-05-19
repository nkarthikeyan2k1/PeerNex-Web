'use client'

import { useState, useEffect } from 'react'

export const useLocalStorage = (key: string, defaultValue: string) => {
    const [value, setValue] = useState<string>(() => {
        if (typeof window === "undefined") {
            return defaultValue
        }
        const storedValue = localStorage.getItem(key)
        return storedValue ?? defaultValue
    })

    useEffect(() => {
        localStorage.setItem(key, value)
    }, [key, value])

    const removeValue = () => {
        localStorage.removeItem(key)
        setValue(defaultValue)
    }

    return [value, setValue, removeValue] as const
}