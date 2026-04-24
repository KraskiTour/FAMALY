'use client';

// ---------------------------------------------------------------------------
// Compact "Коротко о туре" block.
//
// Renders the tour.fullDescription paragraphs with a readability-first pattern:
//   - the first paragraph is always visible (acts as a lede)
//   - any remaining paragraphs collapse behind a "Читать подробнее" toggle
//   - if there is only one paragraph, no toggle is rendered
//
// This is purely a presentation client-component — copy, parsing and data shape
// are untouched upstream (page.tsx still splits the text; we just control how
// much of it is visible at once).
// ---------------------------------------------------------------------------

import { useState } from 'react';

interface TourDescriptionProps {
  paragraphs: string[];
}

export default function TourDescription({ paragraphs }: TourDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  if (paragraphs.length === 0) return null;

  const [first, ...rest] = paragraphs;
  const hasMore = rest.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/70 shadow-card p-5 sm:p-6">
      <p className="text-[15px] text-gray-700 leading-relaxed">{first}</p>

      {hasMore && expanded && (
        <div className="mt-3 space-y-3">
          {rest.map((paragraph, i) => (
            <p key={i} className="text-[15px] text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
          aria-expanded={expanded}
        >
          {expanded ? 'Свернуть' : 'Читать подробнее'}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
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
  );
}
