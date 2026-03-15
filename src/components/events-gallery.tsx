"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { EVENTS, CATEGORY_LABELS, type PortfolioEvent } from "@/data/portfolio";
import { DownloadModal } from "@/components/download-modal";
import { getSiteContent, setSiteContent } from "@/app/actions/site-content";
import { useEditMode } from "@/hooks/use-edit-mode";

type Tag = { number: string; name: string };
type LacrossePhoto = { id: number; cloudinaryUrl: string; title: string; cloudinaryId: string };
// photoKey is used as the siteContent key for tags; derived from cloudinaryId for DB photos
// or from the event id + index for static local photos
type ViewEntry = { url: string; cloudinaryId?: string; photoKey?: string };
// One entry per photo that has at least one tag — stored in photo.tags.searchIndex
type SearchIndexEntry = { photoKey: string; photoUrl: string; eventTitle: string; tags: Tag[] };

function getTagKey(entry: ViewEntry): string | undefined {
  return entry.cloudinaryId ?? entry.photoKey;
}

const CATEGORIES = ["All", "lacrosse", "bike-races", "basketball", "soccer", "climbing"] as const;
const ALL_LABELS: Record<string, string> = { ...CATEGORY_LABELS, lacrosse: "Lacrosse" };
const LACROSSE_EVENT = { sport: "Lacrosse", name: "Sonoma Academy vs Justin Siena", date: "03/13/2026" };

export function EventsGallery({ lacrossePhotos = [], isAdmin = false }: { lacrossePhotos?: LacrossePhoto[]; isAdmin?: boolean }) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [openEvent, setOpenEvent] = useState<PortfolioEvent | null>(null);
  const [openLacrosse, setOpenLacrosse] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<{ url: string; filename: string } | null>(null);
  const [viewPhoto, setViewPhoto] = useState<{ entry: ViewEntry; all: ViewEntry[]; idx: number; prefix: string } | null>(null);
  const [viewTags, setViewTags] = useState<Tag[]>([]);
  const [tagDraft, setTagDraft] = useState({ number: "", name: "" });
  const [tagSaving, setTagSaving] = useState(false);
  const [editingTagIdx, setEditingTagIdx] = useState<number | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [searchIndex, setSearchIndex] = useState<SearchIndexEntry[]>([]);
  const [globalQuery, setGlobalQuery] = useState("");
  const { editMode } = useEditMode();
  const canTag = isAdmin && editMode;

  useEffect(() => {
    if (window.location.hash === "#lacrosse") setActiveCategory("lacrosse");
    // Load search index for global search
    getSiteContent("photo.tags.searchIndex").then((val) => {
      try { setSearchIndex(val ? JSON.parse(val) : []); } catch { setSearchIndex([]); }
    });
  }, []);

  const showLacrosse = activeCategory === "All" || activeCategory === "lacrosse";
  const filteredEvents =
    activeCategory === "lacrosse" ? [] :
    activeCategory === "All" ? EVENTS :
    EVENTS.filter((e) => e.category === activeCategory);

  const grouped = filteredEvents.reduce<Record<string, PortfolioEvent[]>>((acc, event) => {
    const key = event.subcategory ?? CATEGORY_LABELS[event.category];
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  // Fetch global tag index for autocomplete when admin enters edit mode
  useEffect(() => {
    if (!canTag) return;
    getSiteContent("photo.tags.all").then((val) => {
      try { setAllTags(val ? JSON.parse(val) : []); } catch { setAllTags([]); }
    });
  }, [canTag]);

  // Recompute suggestions whenever draft changes
  useEffect(() => {
    const numQ = tagDraft.number.toLowerCase().trim();
    const nameQ = tagDraft.name.toLowerCase().trim();
    if (!numQ && !nameQ) { setSuggestions([]); return; }
    setSuggestions(
      allTags.filter(t =>
        (!numQ || t.number?.toLowerCase().includes(numQ)) &&
        (!nameQ || t.name?.toLowerCase().includes(nameQ))
      ).slice(0, 6)
    );
  }, [tagDraft, allTags]);

  // Fetch tags for currently viewed photo; reset editing state when photo changes
  useEffect(() => {
    const key = viewPhoto ? getTagKey(viewPhoto.entry) : undefined;
    setEditingTagIdx(null);
    setTagDraft({ number: "", name: "" });
    if (!key) { setViewTags([]); return; }
    getSiteContent(`photo.tags.${key}`).then((val) => {
      try { setViewTags(val ? JSON.parse(val) : []); } catch { setViewTags([]); }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewPhoto?.entry.cloudinaryId, viewPhoto?.entry.photoKey, viewPhoto?.idx]);

  async function saveTag() {
    const key = viewPhoto ? getTagKey(viewPhoto.entry) : undefined;
    if (!key || (!tagDraft.number && !tagDraft.name)) return;
    setTagSaving(true);
    let updated: Tag[];
    if (editingTagIdx !== null) {
      updated = viewTags.map((t, i) => i === editingTagIdx ? { number: tagDraft.number, name: tagDraft.name } : t);
    } else {
      updated = [...viewTags, { number: tagDraft.number, name: tagDraft.name }];
    }
    await setSiteContent(`photo.tags.${key}`, JSON.stringify(updated));
    setViewTags(updated);

    // Keep the global autocomplete index up to date
    const newTag = { number: tagDraft.number, name: tagDraft.name };
    const alreadyIndexed = allTags.some(t => t.number === newTag.number && t.name === newTag.name);
    if (!alreadyIndexed) {
      const updatedAll = [...allTags, newTag];
      await setSiteContent("photo.tags.all", JSON.stringify(updatedAll));
      setAllTags(updatedAll);
    }

    // Sync the search index (one entry per tagged photo, searched client-side)
    // viewPhoto is guaranteed non-null here because key is derived from viewPhoto
    const newEntry: SearchIndexEntry = {
      photoKey: key,
      photoUrl: viewPhoto?.entry.url ?? "",
      eventTitle: viewPhoto?.prefix ?? "",
      tags: updated,
    };
    const updatedIndex = searchIndex.some(e => e.photoKey === key)
      ? searchIndex.map(e => e.photoKey === key ? newEntry : e)
      : [...searchIndex, newEntry];
    await setSiteContent("photo.tags.searchIndex", JSON.stringify(updatedIndex));
    setSearchIndex(updatedIndex);

    setTagDraft({ number: "", name: "" });
    setEditingTagIdx(null);
    setSuggestions([]);
    setTagSaving(false);
  }

  async function removeTag(idx: number) {
    const key = viewPhoto ? getTagKey(viewPhoto.entry) : undefined;
    if (!key) return;
    const updated = viewTags.filter((_, i) => i !== idx);
    await setSiteContent(`photo.tags.${key}`, JSON.stringify(updated));
    setViewTags(updated);

    // Sync the search index — remove entry if no tags remain
    const updatedIndex = updated.length > 0
      ? searchIndex.map(e => e.photoKey === key ? { ...e, tags: updated } : e)
      : searchIndex.filter(e => e.photoKey !== key);
    await setSiteContent("photo.tags.searchIndex", JSON.stringify(updatedIndex));
    setSearchIndex(updatedIndex);
  }

  const goPrev = useCallback(() => {
    if (!viewPhoto) return;
    const idx = (viewPhoto.idx - 1 + viewPhoto.all.length) % viewPhoto.all.length;
    setViewPhoto({ ...viewPhoto, entry: viewPhoto.all[idx], idx });
  }, [viewPhoto]);

  const goNext = useCallback(() => {
    if (!viewPhoto) return;
    const idx = (viewPhoto.idx + 1) % viewPhoto.all.length;
    setViewPhoto({ ...viewPhoto, entry: viewPhoto.all[idx], idx });
  }, [viewPhoto]);

  // Keyboard nav
  useEffect(() => {
    if (!viewPhoto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") setViewPhoto(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewPhoto, goPrev, goNext]);

  // Touch swipe for photo viewer
  const touchStart = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) { touchStart.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 50) { if (dx < 0) goNext(); else goPrev(); }
    touchStart.current = null;
  }

  const lacrosseCover = lacrossePhotos[0]?.cloudinaryUrl ?? "";

  function openLacrossePhoto(i: number) {
    setViewPhoto({
      entry: { url: lacrossePhotos[i].cloudinaryUrl, cloudinaryId: lacrossePhotos[i].cloudinaryId },
      all: lacrossePhotos.map(p => ({ url: p.cloudinaryUrl, cloudinaryId: p.cloudinaryId })),
      idx: i,
      prefix: LACROSSE_EVENT.name,
    });
  }

  function openEventPhoto(event: PortfolioEvent, i: number) {
    setViewPhoto({
      entry: { url: event.photos[i].url, photoKey: `evt.${event.id}.${i}` },
      all: event.photos.map((p, j) => ({ url: p.url, photoKey: `evt.${event.id}.${j}` })),
      idx: i,
      prefix: event.title,
    });
  }

  // Compute search results from the index
  const searchResults = globalQuery.trim()
    ? searchIndex.filter(entry =>
        entry.tags.some(t =>
          t.name?.toLowerCase().includes(globalQuery.toLowerCase().trim()) ||
          t.number?.toLowerCase().includes(globalQuery.toLowerCase().trim())
        )
      )
    : [];

  return (
    <>
      {/* Global search */}
      <div className="px-4 sm:px-6 pb-6 max-w-7xl mx-auto">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444]" />
          <input
            type="search"
            placeholder="Search by name or number across all photos…"
            value={globalQuery}
            onChange={e => setGlobalQuery(e.target.value)}
            className="w-full bg-[#111] border border-[#222] text-white text-sm pl-9 pr-9 py-2.5 rounded-full focus:outline-none focus:border-[#c8a96e]/50 placeholder-[#444]"
          />
          {globalQuery && (
            <button onClick={() => setGlobalQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Search results view */}
      {globalQuery && (
        <div className="px-4 sm:px-6 pb-24 sm:pb-32 max-w-7xl mx-auto">
          {searchResults.length === 0 ? (
            <p className="text-[#444] text-sm">No results for &ldquo;{globalQuery}&rdquo;</p>
          ) : (
            <>
              <p className="text-[#555] text-[10px] tracking-widest uppercase mb-5">
                {searchResults.length} photo{searchResults.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {searchResults.map((entry, i) => (
                  <button
                    key={entry.photoKey}
                    onClick={() => setViewPhoto({
                      entry: { url: entry.photoUrl, photoKey: entry.photoKey },
                      all: searchResults.map(r => ({ url: r.photoUrl, photoKey: r.photoKey })),
                      idx: i,
                      prefix: entry.eventTitle,
                    })}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl"
                  >
                    <Image src={entry.photoUrl} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/55 transition-colors duration-300" />
                    {/* Tags centered over the image */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3">
                      {entry.tags.map((t, ti) => (
                        <span key={ti} className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1">
                          {t.number && <span className="text-[#c8a96e] text-xs font-semibold">#{t.number}</span>}
                          {t.name && <span className="text-white text-xs">{t.name}</span>}
                        </span>
                      ))}
                    </div>
                    {/* Event label at bottom */}
                    <p className="absolute bottom-0 left-0 right-0 px-3 py-2 text-[8px] sm:text-[9px] text-[#888] tracking-widest uppercase truncate bg-gradient-to-t from-black/80 to-transparent">
                      {entry.eventTitle}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Category filter + gallery — hidden while searching */}
      {!globalQuery && <>
      <div className="px-4 sm:px-6 pb-8 sm:pb-12 max-w-7xl mx-auto" id="lacrosse">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[10px] sm:text-xs tracking-widest uppercase px-3 sm:px-4 py-1.5 sm:py-2 border rounded-full transition-all duration-300 ${
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

      <div className="px-4 sm:px-6 pb-24 sm:pb-32 max-w-7xl mx-auto space-y-16 sm:space-y-20">
        <AnimatePresence mode="wait">
          {/* Lacrosse folder card */}
          {showLacrosse && lacrossePhotos.length > 0 && (
            <motion.section key="lacrosse-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                <h2 className="text-[#c8a96e] text-xs tracking-[0.3em] uppercase">Lacrosse</h2>
                <div className="flex-1 h-px bg-[#1a1a1a]" />
                <span className="text-[#444] text-xs">1 folder</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
                  onClick={() => setOpenLacrosse(true)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl cursor-pointer text-left"
                >
                  {lacrosseCover && (
                    <Image src={lacrosseCover} alt="Lacrosse" fill className="object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform" sizes="(max-width: 640px) 50vw, 25vw" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    <p className="text-[#c8a96e] text-[8px] sm:text-[9px] tracking-[0.3em] uppercase mb-0.5">{LACROSSE_EVENT.sport} · {LACROSSE_EVENT.date}</p>
                    <p className="text-white text-xs sm:text-sm font-medium leading-tight">{LACROSSE_EVENT.name}</p>
                    <p className="text-[#999] text-[9px] sm:text-[10px] tracking-widest uppercase mt-1">{lacrossePhotos.length} photos</p>
                  </div>
                </motion.button>
              </div>
            </motion.section>
          )}

          {/* Other categories */}
          {Object.entries(grouped).map(([groupName, events]) => (
            <motion.section key={groupName} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                <h2 className="text-[#c8a96e] text-xs tracking-[0.3em] uppercase">{groupName}</h2>
                <div className="flex-1 h-px bg-[#1a1a1a]" />
                <span className="text-[#444] text-xs">{events.length} events</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {events.map((event, i) => (
                  <motion.button key={event.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: i * 0.06 }}
                    onClick={() => setOpenEvent(event)}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl cursor-pointer text-left"
                  >
                    <Image src={event.coverPhoto} alt={event.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110 will-change-transform" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                      <p className="text-white text-xs sm:text-sm font-medium leading-tight">{event.title}</p>
                      <p className="text-[#c8a96e] text-[9px] sm:text-[10px] tracking-widest uppercase mt-1">{event.photos.length} photo{event.photos.length !== 1 ? "s" : ""}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>
      </>}

      {/* ── Lacrosse lightbox ── */}
      <AnimatePresence>
        {openLacrosse && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-[#1a1a1a] px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="min-w-0 pr-3">
                  <p className="text-[#c8a96e] text-[9px] sm:text-[10px] tracking-[0.3em] uppercase">{LACROSSE_EVENT.sport} · {LACROSSE_EVENT.date}</p>
                  <h2 className="text-white text-base sm:text-xl font-light truncate">{LACROSSE_EVENT.name}</h2>
                </div>
                <button onClick={() => setOpenLacrosse(false)} className="flex-shrink-0 text-[#666] hover:text-white transition-colors p-2 -mr-2">
                  <X size={20} />
                </button>
              </div>
              <LacrosseSearch searchIndex={searchIndex} lacrossePhotos={lacrossePhotos} onPhotoClick={(i) => { openLacrossePhoto(i); }} />
            </div>

            {/* Photo grid — single column on mobile, masonry on larger */}
            <div className="px-3 sm:px-6 py-4 sm:py-8 max-w-7xl mx-auto columns-1 sm:columns-2 lg:columns-3 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
              {lacrossePhotos.map((photo, i) => (
                <motion.div key={photo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.6) }}
                  className="break-inside-avoid relative group cursor-pointer"
                  onClick={() => openLacrossePhoto(i)}
                >
                  <Image src={photo.cloudinaryUrl} alt={photo.title} width={1280} height={960} className="w-full h-auto rounded-lg" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                  {/* Download: always visible on mobile, hover-only on desktop */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDownloadTarget({ url: photo.cloudinaryUrl, filename: `${photo.title}.jpg` }); }}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-opacity bg-black/60 hover:bg-black/90 text-white rounded-full p-2"
                    title="Download"
                  >
                    <Download size={14} className="sm:hidden" />
                    <Download size={16} className="hidden sm:block" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Other event lightbox ── */}
      <AnimatePresence>
        {openEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-[#1a1a1a] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <p className="text-[#c8a96e] text-[9px] sm:text-[10px] tracking-[0.3em] uppercase">
                  {CATEGORY_LABELS[openEvent.category]}{openEvent.subcategory ? ` › ${openEvent.subcategory}` : ""}
                </p>
                <h2 className="text-white text-base sm:text-xl font-light truncate">{openEvent.title}</h2>
              </div>
              <button onClick={() => setOpenEvent(null)} className="flex-shrink-0 text-[#666] hover:text-white transition-colors p-2 -mr-2">
                <X size={20} />
              </button>
            </div>
            <div className="px-3 sm:px-6 py-4 sm:py-8 max-w-7xl mx-auto columns-1 sm:columns-2 lg:columns-3 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
              {openEvent.photos.map((photo, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.6) }}
                  className="break-inside-avoid relative group cursor-pointer"
                  onClick={() => openEventPhoto(openEvent, i)}
                >
                  <Image src={photo.url} alt={photo.alt} width={1280} height={960} className="w-full h-auto rounded-lg" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setDownloadTarget({ url: photo.url, filename: `${openEvent.title}-${i + 1}.jpg` }); }}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-opacity bg-black/60 hover:bg-black/90 text-white rounded-full p-2"
                    title="Download"
                  >
                    <Download size={14} className="sm:hidden" />
                    <Download size={16} className="hidden sm:block" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download agreement modal */}
      {downloadTarget && (
        <DownloadModal imageUrl={downloadTarget.url} filename={downloadTarget.filename} onClose={() => setDownloadTarget(null)} />
      )}

      {/* ── Full-screen photo viewer ── */}
      <AnimatePresence>
        {viewPhoto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black flex flex-col overscroll-none"
            style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-black/70 backdrop-blur-sm">
              <div>
                <p className="text-[#c8a96e] text-[9px] sm:text-[10px] tracking-[0.3em] uppercase leading-tight">{viewPhoto.prefix}</p>
                <p className="text-[#555] text-xs">{viewPhoto.idx + 1} / {viewPhoto.all.length}</p>
              </div>
              <div className="flex items-center gap-1 sm:gap-3">
                <button onClick={() => setDownloadTarget({ url: viewPhoto.entry.url, filename: `${viewPhoto.prefix}-${viewPhoto.idx + 1}.jpg` })} className="text-[#666] hover:text-white transition-colors p-2.5" title="Download">
                  <Download size={18} />
                </button>
                <button onClick={() => setViewPhoto(null)} className="text-[#666] hover:text-white transition-colors p-2.5">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Image area — preload prev+next to eliminate delay when cycling */}
            <div className="flex-1 relative min-h-0">
              <Image src={viewPhoto.entry.url} alt={`${viewPhoto.prefix} ${viewPhoto.idx + 1}`} fill className="object-contain" sizes="100vw" priority unoptimized={viewPhoto.entry.url.startsWith("http")} />
              {/* Hidden preloads for adjacent photos */}
              {viewPhoto.all[(viewPhoto.idx + 1) % viewPhoto.all.length] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={viewPhoto.all[(viewPhoto.idx + 1) % viewPhoto.all.length].url} alt="" className="hidden" aria-hidden />
              )}
              {viewPhoto.all[(viewPhoto.idx - 1 + viewPhoto.all.length) % viewPhoto.all.length] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={viewPhoto.all[(viewPhoto.idx - 1 + viewPhoto.all.length) % viewPhoto.all.length].url} alt="" className="hidden" aria-hidden />
              )}

              {/* Prev/Next — smaller on mobile, tap-friendly size */}
              <button onClick={goPrev} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 active:bg-black/80 text-white rounded-full p-2.5 sm:p-3 z-10">
                <ChevronLeft size={20} className="sm:hidden" />
                <ChevronLeft size={24} className="hidden sm:block" />
              </button>
              <button onClick={goNext} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 active:bg-black/80 text-white rounded-full p-2.5 sm:p-3 z-10">
                <ChevronRight size={20} className="sm:hidden" />
                <ChevronRight size={24} className="hidden sm:block" />
              </button>
            </div>

            {/* Tags + edit-mode tag form at bottom */}
            {(viewTags.length > 0 || (canTag && viewPhoto && getTagKey(viewPhoto.entry))) && (
              <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-black/70 backdrop-blur-sm space-y-3">
                {/* Existing tags — clickable to edit in edit mode */}
                {viewTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-center">
                    {viewTags.map((tag, ti) => (
                      <span
                        key={ti}
                        onClick={() => {
                          if (!canTag) return;
                          setEditingTagIdx(ti);
                          setTagDraft({ number: tag.number, name: tag.name });
                        }}
                        className={`flex items-center gap-1.5 sm:gap-2 bg-[#1a1a1a] border rounded-full px-3 sm:px-4 py-1 sm:py-1.5 transition-colors ${
                          canTag
                            ? editingTagIdx === ti
                              ? "border-[#c8a96e] cursor-pointer"
                              : "border-[#2a2a2a] hover:border-[#444] cursor-pointer"
                            : "border-[#2a2a2a]"
                        }`}
                      >
                        {tag.number && <span className="text-[#c8a96e] text-xs font-medium">#{tag.number}</span>}
                        {tag.name && <span className="text-white text-xs sm:text-sm">{tag.name}</span>}
                        {canTag && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeTag(ti); }}
                            className="text-[#555] hover:text-red-400 text-[10px] ml-1 transition-colors"
                          >✕</button>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tag form — edit mode only, for any photo */}
                {canTag && viewPhoto && getTagKey(viewPhoto.entry) && (
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center justify-center">
                      <input
                        placeholder="#"
                        value={tagDraft.number}
                        onChange={e => setTagDraft(d => ({ ...d, number: e.target.value }))}
                        className="w-14 sm:w-16 bg-[#111] border border-[#333] text-white text-sm px-2 py-1.5 rounded-lg focus:outline-none focus:border-[#c8a96e] text-center"
                      />
                      <input
                        placeholder="Name"
                        value={tagDraft.name}
                        onChange={e => setTagDraft(d => ({ ...d, name: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && saveTag()}
                        className="flex-1 max-w-[200px] bg-[#111] border border-[#333] text-white text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#c8a96e]"
                      />
                      <button
                        onClick={saveTag}
                        disabled={tagSaving || (!tagDraft.number && !tagDraft.name)}
                        className="bg-[#c8a96e] text-black text-xs tracking-widest uppercase px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 transition-opacity whitespace-nowrap"
                      >
                        {tagSaving ? "…" : editingTagIdx !== null ? "Save" : "Tag"}
                      </button>
                      {editingTagIdx !== null && (
                        <button
                          onClick={() => { setEditingTagIdx(null); setTagDraft({ number: "", name: "" }); setSuggestions([]); }}
                          className="text-[#555] hover:text-white text-xs transition-colors"
                        >Cancel</button>
                      )}
                    </div>
                    {/* Autocomplete suggestions */}
                    {suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => { setTagDraft({ number: s.number, name: s.name }); setSuggestions([]); }}
                            className="flex items-center gap-1 bg-[#111] border border-[#2a2a2a] hover:border-[#c8a96e]/50 rounded-full px-2.5 py-1 transition-colors"
                          >
                            {s.number && <span className="text-[#c8a96e] text-[10px] font-medium">#{s.number}</span>}
                            {s.name && <span className="text-white text-[10px]">{s.name}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Swipe hint on mobile (shown briefly) */}
            <p className="sm:hidden absolute bottom-16 left-1/2 -translate-x-1/2 text-white/20 text-[9px] tracking-widest uppercase pointer-events-none select-none">
              Swipe to navigate
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Lacrosse search — uses the pre-built search index (no per-photo DB fetches) ──
export function LacrosseSearch({
  searchIndex,
  lacrossePhotos,
  onPhotoClick,
}: {
  searchIndex: SearchIndexEntry[];
  lacrossePhotos: LacrossePhoto[];
  onPhotoClick?: (idx: number) => void;
}) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  // Lacrosse entries: photoKey is a cloudinaryId (no "evt." prefix)
  const results = q
    ? searchIndex
        .filter(e => !e.photoKey.startsWith("evt.") &&
          e.tags.some(t => t.name?.toLowerCase().includes(q) || t.number?.toLowerCase().includes(q)))
        .map(e => ({
          ...e,
          originalIdx: lacrossePhotos.findIndex(p => p.cloudinaryId === e.photoKey),
        }))
        .filter(e => e.originalIdx >= 0)
    : [];

  return (
    <div>
      {/* Search input */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444]" />
        <input
          type="search"
          placeholder="Search by name or jersey #"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#111] border border-[#222] text-white text-sm pl-9 pr-4 py-2 rounded-full focus:outline-none focus:border-[#c8a96e]/50 placeholder-[#444]"
        />
      </div>

      {/* Results */}
      <AnimatePresence>
        {q && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3">
            {results.length === 0 ? (
              <p className="text-[#444] text-xs px-1">No results for &ldquo;{query}&rdquo;</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {results.map((entry) => (
                  <button
                    key={entry.photoKey}
                    onClick={() => { onPhotoClick?.(entry.originalIdx); setQuery(""); }}
                    className="relative aspect-[4/3] rounded-lg overflow-hidden group"
                  >
                    <Image src={entry.photoUrl} alt="" fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 50vw, 33vw" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/55 transition-colors" />
                    {/* Tags centered over image */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
                      {entry.tags.map((t, i) => (
                        <span key={i} className="flex items-center gap-1 bg-black/70 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-0.5">
                          {t.number && <span className="text-[#c8a96e] text-[10px] font-semibold">#{t.number}</span>}
                          {t.name && <span className="text-white text-[10px]">{t.name}</span>}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
