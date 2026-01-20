/**
 * Gallery Type Definitions
 *
 * TypeScript interfaces for the admin photo gallery feature.
 */

export interface GalleryMetadata {
  celebrityName: string;
  generationMode: 'go1' | 'freestyle';
  promptText?: string;
  userPhotoUrl?: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
}

export interface GalleryPhoto {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  metadata: GalleryMetadata;
  timestamp: number;
  size?: number; // in bytes
}

export interface GalleryStats {
  totalPhotos: number;
  popularCelebrities: {
    name: string;
    count: number;
  }[];
  modeBreakdown: {
    go1: number;
    freestyle: number;
  };
  timeline?: {
    date: string;
    count: number;
  }[];
  averageSize?: number;
  storageUsed?: number; // in MB
}

export interface GalleryFilters {
  celebrityFilter: string | null; // null = all
  modeFilter: 'all' | 'go1' | 'freestyle';
  storageFilter: 'all' | 'cloud' | 'local';
  dateRange: {
    from: number | null;
    to: number | null;
  };
  sortBy: 'newest' | 'oldest' | 'celebrity-az' | 'celebrity-za';
  searchQuery: string;
}

export type GalleryExportFormat = 'zip' | 'json' | 'individual';

export interface GalleryStorageData {
  photos: GalleryPhoto[];
  version: number; // for future migrations
  lastUpdated: number;
}
