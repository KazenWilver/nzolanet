export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  publicationId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorPhotoUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface CreateCommentDto {
  text?: string;
}

export interface BackendCommentDto {
  id: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  publicationId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorPhotoUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
}
