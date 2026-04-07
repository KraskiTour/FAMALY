'use client';

import Script from 'next/script';
import { YM_COUNTER_ID, GA_MEASUREMENT_ID } from '@/lib/analytics';

export default function AnalyticsScripts() {
  return (
    <>
      {/* ===== Яндекс.Метрика ===== */}
      {YM_COUNTER_ID > 0 && (
        <Script id="ym-init" strategy="afterInteractive">{`
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return;}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
          ym(${YM_COUNTER_ID},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
        `}</Script>
      )}

      {/* ===== Google Analytics 4 ===== */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer=window.dataLayer||[];
            function gtag(){dataLayer.push(arguments);}
            gtag('js',new Date());
            gtag('config','${GA_MEASUREMENT_ID}');
          `}</Script>
        </>
      )}
    </>
  );
}
