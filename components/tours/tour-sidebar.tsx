import { Tour } from '@/lib/types';
import { CONTACTS } from '@/lib/config';
import { formatPrice, formatDateRange, pluralDays } from '@/lib/utils';

interface TourSidebarProps {
  tour: Tour;
}

export default function TourSidebar({ tour }: TourSidebarProps) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100/60 p-6 sticky top-24">
      <div className="mb-5 pb-5 border-b border-gray-100">
        {tour.oldPrice && (
          <span className="text-sm text-gray-400 line-through block mb-1">
            {formatPrice(tour.oldPrice)}
          </span>
        )}
        <div className="text-3xl font-extrabold text-gray-900">{formatPrice(tour.priceFrom)}</div>
        <p className="text-sm text-gray-500 mt-1">за человека</p>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-sm">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-700">{pluralDays(tour.durationDays)}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <span className="text-gray-700">{tour.transport}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-gray-700">{tour.hotel}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.126-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z" />
          </svg>
          <span className="text-gray-700">{tour.meals}</span>
        </div>
        {tour.maxGroupSize && (
          <div className="flex items-center gap-3 text-sm">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span className="text-gray-700">Группа до {tour.maxGroupSize} чел.</span>
          </div>
        )}
      </div>

      {tour.nextDates.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Ближайшие даты</h3>
          <div className="space-y-2">
            {tour.nextDates.map((date) => (
              <div
                key={date.start}
                className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2.5"
              >
                <span className="text-gray-700">
                  {formatDateRange(date.start, date.end)}
                </span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">{formatPrice(date.price)}</span>
                  {date.seatsLeft <= 10 && (
                    <p className="text-xs text-orange-500">ещё {date.seatsLeft} мест</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tour.departureCities.some((dc) => dc.departureTime) && (
        <div className="mb-6 p-3 bg-brand-50/50 rounded-xl">
          <h3 className="text-xs font-semibold text-brand-800 uppercase tracking-wider mb-2">Отправление</h3>
          <div className="space-y-1.5">
            {tour.departureCities.filter((dc) => dc.departureTime).map((dc) => (
              <div key={dc.slug} className="flex justify-between text-sm">
                <span className="text-gray-700">{dc.city}</span>
                <span className="font-semibold text-gray-900">{dc.departureTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white py-3.5 rounded-2xl text-base font-bold hover:from-brand-700 hover:to-brand-800 transition-all shadow-md shadow-brand-600/15 hover:scale-[1.02]">
          Забронировать место
        </button>
        <a
          href={CONTACTS.whatsapp.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-green-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Написать в WhatsApp
        </a>
        <a
          href={CONTACTS.telegram.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-blue-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          Написать в Telegram
        </a>
        <a
          href={CONTACTS.max.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 bg-violet-600 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-violet-700 transition-colors"
        >
          Написать в MAX
        </a>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
        {[
          'Условия отмены и переноса — при бронировании',
          'Детали поездки фиксируем до выезда',
          'Связь в мессенджерах и по телефону',
        ].map((text) => (
          <div key={text} className="flex items-start gap-2">
            <svg className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-xs text-gray-500">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
