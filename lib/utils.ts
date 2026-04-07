import type { Tour } from './types';

export const FOREIGN_REGIONS = new Set([
  'Грузия', 'Турция', 'Узбекистан', 'Абхазия', 'Беларусь',
]);

export const FOREIGN_DEST_NAMES = new Set([
  'Грузия', 'Стамбул', 'Узбекистан', 'Армения', 'Абхазия', 'Беларусь',
]);

export function getProductLabel(tour: Tour): { text: string; cls: string } | null {
  if (FOREIGN_REGIONS.has(tour.region)) {
    return { text: 'За рубеж', cls: 'text-amber-700 bg-amber-50' };
  }
  if (
    tour.durationDays <= 1 &&
    tour.badges.includes('city') &&
    !tour.badges.includes('bus') &&
    !tour.badges.includes('train')
  ) {
    return { text: 'Экскурсия', cls: 'text-orange-700 bg-orange-50' };
  }
  if (tour.departureCities.length === 0 && tour.durationDays >= 2) {
    return { text: 'Старт по месту', cls: 'text-sky-700 bg-sky-50' };
  }
  return null;
}

export function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU') + ' ₽';
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} — ${formatDate(end)}`;
}

export function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} день`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} дня`;
  return `${n} дней`;
}

export function pluralTours(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} тур`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} тура`;
  return `${n} туров`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
