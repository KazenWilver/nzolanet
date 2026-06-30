import { Component, HostListener, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  @Input() mensagem = 'Tens a certeza?';
  @Output() confirmado = new EventEmitter<void>();
  @Output() cancelado = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.cancelar();
  }

  confirmar(): void {
    this.confirmado.emit();
  }

  cancelar(): void {
    this.cancelado.emit();
  }
}
