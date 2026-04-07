import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50/50">
      <div className="max-w-lg mx-auto px-4 text-center">
        <p className="text-8xl font-extrabold text-brand-600/20 tracking-tighter select-none">404</p>
        <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Страница не найдена
        </h1>
        <p className="mt-3 text-gray-500 leading-relaxed">
          Возможно, маршрут изменился или страница была удалена. Посмотрите наши поездки или вернитесь на главную.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/tours"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 text-white px-7 py-3.5 rounded-2xl text-sm font-bold hover:from-brand-700 hover:to-brand-800 transition-all shadow-md shadow-brand-600/20"
          >
            Все поездки
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-7 py-3.5 rounded-2xl text-sm font-semibold border border-gray-200 hover:border-brand-200 hover:text-brand-600 transition-all"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
