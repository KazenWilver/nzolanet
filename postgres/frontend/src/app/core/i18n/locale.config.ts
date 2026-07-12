import type { LocaleCode } from './locale.types'

export interface SupportedLocale {
  code: LocaleCode
  nativeLabel: string
  flag: string
}

export const DEFAULT_LOCALE: LocaleCode = 'pt-PT'
export const LOCALE_STORAGE_KEY = 'nzolanet_locale'

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  { code: 'pt-PT', nativeLabel: 'Português (Portugal)', flag: '🇵🇹' }
]

export const isSupportedLocale = (value: string | null | undefined): value is LocaleCode =>
  value === 'pt-PT'
