import { Pipe, PipeTransform, inject } from '@angular/core'
import { LocaleService } from './locale.service'

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private readonly localeService = inject(LocaleService)
  private readonly localeSignal = this.localeService.currentLocale

  transform(key: string, params?: Record<string, string | number>): string {
    this.localeSignal()
    return this.localeService.translate(key, params)
  }

}

@Pipe({
  name: 't',
  standalone: true,
  pure: false
})
export class TPipe implements PipeTransform {
  private readonly localeService = inject(LocaleService)
  private readonly localeSignal = this.localeService.currentLocale

  transform(key: string, params?: Record<string, string | number>): string {
    this.localeSignal()
    return this.localeService.translate(key, params)
  }
}
