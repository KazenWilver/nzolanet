import type { User } from './user.model';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface BackendAuthResponseDto {
  token: string;
  user: BackendUserDto;
}

export interface BackendUserDto {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  profilePhotoUrl?: string;
  profilePhoto?: string;
  coverPhotoUrl?: string;
  coverPhoto?: string;
  email?: string;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  createdAt: string;
  role?: string;
  isFollowing?: boolean;
  isPending?: boolean;
  hasIncomingFollowRequest?: boolean;
}
