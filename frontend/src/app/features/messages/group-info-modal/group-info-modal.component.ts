import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { HttpErrorResponse } from '@angular/common/http'
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs'
import { ConversationService } from '../../../core/services/conversation.service'
import { SearchService } from '../../../core/services/search.service'
import { AuthService } from '../../../core/services/auth.service'
import type { ConversationDetail, ConversationParticipant } from '../../../core/models/conversation.model'
import type { User } from '../../../core/models/user.model'
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component'
import { ModalComponent } from '../../../shared/components/modal/modal.component'
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component'
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component'

@Component({
  selector: 'app-group-info-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, ModalComponent, LoadingSpinnerComponent, ConfirmDialogComponent],
  templateUrl: './group-info-modal.component.html',
  styleUrl: './group-info-modal.component.scss'
})
export class GroupInfoModalComponent implements OnInit {
  private readonly conversationService = inject(ConversationService)
  private readonly searchService = inject(SearchService)
  private readonly authService = inject(AuthService)
  private readonly destroyRef = inject(DestroyRef)

  @Input({ required: true }) conversationId!: string
  @Output() closed = new EventEmitter<void>()
  @Output() updated = new EventEmitter<ConversationDetail>()
  @Output() deleted = new EventEmitter<void>()

  detail: ConversationDetail | null = null
  loading = true
  errorMessage = ''
  saving = false
  saveError = ''

  editTitle = ''
  editDescription = ''
  pendingPhoto: File | null = null
  photoPreview = ''
  photoUploading = false
  photoError = ''

  addMemberQuery = ''
  addMemberResults: User[] = []
  addMemberLoading = false
  addMemberError = ''
  addingMemberId: string | null = null
  deleteConfirmOpen = false
  deletingGroup = false
  deleteError = ''

  private readonly searchSubject = new Subject<string>()

  ngOnInit(): void {
    this.loadDetail()

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          this.addMemberLoading = true
          this.addMemberError = ''
          return this.searchService.searchUsers(query)
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: users => {
          const currentUserId = this.authService.getCurrentUser()?.id
          const existingIds = new Set(this.detail?.participants.map(participant => participant.userId) ?? [])
          this.addMemberResults = users.filter(
            user => user.id !== currentUserId && !existingIds.has(user.id)
          )
          this.addMemberLoading = false
        },
        error: () => {
          this.addMemberLoading = false
          this.addMemberError = 'Não foi possível pesquisar utilizadores.'
        }
      })
  }

  get groupPhotoUrl(): string | undefined {
    if (this.photoPreview) {
      return this.photoPreview
    }

    return this.detail?.imageUrl
  }

  handleClose(): void {
    this.clearPhotoPreview()
    this.closed.emit()
  }

  handlePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) {
      return
    }

    this.clearPhotoPreview()
    this.pendingPhoto = file
    this.photoPreview = URL.createObjectURL(file)
    this.photoError = ''
    input.value = ''
  }

  handleConfirmPhoto(): void {
    if (!this.detail || !this.pendingPhoto || this.photoUploading) {
      return
    }

    this.photoUploading = true
    this.photoError = ''

    this.conversationService
      .updateGroup(this.detail.id, {}, this.pendingPhoto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: detail => {
          this.detail = detail
          this.clearPhotoPreview()
          this.photoUploading = false
          this.updated.emit(detail)
        },
        error: (error: HttpErrorResponse) => {
          this.photoUploading = false
          this.photoError = error.error?.message ?? 'Não foi possível atualizar a fotografia.'
        }
      })
  }

  handleCancelPhoto(): void {
    this.clearPhotoPreview()
    this.photoError = ''
  }

  handleSaveGroupInfo(): void {
    if (!this.detail || this.saving) {
      return
    }

    this.saving = true
    this.saveError = ''

    this.conversationService
      .updateGroup(this.detail.id, {
        title: this.editTitle.trim() || undefined,
        description: this.editDescription.trim()
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: detail => {
          this.detail = detail
          this.editTitle = detail.title ?? ''
          this.editDescription = detail.description ?? ''
          this.clearPhotoPreview()
          this.saving = false
          this.updated.emit(detail)
        },
        error: (error: HttpErrorResponse) => {
          this.saving = false
          this.saveError = error.error?.message ?? 'Não foi possível guardar as alterações.'
        }
      })
  }

  handleAddMemberSearchChange(): void {
    const query = this.addMemberQuery.trim()
    if (query.length < 2) {
      this.addMemberResults = []
      this.addMemberLoading = false
      this.addMemberError = ''
      return
    }

    this.searchSubject.next(query)
  }

  handleAddMember(user: User): void {
    if (!this.detail || this.addingMemberId) {
      return
    }

    this.addingMemberId = user.id
    this.addMemberError = ''

    this.conversationService
      .addGroupParticipants(this.detail.id, [user.id])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: detail => {
          this.detail = detail
          this.addingMemberId = null
          this.addMemberQuery = ''
          this.addMemberResults = []
          this.updated.emit(detail)
        },
        error: (error: HttpErrorResponse) => {
          this.addingMemberId = null
          this.addMemberError = error.error?.message ?? 'Não foi possível adicionar o membro.'
        }
      })
  }

  getParticipantName(participant: ConversationParticipant): string {
    return participant.displayName ?? participant.username
  }

  trackParticipant(_: number, participant: ConversationParticipant): string {
    return participant.userId
  }

  trackUser(_: number, user: User): string {
    return user.id
  }

  handleOpenDeleteGroupConfirm(): void {
    this.deleteConfirmOpen = true
    this.deleteError = ''
  }

  handleCancelDeleteGroup(): void {
    this.deleteConfirmOpen = false
    this.deleteError = ''
  }

  handleConfirmDeleteGroup(): void {
    if (!this.detail || this.deletingGroup) {
      return
    }

    this.deletingGroup = true
    this.deleteError = ''

    this.conversationService
      .deleteGroup(this.detail.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deletingGroup = false
          this.deleteConfirmOpen = false
          this.deleted.emit()
        },
        error: (error: HttpErrorResponse) => {
          this.deletingGroup = false
          this.deleteError = error.error?.message ?? 'Não foi possível apagar o grupo.'
        }
      })
  }

  private loadDetail(): void {
    this.loading = true
    this.errorMessage = ''

    this.conversationService
      .getConversation(this.conversationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: detail => {
          this.detail = detail
          this.editTitle = detail.title ?? ''
          this.editDescription = detail.description ?? ''
          this.loading = false
        },
        error: () => {
          this.loading = false
          this.errorMessage = 'Não foi possível carregar o grupo.'
        }
      })
  }

  private clearPhotoPreview(): void {
    if (this.photoPreview) {
      URL.revokeObjectURL(this.photoPreview)
    }
    this.pendingPhoto = null
    this.photoPreview = ''
  }
}
