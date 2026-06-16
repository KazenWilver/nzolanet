import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-media-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-preview.component.html',
  styleUrl: './media-preview.component.scss'
})
export class MediaPreviewComponent {
  @Input() imagemUrl?: string;
  @Input() videoUrl?: string;

  abrirImagem(): void {
    if (this.imagemUrl) window.open(this.imagemUrl, '_blank');
  }
}