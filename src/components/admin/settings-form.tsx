"use client";

import { useState, useEffect } from "react";
import { getSiteContent, setSiteContent, getAllPhotoTagKeys } from "@/app/actions/site-content";
import { getCloudinaryStats, type CloudinaryUsage } from "@/app/actions/cloudinary-stats";

type Tag = { number: string; name: string; sport?: string };

const SPORTS = ["lacrosse", "basketball", "bike-races", "soccer", "climbing"] as const;
type Sport = typeof SPORTS[number];

const SPORT_LABELS: Record<Sport, string> = {
  lacrosse: "Lacrosse",
  basketball: "Basketball",
  "bike-races": "Bike Racing",
  soccer: "Soccer",
  climbing: "Climbing",
};

const SPORT_COLORS: Record<Sport, { accent: string; bg: string; border: string }> = {
  lacrosse:    { accent: "#4a9eff", bg: "rgba(74,158,255,0.08)",  border: "rgba(74,158,255,0.25)" },
  basketball:  { accent: "#f97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.25)" },
  "bike-races":{ accent: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.25)"  },
  soccer:      { accent: "#a855f7", bg: "rgba(168,85,247,0.08)",  border: "rgba(168,85,247,0.25)" },
  climbing:    { accent: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)"  },
};

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function pct(usage: number, limit: number) {
  if (!limit) return 0;
  return Math.min(100, Math.round((usage / limit) * 100));
}

export function SettingsForm() {
  // ── Nav settings ──
  const [showEngineering, setShowEngineering] = useState(true);
  const [showWriting, setShowWriting] = useState(false);
  const [navSaving, setNavSaving] = useState(false);
  const [navMsg, setNavMsg] = useState<string | null>(null);

  // ── Cloudinary ──
  const [cldStats, setCldStats] = useState<CloudinaryUsage | null>(null);
  const [cldLoading, setCldLoading] = useState(true);

  // ── Tags ──
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<{ idx: number; draft: Tag } | null>(null);
  const [tagMsg, setTagMsg] = useState<string | null>(null);
  const [dedupBusy, setDedupBusy] = useState(false);

  // Load nav settings
  useEffect(() => {
    getSiteContent("settings.nav").then((val) => {
      try {
        const s = val ? JSON.parse(val) : {};
        setShowEngineering(s.showEngineering ?? true);
        setShowWriting(s.showWriting ?? false);
      } catch {}
    });
  }, []);

  // Load Cloudinary stats
  useEffect(() => {
    getCloudinaryStats().then((s) => { setCldStats(s); setCldLoading(false); });
  }, []);

  // Load all tags
  useEffect(() => {
    getSiteContent("photo.tags.all").then((val) => {
      try { setAllTags(val ? JSON.parse(val) : []); } catch { setAllTags([]); }
      setTagsLoading(false);
    });
  }, []);

  async function saveNavSettings() {
    setNavSaving(true);
    await setSiteContent("settings.nav", JSON.stringify({ showEngineering, showWriting }));
    setNavMsg("Saved ✓");
    setNavSaving(false);
    setTimeout(() => setNavMsg(null), 2500);
  }

  async function saveTag(idx: number, updated: Tag) {
    const next = allTags.map((t, i) => i === idx ? updated : t);
    setAllTags(next);
    await setSiteContent("photo.tags.all", JSON.stringify(next));
    setEditingTag(null);
    setTagMsg("Saved ✓");
    setTimeout(() => setTagMsg(null), 2000);
  }

  async function deleteTag(idx: number) {
    const next = allTags.filter((_, i) => i !== idx);
    setAllTags(next);
    await setSiteContent("photo.tags.all", JSON.stringify(next));
    setTagMsg("Deleted");
    setTimeout(() => setTagMsg(null), 2000);
  }

  async function deduplicateTags() {
    setDedupBusy(true);
    // 1. Dedup photo.tags.all
    const seen = new Set<string>();
    const unique = allTags.filter((t) => {
      const k = `${t.sport ?? ""}|${t.number}|${t.name}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    setAllTags(unique);
    await setSiteContent("photo.tags.all", JSON.stringify(unique));

    // 2. Dedup per-photo tags in DB
    const rows = await getAllPhotoTagKeys();
    await Promise.all(
      rows.map(async ({ key, value }) => {
        let tags: Tag[] = [];
        try { tags = JSON.parse(value); } catch { return; }
        const seenPer = new Set<string>();
        const deduped = tags.filter((t) => {
          const k = `${t.sport ?? ""}|${t.number}|${t.name}`;
          if (seenPer.has(k)) return false;
          seenPer.add(k);
          return true;
        });
        if (deduped.length !== tags.length) {
          await setSiteContent(key, JSON.stringify(deduped));
        }
      })
    );

    setDedupBusy(false);
    setTagMsg(`Cleaned up ${allTags.length - unique.length} duplicate(s)`);
    setTimeout(() => setTagMsg(null), 3000);
  }

  // Group tags by sport
  const tagsBySport: Record<string, Tag[]> = {};
  const unassigned: Tag[] = [];
  for (const tag of allTags) {
    if (tag.sport && SPORTS.includes(tag.sport as Sport)) {
      if (!tagsBySport[tag.sport]) tagsBySport[tag.sport] = [];
      tagsBySport[tag.sport].push(tag);
    } else {
      unassigned.push(tag);
    }
  }

  return (
    <div className="space-y-14">

      {/* ── Navigation Visibility ── */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-[#c8a96e] text-xs tracking-[0.3em] uppercase">Navigation</h2>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>
        <p className="text-[#555] text-sm mb-6">Control which tabs are visible to public visitors.</p>

        <div className="space-y-4">
          {([ ["Engineering", showEngineering, setShowEngineering], ["Writing", showWriting, setShowWriting] ] as const).map(([label, val, set]) => (
            <div key={label} className="flex items-center justify-between bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-5 py-4">
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-[#555] text-xs mt-0.5">{val ? "Visible to everyone" : "Hidden from public"}</p>
              </div>
              <button
                onClick={() => (set as (v: boolean) => void)(!val)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${val ? "bg-[#c8a96e]" : "bg-[#2a2a2a]"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${val ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={saveNavSettings}
            disabled={navSaving}
            className="bg-[#c8a96e] text-black text-xs tracking-widest uppercase px-5 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-opacity"
          >
            {navSaving ? "Saving…" : "Save Navigation"}
          </button>
          {navMsg && <span className="text-green-400 text-xs">{navMsg}</span>}
        </div>
      </section>

      {/* ── Cloudinary Stats ── */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-[#c8a96e] text-xs tracking-[0.3em] uppercase">Cloudinary Usage</h2>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>

        {cldLoading ? (
          <p className="text-[#555] text-sm">Loading stats…</p>
        ) : !cldStats ? (
          <p className="text-[#555] text-sm">Could not load Cloudinary stats. Check API credentials.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Resources */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5">
              <p className="text-[#666] text-[10px] tracking-widest uppercase mb-2">Photos</p>
              <p className="text-white text-3xl font-light">{cldStats.resources.toLocaleString()}</p>
              <p className="text-[#555] text-xs mt-1">total resources</p>
            </div>

            {/* Storage */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5">
              <p className="text-[#666] text-[10px] tracking-widest uppercase mb-2">Storage</p>
              <p className="text-white text-3xl font-light">{fmt(cldStats.storage.usage)}</p>
              {cldStats.storage.limit > 0 && (
                <>
                  <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full mt-3 mb-1.5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct(cldStats.storage.usage, cldStats.storage.limit)}%`, backgroundColor: pct(cldStats.storage.usage, cldStats.storage.limit) > 80 ? "#ef4444" : "#c8a96e" }}
                    />
                  </div>
                  <p className="text-[#555] text-xs">{pct(cldStats.storage.usage, cldStats.storage.limit)}% of {fmt(cldStats.storage.limit)}</p>
                </>
              )}
            </div>

            {/* Bandwidth */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5">
              <p className="text-[#666] text-[10px] tracking-widest uppercase mb-2">Bandwidth</p>
              <p className="text-white text-3xl font-light">{fmt(cldStats.bandwidth.usage)}</p>
              {cldStats.bandwidth.limit > 0 && (
                <>
                  <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full mt-3 mb-1.5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct(cldStats.bandwidth.usage, cldStats.bandwidth.limit)}%`, backgroundColor: pct(cldStats.bandwidth.usage, cldStats.bandwidth.limit) > 80 ? "#ef4444" : "#4a9eff" }}
                    />
                  </div>
                  <p className="text-[#555] text-xs">{pct(cldStats.bandwidth.usage, cldStats.bandwidth.limit)}% of {fmt(cldStats.bandwidth.limit)}</p>
                </>
              )}
            </div>

            {/* Transformations */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5">
              <p className="text-[#666] text-[10px] tracking-widest uppercase mb-2">Transformations</p>
              <p className="text-white text-3xl font-light">{cldStats.transformations.usage.toLocaleString()}</p>
              <p className="text-[#555] text-xs mt-1">this month</p>
            </div>
          </div>
        )}
      </section>

      {/* ── Player Tags ── */}
      <section>
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-[#c8a96e] text-xs tracking-[0.3em] uppercase">Player Tags</h2>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          {tagMsg && <span className="text-green-400 text-xs">{tagMsg}</span>}
        </div>
        <p className="text-[#555] text-sm mb-5">All tagged players across every sport. Each person can have a separate tag per sport.</p>

        <div className="flex items-center gap-3 mb-7">
          <button
            onClick={deduplicateTags}
            disabled={dedupBusy}
            className="border border-[#2a2a2a] text-[#666] hover:text-white hover:border-[#444] text-xs tracking-widest uppercase px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
          >
            {dedupBusy ? "Cleaning…" : "Merge Duplicates"}
          </button>
          <span className="text-[#444] text-xs">{allTags.length} total tags</span>
        </div>

        {tagsLoading ? (
          <p className="text-[#555] text-sm">Loading…</p>
        ) : allTags.length === 0 ? (
          <p className="text-[#555] text-sm">No tags yet. Tag players in the photography gallery.</p>
        ) : (
          <div className="space-y-8">
            {/* Per-sport groups */}
            {SPORTS.filter(s => tagsBySport[s]?.length > 0).map((sport) => {
              const colors = SPORT_COLORS[sport];
              return (
                <div key={sport}>
                  <p className="text-xs tracking-[0.25em] uppercase font-medium mb-3" style={{ color: colors.accent }}>
                    {SPORT_LABELS[sport]} · {tagsBySport[sport].length} player{tagsBySport[sport].length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tagsBySport[sport].map((tag, localIdx) => {
                      const globalIdx = allTags.indexOf(tag);
                      const isEditing = editingTag?.idx === globalIdx;
                      return isEditing ? (
                        <div key={globalIdx} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border" style={{ background: colors.bg, borderColor: colors.border }}>
                          <input
                            value={editingTag.draft.number}
                            onChange={e => setEditingTag(et => et ? { ...et, draft: { ...et.draft, number: e.target.value } } : null)}
                            className="w-12 bg-transparent text-xs text-center focus:outline-none"
                            style={{ color: colors.accent }}
                            placeholder="#"
                          />
                          <input
                            value={editingTag.draft.name}
                            onChange={e => setEditingTag(et => et ? { ...et, draft: { ...et.draft, name: e.target.value } } : null)}
                            onKeyDown={e => e.key === "Enter" && saveTag(globalIdx, { ...editingTag.draft, sport })}
                            className="w-24 bg-transparent text-white text-xs focus:outline-none"
                            placeholder="Name"
                            autoFocus
                          />
                          <button onClick={() => saveTag(globalIdx, { ...editingTag.draft, sport })} className="text-[10px] text-green-400 hover:text-green-300 ml-1">✓</button>
                          <button onClick={() => setEditingTag(null)} className="text-[10px] text-[#555] hover:text-white">✕</button>
                        </div>
                      ) : (
                        <span
                          key={`${globalIdx}-${localIdx}`}
                          className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 border cursor-pointer transition-opacity hover:opacity-80"
                          style={{ background: colors.bg, borderColor: colors.border }}
                          onClick={() => setEditingTag({ idx: globalIdx, draft: { ...tag } })}
                        >
                          {tag.number && <span className="text-xs font-semibold" style={{ color: colors.accent }}>#{tag.number}</span>}
                          {tag.name && <span className="text-white text-xs">{tag.name}</span>}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteTag(globalIdx); }}
                            className="text-[#555] hover:text-red-400 text-[10px] ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >✕</button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Unassigned / no sport */}
            {unassigned.length > 0 && (
              <div>
                <p className="text-[#555] text-xs tracking-[0.25em] uppercase font-medium mb-3">
                  Unassigned · {unassigned.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {unassigned.map((tag) => {
                    const globalIdx = allTags.indexOf(tag);
                    const isEditing = editingTag?.idx === globalIdx;
                    return isEditing ? (
                      <div key={globalIdx} className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-3 py-1.5">
                        <input
                          value={editingTag.draft.number}
                          onChange={e => setEditingTag(et => et ? { ...et, draft: { ...et.draft, number: e.target.value } } : null)}
                          className="w-12 bg-transparent text-[#c8a96e] text-xs text-center focus:outline-none"
                          placeholder="#"
                        />
                        <input
                          value={editingTag.draft.name}
                          onChange={e => setEditingTag(et => et ? { ...et, draft: { ...et.draft, name: e.target.value } } : null)}
                          onKeyDown={e => e.key === "Enter" && saveTag(globalIdx, editingTag.draft)}
                          className="w-24 bg-transparent text-white text-xs focus:outline-none"
                          placeholder="Name"
                          autoFocus
                        />
                        <button onClick={() => saveTag(globalIdx, editingTag.draft)} className="text-[10px] text-green-400 hover:text-green-300 ml-1">✓</button>
                        <button onClick={() => setEditingTag(null)} className="text-[10px] text-[#555] hover:text-white">✕</button>
                      </div>
                    ) : (
                      <span
                        key={globalIdx}
                        className="group flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-3 py-1.5 cursor-pointer hover:border-[#444] transition-colors"
                        onClick={() => setEditingTag({ idx: globalIdx, draft: { ...tag } })}
                      >
                        {tag.number && <span className="text-[#c8a96e] text-xs font-semibold">#{tag.number}</span>}
                        {tag.name && <span className="text-white text-xs">{tag.name}</span>}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTag(globalIdx); }}
                          className="text-[#555] hover:text-red-400 text-[10px] ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >✕</button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
