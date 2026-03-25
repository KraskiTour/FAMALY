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

interface ParsedBlock {
  type: 'time' | 'text' | 'important' | 'tip';
  time?: string;
  content: string;
}

interface DayFooter {
  endPoint?: string;
  duration?: string;
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
    const tipMatch = text.match(/Рекомендации:\s*(.+)/i);

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
      if (before) {
        parts.push({ type: 'text', content: before });
      }
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

function splitIntoSentences(content: string): string[] {
  const result: string[] = [];
  const pattern = /(?<=\.)\s+(?=[А-ЯЁA-Z])/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;

  const regex = new RegExp(pattern);
  let text = content;
  const splits: number[] = [];

  while ((m = regex.exec(text)) !== null) {
    splits.push(m.index + 1);
  }

  if (splits.length === 0) return [content];

  for (const splitPos of splits) {
    result.push(text.slice(lastIdx, splitPos).trim());
    lastIdx = splitPos;
  }
  if (lastIdx < text.length) {
    result.push(text.slice(lastIdx).trim());
  }

  return result.filter(Boolean);
}

function ContentBlock({ content }: { content: string }) {
  const sentences = splitIntoSentences(content);

  if (sentences.length <= 2) {
    return <p className="text-sm text-gray-600 leading-relaxed">{inlineDurations(content)}</p>;
  }

  return (
    <ul className="space-y-1.5 text-sm text-gray-600 leading-relaxed">
      {sentences.map((s, i) => (
        <li key={i} className="flex gap-1.5 items-start">
          <span className="mt-[7px] w-1 h-1 rounded-full bg-brand-300 shrink-0" />
          <span>{inlineDurations(s)}</span>
        </li>
      ))}
    </ul>
  );
}

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
        return (
          <ContentBlock key={i} content={block.content} />
        );
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

              <h3 className="text-[15px] font-bold text-gray-900 mb-2">{day.title}</h3>

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
