import { CONTACTS } from '@/lib/config';

function appendStartApp(baseUrl: string, tourId: string): string {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}startapp=${encodeURIComponent(tourId)}`;
}

export function getTelegramMiniAppUrl(tourId: string): string {
  const botUsername = CONTACTS.telegram.botUsername;

  if (!botUsername) {
    return CONTACTS.telegram.url;
  }

  return appendStartApp(`https://t.me/${botUsername}`, tourId);
}

export function getMaxMiniAppUrl(tourId: string): string {
  return appendStartApp(CONTACTS.max.botUrl, tourId);
}
