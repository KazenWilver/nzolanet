import type { BackendUserDto } from './auth.model';
import { resolveMediaUrl } from '../helpers/media-url.helper';

export interface User {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  bio?: string;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  createdAt: string;
  role?: string;
  isFollowing?: boolean;
  isPending?: boolean;
  hasIncomingFollowRequest?: boolean;
}

export interface UpdateProfileDto {
  displayName?: string;
  bio?: string;
  isPrivate?: boolean;
}

export const mapBackendUser = (dto: BackendUserDto): User => ({
  id: dto.id,
  username: dto.username,
  displayName: dto.displayName,
  email: dto.email,
  bio: dto.bio,
  profilePhotoUrl: resolveMediaUrl(dto.profilePhotoUrl ?? dto.profilePhoto),
  coverPhotoUrl: resolveMediaUrl(dto.coverPhotoUrl ?? dto.coverPhoto),
  isPrivate: dto.isPrivate ?? false,
  followersCount: dto.followersCount ?? 0,
  followingCount: dto.followingCount ?? 0,
  createdAt: dto.createdAt,
  role: dto.role,
  isFollowing: dto.isFollowing,
  isPending: dto.isPending,
  hasIncomingFollowRequest: dto.hasIncomingFollowRequest
});
