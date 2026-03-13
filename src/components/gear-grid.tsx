"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useEditMode } from "@/hooks/use-edit-mode";
import { setSiteContent } from "@/app/actions/site-content";

type GearItem = {
  itemKey: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  link?: string;
  staticImageUrl?: string; // baked-in image (e.g. Cloudinary fetch)
};

const GEAR: GearItem[] = [
  // ── Skiing ────────────────────────────────────────────────────────────────
  {
    itemKey: "prodigy-3s",
    name: "Prodigy 3s",
    brand: "Faction",
    category: "Skiing",
    description:
      "My all-mountain ski. Playful enough for park laps but stiff enough to charge. The pink topsheet speaks for itself.",
    link: "https://factionskis.com/en-us/products/prodigy-3-ski",
    staticImageUrl:
      "https://res.cloudinary.com/dh9kjvs42/image/fetch/f_auto,q_auto,w_600/" +
      encodeURIComponent(
        "https://factionskis.com/cdn/shop/files/Faction-Skis-2526-Prodigy-3-Topsheet-1x1.jpg?v=1750405805"
      ),
  },
  {
    itemKey: "pivot-gw-14",
    name: "Pivot GW 14",
    brand: "Look",
    category: "Skiing",
    description:
      "The benchmark alpine binding. Wide elasticity window, incredibly reliable release, and you can feel the difference in edge transmission.",
    link: "https://www.rei.com/product/161327/look-pivot-14-gw-ski-bindings",
  },
  {
    itemKey: "tigard",
    name: "Tigard",
    brand: "Dynafit",
    category: "Skiing",
    description:
      "My everyday ski boot. Stiff enough for charging hard snow but walkable enough that I don't hate life in the lodge.",
    link: "https://www.dynafit.com/en-US/tigard",
  },
  // ── Touring ───────────────────────────────────────────────────────────────
  {
    itemKey: "helio-carbon-104",
    name: "Helio Carbon 104",
    brand: "Black Diamond",
    category: "Touring",
    description:
      "Incredibly light for a 104mm waist ski. The carbon construction makes a real difference on long approaches. My go-to for backcountry days.",
    link: "https://www.blackdiamondequipment.com/en_US/product/helio-carbon-104-skis/",
  },
  {
    itemKey: "rotation-10",
    name: "Rotation 10",
    brand: "Dynafit",
    category: "Touring",
    description:
      "Light touring binding that doesn't feel sketchy skiing down. Step-in is fast even with gloves, which matters when it's cold.",
    link: "https://www.dynafit.com/en-US/rotation-10",
  },
  // ── Climbing ──────────────────────────────────────────────────────────────
  {
    itemKey: "cinder-55",
    name: "Cinder 55",
    brand: "Osprey",
    category: "Climbing",
    description:
      "A bit heavy but it's durable and has good shoulder and waist straps. Holds everything I need for a big day out.",
    link: "https://www.rei.com/search#?q=osprey+cinder+55",
  },
  {
    itemKey: "litewire-carabiner",
    name: "Litewire Carabiner",
    brand: "Black Diamond",
    category: "Climbing",
    description:
      "My go-to racking carabiner. Light enough not to notice on the harness but solid enough to trust.",
    link: "https://www.blackdiamondequipment.com/en_US/product/litewire-carabiner/",
  },
  {
    itemKey: "camalot-c4",
    name: "Camalot C4",
    brand: "Black Diamond",
    category: "Climbing",
    description:
      "I only use these for sizes 1–6. For anything smaller I run Z4s — lighter and easier to place in thin cracks.",
    link: "https://www.rei.com/product/138519/black-diamond-camalot-c4-cam",
  },
  {
    itemKey: "camalot-z4",
    name: "Camalot Z4",
    brand: "Black Diamond",
    category: "Climbing",
    description:
      "My choice for anything smaller than a #1 C4. Great for thin cracks where the C4 is overkill.",
    link: "https://www.rei.com/product/169038/black-diamond-camalot-z4-cam",
  },
  {
    itemKey: "grigri",
    name: "GriGri",
    brand: "Petzl",
    category: "Climbing",
    description:
      "Standard belay device. Also use it for filming rigs — clip a pulley to the top when setting up a top-rope filming system, unless traversing.",
    link: "https://www.rei.com/product/151970/petzl-grigri-belay-device",
  },
  {
    itemKey: "ascenders",
    name: "Ascenders",
    brand: "Petzl",
    category: "Climbing",
    description:
      "I use an SMD as a master point and clip my ladders and daisy chain to that. Add a pulley to the top when using a GriGri for filming. For top-rope soloing I add a Micro Traxion and SPOC as backup.",
    link: "https://www.petzl.com/US/en/Sport/Ascenders/ASCENSION",
  },
  {
    itemKey: "micro-traxion",
    name: "Micro Traxion",
    brand: "Petzl",
    category: "Climbing",
    description:
      "Essential for top-rope soloing. Runs smooth and locks hard. Pairs with the SPOC as a redundant backup system.",
    link: "https://www.rei.com/product/834987/petzl-micro-traxion-pulley",
  },
  {
    itemKey: "spoc",
    name: "SPOC",
    brand: "Eldrid",
    category: "Climbing",
    description:
      "Progress capture device I use as a top-rope soloing backup. Always run alongside the Micro Traxion for a redundant catch system.",
    link: "https://www.eldrid.com",
  },
  {
    itemKey: "hot-forge-screwgate",
    name: "Hot Forge Screwgate",
    brand: "Black Diamond",
    category: "Climbing",
    description:
      "Good smaller screwgate locker. Solid and lightweight — I use these anywhere I need a reliable gate without the bulk.",
    link: "https://www.blackdiamondequipment.com/en_US/product/hot-forge-screwgate-carabiner/",
  },
  // ── Photography ──────────────────────────────────────────────────────────
  {
    itemKey: "a7-ii",
    name: "α7 II",
    brand: "Sony",
    category: "Photography",
    description:
      "My primary camera body. Full-frame sensor in a compact package. The 5-axis IBIS makes a real difference for handheld telephoto work at events.",
    link: "https://www.bhphotovideo.com/c/search?q=sony+a7+ii",
  },
  {
    itemKey: "tamron-70-300",
    name: "70-300mm f/4.5-6.3 Di III RXD",
    brand: "Tamron",
    category: "Photography",
    description:
      "Lightweight telephoto for action and sports. Reaches far enough to isolate riders and athletes. Surprisingly sharp for the size and price.",
    link: "https://www.bhphotovideo.com/c/search?q=tamron+70-300+a047+sony",
  },
  {
    itemKey: "peter-mckinnon-pack",
    name: "Peter McKinnon Camera Pack",
    brand: "Nomatic",
    category: "Photography",
    description:
      "Holds my body, lenses, and a laptop with room for a layer and snacks. The magnetic closure on the main compartment is fast when you need to get a shot quickly.",
    link: "https://www.nomatic.com/products/camera-pack",
  },
  // ── Camping ───────────────────────────────────────────────────────────────
  {
    itemKey: "bishop-pass-15",
    name: "Bishop Pass 15°",
    brand: "Mountain Hardwear",
    category: "Camping",
    description:
      "Warm enough for high-altitude Sierra nights without being overkill. Packs down small and feels quality for the weight.",
    link: "https://www.rei.com/search#?q=mountain+hardwear+bishop+pass+15",
  },
  {
    itemKey: "tensor-pad",
    name: "Tensor Sleeping Pad",
    brand: "Nemo",
    category: "Camping",
    description:
      "Ultralight and comfortable. The R-value is solid for three-season use and it inflates fast. One of the better pads at this weight.",
    link: "https://www.rei.com/search#?q=nemo+tensor",
  },
  {
    itemKey: "jetboil",
    name: "Jetboil",
    brand: "Jetboil",
    category: "Camping",
    description:
      "Fast, fuel-efficient, and foolproof. Boils water in under two minutes and the integrated cup keeps everything in one piece.",
    link: "https://www.rei.com/search#?q=jetboil+flash",
  },
];

// Trim solid-color (white/light) backgrounds from product images using Cloudinary e_trim.
// Works on free plans. For images with complex backgrounds, enable the Cloudinary
// AI Background Removal add-on and swap e_trim for e_background_removal.
function withBgRemoval(url: string): string {
  if (url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/e_trim:color_white:20,f_png/");
  }
  if (url.includes("/image/fetch/")) {
    return url.replace("/image/fetch/", "/image/fetch/e_trim:color_white:20,f_png,");
  }
  return url;
}

const CATEGORY_ORDER = ["Skiing", "Touring", "Climbing", "Photography", "Camping"];
const CATEGORIES = CATEGORY_ORDER.filter((c) => GEAR.some((g) => g.category === c));

function GearCard({
  item,
  imageUrl,
  isAdmin,
  editMode,
  onImageUploaded,
}: {
  item: GearItem;
  imageUrl: string | null;
  isAdmin: boolean;
  editMode: boolean;
  onImageUploaded: (key: string, url: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const rawImage = imageUrl ?? item.staticImageUrl ?? null;
  const effectiveImage = rawImage ? withBgRemoval(rawImage) : null;
  const canDrop = isAdmin && editMode && !uploading;

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "portfolio");
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dh9kjvs42/image/upload",
          { method: "POST", body: formData }
        );
        const data = await res.json();
        if (data.secure_url) {
          await setSiteContent(`gear.image.${item.itemKey}`, data.secure_url);
          onImageUploaded(item.itemKey, data.secure_url);
        }
      } finally {
        setUploading(false);
        setDragging(false);
      }
    },
    [item.itemKey, onImageUploaded]
  );

  const handleDragOver = (e: React.DragEvent) => {
    if (!canDrop) return;
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    if (!canDrop) return;
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) uploadFile(file);
    else setDragging(false);
  };

  return (
    <div className="border border-[#1a1a1a] rounded-xl overflow-hidden flex flex-col group hover:border-[#2a2a2a] transition-colors duration-300">
      {/* Image / placeholder */}
      <div
        className={`relative aspect-[4/3] overflow-hidden transition-colors ${
          dragging ? "bg-[#c8a96e]/10 border-[#c8a96e]/50" : effectiveImage ? "bg-transparent" : "bg-[#0d0d0d]"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {effectiveImage ? (
          <Image
            src={effectiveImage}
            alt={item.name}
            fill
            className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {uploading ? (
              <span className="text-[#444] text-[10px] tracking-[0.4em] uppercase animate-pulse">Uploading…</span>
            ) : canDrop ? (
              <>
                <span className="text-[#2a2a2a] text-2xl">↑</span>
                <span className="text-[#2a2a2a] text-[9px] tracking-[0.35em] uppercase">Drop image</span>
              </>
            ) : (
              <>
                <span className="text-[#1f1f1f] text-[10px] tracking-[0.4em] uppercase">{item.brand}</span>
                <span className="text-[#1a1a1a] text-lg font-light">{item.name}</span>
              </>
            )}
          </div>
        )}

        {/* Drop overlay hint when dragging */}
        {dragging && (
          <div className="absolute inset-0 border-2 border-dashed border-[#c8a96e]/60 rounded-xl pointer-events-none flex items-center justify-center">
            <span className="text-[#c8a96e] text-[10px] tracking-[0.4em] uppercase">Drop to upload</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-[#444] text-[9px] tracking-[0.35em] uppercase mb-1">{item.brand}</p>
        <h2 className="text-white text-sm font-light leading-snug mb-3">{item.name}</h2>
        <p className="text-[#555] text-xs leading-relaxed flex-1">{item.description}</p>
        {item.link && (
          <Link
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 self-start text-[9px] tracking-[0.3em] uppercase text-[#c8a96e] border border-[#c8a96e]/30 px-3 py-1.5 rounded hover:bg-[#c8a96e]/10 transition-colors"
          >
            View →
          </Link>
        )}
      </div>
    </div>
  );
}

export function GearGrid({
  initialImages,
  isAdmin,
}: {
  initialImages: Record<string, string>;
  isAdmin: boolean;
}) {
  const { editMode } = useEditMode();
  const [images, setImages] = useState(initialImages);

  const handleImageUploaded = useCallback((key: string, url: string) => {
    setImages((prev) => ({ ...prev, [key]: url }));
  }, []);

  return (
    <>
      {CATEGORIES.map((cat) => (
        <section key={cat} className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <p className="text-[#c8a96e] text-[10px] tracking-[0.4em] uppercase">{cat}</p>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {GEAR.filter((g) => g.category === cat).map((item) => (
              <GearCard
                key={item.itemKey}
                item={item}
                imageUrl={images[item.itemKey] ?? null}
                isAdmin={isAdmin}
                editMode={editMode}
                onImageUploaded={handleImageUploaded}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
