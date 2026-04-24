import type { Tour } from '@/lib/types';

// ---------------------------------------------------------------------------
// Derived "Кому подходит" block.
//
// No new fields in Tour type. The audience cards are inferred from existing
// data (badges, difficulty, minAge, maxGroupSize, durationDays). If we can't
// derive at least 2 cards, the parent can skip rendering the section.
// ---------------------------------------------------------------------------

type AudienceIcon =
  | 'family' | 'relax' | 'culture' | 'mountains' | 'sea' | 'group' | 'easy' | 'active' | 'weekend';

interface AudienceItem {
  icon: AudienceIcon;
  title: string;
  text: string;
}

function Icon({ name }: { name: AudienceIcon }) {
  const common = 'w-5 h-5';
  switch (name) {
    case 'family':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584M18 18.72a5.971 5.971 0 00-.941-3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      );
    case 'relax':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      );
    case 'culture':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
        </svg>
      );
    case 'mountains':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
        </svg>
      );
    case 'sea':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      );
    case 'group':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      );
    case 'easy':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'active':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      );
    case 'weekend':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      );
  }
}

function deriveAudience(tour: Tour): AudienceItem[] {
  const out: AudienceItem[] = [];
  const has = (b: Tour['badges'][number]) => tour.badges.includes(b);

  if (has('family') || has('kids')) {
    out.push({
      icon: 'family',
      title: 'Семьям с детьми',
      text: tour.minAge
        ? `Комфортный темп, подойдёт детям от ${tour.minAge} лет`
        : 'Комфортный темп и понятная программа для детей',
    });
  }

  if (has('relax')) {
    out.push({
      icon: 'relax',
      title: 'Для спокойного отдыха',
      text: 'Без спешки, со свободным временем и возможностью побыть наедине с природой',
    });
  }

  if (has('culture')) {
    out.push({
      icon: 'culture',
      title: 'Любителям культуры',
      text: 'Города, архитектура, музеи, гиды на ключевых локациях',
    });
  }

  if (has('mountains')) {
    out.push({
      icon: 'mountains',
      title: 'Любителям гор и природы',
      text: 'Панорамы, чистый воздух, прогулки с видами',
    });
  }

  if (has('sea')) {
    out.push({
      icon: 'sea',
      title: 'Для моря и набережных',
      text: 'Купание (в сезон), морские виды, прогулки вдоль побережья',
    });
  }

  if (tour.difficulty === 'easy') {
    out.push({
      icon: 'easy',
      title: 'Без физической подготовки',
      text: 'Маршрут простой, подойдёт почти любому возрасту и уровню',
    });
  } else if (tour.difficulty === 'hard') {
    out.push({
      icon: 'active',
      title: 'Активным путешественникам',
      text: 'Нужна готовность к физической нагрузке и длинным переходам',
    });
  }

  if (has('weekend') || tour.durationDays <= 2) {
    out.push({
      icon: 'weekend',
      title: 'Короткий формат — на выходные',
      text: 'Можно уехать быстро и без долгого отпуска',
    });
  }

  if (tour.maxGroupSize && tour.maxGroupSize <= 16) {
    out.push({
      icon: 'group',
      title: 'Камерный формат',
      text: `Небольшая группа — до ${tour.maxGroupSize} человек`,
    });
  }

  // Deduplicate by title (e.g., mountains + hard both may apply; keep first occurrence).
  const seen = new Set<string>();
  const unique = out.filter((item) => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });

  return unique.slice(0, 4);
}

export default function TourAudience({ tour }: { tour: Tour }) {
  const items = deriveAudience(tour);
  if (items.length < 2) return null;

  return (
    <section>
      <div className="mb-6 lg:mb-8">
        <span className="eyebrow">Кому подходит</span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Этот тур хорошо зайдёт, если вы...
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-2xl p-5 border border-gray-200/70 shadow-card hover:shadow-card-hover hover:border-brand-200 transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-700 shrink-0">
                <Icon name={item.icon} />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">{item.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
