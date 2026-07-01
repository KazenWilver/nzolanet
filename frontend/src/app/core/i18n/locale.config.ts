import type { LocaleCode } from './locale.types'

export interface SupportedLocale {
  code: LocaleCode
  nativeLabel: string
  flag: string
}

export const DEFAULT_LOCALE: LocaleCode = 'pt-PT'
export const LOCALE_STORAGE_KEY = 'nzolanet_locale'

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  { code: 'pt-PT', nativeLabel: 'Português (Portugal)', flag: '🇵🇹' },
  { code: 'pt-BR', nativeLabel: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en', nativeLabel: 'English', flag: '🇬🇧🇺🇸' },
  { code: 'fr', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'zh', nativeLabel: '中文', flag: '🇨🇳' },
  { code: 'es', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'hi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', nativeLabel: 'العربية', flag: '🇸🇦' },
  { code: 'ru', nativeLabel: 'Русский', flag: '🇷🇺' },
  { code: 'bn', nativeLabel: 'বাংলা', flag: '🇧🇩' },
  { code: 'ur', nativeLabel: 'اردو', flag: '🇵🇰' },
  { code: 'ja', nativeLabel: '日本語', flag: '🇯🇵' },
  { code: 'ko', nativeLabel: '한국어', flag: '🇰🇷' },
  { code: 'de', nativeLabel: 'Deutsch', flag: '🇩🇪' },
  { code: 'vi', nativeLabel: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'it', nativeLabel: 'Italiano', flag: '🇮🇹' },
  { code: 'th', nativeLabel: 'ไทย', flag: '🇹🇭' },
  { code: 'tr', nativeLabel: 'Türkçe', flag: '🇹🇷' },
  { code: 'sw', nativeLabel: 'Kiswahili', flag: '🇰🇪' }
]

export const isSupportedLocale = (value: string | null | undefined): value is LocaleCode =>
  !!value && SUPPORTED_LOCALES.some(locale => locale.code === value)
