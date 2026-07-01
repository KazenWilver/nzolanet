import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

/**
 * Converte texto simples em HTML com links, menções e hashtags clicáveis.
 */
@Pipe({
  name: 'linkifyText',
  standalone: true
})
export class LinkifyTextPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }

    const escaped = this.escapeHtml(value);
    const withLinks = escaped.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="linkify__url">$1</a>'
    );
    const withMentions = withLinks.replace(
      /(^|[\s(])@([A-Za-z0-9_.-]+)/g,
      '$1<a href="/profile/by-username/$2" class="linkify__mention">@$2</a>'
    );
    const withHashtags = withMentions.replace(
      /(^|[\s(])#([A-Za-z0-9_\u00C0-\u024F]+)/g,
      '$1<a href="/search?q=%23$2" class="linkify__hashtag">#$2</a>'
    );

    return this.sanitizer.bypassSecurityTrustHtml(withHashtags);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
