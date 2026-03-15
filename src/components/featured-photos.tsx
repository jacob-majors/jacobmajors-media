"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { X } from "lucide-react";
import { useEditMode } from "@/hooks/use-edit-mode";
import { getSiteContent, setSiteContent } from "@/app/actions/site-content";

export type FeaturedPhoto = {
  id: number;
  cloudinaryId: string;
  cloudinaryUrl: string;
  title: string;
};

type Tag = { number: string; name: string };

export function FeaturedPhotos({
  photos,
  isAdmin,
}: {
  photos: FeaturedPhoto[];
  isAdmin: boolean;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const { editMode } = useEditMode();
  const canTag = isAdmin && editMode;

  const [tagging, setTagging] = useState<FeaturedPhoto | null>(null);
  const [tags, setTags] = useState<Record<string, Tag[]>>({});
  const [draft, setDraft] = useState({ number: "", name: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTags() {
      const result: Record<string, Tag[]> = {};
      await Promise.all(
        photos.map(async (p) => {
          const val = await getSiteContent(`photo.tags.${p.cloudinaryId}`);
          if (val) {
            try { result[p.cloudinaryId] = JSON.parse(val); } catch {}
          }
        })
      );
      setTags(result);
    }
    if (photos.length) loadTags();
  }, [photos]);

  async function saveTag() {
    if (!tagging || !draft.number || !draft.name) return;
    setSaving(true);
    const existing = tags[tagging.cloudinaryId] ?? [];
    const updated = [...existing, { number: draft.number, name: draft.name }];
    await setSiteContent(`photo.tags.${tagging.cloudinaryId}`, JSON.stringify(updated));
    setTags((prev) => ({ ...prev, [tagging.cloudinaryId]: updated }));
    setDraft({ number: "", name: "" });
    setSaving(false);
  }

  async function removeTag(cloudinaryId: string, idx: number) {
    const updated = [...(tags[cloudinaryId] ?? [])];
    updated.splice(idx, 1);
    await setSiteContent(`photo.tags.${cloudinaryId}`, JSON.stringify(updated));
    setTags((prev) => ({ ...prev, [cloudinaryId]: updated }));
  }

  if (!photos.length) return null;

  return (
    <section ref={ref} className="px-6 pb-32">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((photo, i) => {
          const photoTags = tags[photo.cloudinaryId] ?? [];
          const isLarge = i === 0;
          const aspectClass = isLarge ? "aspect-[4/3]" : "aspect-square";
          const gridClass = isLarge ? "col-span-2 row-span-2" : "";

          return (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className={`relative overflow-hidden group ${gridClass} ${canTag ? "cursor-pointer" : ""}`}
            >
              {canTag ? (
                <button
                  className={`relative w-full ${aspectClass} block`}
                  onClick={() => { setTagging(photo); setDraft({ number: "", name: "" }); }}
                >
                  <Image
                    src={photo.cloudinaryUrl}
                    alt={photo.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105 will-change-transform"
                    sizes={isLarge ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 50vw, 33vw"}
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white text-[10px] tracking-widest uppercase border border-white/40 px-3 py-1.5 rounded-full">
                      Tag Player
                    </span>
                  </div>
                  {/* Existing tags */}
                  {photoTags.length > 0 && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {photoTags.map((tag, ti) => (
                        <span key={ti} className="bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                          #{tag.number} {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ) : (
                <Link href="/photography#lacrosse">
                  <div className={`relative w-full ${aspectClass}`}>
                    <Image
                      src={photo.cloudinaryUrl}
                      alt={photo.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105 will-change-transform"
                      sizes={isLarge ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 50vw, 33vw"}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-500" />
                    {photoTags.length > 0 && (
                      <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {photoTags.map((tag, ti) => (
                          <span key={ti} className="bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                            #{tag.number} {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Tag modal */}
      {tagging && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setTagging(null)}
        >
          <div
            className="bg-[#111] border border-[#222] rounded-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-sm tracking-widest uppercase">Tag Player</h3>
              <button onClick={() => setTagging(null)} className="text-[#555] hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Existing tags */}
            {(tags[tagging.cloudinaryId] ?? []).length > 0 && (
              <div className="mb-4 flex flex-col gap-1.5">
                {(tags[tagging.cloudinaryId] ?? []).map((tag, ti) => (
                  <div key={ti} className="flex items-center justify-between bg-[#1a1a1a] rounded px-3 py-1.5">
                    <span className="text-white text-xs">#{tag.number} — {tag.name}</span>
                    <button
                      onClick={() => removeTag(tagging.cloudinaryId, ti)}
                      className="text-[#555] hover:text-red-400 text-xs ml-3 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <input
                placeholder="#"
                value={draft.number}
                onChange={(e) => setDraft((d) => ({ ...d, number: e.target.value }))}
                className="w-16 bg-[#1a1a1a] border border-[#333] text-white text-sm px-2 py-1.5 rounded focus:outline-none focus:border-[#c8a96e]"
              />
              <input
                placeholder="Player name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && saveTag()}
                className="flex-1 bg-[#1a1a1a] border border-[#333] text-white text-sm px-2 py-1.5 rounded focus:outline-none focus:border-[#c8a96e]"
              />
            </div>
            <button
              onClick={saveTag}
              disabled={saving || !draft.number || !draft.name}
              className="w-full bg-[#c8a96e] text-black text-xs tracking-widest uppercase py-2 rounded font-medium disabled:opacity-40 transition-opacity"
            >
              {saving ? "Saving…" : "Add Tag"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
