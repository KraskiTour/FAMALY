export type Badge = 'hit' | 'new' | 'hot' | 'kids' | 'family' | 'weekend' | 'sea' | 'mountains' | 'city' | 'train' | 'bus';

export interface DepartureCity {
  city: string;
  slug: string;
  meetingPoint?: string;
  departureTime?: string;
}

export type TourDateStatus = 'open' | 'few_seats' | 'sold_out' | 'confirmed';

export interface TourDate {
  start: string;
  end: string;
  price: number;
  seatsLeft: number;
  status?: TourDateStatus;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  images?: string[];
}

export interface TourOrganizationalInfo {
  meetingPoint?: string;
  checkIn?: string;
  checkOut?: string;
  programStart?: string;
  programEnd?: string;
}

export interface Tour {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  departureCities: DepartureCity[];
  destination: string;
  region: string;
  durationDays: number;
  seasonMonths: number[];
  priceFrom: number;
  oldPrice: number | null;
  nextDates: TourDate[];
  included: string[];
  excluded: string[];
  itinerary: ItineraryDay[];
  gallery: string[];
  badges: Badge[];
  transport: string;
  meals: string;
  hotel: string;
  difficulty: 'easy' | 'medium' | 'hard';
  seoTitle: string;
  seoDescription: string;
  isPublished?: boolean;
  highlights?: string[];
  minGroupSize?: number;
  maxGroupSize?: number;
  minAge?: number;
  organizationalInfo?: TourOrganizationalInfo;
}

export interface City {
  name: string;
  slug: string;
  region: string;
  nameGenitive: string;
  description: string;
}

export interface Destination {
  name: string;
  slug: string;
  region: string;
  description: string;
  image: string;
}

export interface Review {
  id: string;
  author: string;
  city: string;
  tourSlug: string;
  rating: number;
  text: string;
  date: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  tourSlug: string | null;
}

export const BADGE_LABELS: Record<Badge, string> = {
  hit: 'Хит',
  new: 'Новинка',
  hot: 'Горящий',
  kids: 'С детьми',
  family: 'Семьям',
  weekend: 'Выходные',
  sea: 'Море',
  mountains: 'Горы',
  city: 'Город',
  train: 'Поезд',
  bus: 'Автобус',
};

export const BADGE_COLORS: Record<Badge, string> = {
  hit: 'bg-amber-500/85 backdrop-blur-sm',
  new: 'bg-indigo-500/85 backdrop-blur-sm',
  hot: 'bg-rose-500/85 backdrop-blur-sm',
  kids: 'bg-teal-500/85 backdrop-blur-sm',
  family: 'bg-brand-600/85 backdrop-blur-sm',
  weekend: 'bg-violet-500/85 backdrop-blur-sm',
  sea: 'bg-sky-500/85 backdrop-blur-sm',
  mountains: 'bg-emerald-600/85 backdrop-blur-sm',
  city: 'bg-orange-500/85 backdrop-blur-sm',
  train: 'bg-slate-600/85 backdrop-blur-sm',
  bus: 'bg-cyan-600/85 backdrop-blur-sm',
};
