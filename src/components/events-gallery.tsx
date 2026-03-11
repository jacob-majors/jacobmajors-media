"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { EVENTS, CATEGORY_LABELS, type PortfolioEvent } from "@/data/portfolio";

const CATEGORIES = ["All", "bike-races", "basketball", "soccer", "climbing"] as const;

export function EventsGallery() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [openEvent, setOpenEvent] = useState<PortfolioEvent | null>(null);

  const filtered =
    activeCategory === "All"
      ? EVENTS
      : EVENTS.filter((e) => e.category === activeCategory);

  // Group by subcategory (or category) for display
  const grouped = filtered.reduce<Record<string, PortfolioEvent[]>>((acc, event) => {
    const key = event.subcategory ?? CATEGORY_LABELS[event.category];
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  return (
    <>
      {/* Category filter */}
      <div className="px-6 pb-12 max-w-7xl mx-auto">
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
              {cat === "All" ? "All" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Events grouped by subcategory */}
      <div className="px-6 pb-32 max-w-7xl mx-auto space-y-20">
        <AnimatePresence mode="wait">
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
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
                    {/* Event title */}
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

      {/* Event lightbox / gallery */}
      <AnimatePresence>
        {openEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/96 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-[#c8a96e] text-[10px] tracking-[0.3em] uppercase">
                  {CATEGORY_LABELS[openEvent.category]}
                  {openEvent.subcategory ? ` › ${openEvent.subcategory}` : ""}
                </p>
                <h2 className="text-white text-xl font-light">{openEvent.title}</h2>
              </div>
              <button
                onClick={() => setOpenEvent(null)}
                className="text-[#666] hover:text-white transition-colors p-2"
              >
                <X size={20} />
              </button>
            </div>

            {/* Photos grid */}
            <div className="px-6 py-8 max-w-7xl mx-auto columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {openEvent.photos.map((photo, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="break-inside-avoid"
                >
                  <Image
                    src={photo.url}
                    alt={photo.alt}
                    width={1280}
                    height={960}
                    className="w-full h-auto rounded-lg"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
