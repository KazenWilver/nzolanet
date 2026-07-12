import { Pipe, PipeTransform, inject } from '@angular/core'
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser'

/**
 * Formata texto das mensagens da Fimbu: escapa HTML e converte **negrito** em &lt;strong&gt;.
 */
@Pipe({
  name: 'fimbuMessageText',
  standalone: true
})
export class FimbuMessageTextPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer)

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return ''
    }

    const escaped = this.escapeHtml(value)
    const withBold = escaped.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')

    return this.sanitizer.bypassSecurityTrustHtml(withBold)
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}
