import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, Output, EventEmitter, ViewChild, inject } from '@angular/core';
import { FocusTrapService } from '../../../core/services/focus-trap.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {
  private readonly focusTrap = inject(FocusTrapService);

  @Input() mensagem = 'Tens a certeza?';
  @Output() confirmado = new EventEmitter<void>();
  @Output() cancelado = new EventEmitter<void>();

  @ViewChild('dialogPanel') dialogPanelRef?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    requestAnimationFrame(() => {
      const panel = this.dialogPanelRef?.nativeElement;
      if (panel) {
        const cancelButton = panel.querySelector<HTMLElement>('.dialogo__btn--cancelar');
        this.focusTrap.activate(panel, cancelButton ?? undefined);
      }
    });
  }

  ngOnDestroy(): void {
    this.focusTrap.deactivate();
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.cancelar();
  }

  confirmar(): void {
    this.focusTrap.deactivate();
    this.confirmado.emit();
  }

  cancelar(): void {
    this.focusTrap.deactivate();
    this.cancelado.emit();
  }
}
