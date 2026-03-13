"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { saveHeroSlide, deleteHeroSlide, getHeroSlides, replaceHeroSlide, updateHeroSlideText } from "@/app/actions/hero-slides";

type Slide = {
  id: number;
  cloudinaryId: string;
  cloudinaryUrl: string;
  headline: string;
  sub: string;
  sortOrder: number;
};

type UploadInfo = { public_id: string; secure_url: string };

// ── Single slide card with click-to-replace and inline text editing ──────────
function SlideCard({ slide, index, onRefresh }: { slide: Slide; index: number; onRefresh: () => void }) {
  const [headline, setHeadline] = useState(slide.headline);
  const [sub, setSub] = useState(slide.sub);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(slide.cloudinaryUrl);

  const textChanged = headline !== slide.headline || sub !== slide.sub;

  async function handleSaveText() {
    setSaving(true);
    await updateHeroSlideText(slide.id, headline, sub);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onRefresh();
  }

  async function handleReplace(info: UploadInfo) {
    setReplacing(true);
    setPreviewUrl(info.secure_url);
    await replaceHeroSlide(slide.id, {
      cloudinaryId: info.public_id,
      cloudinaryUrl: info.secure_url,
      headline,
      sub,
    });
    setReplacing(false);
    onRefresh();
  }

  return (
    <div className="border border-[#1a1a1a] rounded-xl overflow-hidden">
      {/* Photo preview — click to replace */}
      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        options={{ sources: ["local"], multiple: false }}
        onSuccess={(result) => {
          if (result.info && typeof result.info === "object") {
            handleReplace(result.info as UploadInfo);
          }
        }}
      >
        {({ open }) => (
          <button
            onClick={() => open()}
            className="relative w-full aspect-video block group overflow-hidden"
            title="Click to replace photo"
          >
            <Image
              src={previewUrl}
              alt={headline}
              fill
              className="object-cover transition-all duration-500 group-hover:brightness-50"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
            {/* Gradient overlay always */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

            {/* Replace overlay on hover */}
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {replacing ? (
                <p className="text-white text-sm">Uploading...</p>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full border-2 border-white/80 flex items-center justify-center mb-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="text-white text-sm font-medium">Replace Photo</p>
                  <p className="text-white/60 text-xs mt-1">Click to upload new image</p>
                </>
              )}
            </div>

            {/* Slide number badge */}
            <span className="absolute top-2 left-2 bg-black/60 text-[#c8a96e] text-xs px-2 py-1 rounded font-mono">
              #{index + 1}
            </span>
          </button>
        )}
      </CldUploadWidget>

      {/* Text fields */}
      <div className="p-4 space-y-3">
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Headline"
          className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#c8a96e] transition-colors"
        />
        <input
          type="text"
          value={sub}
          onChange={(e) => setSub(e.target.value)}
          placeholder="Sub text"
          className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#c8a96e] transition-colors"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSaveText}
            disabled={saving || !textChanged}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all bg-[#c8a96e] text-black hover:bg-[#d4b97a] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save Text"}
          </button>
          <button
            onClick={async () => { await deleteHeroSlide(slide.id); onRefresh(); }}
            className="px-3 py-2 rounded-lg text-xs border border-red-900/50 text-red-400 hover:bg-red-950/40 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
export function HeroSlidesForm() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [uploaded, setUploaded] = useState<UploadInfo | null>(null);
  const [headline, setHeadline] = useState("");
  const [sub, setSub] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function loadSlides() {
    const data = await getHeroSlides();
    setSlides(data as Slide[]);
  }

  useEffect(() => { loadSlides(); }, []);

  async function handleAdd() {
    if (!uploaded || !headline || !sub) return;
    setSaving(true);
    await saveHeroSlide({
      cloudinaryId: uploaded.public_id,
      cloudinaryUrl: uploaded.secure_url,
      headline,
      sub,
      sortOrder: slides.length,
    });
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    setUploaded(null);
    setHeadline("");
    setSub("");
    await loadSlides();
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-white text-2xl font-light mb-2">Hero Slides</h2>
        <p className="text-[#666] text-sm">Full-screen photos at the top of the homepage. Click any photo to replace it.</p>
      </div>

      {/* Existing slides */}
      {slides.length > 0 && (
        <div className="space-y-4">
          <p className="text-[#c8a96e] text-xs tracking-[0.3em] uppercase">Current Slides ({slides.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {slides.map((slide, i) => (
              <SlideCard key={slide.id} slide={slide} index={i} onRefresh={loadSlides} />
            ))}
          </div>
        </div>
      )}

      {/* Add new slide */}
      <div className="space-y-4 border border-[#1a1a1a] rounded-xl p-6">
        <p className="text-[#c8a96e] text-xs tracking-[0.3em] uppercase">Add New Slide</p>

        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          options={{ sources: ["local"], multiple: false }}
          onSuccess={(result) => {
            if (result.info && typeof result.info === "object") {
              setUploaded(result.info as UploadInfo);
            }
          }}
        >
          {({ open }) => (
            <button
              onClick={() => open()}
              className="border-2 border-dashed border-[#333] rounded-xl p-10 w-full text-center hover:border-[#c8a96e] transition-colors group"
            >
              {uploaded ? (
                <p className="text-[#c8a96e] text-sm">✓ Photo ready — {uploaded.public_id}</p>
              ) : (
                <>
                  <p className="text-[#666] group-hover:text-white transition-colors text-sm">Click to upload photo</p>
                  <p className="text-[#444] text-xs mt-1">Full quality — Cloudinary optimises on delivery</p>
                </>
              )}
            </button>
          )}
        </CldUploadWidget>

        {uploaded && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder='Headline (e.g. "USA Cycling Nationals.")'
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#c8a96e] transition-colors"
            />
            <input
              type="text"
              placeholder='Sub text (e.g. "Pro Men — XCO & XCC")'
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#c8a96e] transition-colors"
            />
            <button
              onClick={handleAdd}
              disabled={saving || !headline || !sub}
              className="w-full bg-[#c8a96e] text-black font-medium py-3 rounded-lg hover:bg-[#d4b97a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : success ? "Added!" : "Add to Hero"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
