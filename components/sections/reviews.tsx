import { reviews } from '@/data/mock-tours';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Рейтинг ${rating} из 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const AVATAR_TONES = [
  'from-brand-500 to-brand-700',
  'from-warm-400 to-warm-600',
  'from-sky-500 to-indigo-600',
  'from-emerald-500 to-teal-700',
  'from-rose-400 to-rose-600',
  'from-amber-400 to-orange-600',
];

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Reviews() {
  const avgRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / Math.max(reviews.length, 1)
  ).toFixed(1);

  return (
    <section className="section-y bg-stone-50/60">
      <div className="container-page">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 lg:mb-14">
          <div className="max-w-2xl">
            <span className="eyebrow">Отзывы</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Что говорят путешественники
            </h2>
            <p className="mt-3 text-base sm:text-lg text-gray-500 leading-relaxed">
              Короткие поездки на выходные, семейные выезды и насыщенные маршруты — каждый выбирает свой формат отдыха.
            </p>
          </div>
          <div className="inline-flex items-center gap-3 bg-white border border-gray-200/70 rounded-2xl px-5 py-3 shadow-card shrink-0 self-start sm:self-auto">
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none">{avgRating}</span>
              <span className="text-[11px] text-gray-500 mt-1">средний рейтинг</span>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex flex-col">
              <StarRating rating={5} />
              <span className="text-[11px] text-gray-500 mt-1">на основе отзывов</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {reviews.map((review, i) => (
            <article
              key={review.id}
              className="bg-white rounded-2xl p-6 border border-gray-200/70 hover:border-brand-200 hover:shadow-card-hover transition-all duration-300"
            >
              <StarRating rating={review.rating} />
              <p className="mt-4 text-gray-700 text-[15px] leading-relaxed">
                {review.text}
              </p>
              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_TONES[i % AVATAR_TONES.length]} text-white font-bold text-sm flex items-center justify-center shrink-0`}
                  aria-hidden
                >
                  {getInitials(review.author)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{review.author}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {review.city} · {new Date(review.date).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
