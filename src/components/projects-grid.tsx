"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Github, ExternalLink, ArrowRight } from "lucide-react";
import Image from "next/image";
import { CldImage } from "next-cloudinary";
import dynamic from "next/dynamic";
import type { projects } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { useTheme } from "@/providers/theme-provider";

type Project = InferSelectModel<typeof projects>;

const STLViewer = dynamic(
  () => import("./stl-viewer").then((m) => m.STLViewer),
  { ssr: false },
);

function ProjectCard({ project, index, inView }: { project: Project; index: number; inView: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [stlMounted, setStlMounted] = useState(false);
  const [stlVisible, setStlVisible] = useState(false);
  const { theme } = useTheme();

  const accentColor = theme === "cream" ? "#9b7120" : "#c8a96e";
  const tags = JSON.parse(project.tags) as string[];
  const hasWriteup = !!project.longDescription;
  const hasLinks = project.githubUrl || project.liveUrl;
  const hasStl = !!project.stlUrl;

  function handleImageEnter() {
    if (!hasStl) return;
    if (!stlMounted) setStlMounted(true);
    setStlVisible(true);
  }

  function handleImageLeave() {
    setStlVisible(false);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col"
    >
      {/* Cover image / STL hover */}
      <div
        className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#111] mb-5 cursor-default"
        onMouseEnter={handleImageEnter}
        onMouseLeave={handleImageLeave}
      >
        {/* STL hint badge */}
        {hasStl && (
          <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-sm text-[#c8a96e] text-[9px] tracking-widest uppercase px-2 py-1 rounded pointer-events-none">
            3D
          </div>
        )}

        {/* Photo layer */}
        <div
          className="absolute inset-0 transition-opacity duration-400"
          style={{ opacity: stlVisible ? 0 : 1 }}
        >
          {project.cloudinaryId ? (
            <CldImage
              src={project.cloudinaryId}
              alt={project.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          ) : project.cloudinaryUrl ? (
            <Image
              src={project.cloudinaryUrl}
              alt={project.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center border border-[#1a1a1a] rounded-xl">
              {hasStl ? (
                <span className="text-[#333] text-xs tracking-widest uppercase">Hover to view 3D</span>
              ) : (
                <span className="text-[#2a2a2a] text-xs tracking-widest uppercase">No photo</span>
              )}
            </div>
          )}
        </div>

        {/* STL viewer layer */}
        {stlMounted && hasStl && (
          <div
            className="absolute inset-0 transition-opacity duration-400"
            style={{ opacity: stlVisible ? 1 : 0 }}
          >
            <STLViewer url={project.stlUrl!} accentColor={accentColor} />
          </div>
        )}
      </div>

      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-white underline underline-offset-4 decoration-[#c8a96e]/60 mb-3 leading-tight">
        {project.title}
      </h2>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[10px] tracking-wider uppercase text-[#c8a96e] border border-[#c8a96e]/30 rounded px-2 py-1">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      <p className="text-[#888] text-base leading-relaxed mb-5">
        {project.description}
      </p>

      {/* Read more / links */}
      <div className="flex items-center gap-4 mt-auto">
        {hasWriteup && (
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold bg-[#1a1a1a] hover:bg-[#c8a96e] text-white hover:text-black transition-all duration-200 rounded-lg px-5 py-2.5"
          >
            {isOpen ? "Read less" : "Read more"}
            <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ArrowRight size={14} />
            </motion.span>
          </button>
        )}
        {!hasWriteup && project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold bg-[#1a1a1a] hover:bg-[#c8a96e] text-white hover:text-black transition-all duration-200 rounded-lg px-5 py-2.5"
          >
            View Project
            <ExternalLink size={14} />
          </a>
        )}
        {!hasWriteup && project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#666] hover:text-white transition-colors flex items-center gap-2 text-sm"
          >
            <Github size={15} />
            Source
          </a>
        )}
      </div>

      {/* Expanded write-up */}
      <AnimatePresence initial={false}>
        {isOpen && hasWriteup && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#1a1a1a] mt-5 pt-5">
              <p className="text-[#888] text-sm leading-relaxed whitespace-pre-wrap mb-6">
                {project.longDescription}
              </p>
              {hasLinks && (
                <div className="flex items-center gap-5">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#666] hover:text-white transition-colors flex items-center gap-2 text-sm"
                    >
                      <Github size={15} />
                      Source
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#c8a96e] hover:text-white transition-colors flex items-center gap-2 text-sm"
                    >
                      <ExternalLink size={15} />
                      View Project
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export function ProjectsGrid({ projects }: { projects: Project[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="px-4 sm:px-6 pb-32 max-w-5xl mx-auto">
      <div className="grid sm:grid-cols-2 gap-12 sm:gap-14">
        {projects.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} inView={inView} />
        ))}
      </div>
    </div>
  );
}
