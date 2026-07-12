import { Component, DestroyRef, EventEmitter, Output, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { HttpErrorResponse } from '@angular/common/http'
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs'
import { SearchService } from '../../../core/services/search.service'
import { ConversationService } from '../../../core/services/conversation.service'
import { AuthService } from '../../../core/services/auth.service'
import type { User } from '../../../core/models/user.model'
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component'
import { ModalComponent } from '../../../shared/components/modal/modal.component'
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component'

@Component({
  selector: 'app-new-conversation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, ModalComponent, LoadingSpinnerComponent],
  template: `
    <app-modal [open]="true" title="Nova conversa" (closed)="handleClose()">
      <div class="new-conversation__tabs">
        <button type="button" [class.active]="mode === 'direct'" (click)="handleToggleMode('direct')">Direta</button>
        <button type="button" [class.active]="mode === 'group'" (click)="handleToggleMode('group')">Grupo</button>
      </div>
      <label class="new-conversation__search" aria-label="Pesquisar utilizadores">
        <span aria-hidden="true">🔍</span>
        <input
          type="search"
          [(ngModel)]="searchQuery"
          (ngModelChange)="handleSearchChange()"
          placeholder="Pesquisar por nome ou @utilizador"
          class="new-conversation__search-input"
        />
      </label>

      @if (mode === 'group') {
        <label class="new-conversation__search" aria-label="Título do grupo">
          <span aria-hidden="true">📝</span>
          <input
            type="text"
            [(ngModel)]="groupTitle"
            placeholder="Título do grupo"
            class="new-conversation__search-input"
          />
        </label>
      }

      @if (loading) {
        <div class="new-conversation__loading">
          <app-loading-spinner tamanho="md" />
        </div>
      } @else if (errorMessage) {
        <p class="new-conversation__error" role="alert">{{ errorMessage }}</p>
      } @else if (searchQuery.trim().length < 2) {
        <p class="new-conversation__hint">Escreve pelo menos 2 caracteres para pesquisar.</p>
      } @else if (results.length === 0) {
        <p class="new-conversation__hint">Nenhum utilizador encontrado.</p>
      } @else {
        <ul class="new-conversation__list" role="list">
          @for (user of results; track user.id) {
            <li>
              <button
                type="button"
                class="new-conversation__item"
                [disabled]="startingUserId === user.id"
                (click)="mode === 'direct' ? handleStartConversation(user) : handleToggleGroupParticipant(user.id)"
              >
                <app-avatar [src]="user.profilePhotoUrl" [username]="user.username" size="md" />
                <span class="new-conversation__meta">
                  <strong>{{ user.displayName ?? user.username }}</strong>
                  <span>@{{ user.username }}</span>
                </span>
                @if (startingUserId === user.id) {
                  <span class="new-conversation__starting">A abrir…</span>
                } @else if (mode === 'group') {
                  <span class="new-conversation__starting">
                    {{ selectedGroupParticipantIds.has(user.id) ? 'Selecionado' : 'Selecionar' }}
                  </span>
                }
              </button>
            </li>
          }
        </ul>
      }

      @if (mode === 'group') {
        <div class="new-conversation__group-actions">
          <button type="button" class="new-conversation__create-btn" (click)="handleCreateGroupConversation()">
            Criar grupo
          </button>
        </div>
      }
    </app-modal>
  `,
  styles: `
    .new-conversation__tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .new-conversation__tabs button {
      border: 1px solid var(--color-border);
      border-radius: 9999px;
      background: transparent;
      color: var(--color-text-primary);
      padding: 6px 12px;
      cursor: pointer;
    }

    .new-conversation__tabs button.active {
      background: var(--color-accent-blue-bg);
      border-color: var(--color-accent);
    }

    .new-conversation__search {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding: 0 14px;
      min-height: 42px;
      border-radius: 9999px;
      background: var(--color-bg-hover);
    }

    .new-conversation__search-input {
      flex: 1;
      border: none;
      background: transparent;
      font: inherit;
      color: var(--color-text-primary);
      min-width: 0;

      &:focus {
        outline: none;
      }
    }

    .new-conversation__loading,
    .new-conversation__hint,
    .new-conversation__error {
      text-align: center;
      color: var(--color-text-secondary);
      padding: 20px 8px;
      margin: 0;
    }

    .new-conversation__error {
      color: var(--color-danger, #f4212e);
    }

    .new-conversation__list {
      list-style: none;
      margin: 0;
      padding: 0;
      max-height: 360px;
      overflow-y: auto;
    }

    .new-conversation__item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 4px;
      border: none;
      border-bottom: 1px solid var(--color-border);
      background: transparent;
      text-align: left;
      cursor: pointer;
      color: inherit;

      &:hover:not(:disabled) {
        background: var(--color-bg-hover);
      }

      &:disabled {
        opacity: 0.7;
        cursor: wait;
      }
    }

    .new-conversation__meta {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;

      strong {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      span {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }
    }

    .new-conversation__starting {
      font-size: 0.8rem;
      color: var(--color-text-secondary);
      white-space: nowrap;
    }

    .new-conversation__group-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;
    }

    .new-conversation__create-btn {
      border: none;
      border-radius: 9999px;
      min-height: 40px;
      padding: 0 16px;
      cursor: pointer;
      background: var(--color-text-primary);
      color: var(--color-bg-primary);
    }
  `
})
export class NewConversationModalComponent {
  private readonly searchService = inject(SearchService)
  private readonly conversationService = inject(ConversationService)
  private readonly authService = inject(AuthService)
  private readonly destroyRef = inject(DestroyRef)

  @Output() closed = new EventEmitter<void>()
  @Output() conversationCreated = new EventEmitter<string>()

  searchQuery = ''
  mode: 'direct' | 'group' = 'direct'
  groupTitle = ''
  results: User[] = []
  loading = false
  errorMessage = ''
  startingUserId: string | null = null

  private readonly searchSubject = new Subject<string>()

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          this.loading = true
          this.errorMessage = ''
          return this.searchService.searchUsers(query)
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: users => {
          const currentUserId = this.authService.getCurrentUser()?.id
          this.results = users.filter(user => user.id !== currentUserId)
          this.loading = false
        },
        error: () => {
          this.loading = false
          this.errorMessage = 'Não foi possível pesquisar utilizadores.'
        }
      })
  }

  handleSearchChange(): void {
    const query = this.searchQuery.trim()
    if (query.length < 2) {
      this.results = []
      this.loading = false
      this.errorMessage = ''
      return
    }

    this.searchSubject.next(query)
  }

  handleToggleMode(mode: 'direct' | 'group'): void {
    this.mode = mode
    this.errorMessage = ''
  }

  selectedGroupParticipantIds = new Set<string>()

  handleToggleGroupParticipant(userId: string): void {
    if (this.selectedGroupParticipantIds.has(userId)) {
      this.selectedGroupParticipantIds.delete(userId)
      return
    }

    this.selectedGroupParticipantIds.add(userId)
  }

  handleCreateGroupConversation(): void {
    const title = this.groupTitle.trim()
    const participantIds = Array.from(this.selectedGroupParticipantIds)
    if (!title || participantIds.length === 0) {
      this.errorMessage = 'Define um título e escolhe participantes.'
      return
    }

    this.errorMessage = ''
    this.conversationService
      .createGroupConversation({ title, participantIds })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: conversation => {
          this.conversationCreated.emit(conversation.id)
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = error.error?.message ?? 'Não foi possível criar o grupo.'
        }
      })
  }

  handleStartConversation(user: User): void {
    if (this.startingUserId) {
      return
    }

    this.startingUserId = user.id
    this.errorMessage = ''

    this.conversationService
      .getOrCreateConversation(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: conversation => {
          this.startingUserId = null
          this.conversationCreated.emit(conversation.id)
        },
        error: (error: HttpErrorResponse) => {
          this.startingUserId = null
          this.errorMessage = error.error?.message ?? 'Não foi possível iniciar a conversa.'
        }
      })
  }

  handleClose(): void {
    this.closed.emit()
  }
}
