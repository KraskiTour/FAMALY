import React from 'react';
import Image from 'next/image';
import { ItineraryDay } from '@/lib/types';

interface TourItineraryProps {
  itinerary: ItineraryDay[];
}

function isRealImage(src: string) {
  return src.startsWith('/images/') || src.startsWith('http');
}

function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center px-2">
        <svg className="w-8 h-8 mx-auto text-brand-200/80" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
        </svg>
        <p className="mt-1 text-[10px] text-brand-400 font-medium leading-tight line-clamp-2">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

interface ParsedBlock {
  type: 'time' | 'text' | 'important' | 'tip';
  time?: string;
  content: string;
}

interface DayFooter {
  endPoint?: string;
  duration?: string;
}

const SERVICE_RE = /^(Переезд|Обед|Ужин|Завтрак|Размещение|Заселение|Свободное время|Трансфер|Отъезд|Самостоятельный отъезд|Прибытие|Отправление|Выезд|Сбор группы)/i;
const ATTRACTION_DASH_RE = /^(.+?)\s—\s/;

type SentenceKind = 'attraction' | 'service' | 'regular';

function classifySentence(s: string): SentenceKind {
  const trimmed = s.trim();
  if (SERVICE_RE.test(trimmed)) return 'service';
  if (ATTRACTION_DASH_RE.test(trimmed)) return 'attraction';
  return 'regular';
}

function extractHighlights(description: string): string[] {
  const highlights: string[] = [];
  const dashPattern = /(?:^|(?:\.\s+))([А-ЯЁ][а-яёА-ЯЁ\s«»\-(),.]{2,60}?)\s—\s/g;
  let m: RegExpExecArray | null;
  while ((m = dashPattern.exec(description)) !== null) {
    const name = m[1].trim();
    if (SERVICE_RE.test(name)) continue;
    if (name.length < 4 || name.length > 55) continue;
    if (/^(Доп|После|Затем|Далее|Вечером|Утром|Днём)/i.test(name)) continue;
    highlights.push(name);
    if (highlights.length >= 4) break;
  }
  return highlights;
}

function parseDescription(raw: string): { blocks: ParsedBlock[]; footer: DayFooter } {
  const footer: DayFooter = {};
  let text = raw;

  const endMatch = text.match(/Окончание(?:\s*программы)?:\s*(.+?)(?:\.|$)/);
  if (endMatch) {
    footer.endPoint = endMatch[1].trim().replace(/\.$/, '');
    text = text.replace(endMatch[0], '');
  }

  const durMatch = text.match(/Продолжительность дня:\s*(.+?)(?:\.|$)/);
  if (durMatch) {
    footer.duration = durMatch[1].trim().replace(/\.$/, '');
    text = text.replace(durMatch[0], '');
  }

  text = text.replace(/\s{2,}/g, ' ').trim();

  const timePattern = /(\d{1,2}:\d{2})\s*—\s*/g;
  const parts: ParsedBlock[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const matches: { index: number; time: string; length: number }[] = [];

  while ((match = timePattern.exec(text)) !== null) {
    matches.push({ index: match.index, time: match[1], length: match[0].length });
  }

  if (matches.length === 0) {
    const importantMatch = text.match(/Важно:\s*(.+)/i);
    const tipMatch = text.match(/Рекомендации?:\s*(.+)/i);
    let mainText = text;
    if (importantMatch) {
      mainText = mainText.replace(importantMatch[0], '').trim();
      parts.push({ type: 'important', content: importantMatch[1].trim() });
    }
    if (tipMatch) {
      mainText = mainText.replace(tipMatch[0], '').trim();
      parts.push({ type: 'tip', content: tipMatch[1].trim() });
    }
    if (mainText) {
      parts.unshift({ type: 'text', content: mainText });
    }
    return { blocks: parts, footer };
  }

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (m.index > lastIndex) {
      const before = text.slice(lastIndex, m.index).trim();
      if (before) parts.push({ type: 'text', content: before });
    }
    const contentStart = m.index + m.length;
    const contentEnd = i < matches.length - 1 ? matches[i + 1].index : text.length;
    let content = text.slice(contentStart, contentEnd).trim();

    const importantIdx = content.indexOf('Важно:');
    if (importantIdx > -1) {
      const importantText = content.slice(importantIdx + 'Важно:'.length).trim();
      content = content.slice(0, importantIdx).trim();
      parts.push({ type: 'time', time: m.time, content });
      parts.push({ type: 'important', content: importantText });
    } else {
      parts.push({ type: 'time', time: m.time, content });
    }
    lastIndex = contentEnd;
  }

  if (lastIndex < text.length) {
    let remaining = text.slice(lastIndex).trim();
    if (remaining) {
      const importantIdx = remaining.indexOf('Важно:');
      if (importantIdx > -1) {
        const before = remaining.slice(0, importantIdx).trim();
        const importantText = remaining.slice(importantIdx + 'Важно:'.length).trim();
        if (before) parts.push({ type: 'text', content: before });
        parts.push({ type: 'important', content: importantText });
      } else {
        parts.push({ type: 'text', content: remaining });
      }
    }
  }

  return { blocks: parts, footer };
}

// ---------------------------------------------------------------------------
// Inline rendering helpers
// ---------------------------------------------------------------------------

function DurationBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-1.5 py-0.5 whitespace-nowrap align-middle">
      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {text}
    </span>
  );
}

function inlineDurations(text: string): React.ReactNode[] {
  const durationPattern = /\(~([\d,]+\s*(?:час(?:а|ов)?|минут[а-я]*))\)/g;
  const parts = text.split(durationPattern);
  if (parts.length === 1) return [text];
  return parts.map((part, i) =>
    i % 2 === 1 ? <DurationBadge key={i} text={`~${part}`} /> : <span key={i}>{part}</span>
  );
}

function boldAttractionName(text: string): React.ReactNode {
  const m = text.match(/^(.+?)\s—\s(.+)$/);
  if (m && !SERVICE_RE.test(m[1])) {
    return (
      <>
        <strong className="font-semibold text-gray-800">{m[1]}</strong>
        <span> — </span>
        <span>{inlineDurations(m[2])}</span>
      </>
    );
  }
  return <>{inlineDurations(text)}</>;
}

// ---------------------------------------------------------------------------
// Sentence-level rendering
// ---------------------------------------------------------------------------

function splitIntoSentences(content: string): string[] {
  const pattern = /(?<=\.)\s+(?=[А-ЯЁA-Z«])/g;
  const result: string[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  const regex = new RegExp(pattern);
  const splits: number[] = [];

  while ((m = regex.exec(content)) !== null) {
    splits.push(m.index + 1);
  }
  if (splits.length === 0) return [content];

  for (const splitPos of splits) {
    result.push(content.slice(lastIdx, splitPos).trim());
    lastIdx = splitPos;
  }
  if (lastIdx < content.length) {
    result.push(content.slice(lastIdx).trim());
  }
  return result.filter(Boolean);
}

function ServiceLine({ text }: { text: string }) {
  let icon: React.ReactNode;
  const lower = text.toLowerCase();

  if (/^(переезд|трансфер)/i.test(text)) {
    icon = (
      <svg className="w-3.5 h-3.5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    );
  } else if (/обед|ужин|завтрак|питани/i.test(lower)) {
    icon = (
      <svg className="w-3.5 h-3.5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.126-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z" />
      </svg>
    );
  } else if (/размещение|заселение/i.test(lower)) {
    icon = (
      <svg className="w-3.5 h-3.5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    );
  } else if (/свободное время/i.test(lower)) {
    icon = (
      <svg className="w-3.5 h-3.5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  } else {
    icon = (
      <svg className="w-3.5 h-3.5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    );
  }

  return (
    <div className="flex items-start gap-2 text-[13px] text-gray-400 leading-relaxed">
      <span className="mt-[3px]">{icon}</span>
      <span>{inlineDurations(text)}</span>
    </div>
  );
}

function ContentBlock({ content }: { content: string }) {
  const sentences = splitIntoSentences(content);

  if (sentences.length <= 2) {
    const kind = classifySentence(content);
    if (kind === 'service') return <ServiceLine text={content} />;
    return <p className="text-sm text-gray-600 leading-relaxed">{boldAttractionName(content)}</p>;
  }

  const attractions: string[] = [];
  const services: string[] = [];
  const regulars: string[] = [];

  for (const s of sentences) {
    const kind = classifySentence(s);
    if (kind === 'service') services.push(s);
    else if (kind === 'attraction') attractions.push(s);
    else regulars.push(s);
  }

  const mainItems = [...attractions, ...regulars];

  return (
    <div className="space-y-2">
      {mainItems.length > 0 && (
        <ul className="space-y-1.5 text-sm text-gray-600 leading-relaxed">
          {mainItems.map((s, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
              <span>{boldAttractionName(s)}</span>
            </li>
          ))}
        </ul>
      )}
      {services.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-gray-100/80">
          {services.map((s, i) => (
            <ServiceLine key={i} text={s} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day-level rendering
// ---------------------------------------------------------------------------

function DayDescription({ description }: { description: string }) {
  const { blocks, footer } = parseDescription(description);
  const hasFooter = footer.endPoint || footer.duration;

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.type === 'time') {
          return (
            <div key={i} className="rounded-lg bg-gray-50/70 border border-gray-100 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="shrink-0 inline-flex items-center justify-center text-[11px] font-bold text-white bg-brand-600 rounded px-1.5 py-0.5 tabular-nums tracking-tight min-w-[40px] text-center">
                  {block.time}
                </span>
              </div>
              <ContentBlock content={block.content} />
            </div>
          );
        }
        if (block.type === 'important') {
          return (
            <div key={i} className="flex gap-2 items-start bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-sm text-amber-800 leading-relaxed">{block.content}</p>
            </div>
          );
        }
        if (block.type === 'tip') {
          return (
            <div key={i} className="flex gap-2 items-start bg-sky-50 border border-sky-200/60 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              <p className="text-sm text-sky-800 leading-relaxed">{block.content}</p>
            </div>
          );
        }
        return <ContentBlock key={i} content={block.content} />;
      })}

      {hasFooter && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 pt-2 border-t border-gray-100">
          {footer.endPoint && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {footer.endPoint}
            </span>
          )}
          {footer.duration && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {footer.duration}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day highlights — key locations as compact tags under day title
// ---------------------------------------------------------------------------

function DayHighlights({ description }: { description: string }) {
  const highlights = extractHighlights(description);
  if (highlights.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2.5">
      {highlights.map((h, i) => (
        <span
          key={i}
          className="text-[11px] font-medium text-brand-700 bg-brand-50 border border-brand-100/80 rounded-md px-2 py-0.5"
        >
          {h}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TourItinerary({ itinerary }: TourItineraryProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">Программа по дням</h2>
      <div className="space-y-0">
        {itinerary.map((day, index) => {
          const hasImages = day.images && day.images.length > 0;

          return (
            <div key={day.day} className="relative pl-10 pb-8 last:pb-0">
              {index < itinerary.length - 1 && (
                <div className="absolute left-[13px] top-8 bottom-0 w-px bg-brand-200" />
              )}
              <div className="absolute left-0 top-0.5 w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold flex items-center justify-center shadow-sm shadow-brand-600/30">
                {day.day}
              </div>

              <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">{day.title}</h3>

              <DayHighlights description={day.description} />

              {hasImages && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {day.images!.slice(0, 2).map((img, imgIdx) => {
                    const showReal = isRealImage(img);
                    return (
                      <div key={imgIdx} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-brand-50 via-teal-50/50 to-sky-50 shadow-sm">
                        {showReal ? (
                          <Image
                            src={img}
                            alt={`${day.title} — фото ${imgIdx + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, 200px"
                            unoptimized={img.startsWith('https://')}
                          />
                        ) : (
                          <PhotoPlaceholder label={img.split('/').pop()?.replace(/\.\w+$/, '').replace(/-/g, ' ') || day.title} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <DayDescription description={day.description} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
