import { UserRole } from '../services/users';

export { UserRole };

export interface SocialMedia {
  id: string;
  type: string;
  url: string;
  username: string;
  followers: number;
}

export interface Profile {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  websiteUrl: string;
  location: string;
  niches?: string[];
  contentTypes?: string[];
  languages?: string[];
  followersCount?: number;
  companyName?: string;
  industry?: string;
  categories?: string[];
  socialMedia: SocialMedia[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  profileImage?: string;
  coverImage?: string;
  bio?: string;
  followers?: number;
  engagementRate?: number;
  categories?: string[];
  languages?: string[];
  description?: string;
  industry?: string;
  location?: string;
  activeOrders?: number;
  totalSpent?: number;
  profile?: Profile;
  createdAt: string;
  updatedAt: string;
} 