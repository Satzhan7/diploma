export enum UserRole {
  ADMIN = 'admin',
  BRAND = 'brand',
  INFLUENCER = 'influencer',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  profile?: {
    id: string;
    avatarUrl?: string;
    type: 'brand' | 'influencer';
  };
  createdAt: string;
  updatedAt: string;
} 