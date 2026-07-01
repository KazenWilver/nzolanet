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
  repostsCount: number;
  hasLiked?: boolean;
  hasReposted?: boolean;
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
  repostsCount?: number;
  hasLiked?: boolean;
  hasReposted?: boolean;
}

export interface PaginatedPublications {
  items: Publication[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

export interface BackendPaginatedPublicationsDto {
  items: BackendPublicationDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}
