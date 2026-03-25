export const COMPANY = {
  name: 'KRASKI.TRAVEL',
  fullName: 'ООО «Краски Тревел»',
  tagline: 'Семейные, взрослые и сборные путешествия по России',
  description:
    'KRASKI.TRAVEL — семейные туры, взрослые и сборные поездки по России. Готовые маршруты в удобных форматах, понятная организация и простая бронь.',
  /** Год регистрации юрлица (по данным ЕГРЮЛ) */
  foundedYear: 2025,

  inn: '2308299813',
  kpp: '230801001',
  ogrn: '1252300002316',

  /** Юридический адрес (ЕГРЮЛ) */
  address: '350004, Краснодарский край, г. Краснодар, ул. им. Володи Головатого, д. 252',
  workingHours: 'Пн–Пт 9:00–19:00, Сб 10:00–16:00',
} as const;

/** E.164 без пробелов — для tel: и мессенджеров */
const PHONE_E164 = '+79282088885';

export const CONTACTS = {
  phone: '+7 (928) 208-88-85',
  phoneRaw: PHONE_E164,

  whatsapp: {
    number: '79282088885',
    url: 'https://wa.me/79282088885',
    label: 'WhatsApp',
  },

  /** Уточните публичный @username у команды; сейчас — единый брендовый канал */
  telegram: {
    username: 'kraskitravel',
    url: 'https://t.me/kraskitravel',
    label: 'Telegram',
  },

  /** Замените на ссылку-профиль в MAX, когда будет готов канал компании */
  max: {
    url: 'https://max.ru',
    label: 'MAX',
  },

  /** Рабочая почта: при необходимости замените на фактический ящик */
  email: 'office@kraski.travel',
} as const;

export const SITE = {
  url: 'https://kraski.travel',
  defaultTitle: `${COMPANY.name} — семейные туры и поездки по России`,
  titleSuffix: ` | ${COMPANY.name}`,
  defaultDescription: COMPANY.description,
} as const;
