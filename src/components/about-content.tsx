"use client";

import { InlineEdit } from "./inline-edit";

type AboutData = {
  headline: string;
  bio1: string;
  bio2: string;
  bio3: string;
  col1Label: string;
  col1Text: string;
  col2Label: string;
  col2Text: string;
  col3Label: string;
  col3Text: string;
};

export function AboutContent({ data, isAdmin }: { data: AboutData; isAdmin: boolean }) {
  if (!isAdmin) {
    return (
      <div>
        <h1 className="text-5xl md:text-7xl font-light text-white mb-16 leading-tight">{data.headline}</h1>
        <div className="space-y-8 text-[#999] text-lg leading-relaxed">
          <p>{data.bio1}</p>
          <p>{data.bio2}</p>
          <p>{data.bio3}</p>
        </div>
        <div className="mt-20 pt-12 border-t border-[#1a1a1a] grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            { label: data.col1Label, text: data.col1Text },
            { label: data.col2Label, text: data.col2Text },
            { label: data.col3Label, text: data.col3Text },
          ].map((col) => (
            <div key={col.label}>
              <p className="text-[#c8a96e] text-[10px] tracking-[0.4em] uppercase mb-3">{col.label}</p>
              <p className="text-white text-sm leading-relaxed">{col.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Admin mode — inline editable
  return (
    <div>
      {/* Admin mode badge */}
      <div className="mb-8 flex items-center gap-2">
        <span className="bg-[#c8a96e]/20 border border-[#c8a96e]/40 text-[#c8a96e] text-xs tracking-widest uppercase px-3 py-1 rounded-full">
          Edit Mode — click any text to edit
        </span>
      </div>

      <InlineEdit contentKey="about.headline" value={data.headline} as="h1"
        className="text-5xl md:text-7xl font-light text-white mb-16 leading-tight" />

      <div className="space-y-8">
        <InlineEdit contentKey="about.bio1" value={data.bio1} multiline
          className="text-[#999] text-lg leading-relaxed" />
        <InlineEdit contentKey="about.bio2" value={data.bio2} multiline
          className="text-[#999] text-lg leading-relaxed" />
        <InlineEdit contentKey="about.bio3" value={data.bio3} multiline
          className="text-[#999] text-lg leading-relaxed" />
      </div>

      <div className="mt-20 pt-12 border-t border-[#1a1a1a] grid grid-cols-1 sm:grid-cols-3 gap-10">
        <div>
          <InlineEdit contentKey="about.col1Label" value={data.col1Label}
            className="text-[#c8a96e] text-[10px] tracking-[0.4em] uppercase mb-3" />
          <InlineEdit contentKey="about.col1Text" value={data.col1Text} multiline
            className="text-white text-sm leading-relaxed" />
        </div>
        <div>
          <InlineEdit contentKey="about.col2Label" value={data.col2Label}
            className="text-[#c8a96e] text-[10px] tracking-[0.4em] uppercase mb-3" />
          <InlineEdit contentKey="about.col2Text" value={data.col2Text} multiline
            className="text-white text-sm leading-relaxed" />
        </div>
        <div>
          <InlineEdit contentKey="about.col3Label" value={data.col3Label}
            className="text-[#c8a96e] text-[10px] tracking-[0.4em] uppercase mb-3" />
          <InlineEdit contentKey="about.col3Text" value={data.col3Text} multiline
            className="text-white text-sm leading-relaxed" />
        </div>
      </div>
    </div>
  );
}
