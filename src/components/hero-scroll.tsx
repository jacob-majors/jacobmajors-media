"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { HERO_PHOTOS } from "@/data/portfolio";

type SlideData = { url: string; headline: string; sub: string };

export function HeroScroll({ dbSlides }: { dbSlides?: SlideData[] }) {
  const slides: SlideData[] = dbSlides && dbSlides.length > 0 ? dbSlides : HERO_PHOTOS;

  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement[]>([]);
  const textsRef = useRef<HTMLDivElement[]>([]);
  const subTextsRef = useRef<HTMLParagraphElement[]>([]);
  const headlinesRef = useRef<HTMLHeadingElement[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const total = slides.length;

      // Initial state — first slide visible, rest hidden
      slidesRef.current.forEach((slide, i) => {
        if (i > 0) gsap.set(slide, { opacity: 0 });
      });
      textsRef.current.forEach((text, i) => {
        if (i > 0) gsap.set(text, { opacity: 0, y: 40 });
        else gsap.set(text, { opacity: 1, y: 0 });
      });

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const p = self.progress;

          slides.forEach((_, i) => {
            const slide = slidesRef.current[i];
            const text = textsRef.current[i];
            if (!slide || !text) return;

            const segStart = i / total;
            const segEnd = (i + 1) / total;
            const fade = 1 / total * 0.35; // 35% of each segment is crossfade

            let imgOpacity = 0;
            let textOpacity = 0;
            let textY = 30;

            if (i === 0) {
              // First slide: hold full, then fade out
              if (p <= segEnd - fade) {
                imgOpacity = 1;
                textOpacity = p < fade ? p / fade : 1;
                textY = p < fade ? 20 * (1 - p / fade) : 0;
              } else {
                const t = (p - (segEnd - fade)) / fade;
                imgOpacity = Math.max(0, 1 - t);
                textOpacity = Math.max(0, 1 - t * 1.5);
                textY = t * -20;
              }
            } else {
              // Mid/last slides: fade in then hold then fade out
              const fadeInStart = segStart - fade * 0.5;
              const fadeInEnd = segStart + fade * 0.5;
              const fadeOutStart = segEnd - fade * 0.5;
              const fadeOutEnd = segEnd + fade * 0.3;

              if (p < fadeInStart) {
                imgOpacity = 0;
                textOpacity = 0;
                textY = 30;
              } else if (p >= fadeInStart && p < fadeInEnd) {
                const t = (p - fadeInStart) / (fadeInEnd - fadeInStart);
                imgOpacity = t;
                textOpacity = Math.max(0, t * 1.2 - 0.1);
                textY = 30 * (1 - t);
              } else if (p >= fadeInEnd && p < fadeOutStart) {
                imgOpacity = 1;
                textOpacity = 1;
                textY = 0;
              } else if (i < total - 1) {
                // Not last slide — fade out
                const t = (p - fadeOutStart) / (fadeOutEnd - fadeOutStart);
                imgOpacity = Math.max(0, 1 - t);
                textOpacity = Math.max(0, 1 - t * 1.5);
                textY = t * -20;
              } else {
                // Last slide — hold
                imgOpacity = 1;
                textOpacity = 1;
                textY = 0;
              }
            }

            gsap.set(slide, { opacity: imgOpacity });
            gsap.set(text, { opacity: textOpacity, y: textY });
          });
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [slides]);

  return (
    <div ref={containerRef} style={{ height: `${slides.length * 120}vh` }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* Image layers */}
        {slides.map((slide, i) => (
          <div
            key={i}
            ref={(el) => { if (el) slidesRef.current[i] = el; }}
            className="absolute inset-0"
          >
            <Image
              src={slide.url}
              alt={slide.headline}
              fill
              priority={i === 0}
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/65" />
          </div>
        ))}

        {/* Text layers */}
        {slides.map((slide, i) => (
          <div
            key={i}
            ref={(el) => { if (el) textsRef.current[i] = el; }}
            className="absolute inset-0 flex flex-col items-center justify-end pb-28 text-center px-6 pointer-events-none"
          >
            <p
              ref={(el) => { if (el) subTextsRef.current[i] = el; }}
              className="text-[#c8a96e] text-[11px] tracking-[0.45em] uppercase mb-5"
            >
              {slide.sub}
            </p>
            <h1
              ref={(el) => { if (el) headlinesRef.current[i] = el; }}
              className="text-5xl md:text-7xl lg:text-[90px] font-light text-white leading-[0.95] tracking-tight max-w-4xl"
            >
              {slide.headline}
            </h1>
          </div>
        ))}

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 pointer-events-none">
          <span className="text-white/50 text-[9px] tracking-[0.35em] uppercase">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-[#c8a96e]/60 to-transparent" />
        </div>

        {/* Progress dots */}
        <div className="absolute right-7 top-1/2 -translate-y-1/2 flex flex-col gap-2.5">
          {slides.map((_, i) => (
            <div key={i} className="w-[3px] h-[3px] rounded-full bg-white/35" />
          ))}
        </div>
      </div>
    </div>
  );
}
