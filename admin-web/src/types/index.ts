export type UserRole = 'customer' | 'admin';
export type AuthProvider = 'local' | 'google';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  authProvider?: AuthProvider;
  createdAt?: string;
  updatedAt?: string;
}

export interface Guesthouse {
  _id: string;
  name: string;
  logo: string;
  gallery: string[];
  description: string;
  amenities: string[];
  pricePerNight: number;
  city: string;
  country: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  contact?: {
    phone: string;
    email: string;
  };
  verificationStatus?: 'pending' | 'verified' | 'rejected' | string;
  verifiedBy?: string;
  verifiedAt?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  // Computed fields from aggregation
  averageRating?: number;
  ratingsCount?: number;
  favouritesCount?: number;
}

export interface Rating {
  _id: string;
  guesthouseId: string | Guesthouse;
  customerId: string | User;
  rating: number;
  comment?: string;
  createdAt: string;
}

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface Report {
  _id: string;
  customerId: User | string;
  ratingId: Rating | string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: User | string;
}

export interface DashboardStats {
  totalGuesthouses: number;
  topCity: string;
  topRatedStay: {
    name: string;
    rating: number;
  } | null;
  avgPrice: number;
  cityCounts: { city: string; count: number }[];
  recentlyAdded: Guesthouse[];
}

export type ThemeMode = 'light' | 'dark' | 'system';
