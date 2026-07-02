import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  Renderer2,
  inject
} from '@angular/core'
import { Subject, Subscription, of } from 'rxjs'
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators'
import { SearchService } from '../../core/services/search.service'
import { AnimationService } from '../../core/services/animation.service'
import { LocaleService } from '../../core/i18n/locale.service'
import type { User } from '../../core/models/user.model'

interface MentionQuery {
  text: string
  start: number
  caret: number
}

@Directive({
  selector: 'textarea[appMentionAutocomplete]',
  standalone: true
})
export class MentionAutocompleteDirective implements AfterViewInit, OnDestroy {
  /** Quando false, desactiva menções (ex.: conversas 1 a 1). */
  @Input() mentionAutocompleteEnabled = true

  private readonly host = inject(ElementRef<HTMLTextAreaElement>)
  private readonly renderer = inject(Renderer2)
  private readonly searchService = inject(SearchService)
  private readonly animationService = inject(AnimationService)
  private readonly localeService = inject(LocaleService)
  private readonly ngZone = inject(NgZone)

  private readonly mentionQuery$ = new Subject<MentionQuery>()
  private readonly subscription = new Subscription()
  private dropdownElement: HTMLElement | null = null
  private highlightElement: HTMLElement | null = null
  private wrapperElement: HTMLElement | null = null
  private resizeObserver: ResizeObserver | null = null
  private mentionStart = -1
  private mentionCaret = -1
  private activeIndex = -1
  private suggestions: User[] = []

  private static readonly mentionTokenExact = /^@[a-zA-Z0-9._-]+$/

  constructor() {
    this.subscription.add(
      this.mentionQuery$
        .pipe(
          debounceTime(220),
          distinctUntilChanged((left, right) => left.text === right.text),
          switchMap(query => {
            if (query.text.length < 1) {
              return of<User[]>([])
            }
            return this.searchService.searchUsers(query.text)
          })
        )
        .subscribe(users => {
          this.suggestions = users
          this.activeIndex = users.length > 0 ? 0 : -1
          this.renderDropdown()
        })
    )
  }

  ngAfterViewInit(): void {
    this.setupHighlightLayer()
    this.updateHighlight()
    this.observeTextareaResize()
  }

  @HostListener('input')
  handleInput(): void {
    this.updateHighlight()

    if (!this.mentionAutocompleteEnabled) {
      this.closeDropdown()
      return
    }

    const mentionQuery = this.getMentionQuery()
    if (!mentionQuery) {
      this.closeDropdown()
      return
    }

    this.mentionStart = mentionQuery.start
    this.mentionCaret = mentionQuery.caret
    this.mentionQuery$.next(mentionQuery)
  }

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.mentionAutocompleteEnabled || !this.dropdownElement) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!this.suggestions.length) {
        return
      }
      this.activeIndex = (this.activeIndex + 1) % this.suggestions.length
      this.renderDropdown()
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!this.suggestions.length) {
        return
      }
      this.activeIndex = (this.activeIndex - 1 + this.suggestions.length) % this.suggestions.length
      this.renderDropdown()
      return
    }

    if (event.key === 'Enter') {
      if (this.suggestions.length > 0 && this.activeIndex >= 0) {
        event.preventDefault()
        this.insertMention(this.suggestions[this.activeIndex])
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      this.closeDropdown()
    }
  }

  @HostListener('blur')
  handleBlur(): void {
    setTimeout(() => {
      this.closeDropdown()
    }, 120)
  }

  @HostListener('scroll')
  handleScroll(): void {
    this.syncHighlightScroll()
  }

  @HostListener('window:resize')
  handleResize(): void {
    this.syncHighlightStyles()
    this.positionDropdown()
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect()
    this.subscription.unsubscribe()
    this.closeDropdown()
  }

  private getMentionQuery(): MentionQuery | null {
    const textarea = this.host.nativeElement
    const caret = textarea.selectionStart ?? textarea.value.length
    const valueBeforeCaret = textarea.value.slice(0, caret)
    const match = valueBeforeCaret.match(/(?:^|\s)@([a-zA-Z0-9._-]{0,30})$/)

    if (!match) {
      return null
    }

    const mentionValue = match[1] ?? ''
    const start = caret - mentionValue.length - 1
    return {
      text: mentionValue.replace(/^@/, ''),
      start,
      caret
    }
  }

  private ensureDropdown(): HTMLElement {
    if (this.dropdownElement) {
      return this.dropdownElement
    }

    const dropdown = this.renderer.createElement('div') as HTMLElement
    this.renderer.addClass(dropdown, 'mention-autocomplete')
    this.renderer.setAttribute(dropdown, 'role', 'listbox')
    this.renderer.setAttribute(dropdown, 'aria-label', this.localeService.translate('mentions.ariaList'))
    this.renderer.appendChild(document.body, dropdown)
    this.dropdownElement = dropdown
    return dropdown
  }

  private renderDropdown(): void {
    const dropdown = this.ensureDropdown()
    dropdown.innerHTML = ''

    if (this.suggestions.length === 0) {
      const emptyElement = this.renderer.createElement('div')
      this.renderer.addClass(emptyElement, 'mention-autocomplete__empty')
      this.renderer.setProperty(emptyElement, 'textContent', this.localeService.translate('mentions.noResults'))
      this.renderer.appendChild(dropdown, emptyElement)
      this.positionDropdown()
      this.animationService.dropdownIn(dropdown)
      return
    }

    this.suggestions.forEach((user, index) => {
      const item = this.renderer.createElement('button') as HTMLButtonElement
      item.type = 'button'
      this.renderer.addClass(item, 'mention-autocomplete__item')
      if (index === this.activeIndex) {
        this.renderer.addClass(item, 'mention-autocomplete__item--active')
      }
      this.renderer.setAttribute(item, 'role', 'option')
      this.renderer.listen(item, 'mousedown', event => {
        event.preventDefault()
        this.insertMention(user)
      })

      const avatar = this.renderer.createElement('img')
      this.renderer.addClass(avatar, 'mention-autocomplete__avatar')
      this.renderer.setAttribute(avatar, 'src', user.profilePhotoUrl || '/assets/default-avatar.png')
      this.renderer.setAttribute(avatar, 'alt', user.username)
      this.renderer.appendChild(item, avatar)

      const content = this.renderer.createElement('span')
      this.renderer.addClass(content, 'mention-autocomplete__meta')

      const displayName = this.renderer.createElement('strong')
      this.renderer.setProperty(displayName, 'textContent', user.displayName ?? user.username)
      this.renderer.appendChild(content, displayName)

      const username = this.renderer.createElement('span')
      this.renderer.setProperty(username, 'textContent', `@${user.username}`)
      this.renderer.appendChild(content, username)

      this.renderer.appendChild(item, content)
      this.renderer.appendChild(dropdown, item)
      this.animationService.listItemIn(item, index)
    })

    this.positionDropdown()
    this.animationService.dropdownIn(dropdown)
  }

  private positionDropdown(): void {
    if (!this.dropdownElement) {
      return
    }

    const textarea = this.host.nativeElement
    const rect = textarea.getBoundingClientRect()
    const caretPosition = this.getCaretCoordinates(textarea, this.mentionCaret > -1 ? this.mentionCaret : textarea.selectionStart ?? 0)
    const top = Math.min(window.innerHeight - 220, rect.top + caretPosition.top + 28)
    const left = Math.min(window.innerWidth - 260, rect.left + Math.max(12, caretPosition.left - 20))

    this.renderer.setStyle(this.dropdownElement, 'position', 'fixed')
    this.renderer.setStyle(this.dropdownElement, 'top', `${Math.max(8, top)}px`)
    this.renderer.setStyle(this.dropdownElement, 'left', `${Math.max(8, left)}px`)
    this.renderer.setStyle(this.dropdownElement, 'width', 'min(320px, calc(100vw - 16px))')
    this.renderer.setStyle(this.dropdownElement, 'z-index', '1300')
  }

  private getCaretCoordinates(textarea: HTMLTextAreaElement, position: number): { top: number; left: number } {
    const mirror = this.renderer.createElement('div') as HTMLDivElement
    const styles = window.getComputedStyle(textarea)
    const properties = [
      'boxSizing',
      'width',
      'height',
      'overflowX',
      'overflowY',
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'fontStyle',
      'fontVariant',
      'fontWeight',
      'fontStretch',
      'fontSize',
      'fontFamily',
      'lineHeight',
      'textAlign',
      'textTransform',
      'textIndent',
      'textDecoration',
      'letterSpacing',
      'wordSpacing'
    ] as const

    properties.forEach(property => {
      this.renderer.setStyle(mirror, property, styles[property])
    })

    this.renderer.setStyle(mirror, 'position', 'absolute')
    this.renderer.setStyle(mirror, 'visibility', 'hidden')
    this.renderer.setStyle(mirror, 'white-space', 'pre-wrap')
    this.renderer.setStyle(mirror, 'word-wrap', 'break-word')
    this.renderer.setStyle(mirror, 'top', '0')
    this.renderer.setStyle(mirror, 'left', '0')

    const value = textarea.value.slice(0, position)
    mirror.textContent = value

    const marker = this.renderer.createElement('span')
    marker.textContent = '.'
    this.renderer.appendChild(mirror, marker)
    this.renderer.appendChild(document.body, mirror)

    const { offsetTop, offsetLeft } = marker as HTMLSpanElement
    document.body.removeChild(mirror)

    return { top: offsetTop - textarea.scrollTop, left: offsetLeft - textarea.scrollLeft }
  }

  private insertMention(user: User): void {
    const textarea = this.host.nativeElement
    const currentValue = textarea.value
    const end = textarea.selectionStart ?? this.mentionCaret
    const mentionStart = this.mentionStart
    if (mentionStart < 0 || end < mentionStart) {
      return
    }

    const before = currentValue.slice(0, mentionStart)
    const after = currentValue.slice(end)
    const mentionText = `@${user.username} `
    const nextValue = `${before}${mentionText}${after}`

    textarea.value = nextValue
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    this.updateHighlight()

    const caretPosition = before.length + mentionText.length
    textarea.focus()
    textarea.setSelectionRange(caretPosition, caretPosition)
    this.closeDropdown()
  }

  private setupHighlightLayer(): void {
    const textarea = this.host.nativeElement
    const parent = textarea.parentNode

    if (!parent) {
      return
    }

    const wrapper = this.renderer.createElement('div') as HTMLElement
    this.renderer.addClass(wrapper, 'mention-field')

    const highlight = this.renderer.createElement('div') as HTMLElement
    this.renderer.addClass(highlight, 'mention-field__highlight')
    this.renderer.setAttribute(highlight, 'aria-hidden', 'true')

    this.renderer.insertBefore(parent, wrapper, textarea)
    this.renderer.removeChild(parent, textarea)
    this.renderer.appendChild(wrapper, highlight)
    this.renderer.appendChild(wrapper, textarea)
    this.renderer.addClass(textarea, 'mention-field__input')

    const computed = window.getComputedStyle(textarea)
    if (computed.flexGrow !== '0' || computed.flex !== '0 1 auto') {
      this.renderer.setStyle(wrapper, 'flex', computed.flex)
      this.renderer.setStyle(wrapper, 'flex-grow', computed.flexGrow)
      this.renderer.setStyle(wrapper, 'flex-shrink', computed.flexShrink)
      this.renderer.setStyle(wrapper, 'flex-basis', computed.flexBasis)
      this.renderer.setStyle(wrapper, 'min-width', computed.minWidth)
      this.renderer.setStyle(textarea, 'flex', 'unset')
    }

    if (computed.width && computed.width !== 'auto') {
      this.renderer.setStyle(wrapper, 'width', computed.width)
    }

    this.wrapperElement = wrapper
    this.highlightElement = highlight
    this.syncHighlightStyles()
  }

  private observeTextareaResize(): void {
    if (typeof ResizeObserver === 'undefined') {
      return
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.syncHighlightStyles()
      this.syncHighlightScroll()
    })
    this.resizeObserver.observe(this.host.nativeElement)
  }

  private syncHighlightStyles(): void {
    if (!this.highlightElement) {
      return
    }

    const textarea = this.host.nativeElement
    const styles = window.getComputedStyle(textarea)
    const properties = [
      'boxSizing',
      'width',
      'height',
      'minHeight',
      'maxHeight',
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth',
      'borderTopStyle',
      'borderRightStyle',
      'borderBottomStyle',
      'borderLeftStyle',
      'borderRadius',
      'fontStyle',
      'fontVariant',
      'fontWeight',
      'fontStretch',
      'fontSize',
      'fontFamily',
      'lineHeight',
      'letterSpacing',
      'wordSpacing',
      'textAlign',
      'textTransform',
      'textIndent',
      'textDecoration',
      'whiteSpace',
      'wordBreak',
      'overflowWrap',
      'tabSize',
      'overflowX',
      'overflowY'
    ] as const

    properties.forEach(property => {
      this.renderer.setStyle(this.highlightElement, property, styles[property])
    })
  }

  private updateHighlight(): void {
    if (!this.highlightElement) {
      return
    }

    this.syncHighlightStyles()
    this.highlightElement.innerHTML = this.buildHighlightHtml(this.host.nativeElement.value)
    this.syncHighlightScroll()
  }

  private syncHighlightScroll(): void {
    if (!this.highlightElement) {
      return
    }

    const textarea = this.host.nativeElement
    this.highlightElement.scrollTop = textarea.scrollTop
    this.highlightElement.scrollLeft = textarea.scrollLeft
  }

  private buildHighlightHtml(value: string): string {
    if (!value) {
      return ''
    }

    const parts = value.split(/(@[a-zA-Z0-9._-]+)/)

    return parts
      .map(part => {
        const escaped = this.escapeHtml(part)

        if (MentionAutocompleteDirective.mentionTokenExact.test(part)) {
          return `<span class="mention-field__token">${escaped}</span>`
        }

        return escaped
      })
      .join('') + (value.endsWith('\n') ? '<br>' : '')
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  private closeDropdown(): void {
    this.suggestions = []
    this.activeIndex = -1
    this.mentionStart = -1
    this.mentionCaret = -1

    if (!this.dropdownElement) {
      return
    }

    const dropdown = this.dropdownElement
    this.dropdownElement = null
    this.ngZone.runOutsideAngular(() => {
      queueMicrotask(() => {
        dropdown.remove()
      })
    })
  }
}
