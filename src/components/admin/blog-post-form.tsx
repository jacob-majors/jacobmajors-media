"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { saveBlogPost } from "@/app/actions/blog";

export function BlogPostForm() {
  const [uploaded, setUploaded] = useState<{ public_id: string; secure_url: string } | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", content: "", category: "blog", published: false });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleSave() {
    if (!form.title || !form.content) return;
    setSaving(true);
    await saveBlogPost({
      ...form,
      coverCloudinaryId: uploaded?.public_id,
      coverCloudinaryUrl: uploaded?.secure_url,
      publishedAt: form.published ? new Date().toISOString() : undefined,
    });
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setForm({ title: "", slug: "", excerpt: "", content: "", category: "blog", published: false });
    setUploaded(null);
  }

  return (
    <div className="space-y-8">
      <h2 className="text-white text-2xl font-light">Write Post</h2>
      <div className="space-y-4">
        {/* Category selector */}
        <div className="flex gap-3">
          {(["blog", "trip"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setForm({ ...form, category: cat })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                form.category === cat
                  ? "bg-[#c8a96e] text-black"
                  : "border border-[#333] text-[#666] hover:border-[#c8a96e] hover:text-white"
              }`}
            >
              {cat === "blog" ? "Blog Post" : "Trip Report"}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })}
          className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#c8a96e] transition-colors"
        />
        <input
          type="text"
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-[#999] placeholder-[#555] focus:outline-none focus:border-[#c8a96e] transition-colors font-mono text-sm"
        />
        <input
          type="text"
          placeholder="Excerpt"
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#c8a96e] transition-colors"
        />
        <textarea
          placeholder="Content (HTML or Markdown)"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={12}
          className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#c8a96e] transition-colors resize-none font-mono text-sm"
        />
        <label className="flex items-center gap-3 text-[#999] cursor-pointer">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="accent-[#c8a96e]" />
          Publish immediately
        </label>

        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          onSuccess={(result) => {
            if (result.info && typeof result.info === "object") {
              const info = result.info as { public_id: string; secure_url: string };
              setUploaded(info);
            }
          }}
        >
          {({ open }) => (
            <button
              onClick={() => open()}
              className="border border-dashed border-[#333] rounded-lg p-6 w-full text-center hover:border-[#c8a96e] transition-colors text-[#666] text-sm"
            >
              {uploaded ? `✓ ${uploaded.public_id}` : "Upload cover image (optional)"}
            </button>
          )}
        </CldUploadWidget>

        <button
          onClick={handleSave}
          disabled={saving || !form.title || !form.content}
          className="w-full bg-[#c8a96e] text-black font-medium py-3 rounded-lg hover:bg-[#d4b97a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : success ? "Saved!" : "Save Post"}
        </button>
      </div>
    </div>
  );
}
