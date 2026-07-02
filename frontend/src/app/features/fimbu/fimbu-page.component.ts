import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { HttpErrorResponse } from '@angular/common/http'
import { FimbuService } from '../../core/services/fimbu.service'
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component'
import { TPipe } from '../../core/i18n/translate.pipe'
import { FimbuMessageTextPipe } from '../../shared/pipes/fimbu-message-text.pipe'
import type { FimbuMessage } from '../../core/models/fimbu.model'

@Component({
  selector: 'app-fimbu-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent, TPipe, FimbuMessageTextPipe],
  templateUrl: './fimbu-page.component.html',
  styleUrl: './fimbu-page.component.scss'
})
export class FimbuPageComponent implements OnInit {
  private readonly fimbuService = inject(FimbuService)
  private readonly formBuilder = inject(FormBuilder)
  private readonly destroyRef = inject(DestroyRef)

  @ViewChild('messagesScroll') messagesScroll?: ElementRef<HTMLElement>
  @ViewChild('composerTextarea') composerTextarea?: ElementRef<HTMLTextAreaElement>

  messages: FimbuMessage[] = []
  loadingHistory = true
  sending = false
  clearing = false
  loadError = ''
  sendError = ''
  sendErrorIsKey = true

  readonly composerForm = this.formBuilder.nonNullable.group({
    message: ['', [Validators.required, Validators.maxLength(4000)]]
  })

  ngOnInit(): void {
    this.loadHistory()
  }

  loadHistory(): void {
    this.loadingHistory = true
    this.loadError = ''

    this.fimbuService
      .getHistory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.messages = response.messages ?? []
          this.loadingHistory = false
          this.scrollToBottom()
        },
        error: () => {
          this.loadError = 'fimbu.loadFailed'
          this.loadingHistory = false
        }
      })
  }

  handleSubmit(): void {
    if (this.sending || this.composerForm.invalid) {
      return
    }

    const text = this.composerForm.controls.message.value.trim()
    if (!text) {
      return
    }

    const optimistic: FimbuMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    }

    this.messages = [...this.messages, optimistic]
    this.composerForm.reset()
    this.sendError = ''
    this.sending = true
    this.scrollToBottom()
    this.resizeComposer()

    this.fimbuService
      .sendMessage(text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.messages = [
            ...this.messages,
            {
              role: 'assistant',
              content: response.reply,
              timestamp: response.timestamp
            }
          ]
          this.sending = false
          this.scrollToBottom()
        },
        error: (error: HttpErrorResponse) => {
          this.sending = false
          const serverMessage = typeof error.error?.message === 'string' ? error.error.message : ''
          if (serverMessage) {
            this.sendError = serverMessage
            this.sendErrorIsKey = false
          } else {
            this.sendError = 'fimbu.sendFailed'
            this.sendErrorIsKey = true
          }
        }
      })
  }

  handleComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      this.handleSubmit()
    }
  }

  handleComposerInput(): void {
    this.resizeComposer()
  }

  handleClearHistory(): void {
    if (this.clearing || this.sending) {
      return
    }

    this.clearing = true
    this.fimbuService
      .clearHistory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messages = []
          this.clearing = false
        },
        error: () => {
          this.clearing = false
        }
      })
  }

  isUserMessage(message: FimbuMessage): boolean {
    return message.role === 'user'
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      const el = this.messagesScroll?.nativeElement
      if (!el) {
        return
      }

      el.scrollTop = el.scrollHeight
    })
  }

  private resizeComposer(): void {
    requestAnimationFrame(() => {
      const textarea = this.composerTextarea?.nativeElement
      if (!textarea) {
        return
      }

      textarea.style.height = 'auto'
      const maxHeight = 160
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    })
  }
}
