import { Injectable, computed, signal } from '@angular/core'
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, SUPPORTED_LOCALES, isSupportedLocale } from './locale.config'
import type { LocaleCode, LocaleMessages } from './locale.types'
import ptPT from './locales/pt-PT'

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly fallbackMessages = ptPT
  private readonly currentLocaleSignal = signal<LocaleCode>(DEFAULT_LOCALE)
  private readonly messagesSignal = signal<LocaleMessages>(ptPT)

  readonly currentLocale = computed(() => this.currentLocaleSignal())
  readonly messages = computed(() => this.messagesSignal())
  readonly supportedLocales = SUPPORTED_LOCALES

  async initialize(): Promise<void> {
    const storedCode = this.readStoredLocale()
    await this.loadLocale(storedCode)
  }

  async loadLocale(code: LocaleCode): Promise<void> {
    const localeCode = isSupportedLocale(code) ? code : DEFAULT_LOCALE
    const loadedMessages = await this.importLocaleMessages(localeCode)
    this.messagesSignal.set(loadedMessages)
    this.currentLocaleSignal.set(localeCode)
    this.storeLocale(localeCode)
  }

  translate(key: string, params?: Record<string, string | number>): string {
    const currentValue = this.resolveKey(this.messagesSignal(), key)
    const fallbackValue = this.resolveKey(this.fallbackMessages, key)
    const raw = typeof currentValue === 'string'
      ? currentValue
      : typeof fallbackValue === 'string'
        ? fallbackValue
        : key
    return this.interpolate(raw, params)
  }

  private async importLocaleMessages(code: LocaleCode): Promise<LocaleMessages> {
    try {
      const module = await import(`./locales/${code}`)
      return module.default as LocaleMessages
    } catch {
      return this.fallbackMessages
    }
  }

  private resolveKey(messages: LocaleMessages, key: string): unknown {
    return key
      .split('.')
      .reduce<unknown>((accumulator, segment) => {
        if (typeof accumulator !== 'object' || accumulator === null) {
          return undefined
        }
        return (accumulator as Record<string, unknown>)[segment]
      }, messages)
  }

  private interpolate(value: string, params?: Record<string, string | number>): string {
    if (!params) {
      return value
    }

    return Object.entries(params).reduce((translated, [paramKey, paramValue]) => {
      const pattern = new RegExp(`\\{\\{\\s*${paramKey}\\s*\\}\\}`, 'g')
      return translated.replace(pattern, String(paramValue))
    }, value)
  }

  private readStoredLocale(): LocaleCode {
    if (typeof window === 'undefined') {
      return DEFAULT_LOCALE
    }
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return isSupportedLocale(stored) ? stored : DEFAULT_LOCALE
  }

  private storeLocale(code: LocaleCode): void {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(LOCALE_STORAGE_KEY, code)
  }
}
