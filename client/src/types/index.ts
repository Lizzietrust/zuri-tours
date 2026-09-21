export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "guide" | "lead-guide" | "admin";
  photo?: string;
  bio?: string;
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
  createdAt: string;
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

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "guide" | "lead-guide" | "admin";
  photo?: string;
  bio?: string;
  phone?: string;
  languages?: string[];
  certifications?: string[];
  assignedTours?: unknown[];
  createdAt?: string;
}
