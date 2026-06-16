import { Pipe, PipeTransform } from '@angular/core';

// Pipe personalizado que converte uma data em texto relativo legível em português
// Ex: "há 5 min", "há 2h", "há 3d" — actualiza-se automaticamente (pure: false)
@Pipe({ name: 'tempoAtras', standalone: true, pure: false })
export class TimeAgoPipe implements PipeTransform {
  transform(valor: string | Date): string {
    const agora = new Date();
    const data = new Date(valor);
    const segundos = Math.floor((agora.getTime() - data.getTime()) / 1000);

    if (segundos < 60) return 'agora mesmo';
    if (segundos < 3600) return `há ${Math.floor(segundos / 60)} min`;
    if (segundos < 86400) return `há ${Math.floor(segundos / 3600)}h`;
    if (segundos < 604800) return `há ${Math.floor(segundos / 86400)}d`;
    return data.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
  }
}