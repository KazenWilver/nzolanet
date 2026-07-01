import { CommonModule } from '@angular/common'
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AnimationService } from '../../../core/services/animation.service'
import { AvatarComponent } from '../avatar/avatar.component'
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component'
import type { Publication } from '../../../core/models/publication.model'

@Component({
  selector: 'app-repost-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, LoadingSpinnerComponent],
  templateUrl: './repost-dialog.component.html',
  styleUrl: './repost-dialog.component.scss'
})
export class RepostDialogComponent implements OnInit {
  private readonly animationService = inject(AnimationService)

  @ViewChild('overlay') overlayRef?: ElementRef<HTMLElement>
  @ViewChild('dialog') dialogRef?: ElementRef<HTMLElement>

  @Input({ required: true }) publication!: Publication
  @Output() closed = new EventEmitter<void>()
  @Output() confirmed = new EventEmitter<string>()

  quoteText = ''
  submitting = false

  ngOnInit(): void {
    requestAnimationFrame(() => {
      const overlay = this.overlayRef?.nativeElement
      const dialog = this.dialogRef?.nativeElement
      if (overlay && dialog) {
        this.animationService.modalEnter(overlay, dialog)
      }
    })
  }

  get authorName(): string {
    return this.publication.authorDisplayName ?? this.publication.authorUsername
  }

  handleClose(): void {
    if (this.submitting) {
      return
    }
    this.closed.emit()
  }

  handleConfirm(): void {
    if (this.submitting) {
      return
    }
    this.submitting = true
    this.confirmed.emit(this.quoteText.trim())
  }

  markSubmitComplete(): void {
    this.submitting = false
  }
}
