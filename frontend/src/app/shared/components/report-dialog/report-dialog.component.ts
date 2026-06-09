import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-dialog.component.html',
  styleUrl: './report-dialog.component.scss'
})
export class ReportDialogComponent {
  @Input() tipo: 'comentario' | 'publicacao' = 'comentario';
  @Output() confirmado = new EventEmitter<string>();
  @Output() cancelado = new EventEmitter<void>();

  @Input() disabled = false;

  motivoSelecionado = '';
  motivoOutro = '';
  submitting = false;
  motivos = [
    'Conteúdo ofensivo',
    'Spam',
    'Desinformação',
    'Conteúdo sexual explícito',
    'Violência',
    'Discurso de ódio',
    'Outro'
  ];

  get motivoFinal(): string {
    if (this.motivoSelecionado === 'Outro') {
      return this.motivoOutro.trim();
    }
    return this.motivoSelecionado;
  }

  confirmar(): void {
    if (!this.motivoFinal.trim() || this.disabled || this.submitting) return;
    this.submitting = true;
    // Emitir motivo e confiar no pai para gerir a resposta; manter controls desativados
    this.confirmado.emit(this.motivoFinal);
  }

  cancelar(): void {
    this.cancelado.emit();
  }
}
