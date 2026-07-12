import { Injectable, computed, signal } from '@angular/core'
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isSupportedLocale } from './locale.config'
import type { LocaleCode, LocaleMessages } from './locale.types'
import ptPT from './locales/pt-PT'

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly messages = ptPT
  private readonly currentLocaleSignal = signal<LocaleCode>(DEFAULT_LOCALE)

  readonly currentLocale = computed(() => this.currentLocaleSignal())
  readonly messages$ = computed(() => this.messages)

  async initialize(): Promise<void> {
    const storedCode = this.readStoredLocale()
    this.currentLocaleSignal.set(storedCode)
    this.storeLocale(storedCode)
  }

  translate(key: string, params?: Record<string, string | number>): string {
    const currentValue = this.resolveKey(this.messages, key)
    const raw = typeof currentValue === 'string' ? currentValue : key
    return this.interpolate(raw, params)
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
