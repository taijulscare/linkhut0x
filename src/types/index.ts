/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'editor' | 'user';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  enabled: boolean;
  postCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ScreenshotItem {
  id: string;
  url: string;
  order: number;
  caption?: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  thumbnailUrl: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  tags: string[];
  downloadUrl: string;
  requiredAds: number;
  screenshots: ScreenshotItem[];
  published: boolean;
  publishDate: string; // ISO date string or formatted date
  views: number;
  likes: number;
  featured?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type AdPlacement = 
  | 'homepage_top' 
  | 'homepage_between' 
  | 'homepage_bottom' 
  | 'post_top' 
  | 'post_middle' 
  | 'post_bottom' 
  | 'sidebar';

export type AdProviderType = 'adsterra' | 'monetag' | 'telegram' | 'custom';

export interface AdUnit {
  id: string;
  provider: AdProviderType;
  placement: AdPlacement;
  title: string;
  code: string;
  active: boolean;
  frequency?: number; // e.g. every 5 posts for between-posts
  createdAt: number;
  updatedAt: number;
}

export interface SiteSettings {
  id: string;
  siteName: string;
  siteDescription: string;
  logoUrl?: string;
  defaultTheme: 'light' | 'dark' | 'system';
  defaultRequiredAds: number;
  postsPerPage: number;
  adFrequency: number;
  monetizationEnabled: boolean;
  downloadTimerSeconds: number;
  socialLinks?: {
    telegram?: string;
    twitter?: string;
    github?: string;
    youtube?: string;
  };
  contactEmail?: string;
  updatedAt: number;
}

export interface LikeRecord {
  id: string;
  postId: string;
  userId: string;
  createdAt: number;
}

export interface AdRewardProgress {
  requiredCount: number;
  completedCount: number;
  isUnlocked: boolean;
}

export interface AdRewardProvider {
  name: string;
  showRewardedAd: (stepIndex: number) => Promise<boolean>;
}
