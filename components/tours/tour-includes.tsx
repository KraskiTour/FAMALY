interface TourIncludesProps {
  included: string[];
  excluded: string[];
}

export default function TourIncludes({ included, excluded }: TourIncludesProps) {
  return (
    <section>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-8 tracking-tight">Что включено</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-brand-50/50 rounded-xl p-5">
          <h3 className="text-[11px] font-bold text-brand-700 uppercase tracking-wider mb-4">
            Включено в стоимость
          </h3>
          <ul className="space-y-3">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                <svg className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4">
            Не включено
          </h3>
          <ul className="space-y-3">
            {excluded.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-gray-500">
                <svg className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
