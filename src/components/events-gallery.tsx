"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { EVENTS, CATEGORY_LABELS, type PortfolioEvent } from "@/data/portfolio";
import { DownloadModal } from "@/components/download-modal";

type LacrossePhoto = { id: number; cloudinaryUrl: string; title: string; cloudinaryId: string };

const CATEGORIES = ["All", "lacrosse", "bike-races", "basketball", "soccer", "climbing"] as const;
const ALL_LABELS: Record<string, string> = { ...CATEGORY_LABELS, lacrosse: "Lacrosse" };

export function EventsGallery({ lacrossePhotos = [] }: { lacrossePhotos?: LacrossePhoto[] }) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [openEvent, setOpenEvent] = useState<PortfolioEvent | null>(null);
  const [openLacrosse, setOpenLacrosse] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<{ url: string; filename: string } | null>(null);

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
                    <p className="text-white text-sm font-medium leading-tight">Lacrosse</p>
                    <p className="text-[#c8a96e] text-[10px] tracking-widest uppercase mt-1">
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
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-[#c8a96e] text-[10px] tracking-[0.3em] uppercase">Lacrosse</p>
                <h2 className="text-white text-xl font-light">{lacrossePhotos.length} Photos</h2>
              </div>
              <button onClick={() => setOpenLacrosse(false)} className="text-[#666] hover:text-white transition-colors p-2">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-8 max-w-7xl mx-auto columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {lacrossePhotos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="break-inside-avoid relative group"
                >
                  <Image
                    src={photo.cloudinaryUrl}
                    alt={photo.title}
                    width={1280}
                    height={960}
                    className="w-full h-auto rounded-lg"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Download button on hover */}
                  <button
                    onClick={() => setDownloadTarget({ url: photo.cloudinaryUrl, filename: `${photo.title}.jpg` })}
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
                  className="break-inside-avoid relative group"
                >
                  <Image
                    src={photo.url}
                    alt={photo.alt}
                    width={1280}
                    height={960}
                    className="w-full h-auto rounded-lg"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Download button on hover */}
                  <button
                    onClick={() => setDownloadTarget({ url: photo.url, filename: `${openEvent.title}-${i + 1}.jpg` })}
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
    </>
  );
}
