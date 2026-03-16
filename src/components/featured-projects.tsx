"use client";

import { CldImage } from "next-cloudinary";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import type { projects } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type Project = InferSelectModel<typeof projects>;

export function FeaturedProjects({ projects }: { projects: Project[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  if (projects.length === 0) {
    return (
      <section className="px-6 pb-32">
        <div className="max-w-7xl mx-auto h-64 border border-dashed border-[#333] rounded flex items-center justify-center">
          <p className="text-[#666] text-sm">No featured projects yet — add some from the admin panel</p>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="px-6 pb-32">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
        {projects.map((project, i) => {
          const tags = JSON.parse(project.tags) as string[];
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="group border border-[#1a1a1a] rounded-2xl overflow-hidden hover:border-[#c8a96e]/30 transition-colors duration-500"
            >
              <Link href={project.liveUrl ?? `/projects/${project.id}`} target={project.liveUrl ? "_blank" : undefined} rel={project.liveUrl ? "noopener noreferrer" : undefined}>
                {project.cloudinaryId && (
                  <div className="relative aspect-video overflow-hidden">
                    <CldImage
                      src={project.cloudinaryId}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] tracking-wider uppercase text-[#c8a96e] border border-[#c8a96e]/30 rounded px-2 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-white text-xl font-medium mb-3 group-hover:text-[#c8a96e] transition-colors">{project.title}</h3>
                  <p className="text-[#666] text-sm leading-relaxed line-clamp-3">{project.description}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
