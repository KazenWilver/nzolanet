export interface Publication {
  id: string;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorPhotoUrl?: string;
  likesCount: number;
  commentsCount: number;
  hasLiked?: boolean;
}

export interface UpdatePublicationDto {
  text: string;
}

export interface BackendPublicationDto {
  id: string;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorPhotoUrl?: string;
  likesCount: number;
  commentsCount: number;
  hasLiked?: boolean;
}
