import { useState, useEffect } from 'react'
import { theme as themeConfig } from '@/theme/config'

export type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)

    // Sync config.ts with CSS variables
    const colors = themeConfig[theme] as Record<string, string>
    Object.entries(colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case (e.g., btnSecondaryBg -> --btn-secondary-bg)
      const cssVar = `--${key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`
      root.style.setProperty(cssVar, value)
      
      // Keep legacy/short names for backward compatibility if they differ
      if (key === 'primary') root.style.setProperty('--brand-primary', value)
      if (key === 'secondary') root.style.setProperty('--brand-secondary', value)
      if (key === 'accent') root.style.setProperty('--brand-accent', value)
      if (key === 'background') root.style.setProperty('--background', value)
      if (key === 'foreground') root.style.setProperty('--foreground', value)
      if (key === 'card') root.style.setProperty('--card-bg', value)
      if (key === 'border') root.style.setProperty('--card-border', value)
    })
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return { theme, toggleTheme, setTheme }
}
