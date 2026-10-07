export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "guide" | "lead-guide" | "admin";
  photo?: string;
  profileImage?: string;
  bio?: string;
  phone?: string;
  phoneNumber?: string;
  languages?: string[];
  certifications?: string[];
  assignedTours?: unknown[];
  createdAt?: string;
}

export interface TourLocation {
  type: "Point";
  coordinates: [number, number];
  address: string;
  city?: string;
  country?: string;
  region?: string;
}

export interface Tour {
  _id: string;
  name: string;
  slug: string;
  duration: number;
  maxGroupSize: number;
  difficulty: "easy" | "medium" | "difficult";
  price: number;
  priceDiscount?: number;
  summary: string;
  description: string;
  imageCover: string;
  images: string[];
  startDates: string[];
  ratingsAverage: number;
  ratingsQuantity: number;
  category: string;
  location: TourLocation;
  featured?: boolean;

  hasUserReviewed?: boolean;
  distance?: number;
  distanceUnit?: string;
}

export interface Review {
  _id: string;
  review: string;
  rating: number;
  title?: string;
  user: User | string;
  tour: Tour | string;
  status: "pending" | "approved" | "rejected" | "flagged";
  helpfulCount: number;
  isVerifiedPurchase?: boolean;
  isRecommended?: boolean;
  response?: ReviewResponse;
  createdAt: string;
}

export interface ReviewResponse {
  text: string;
  respondedBy: string | User;
  respondedAt: string;
}

export interface ApiListResponse<T> {
  status: "success";
  results: number;
  total?: number;
  page?: number;
  pages?: number;
  data: Record<string, T[]>;
}

export interface ApiSingleResponse<T> {
  status: "success";
  data: Record<string, T>;
}

export interface TourFilters {
  q: string;
  difficulty: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  maxDuration: string;
  category: string;
  sort: string;
}

export interface TourQueryParams {
  q?: string;
  difficulty?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxDuration?: number;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;

  lat?: number;
  lng?: number;

  radius?: number;
}
