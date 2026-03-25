import { reviews } from '@/data/mock-tours';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
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

export default function Reviews() {
  return (
    <section className="py-20 lg:py-28 bg-stone-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Отзывы путешественников
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Короткие путешествия на выходные, семейные выезды и насыщенные маршруты — каждый выбирает свой формат отдыха.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative"
            >
              <div className="absolute top-5 right-6 text-brand-100 text-4xl font-serif leading-none select-none">&ldquo;</div>
              <StarRating rating={review.rating} />
              <p className="mt-4 text-gray-600 text-[15px] leading-relaxed relative">
                {review.text}
              </p>
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{review.author}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{review.city}</p>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(review.date).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
