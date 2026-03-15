"use client";

import { useState } from "react";
import { X, Download } from "lucide-react";

interface Props {
  imageUrl: string;
  filename?: string;
  onClose: () => void;
}

function toDownloadUrl(url: string): string {
  // Add fl_attachment to Cloudinary upload URLs to force browser download
  if (url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/fl_attachment/");
  }
  return url;
}

export function DownloadModal({ imageUrl, filename = "photo.jpg", onClose }: Props) {
  const [tagChecked, setTagChecked] = useState(false);
  const [sellChecked, setSellChecked] = useState(false);
  const canDownload = tagChecked && sellChecked;

  async function handleDownload() {
    try {
      // Fetch as blob so the browser downloads instead of navigating
      const res = await fetch(toDownloadUrl(imageUrl));
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      // Fallback: open in new tab
      window.open(imageUrl, "_blank");
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border border-[#222] rounded-2xl p-8 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[#c8a96e] text-[10px] tracking-[0.4em] uppercase mb-1">Before you download</p>
            <h3 className="text-white text-lg font-light">Usage Agreement</h3>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors mt-1">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 mb-8">
          <label className="flex items-start gap-3 cursor-pointer group">
            <button
              role="checkbox"
              aria-checked={tagChecked}
              onClick={() => setTagChecked(!tagChecked)}
              className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                tagChecked ? "bg-[#c8a96e] border-[#c8a96e]" : "border-[#444] group-hover:border-[#666]"
              }`}
            >
              {tagChecked && (
                <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className="text-[#aaa] text-sm leading-relaxed" onClick={() => setTagChecked(!tagChecked)}>
              I agree to tag{" "}
              <span className="text-white font-medium">@jacobmajorsmedia</span>{" "}
              on Instagram and any other platform when sharing this photo.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <button
              role="checkbox"
              aria-checked={sellChecked}
              onClick={() => setSellChecked(!sellChecked)}
              className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                sellChecked ? "bg-[#c8a96e] border-[#c8a96e]" : "border-[#444] group-hover:border-[#666]"
              }`}
            >
              {sellChecked && (
                <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className="text-[#aaa] text-sm leading-relaxed" onClick={() => setSellChecked(!sellChecked)}>
              I agree{" "}
              <span className="text-white font-medium">not to sell</span>{" "}
              or use this photo for commercial purposes without written permission from Jacob Majors.
            </span>
          </label>
        </div>

        <button
          onClick={handleDownload}
          disabled={!canDownload}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm tracking-widest uppercase font-medium transition-all ${
            canDownload
              ? "bg-[#c8a96e] text-black hover:bg-[#d4b87a]"
              : "bg-[#1a1a1a] text-[#444] cursor-not-allowed"
          }`}
        >
          <Download size={15} />
          Download Photo
        </button>
      </div>
    </div>
  );
}
