"use client";

import { useState, useRef, useEffect } from "react";
import { setSiteContent } from "@/app/actions/site-content";

interface InlineEditProps {
  contentKey: string;
  value: string;
  as?: "p" | "h1" | "span";
  className?: string;
  multiline?: boolean;
}

export function InlineEdit({ contentKey, value, as: Tag = "p", className = "", multiline = false }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(value);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  async function handleSave() {
    setSaving(true);
    await setSiteContent(contentKey, draft);
    setCurrent(draft);
    setSaving(false);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setDraft(current); setEditing(false); }
    if (e.key === "Enter" && !multiline && !e.shiftKey) { e.preventDefault(); handleSave(); }
  }

  if (editing) {
    return (
      <div className="relative">
        {multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            className={`${className} w-full bg-[#0f0f0f] border border-[#c8a96e] rounded-lg px-3 py-2 text-white resize-none focus:outline-none`}
          />
        ) : (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${className} w-full bg-[#0f0f0f] border border-[#c8a96e] rounded-lg px-3 py-2 text-white focus:outline-none`}
          />
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 bg-[#c8a96e] text-black text-xs font-medium rounded hover:bg-[#d4b97a] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => { setDraft(current); setEditing(false); }}
            className="px-3 py-1 border border-[#333] text-[#999] text-xs rounded hover:border-[#555] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group/edit cursor-pointer"
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      <Tag className={className}>{current}</Tag>
      {/* Pencil icon on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className="absolute -top-1 -right-1 opacity-0 group-hover/edit:opacity-100 transition-opacity duration-200 bg-[#c8a96e] text-black rounded-full w-6 h-6 flex items-center justify-center z-10"
        title="Edit"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>
  );
}
