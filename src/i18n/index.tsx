import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { en, type TranslationKeys } from './en'
import { fr } from './fr'
import { ar } from './ar'

export type Locale = 'en' | 'fr' | 'ar'

export interface LocaleInfo {
  code: Locale
  name: string
  nativeName: string
  shortName: string
  dir: 'ltr' | 'rtl'
  font: string
}

export const locales: Record<Locale, LocaleInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English', shortName: 'EN', dir: 'ltr', font: "'Sansation', 'Inter', sans-serif" },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', shortName: 'FR', dir: 'ltr', font: "'Sansation', 'Inter', sans-serif" },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', shortName: 'AR', dir: 'rtl', font: "'Alyamama', 'Cairo', sans-serif" },
}

const translations: Record<Locale, TranslationKeys> = { en, fr, ar }

interface I18nContextValue {
  locale: Locale
  localeInfo: LocaleInfo
  t: TranslationKeys
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  localeInfo: locales.en,
  t: en,
  setLocale: () => {},
})

export function useTranslation() {
  return useContext(I18nContext)
}

const STORAGE_KEY = 'vaultshare-locale'

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && stored in locales) return stored as Locale
  } catch {}
  // Detect browser language
  const browserLang = navigator.language.split('-')[0]
  if (browserLang in locales) return browserLang as Locale
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    try { localStorage.setItem(STORAGE_KEY, newLocale) } catch {}
  }, [])

  // Apply dir and font to <html>
  useEffect(() => {
    const info = locales[locale]
    document.documentElement.dir = info.dir
    document.documentElement.lang = locale
    document.documentElement.style.setProperty('--brand-font', info.font)
  }, [locale])

  const value: I18nContextValue = {
    locale,
    localeInfo: locales[locale],
    t: translations[locale],
    setLocale,
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}
