// Barrel export do módulo de comentários.
// Centraliza os imports dos componentes de comentários para que outros módulos
// não precisem de conhecer os caminhos internos de shared/components.
// Uso: import { CommentFormComponent, CommentItemComponent } from '../../features/comments/comments.module'
export { CommentFormComponent } from '../../shared/components/comment-form/comment-form.component';
export { CommentItemComponent } from '../../shared/components/comment-item/comment-item.component';