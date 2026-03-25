'use client';

import { useState } from 'react';
import Image from 'next/image';

interface TourGalleryProps {
  images: string[];
  title: string;
}

function isRealImage(src: string) {
  return src.startsWith('/images/') || src.startsWith('http');
}

export default function TourGallery({ images, title }: TourGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];
  const showReal = activeImage && isRealImage(activeImage);

  return (
    <div>
      <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-to-br from-brand-50 via-teal-50/50 to-sky-50 shadow-sm">
        {showReal ? (
          <Image
            src={activeImage}
            alt={`${title} — фото ${activeIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 66vw"
            priority={activeIndex === 0}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-brand-200/80" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
              </svg>
              <p className="mt-2 text-sm text-brand-500 font-medium">{title} — фото {activeIndex + 1}</p>
            </div>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mt-3">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                index === activeIndex ? 'border-brand-500 shadow-sm' : 'border-transparent hover:border-gray-300'
              }`}
            >
              {isRealImage(img) ? (
                <Image src={img} alt={`${title} — ${index + 1}`} width={80} height={56} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-50 to-teal-50/50 flex items-center justify-center">
                  <span className="text-xs font-medium text-brand-400">{index + 1}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
