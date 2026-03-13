"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { saveProject } from "@/app/actions/projects";

type FormState = {
  title: string;
  description: string;
  longDescription: string;
  tags: string;
  githubUrl: string;
  liveUrl: string;
  featured: boolean;
};

const EMPTY_FORM: FormState = {
  title: "", description: "", longDescription: "", tags: "",
  githubUrl: "", liveUrl: "", featured: false,
};

export function ProjectForm() {
  const [uploaded, setUploaded] = useState<{ public_id: string; secure_url: string } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Instructables import
  const [ibleUrl, setIbleUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importedPhotos, setImportedPhotos] = useState<string[]>([]);
  const [importedCover, setImportedCover] = useState("");

  async function handleImport() {
    if (!ibleUrl.includes("instructables.com")) {
      setImportError("Please enter a valid Instructables URL.");
      return;
    }
    setImporting(true);
    setImportError("");
    try {
      const res = await fetch("/api/scrape-instructables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: ibleUrl }),
      });
      const data = await res.json();
      if (data.error) { setImportError(data.error); return; }

      setForm({
        title: data.title || "",
        description: data.description || "",
        longDescription: data.longDescription || "",
        tags: (data.tags || []).join(", "),
        githubUrl: "",
        liveUrl: data.sourceUrl || ibleUrl,
        featured: false,
      });
      if (data.photos?.length) setImportedPhotos(data.photos);
      if (data.coverUrl) setImportedCover(data.coverUrl);
    } catch {
      setImportError("Failed to import. Check the URL and try again.");
    } finally {
      setImporting(false);
    }
  }

  async function handleSave() {
    if (!form.title) return;
    setSaving(true);
    await saveProject({
      ...form,
      tags: JSON.stringify(form.tags.split(",").map((t) => t.trim()).filter(Boolean)),
      cloudinaryId: uploaded?.public_id,
      cloudinaryUrl: uploaded?.secure_url ?? importedCover,
    });
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setForm(EMPTY_FORM);
    setUploaded(null);
    setImportedPhotos([]);
    setImportedCover("");
    setIbleUrl("");
  }

  return (
    <div className="space-y-10">
      <h2 className="text-white text-2xl font-light">Add Project</h2>

      {/* Instructables import */}
      <div className="border border-[#1a1a1a] rounded-xl p-6 space-y-4">
        <p className="text-[#c8a96e] text-xs tracking-[0.3em] uppercase">Import from Instructables</p>
        <p className="text-[#666] text-sm">Paste an Instructables link to auto-fill title, description, steps, and photos.</p>
        <div className="flex gap-3">
          <input
            type="url"
            placeholder="https://www.instructables.com/your-project/"
            value={ibleUrl}
            onChange={(e) => { setIbleUrl(e.target.value); setImportError(""); }}
            className="flex-1 bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#c8a96e] transition-colors text-sm"
          />
          <button
            onClick={handleImport}
            disabled={importing || !ibleUrl}
            className="px-5 py-3 bg-[#c8a96e] text-black text-sm font-medium rounded-lg hover:bg-[#d4b97a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {importing ? "Importing…" : "Import"}
          </button>
        </div>
        {importError && <p className="text-red-400 text-sm">{importError}</p>}

        {importedPhotos.length > 0 && (
          <div className="space-y-2">
            <p className="text-[#555] text-xs">Extracted {importedPhotos.length} photos — first photo used as cover</p>
            <div className="grid grid-cols-4 gap-2">
              {importedPhotos.slice(0, 8).map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#222]">
                  <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="100px" />
                  {i === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-1">
                      <span className="bg-[#c8a96e] text-black text-[9px] px-1.5 py-0.5 rounded font-medium">Cover</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual / editable form */}
      <div className="space-y-4">
        <p className="text-[#c8a96e] text-xs tracking-[0.3em] uppercase">Project Details</p>
        {(["title", "description", "tags", "githubUrl", "liveUrl"] as const).map((field) => (
          <input
            key={field}
            type="text"
            placeholder={
              field === "tags" ? "Tags (comma separated: React, TypeScript)" :
              field === "liveUrl" ? "Live URL (auto-filled from Instructables)" :
              field.charAt(0).toUpperCase() + field.slice(1)
            }
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#c8a96e] transition-colors"
          />
        ))}
        <textarea
          placeholder="Long description / steps (auto-filled from Instructables)"
          value={form.longDescription}
          onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
          rows={6}
          className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#c8a96e] transition-colors resize-none font-mono text-sm"
        />
        <label className="flex items-center gap-3 text-[#999] cursor-pointer">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-[#c8a96e]" />
          Featured on homepage
        </label>

        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          onSuccess={(result) => {
            if (result.info && typeof result.info === "object") {
              const info = result.info as { public_id: string; secure_url: string };
              setUploaded(info);
              setImportedCover("");
            }
          }}
        >
          {({ open }) => (
            <button
              onClick={() => open()}
              className="border border-dashed border-[#333] rounded-lg p-6 w-full text-center hover:border-[#c8a96e] transition-colors text-[#666] text-sm"
            >
              {uploaded
                ? `✓ ${uploaded.public_id}`
                : importedCover
                ? "✓ Using Instructables cover photo (click to override)"
                : "Upload cover image (optional)"}
            </button>
          )}
        </CldUploadWidget>

        <button
          onClick={handleSave}
          disabled={saving || !form.title}
          className="w-full bg-[#c8a96e] text-black font-medium py-3 rounded-lg hover:bg-[#d4b97a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : success ? "Saved!" : "Save Project"}
        </button>
      </div>
    </div>
  );
}
