'use client';

import { useState } from 'react';
import { Tour } from '@/lib/types';
import { CONTACTS } from '@/lib/config';
import { formatPrice, formatDateRange, pluralDays } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

interface TourSidebarProps {
  tour: Tour;
}

// How many nearest dates we show before the "Show all" toggle kicks in.
// Picked to fill roughly one viewport chunk in the sidebar — tours with 10+
// date lines were making the right column very tall and visually heavy.
const DATES_VISIBLE_BY_DEFAULT = 6;

export default function TourSidebar({ tour }: TourSidebarProps) {
  const SOURCE_LINK_PASSWORD = '0001';
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [sent, setSent] = useState(false);
  const [showAllDates, setShowAllDates] = useState(false);

  const hasHiddenDates = tour.nextDates.length > DATES_VISIBLE_BY_DEFAULT;
  const visibleDates = showAllDates || !hasHiddenDates
    ? tour.nextDates
    : tour.nextDates.slice(0, DATES_VISIBLE_BY_DEFAULT);
  const hiddenDatesCount = tour.nextDates.length - DATES_VISIBLE_BY_DEFAULT;

  const handleSubmit = () => {
    const msg = [
      `Здравствуйте! Хочу узнать подробнее о туре «${tour.title}».`,
      name ? `Меня зовут ${name}.` : '',
      contact ? `Связаться со мной: ${contact}` : '',
    ].filter(Boolean).join('\n');
    trackEvent('submit_tour_lead_form', { tour: tour.slug });
    window.open(`${CONTACTS.whatsapp.url}?text=${encodeURIComponent(msg)}`, '_blank');
    setSent(true);
  };

  const handleSourceOpen = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!tour.sourceUrl) return;

    const entered = window.prompt('Введите пароль для перехода к источнику');
    if (entered !== SOURCE_LINK_PASSWORD) {
      window.alert('Неверный пароль');
      return;
    }

    window.open(tour.sourceUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="booking" className="bg-white rounded-2xl shadow-elevated border border-gray-100 p-6 lg:sticky lg:top-24">
      <div className="mb-5 pb-5 border-b border-gray-100">
        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
          Стоимость тура
        </p>
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
            от {formatPrice(tour.priceFrom)}
          </span>
          {tour.oldPrice && (
            <span className="text-base text-gray-400 line-through">
              {formatPrice(tour.oldPrice)}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">за человека · без скрытых доплат</p>
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Ближайшие даты</h3>
            <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-2 py-0.5">
              {tour.nextDates.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {visibleDates.map((date, idx) => {
              const lowSeats = date.seatsLeft != null && date.seatsLeft <= 10;
              return (
                <div
                  key={`${date.start}-${idx}`}
                  className="flex items-center justify-between gap-3 text-sm bg-gray-50/80 hover:bg-brand-50/60 border border-gray-100 rounded-xl px-3.5 py-2.5 transition-colors"
                >
                  <span className="text-gray-800 font-medium">
                    {formatDateRange(date.start, date.end)}
                  </span>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-gray-900">{formatPrice(date.price)}</span>
                    {lowSeats && (
                      <p className="text-[11px] text-orange-600 font-semibold leading-tight">
                        ещё {date.seatsLeft} мест
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {hasHiddenDates && (
            <button
              type="button"
              onClick={() => setShowAllDates((v) => !v)}
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-brand-700 hover:text-brand-800 bg-brand-50/60 hover:bg-brand-50 border border-brand-100 rounded-xl px-3 py-2 transition-colors"
              aria-expanded={showAllDates}
            >
              {showAllDates ? (
                <>Свернуть список</>
              ) : (
                <>Показать все даты <span className="text-brand-500">+{hiddenDatesCount}</span></>
              )}
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showAllDates ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          )}
        </div>
      )}

      {tour.departureCities.length === 0 ? (
        <div className="mb-6 p-3 bg-brand-50/50 rounded-xl">
          <h3 className="text-xs font-semibold text-brand-800 uppercase tracking-wider mb-2">Старт и логистика</h3>
          <div className="space-y-1.5 text-sm text-gray-700">
            <p>Программа начинается по месту проведения</p>
            <p className="text-brand-700 font-medium">Поможем подобрать билеты и удобный маршрут до старта тура</p>
          </div>
        </div>
      ) : tour.departureCities.some((dc) => dc.departureTime) ? (
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
      ) : null}

      <div className="space-y-2.5">
        {!showForm ? (
          <>
            {tour.atomsTourId && (
              <a
                href={`/booking?tour=${tour.atomsTourId}`}
                onClick={() => trackEvent('click_booking_atoms', { tour: tour.slug, atomsTourId: tour.atomsTourId! })}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 text-white py-3.5 rounded-2xl text-base font-bold hover:from-brand-700 hover:to-brand-800 transition-all duration-200 shadow-button hover:shadow-elevated hover:scale-[1.01]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
                Забронировать онлайн
              </a>
            )}
            <button
              type="button"
              onClick={() => { trackEvent('open_tour_lead_form', { tour: tour.slug }); setShowForm(true); }}
              className={`w-full ${
                tour.atomsTourId
                  ? 'bg-white text-brand-700 border-2 border-brand-200 hover:border-brand-400 hover:bg-brand-50'
                  : 'bg-gradient-to-r from-brand-600 to-brand-700 text-white hover:from-brand-700 hover:to-brand-800 shadow-button hover:shadow-elevated'
              } py-3.5 rounded-2xl text-base font-bold transition-all duration-200`}
            >
              Оставить заявку
            </button>
            <div className="flex items-center gap-2 py-2">
              <span className="h-px flex-1 bg-gray-100" />
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">или в мессенджере</span>
              <span className="h-px flex-1 bg-gray-100" />
            </div>
            <a
              href={`${CONTACTS.whatsapp.url}?text=${encodeURIComponent(`Здравствуйте! Интересует тур «${tour.title}».`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('click_whatsapp', { tour: tour.slug })}
              className="w-full inline-flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-2xl text-sm font-bold hover:bg-green-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <div className="grid grid-cols-2 gap-2">
              <a href={CONTACTS.telegram.url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('click_telegram', { tour: tour.slug })} className="inline-flex items-center justify-center gap-1.5 bg-white text-blue-600 border border-blue-100 py-2.5 rounded-xl text-xs font-semibold hover:border-blue-300 hover:bg-blue-50/60 transition-colors">
                Telegram
              </a>
              <a href={CONTACTS.max.url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('click_max', { tour: tour.slug })} className="inline-flex items-center justify-center gap-1.5 bg-white text-violet-600 border border-violet-100 py-2.5 rounded-xl text-xs font-semibold hover:border-violet-300 hover:bg-violet-50/60 transition-colors">
                MAX
              </a>
            </div>
          </>
        ) : sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">Заявка отправлена</p>
            <p className="text-xs text-gray-500 mt-1">Ответим в WhatsApp в течение 15 минут</p>
            <button onClick={() => { setSent(false); setShowForm(false); }} className="mt-3 text-xs text-brand-600 hover:text-brand-700 font-medium">← Назад</button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-gray-900">Быстрый запрос по туру</p>
            <p className="text-xs text-gray-400 -mt-1">«{tour.title}»</p>
            <input
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50/50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all"
            />
            <input
              type="text"
              placeholder="Телефон или мессенджер"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50/50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all"
            />
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white py-3 rounded-2xl text-sm font-bold hover:from-brand-700 hover:to-brand-800 transition-all shadow-md shadow-brand-600/15"
            >
              Отправить запрос
            </button>
            <button onClick={() => setShowForm(false)} className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1">Отмена</button>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100">
        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2.5">
          Что обещаем
        </p>
        <ul className="space-y-2">
          {[
            'Отвечаем в течение 15 минут',
            'Условия отмены и переноса — при бронировании',
            'Один менеджер от заявки до поездки',
            'Поможем с билетами и логистикой',
          ].map((text) => (
            <li key={text} className="flex items-start gap-2">
              <svg className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.4} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span className="text-xs text-gray-600 leading-snug">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {tour.sourceUrl && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <a
            href={tour.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-600 transition-colors"
            title={`Посмотреть оригинал у ${tour.sourceOperator || 'оператора'}`}
            onClick={handleSourceOpen}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
