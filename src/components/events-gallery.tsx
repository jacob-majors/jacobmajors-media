"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { EVENTS, CATEGORY_LABELS, type PortfolioEvent } from "@/data/portfolio";
import { DownloadModal } from "@/components/download-modal";
import { getSiteContent } from "@/app/actions/site-content";

type Tag = { number: string; name: string };

type LacrossePhoto = { id: number; cloudinaryUrl: string; title: string; cloudinaryId: string };

const CATEGORIES = ["All", "lacrosse", "bike-races", "basketball", "soccer", "climbing"] as const;
const ALL_LABELS: Record<string, string> = { ...CATEGORY_LABELS, lacrosse: "Lacrosse" };

export function EventsGallery({ lacrossePhotos = [] }: { lacrossePhotos?: LacrossePhoto[] }) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [openEvent, setOpenEvent] = useState<PortfolioEvent | null>(null);
  const [openLacrosse, setOpenLacrosse] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<{ url: string; filename: string } | null>(null);
  // Full-screen single photo viewer
  type ViewEntry = { url: string; cloudinaryId?: string };
  const [viewPhoto, setViewPhoto] = useState<{ entry: ViewEntry; all: ViewEntry[]; idx: number; prefix: string } | null>(null);
  const [viewTags, setViewTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (window.location.hash === "#lacrosse") {
      setActiveCategory("lacrosse");
    }
  }, []);

  const showLacrosse = activeCategory === "All" || activeCategory === "lacrosse";
  const filteredEvents =
    activeCategory === "lacrosse"
      ? []
      : activeCategory === "All"
      ? EVENTS
      : EVENTS.filter((e) => e.category === activeCategory);

  const grouped = filteredEvents.reduce<Record<string, PortfolioEvent[]>>((acc, event) => {
    const key = event.subcategory ?? CATEGORY_LABELS[event.category];
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  const lacrosseCover = lacrossePhotos[0]?.cloudinaryUrl ?? "";
  const LACROSSE_EVENT = { sport: "Lacrosse", name: "Sonoma Academy vs Justin Siena", date: "03/13/2026" };

  // Fetch tags whenever viewPhoto changes
  useEffect(() => {
    if (!viewPhoto?.entry.cloudinaryId) { setViewTags([]); return; }
    getSiteContent(`photo.tags.${viewPhoto.entry.cloudinaryId}`).then((val) => {
      try { setViewTags(val ? JSON.parse(val) : []); } catch { setViewTags([]); }
    });
  }, [viewPhoto?.entry.cloudinaryId]);

  const goPrev = useCallback(() => {
    if (!viewPhoto) return;
    const newIdx = (viewPhoto.idx - 1 + viewPhoto.all.length) % viewPhoto.all.length;
    setViewPhoto({ ...viewPhoto, entry: viewPhoto.all[newIdx], idx: newIdx });
  }, [viewPhoto]);

  const goNext = useCallback(() => {
    if (!viewPhoto) return;
    const newIdx = (viewPhoto.idx + 1) % viewPhoto.all.length;
    setViewPhoto({ ...viewPhoto, entry: viewPhoto.all[newIdx], idx: newIdx });
  }, [viewPhoto]);

  // Keyboard navigation
  useEffect(() => {
    if (!viewPhoto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") setViewPhoto(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewPhoto, goPrev, goNext]);

  return (
    <>
      {/* Category filter */}
      <div className="px-6 pb-12 max-w-7xl mx-auto" id="lacrosse">
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs tracking-widest uppercase px-4 py-2 border rounded-full transition-all duration-300 ${
                activeCategory === cat
                  ? "border-[#c8a96e] text-[#c8a96e] bg-[#c8a96e]/10"
                  : "border-[#333] text-[#666] hover:border-[#555] hover:text-[#999]"
              }`}
            >
              {cat === "All" ? "All" : ALL_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-32 max-w-7xl mx-auto space-y-20">
        <AnimatePresence mode="wait">
          {/* Lacrosse folder card */}
          {showLacrosse && lacrossePhotos.length > 0 && (
            <motion.section
              key="lacrosse-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-6 mb-8">
                <h2 className="text-[#c8a96e] text-xs tracking-[0.3em] uppercase">Lacrosse</h2>
                <div className="flex-1 h-px bg-[#1a1a1a]" />
                <span className="text-[#444] text-xs">1 folder</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => setOpenLacrosse(true)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl cursor-pointer text-left"
                >
                  {lacrosseCover && (
                    <Image
                      src={lacrosseCover}
                      alt="Lacrosse"
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-[#c8a96e] text-[9px] tracking-[0.3em] uppercase mb-1">{LACROSSE_EVENT.sport} · {LACROSSE_EVENT.date}</p>
                    <p className="text-white text-sm font-medium leading-tight">{LACROSSE_EVENT.name}</p>
                    <p className="text-[#999] text-[10px] tracking-widest uppercase mt-1">
                      {lacrossePhotos.length} photos
                    </p>
                  </div>
                </motion.button>
              </div>
            </motion.section>
          )}

          {/* Other categories */}
          {Object.entries(grouped).map(([groupName, events]) => (
            <motion.section
              key={groupName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-6 mb-8">
                <h2 className="text-[#c8a96e] text-xs tracking-[0.3em] uppercase">{groupName}</h2>
                <div className="flex-1 h-px bg-[#1a1a1a]" />
                <span className="text-[#444] text-xs">{events.length} events</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {events.map((event, i) => (
                  <motion.button
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    onClick={() => setOpenEvent(event)}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl cursor-pointer text-left"
                  >
                    <Image
                      src={event.coverPhoto}
                      alt={event.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white text-sm font-medium leading-tight">{event.title}</p>
                      <p className="text-[#c8a96e] text-[10px] tracking-widest uppercase mt-1">
                        {event.photos.length} photo{event.photos.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>

      {/* Lacrosse lightbox */}
      <AnimatePresence>
        {openLacrosse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/96 overflow-y-auto"
          >
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#1a1a1a] px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[#c8a96e] text-[10px] tracking-[0.3em] uppercase">{LACROSSE_EVENT.sport} · {LACROSSE_EVENT.date}</p>
                  <h2 className="text-white text-xl font-light">{LACROSSE_EVENT.name}</h2>
                </div>
                <button onClick={() => setOpenLacrosse(false)} className="text-[#666] hover:text-white transition-colors p-2">
                  <X size={20} />
                </button>
              </div>
              <LacrosseSearch photos={lacrossePhotos} />
            </div>
            <div className="px-6 py-8 max-w-7xl mx-auto columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {lacrossePhotos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="break-inside-avoid relative group cursor-pointer"
                  onClick={() => setViewPhoto({ entry: { url: photo.cloudinaryUrl, cloudinaryId: photo.cloudinaryId }, all: lacrossePhotos.map(p => ({ url: p.cloudinaryUrl, cloudinaryId: p.cloudinaryId })), idx: i, prefix: LACROSSE_EVENT.name })}
                >
                  <Image
                    src={photo.cloudinaryUrl}
                    alt={photo.title}
                    width={1280}
                    height={960}
                    className="w-full h-auto rounded-lg"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setDownloadTarget({ url: photo.cloudinaryUrl, filename: `${photo.title}.jpg` }); }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-black/90 text-white rounded-full p-2"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Other event lightbox */}
      <AnimatePresence>
        {openEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/96 overflow-y-auto"
          >
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-[#c8a96e] text-[10px] tracking-[0.3em] uppercase">
                  {CATEGORY_LABELS[openEvent.category]}
                  {openEvent.subcategory ? ` › ${openEvent.subcategory}` : ""}
                </p>
                <h2 className="text-white text-xl font-light">{openEvent.title}</h2>
              </div>
              <button onClick={() => setOpenEvent(null)} className="text-[#666] hover:text-white transition-colors p-2">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-8 max-w-7xl mx-auto columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {openEvent.photos.map((photo, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="break-inside-avoid relative group cursor-pointer"
                  onClick={() => setViewPhoto({ entry: { url: photo.url }, all: openEvent.photos.map(p => ({ url: p.url })), idx: i, prefix: openEvent.title })}
                >
                  <Image
                    src={photo.url}
                    alt={photo.alt}
                    width={1280}
                    height={960}
                    className="w-full h-auto rounded-lg"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setDownloadTarget({ url: photo.url, filename: `${openEvent.title}-${i + 1}.jpg` }); }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-black/90 text-white rounded-full p-2"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download agreement modal */}
      {downloadTarget && (
        <DownloadModal
          imageUrl={downloadTarget.url}
          filename={downloadTarget.filename}
          onClose={() => setDownloadTarget(null)}
        />
      )}

      {/* Full-screen photo viewer */}
      <AnimatePresence>
        {viewPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black flex flex-col"
            onClick={() => setViewPhoto(null)}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-black/60 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
              <div>
                <p className="text-[#c8a96e] text-[10px] tracking-[0.3em] uppercase">{viewPhoto.prefix}</p>
                <p className="text-[#666] text-xs">{viewPhoto.idx + 1} / {viewPhoto.all.length}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDownloadTarget({ url: viewPhoto.entry.url, filename: `${viewPhoto.prefix}-${viewPhoto.idx + 1}.jpg` })}
                  className="text-[#666] hover:text-white transition-colors p-2"
                  title="Download"
                >
                  <Download size={18} />
                </button>
                <button onClick={() => setViewPhoto(null)} className="text-[#666] hover:text-white transition-colors p-2">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="flex-1 relative flex items-center justify-center" onClick={e => e.stopPropagation()}>
              <Image
                key={viewPhoto.entry.url}
                src={viewPhoto.entry.url}
                alt={`${viewPhoto.prefix} photo ${viewPhoto.idx + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />

              {/* Prev / Next */}
              <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-3 transition-colors z-10">
                <ChevronLeft size={24} />
              </button>
              <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-3 transition-colors z-10">
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Tags at bottom */}
            {viewTags.length > 0 && (
              <div className="flex-shrink-0 flex flex-wrap gap-3 items-center justify-center px-6 py-4 bg-black/60 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
                {viewTags.map((tag, ti) => (
                  <span key={ti} className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-4 py-1.5">
                    <span className="text-[#c8a96e] text-xs font-medium">#{tag.number}</span>
                    <span className="text-white text-sm">{tag.name}</span>
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Lacrosse search bar (shown above the lacrosse folder) ──────────────────────
export function LacrosseSearch({ photos }: { photos: { id: number; cloudinaryUrl: string; cloudinaryId: string; title: string }[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ photo: typeof photos[number]; tags: { number: string; name: string }[] }[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    const q = query.trim().toLowerCase();

    Promise.all(
      photos.map(async (photo) => {
        const val = await getSiteContent(`photo.tags.${photo.cloudinaryId}`);
        let tags: { number: string; name: string }[] = [];
        try { tags = val ? JSON.parse(val) : []; } catch {}
        return { photo, tags };
      })
    ).then((all) => {
      const matched = all.filter(({ tags }) =>
        tags.some(t => t.name.toLowerCase().includes(q) || t.number.toLowerCase().includes(q))
      );
      setResults(matched);
      setSearching(false);
    });
  }, [query, photos]);

  return (
    <div className="mb-8">
      <div className="relative max-w-sm">
        <input
          type="search"
          placeholder="Search by name or jersey #…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-[#0d0d0d] border border-[#222] text-white text-sm px-4 py-2.5 rounded-full focus:outline-none focus:border-[#c8a96e]/50 placeholder-[#444]"
        />
        {searching && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#444] text-[10px]">…</span>}
      </div>

      {query.trim() && (
        <div className="mt-4">
          {results.length === 0 && !searching ? (
            <p className="text-[#444] text-sm">No photos found for &ldquo;{query}&rdquo;</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {results.map(({ photo, tags }) => (
                <div key={photo.id} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                  <Image src={photo.cloudinaryUrl} alt={photo.title} fill className="object-cover" sizes="25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-wrap gap-1">
                    {tags.map((t, i) => (
                      <span key={i} className="bg-black/70 text-[10px] rounded px-2 py-0.5">
                        <span className="text-[#c8a96e]">#{t.number}</span>
                        <span className="text-white ml-1">{t.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
