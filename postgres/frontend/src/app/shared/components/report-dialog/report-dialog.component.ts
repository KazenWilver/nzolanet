import { CommonModule } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AnimationService } from '../../../core/services/animation.service'
import { LocaleService } from '../../../core/i18n/locale.service'
import { TPipe } from '../../../core/i18n/translate.pipe'
import { ReportService } from '../../../core/services/report.service'
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component'

type ReportReason = 'spam' | 'harassment' | 'hate' | 'violence' | 'misinformation' | 'other'
type ReportTargetType = 'publication' | 'comment'

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, TPipe],
  templateUrl: './report-dialog.component.html',
  styleUrl: './report-dialog.component.scss'
})
export class ReportDialogComponent implements OnInit {
  private readonly reportService = inject(ReportService)
  private readonly animationService = inject(AnimationService)
  private readonly localeService = inject(LocaleService)

  @ViewChild('overlay') overlayRef?: ElementRef<HTMLElement>
  @ViewChild('dialog') dialogRef?: ElementRef<HTMLElement>

  @Input({ required: true }) targetType!: ReportTargetType
  @Input({ required: true }) targetId!: string
  @Output() closed = new EventEmitter<void>()
  @Output() reported = new EventEmitter<void>()

  readonly reasons: ReportReason[] = ['spam', 'harassment', 'hate', 'violence', 'misinformation', 'other']

  selectedReason: ReportReason = 'spam'
  details = ''
  submitting = false
  errorMessage = ''
  successMessage = ''

  ngOnInit(): void {
    requestAnimationFrame(() => {
      const overlay = this.overlayRef?.nativeElement
      const dialog = this.dialogRef?.nativeElement
      if (overlay && dialog) {
        this.animationService.modalEnter(overlay, dialog)
      }
    })
  }

  handleClose(): void {
    if (this.submitting) {
      return
    }
    this.closed.emit()
  }

  handleSubmit(): void {
    if (this.submitting) {
      return
    }

    this.submitting = true
    this.errorMessage = ''
    this.successMessage = ''

    const payload = {
      reason: this.selectedReason,
      details: this.details.trim() || undefined
    }

    const request$ = this.targetType === 'publication'
      ? this.reportService.reportPublication(this.targetId, payload)
      : this.reportService.reportComment(this.targetId, payload)

    request$.subscribe({
      next: () => {
        this.submitting = false
        this.successMessage = this.localeService.translate('report.success')
        this.reported.emit()
        setTimeout(() => this.closed.emit(), 900)
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false
        this.errorMessage = error.status === 409
          ? this.localeService.translate('report.alreadyReported')
          : this.localeService.translate('errors.generic')
      }
    })
  }
}
