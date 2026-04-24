interface TourIncludesProps {
  included: string[];
  excluded: string[];
}

export default function TourIncludes({ included, excluded }: TourIncludesProps) {
  return (
    <section>
      <div className="mb-6 lg:mb-8">
        <span className="eyebrow">Стоимость</span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Что входит в цену
        </h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Прозрачный список — чтобы вы видели ровно то, за что платите
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-brand-100 shadow-card">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-50 text-brand-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.4} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
            <h3 className="text-base font-bold text-gray-900">Включено в стоимость</h3>
          </div>
          <ul className="space-y-3">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-card">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.4} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
              </svg>
            </span>
            <h3 className="text-base font-bold text-gray-900">Не входит — оплачивается отдельно</h3>
          </div>
          <ul className="space-y-3">
            {excluded.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
                <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-400 shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
