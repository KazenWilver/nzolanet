import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converte uma data em texto relativo legível em português.
 * O parâmetro `_tick` força reavaliação quando o RelativeTimeService actualiza.
 */
@Pipe({ name: 'tempoAtras', standalone: true, pure: true })
export class TimeAgoPipe implements PipeTransform {
  transform(valor: string | Date, _tick = 0): string {
    void _tick;

    const agora = new Date();
    const data = new Date(valor);
    const segundos = Math.floor((agora.getTime() - data.getTime()) / 1000);

    if (segundos < 60) {
      return 'agora mesmo';
    }

    if (segundos < 3600) {
      return `há ${Math.floor(segundos / 60)} min`;
    }

    if (segundos < 86400) {
      return `há ${Math.floor(segundos / 3600)}h`;
    }

    if (segundos < 604800) {
      return `há ${Math.floor(segundos / 86400)}d`;
    }

    return data.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
  }
}
