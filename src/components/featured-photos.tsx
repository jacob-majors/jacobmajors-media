"use client";

import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { EVENTS } from "@/data/portfolio";

// Pull 6 featured events from static data for homepage grid
const FEATURED = EVENTS.filter((e) => e.featured).slice(0, 6);

export function FeaturedPhotos() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="px-6 pb-32">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3">
        {FEATURED.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className={`relative overflow-hidden group cursor-pointer ${i === 0 ? "col-span-2 row-span-2" : ""}`}
          >
            <Link href="/photography">
              <div className={`relative w-full ${i === 0 ? "aspect-[4/3]" : "aspect-square"}`}>
                <Image
                  src={event.coverPhoto}
                  alt={event.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105 will-change-transform"
                  sizes={i === 0 ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 50vw, 33vw"}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-500" />
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-medium">{event.title}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
