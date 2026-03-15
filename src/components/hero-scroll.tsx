"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { CldUploadWidget } from "next-cloudinary";
import { HERO_PHOTOS } from "@/data/portfolio";
import { replaceHeroSlide, updateHeroSlideText } from "@/app/actions/hero-slides";
import { useEditMode } from "@/hooks/use-edit-mode";

type SlideData = { id?: number; url: string; headline: string; sub: string };

// ── Per-slide replace overlay (admin only) ───────────────────────────────────
function AdminReplaceOverlay({ slide, onReplaced }: { slide: SlideData; onReplaced: (url: string) => void }) {
  const [replacing, setReplacing] = useState(false);

  if (!slide.id) return null;

  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      options={{ sources: ["local"], multiple: false }}
      onSuccess={async (result) => {
        if (result.info && typeof result.info === "object") {
          const info = result.info as { public_id: string; secure_url: string };
          setReplacing(true);
          await replaceHeroSlide(slide.id!, {
            cloudinaryId: info.public_id,
            cloudinaryUrl: info.secure_url,
            headline: slide.headline,
            sub: slide.sub,
          });
          onReplaced(info.secure_url);
          setReplacing(false);
        }
      }}
    >
      {({ open }) => (
        <button
          onClick={(e) => { e.stopPropagation(); open(); }}
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center opacity-0 group-hover/slide:opacity-100 transition-opacity duration-300 z-20 cursor-pointer"
          title="Click to replace this photo"
        >
          <div className="absolute inset-0 bg-black/50 transition-opacity duration-300" />
          <div className="relative z-10 flex flex-col items-center gap-2">
            {replacing ? (
              <p className="text-white text-sm font-medium">Uploading…</p>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full border-2 border-white/70 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-white text-sm font-medium tracking-wide">Replace Photo</p>
              </>
            )}
          </div>
        </button>
      )}
    </CldUploadWidget>
  );
}

// ── Slide text inline edit panel ─────────────────────────────────────────────
function SlideTextEditor({
  slide,
  onSaved,
}: {
  slide: SlideData;
  onSaved: (headline: string, sub: string) => void;
}) {
  const [headline, setHeadline] = useState(slide.headline);
  const [sub, setSub] = useState(slide.sub);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!slide.id) return;
    setSaving(true);
    await updateHeroSlideText(slide.id, headline, sub);
    onSaved(headline, sub);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div
      className="absolute bottom-36 left-1/2 -translate-x-1/2 z-30 bg-black/80 backdrop-blur-md border border-[#2a2a2a] rounded-xl p-4 w-[min(480px,90vw)]"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-[#c8a96e] text-[9px] tracking-[0.4em] uppercase mb-3">Edit slide text</p>
      <div className="flex flex-col gap-2 mb-3">
        <input
          value={sub}
          onChange={(e) => setSub(e.target.value)}
          placeholder="Sub label (e.g. Photography · Action Sports)"
          className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#c8a96e] text-xs focus:outline-none focus:border-[#c8a96e]/50 placeholder-[#333]"
        />
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Headline"
          className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c8a96e]/50 placeholder-[#333]"
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !slide.id}
          className="px-4 py-1.5 bg-[#c8a96e] text-black text-[10px] tracking-widest uppercase font-medium rounded-lg hover:bg-[#d4b97a] transition-colors disabled:opacity-40"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Main hero scroll ─────────────────────────────────────────────────────────
export function HeroScroll({ dbSlides, isAdmin }: { dbSlides?: SlideData[]; isAdmin?: boolean }) {
  const initialSlides: SlideData[] = dbSlides && dbSlides.length > 0 ? dbSlides : HERO_PHOTOS;
  const [slides, setSlides] = useState<SlideData[]>(initialSlides);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { editMode } = useEditMode();

  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement[]>([]);
  const textsRef = useRef<HTMLDivElement[]>([]);
  const subTextsRef = useRef<HTMLParagraphElement[]>([]);
  const headlinesRef = useRef<HTMLHeadingElement[]>([]);

  // Track currently visible slide (used to close edit panel when user scrolls away)

  function handleReplaced(index: number, newUrl: string) {
    setSlides((prev) => prev.map((s, i) => i === index ? { ...s, url: newUrl } : s));
  }

  function handleTextSaved(index: number, headline: string, sub: string) {
    setSlides((prev) => prev.map((s, i) => i === index ? { ...s, headline, sub } : s));
    setEditingIndex(null);
  }

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const total = slides.length;

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

          // Fade entire sticky container out in the last 8% of scroll
          const endFadeStart = 0.92;
          const containerOpacity = p > endFadeStart ? Math.max(0, 1 - (p - endFadeStart) / 0.08) : 1;
          if (containerRef.current) {
            const sticky = containerRef.current.querySelector(".sticky") as HTMLElement | null;
            if (sticky) gsap.set(sticky, { opacity: containerOpacity });
          }

          slides.forEach((_, i) => {
            const slide = slidesRef.current[i];
            const text = textsRef.current[i];
            if (!slide || !text) return;

            const segStart = i / total;
            const segEnd = (i + 1) / total;
            const fade = (1 / total) * 0.35;

            let imgOpacity = 0;
            let textOpacity = 0;
            let textY = 30;

            if (i === 0) {
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
              const fadeInStart = segStart - fade * 0.5;
              const fadeInEnd = segStart + fade * 0.5;
              const fadeOutStart = segEnd - fade * 0.5;
              const fadeOutEnd = segEnd + fade * 0.3;

              if (p < fadeInStart) {
                imgOpacity = 0; textOpacity = 0; textY = 30;
              } else if (p < fadeInEnd) {
                const t = (p - fadeInStart) / (fadeInEnd - fadeInStart);
                imgOpacity = t;
                textOpacity = Math.max(0, t * 1.2 - 0.1);
                textY = 30 * (1 - t);
              } else if (p < fadeOutStart) {
                imgOpacity = 1; textOpacity = 1; textY = 0;
              } else if (i < total - 1) {
                const t = (p - fadeOutStart) / (fadeOutEnd - fadeOutStart);
                imgOpacity = Math.max(0, 1 - t);
                textOpacity = Math.max(0, 1 - t * 1.5);
                textY = t * -20;
              } else {
                // Last slide: also fade out toward the very end
                imgOpacity = 1; textOpacity = 1; textY = 0;
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

  const canEdit = isAdmin && editMode;

  return (
    <div ref={containerRef} style={{ height: `${slides.length * 120}vh` }} className="relative">

      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Image layers */}
        {slides.map((slide, i) => (
          <div
            key={i}
            ref={(el) => { if (el) slidesRef.current[i] = el; }}
            className={`absolute inset-0 ${canEdit && slide.id ? "group/slide" : ""}`}
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

            {canEdit && slide.id && (
              <AdminReplaceOverlay
                slide={slide}
                onReplaced={(url) => handleReplaced(i, url)}
              />
            )}
          </div>
        ))}

        {/* Text layers */}
        {slides.map((slide, i) => (
          <div
            key={i}
            ref={(el) => { if (el) textsRef.current[i] = el; }}
            className={`absolute inset-0 flex flex-col items-center justify-end pb-28 text-center px-6 ${canEdit ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <p
              ref={(el) => { if (el) subTextsRef.current[i] = el; }}
              className={`text-[#c8a96e] text-[11px] tracking-[0.45em] uppercase mb-5 ${canEdit ? "cursor-pointer hover:opacity-80" : ""}`}
              onClick={() => canEdit && setEditingIndex(i)}
            >
              {slide.sub}
            </p>
            <h1
              ref={(el) => { if (el) headlinesRef.current[i] = el; }}
              className={`text-5xl md:text-7xl lg:text-[90px] font-light text-white leading-[0.95] tracking-tight max-w-4xl ${canEdit ? "cursor-pointer hover:opacity-80" : ""}`}
              onClick={() => canEdit && setEditingIndex(i)}
            >
              {slide.headline}
            </h1>

            {/* Edit pencil hint */}
            {canEdit && slide.id && (
              <button
                onClick={() => setEditingIndex(i)}
                className="mt-4 text-[9px] tracking-[0.35em] uppercase text-[#c8a96e]/50 hover:text-[#c8a96e] transition-colors pointer-events-auto"
              >
                ✏ Edit text
              </button>
            )}
          </div>
        ))}

        {/* Text editor panel — for visible slide */}
        {canEdit && editingIndex !== null && slides[editingIndex]?.id && (
          <SlideTextEditor
            slide={slides[editingIndex]}
            onSaved={(h, s) => handleTextSaved(editingIndex, h, s)}
          />
        )}

        {/* Click outside to close editor */}
        {canEdit && editingIndex !== null && (
          <div
            className="absolute inset-0 z-20"
            onClick={() => setEditingIndex(null)}
          />
        )}

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
