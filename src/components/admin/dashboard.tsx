"use client";

import { useState } from "react";
import { PhotoUploadForm } from "./photo-upload-form";
import { ProjectForm } from "./project-form";
import { BlogPostForm } from "./blog-post-form";
import { HeroSlidesForm } from "./hero-slides-form";

const TABS = ["Hero", "Photos", "Projects", "Blog"] as const;
type Tab = typeof TABS[number];

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("Photos");

  return (
    <main className="pt-24 px-6 max-w-4xl mx-auto pb-32">
      <div className="py-12">
        <p className="text-[#c8a96e] text-xs tracking-[0.4em] uppercase mb-4">Admin</p>
        <h1 className="text-4xl font-light text-white">Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#1a1a1a] mb-12">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-4 text-sm tracking-wider uppercase transition-colors border-b-2 -mb-px ${
              tab === t ? "text-[#c8a96e] border-[#c8a96e]" : "text-[#666] border-transparent"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Hero" && <HeroSlidesForm />}
      {tab === "Photos" && <PhotoUploadForm />}
      {tab === "Projects" && <ProjectForm />}
      {tab === "Blog" && <BlogPostForm />}
    </main>
  );
}
