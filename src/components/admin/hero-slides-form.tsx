"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { saveHeroSlide, deleteHeroSlide, getHeroSlides } from "@/app/actions/hero-slides";

type Slide = {
  id: number;
  cloudinaryId: string;
  cloudinaryUrl: string;
  headline: string;
  sub: string;
  sortOrder: number;
};

export function HeroSlidesForm() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [uploaded, setUploaded] = useState<{ public_id: string; secure_url: string } | null>(null);
  const [headline, setHeadline] = useState("");
  const [sub, setSub] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function loadSlides() {
    const data = await getHeroSlides();
    setSlides(data as Slide[]);
  }

  useEffect(() => { loadSlides(); }, []);

  async function handleSave() {
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
    setTimeout(() => setSuccess(false), 3000);
    setUploaded(null);
    setHeadline("");
    setSub("");
    await loadSlides();
  }

  async function handleDelete(id: number) {
    await deleteHeroSlide(id);
    await loadSlides();
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-white text-2xl font-light mb-2">Hero Slides</h2>
        <p className="text-[#666] text-sm">These photos appear in the full-screen scroll at the top of the homepage.</p>
      </div>

      {/* Existing slides */}
      {slides.length > 0 && (
        <div className="space-y-3">
          <p className="text-[#c8a96e] text-xs tracking-[0.3em] uppercase">Current Slides ({slides.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {slides.map((slide, i) => (
              <div key={slide.id} className="relative rounded-xl overflow-hidden border border-[#1a1a1a] group">
                <div className="relative aspect-video">
                  <Image
                    src={slide.cloudinaryUrl}
                    alt={slide.headline}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-[#c8a96e] text-[10px] tracking-widest uppercase">{slide.sub}</p>
                  <p className="text-white text-sm font-light">{slide.headline}</p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className="bg-black/60 text-[#666] text-xs px-2 py-1 rounded">#{i + 1}</span>
                  <button
                    onClick={() => handleDelete(slide.id)}
                    className="bg-black/60 text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload new slide */}
      <div className="space-y-5 border border-[#1a1a1a] rounded-xl p-6">
        <p className="text-[#c8a96e] text-xs tracking-[0.3em] uppercase">Add New Slide</p>

        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          options={{ sources: ["local"], multiple: false }}
          onSuccess={(result) => {
            if (result.info && typeof result.info === "object") {
              const info = result.info as { public_id: string; secure_url: string };
              setUploaded(info);
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
                  <p className="text-[#666] group-hover:text-white transition-colors text-sm">Click to upload high-quality photo</p>
                  <p className="text-[#444] text-xs mt-1">Uploaded to Cloudinary — no compression</p>
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
              onClick={handleSave}
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
