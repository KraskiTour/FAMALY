import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-brand-900 via-gray-900 to-stone-950 overflow-hidden">
      <div className="absolute inset-0">
        <div className="brand-blob brand-blob-teal w-[600px] h-[500px] -top-20 -right-20 opacity-80" />
        <div className="brand-blob brand-blob-warm w-[400px] h-[350px] bottom-0 left-10 opacity-70" />
        <div className="brand-blob brand-blob-sky w-[350px] h-[300px] top-1/3 right-1/4 opacity-50" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-40">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/[0.07] backdrop-blur-md border border-white/[0.08] rounded-full px-4 py-1.5 mb-8">
            <div className="w-2 h-2 bg-brand-400 rounded-full" />
            <span className="text-brand-200/90 text-sm font-medium">Бронирование открыто на лето 2026</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold text-white leading-[1.08] tracking-tight">
            Путешествия, которые
            <br />
            <span className="bg-gradient-to-r from-brand-300 to-teal-300 bg-clip-text text-transparent">легко выбрать и приятно вспоминать</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl">
            Семейные, взрослые и сборные поездки по России — автобусом, поездом
            и в других удобных форматах. Выбирайте маршрут и&nbsp;бронируйте без лишней суеты.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/tours"
              className="group/cta inline-flex items-center justify-center gap-2.5 bg-white text-brand-900 px-8 py-4 rounded-2xl text-base font-bold hover:bg-brand-50 transition-all shadow-xl shadow-brand-950/30"
            >
              Подобрать поездку
              <svg className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/#goroda-vyezda"
              className="inline-flex items-center justify-center border border-white/15 bg-white/[0.04] backdrop-blur-md text-white px-8 py-4 rounded-2xl text-base font-semibold hover:bg-white/[0.08] hover:border-white/25 transition-all"
            >
              Смотреть направления
            </Link>
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
          {[
            'Поездки для семей, взрослых и небольших компаний',
            'Автобусные, железнодорожные и комбинированные маршруты',
            'Выходные, каникулы и многодневные путешествия',
          ].map((text) => (
            <div key={text} className="flex items-start gap-3">
              <svg className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-sm text-gray-300/90 leading-snug">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
