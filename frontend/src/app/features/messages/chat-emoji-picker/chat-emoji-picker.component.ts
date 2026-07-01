import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CHAT_COMPOSER_EMOJIS, CHAT_REACTION_EMOJIS } from '../chat.constants'

@Component({
  selector: 'app-chat-emoji-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-emoji-picker.component.html',
  styleUrl: './chat-emoji-picker.component.scss'
})
export class ChatEmojiPickerComponent {
  @Input() mode: 'composer' | 'reaction' = 'composer'
  @Output() emojiSelected = new EventEmitter<string>()
  @Output() closed = new EventEmitter<void>()

  get emojis(): readonly string[] {
    return this.mode === 'reaction' ? CHAT_REACTION_EMOJIS : CHAT_COMPOSER_EMOJIS
  }

  handleSelect(emoji: string): void {
    this.emojiSelected.emit(emoji)
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.closed.emit()
  }
}
