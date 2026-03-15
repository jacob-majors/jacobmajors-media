import { EventsGallery } from "@/components/events-gallery";
import type { Metadata } from "next";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Photography",
  description: "Action-sports photography by Jacob Majors — bike races, lacrosse, basketball, soccer, climbing.",
};

export default async function PhotographyPage() {
  let lacrossePhotos: { id: number; cloudinaryUrl: string; title: string; cloudinaryId: string }[] = [];

  try {
    const rows = await db.select({
      id: photos.id,
      cloudinaryUrl: photos.cloudinaryUrl,
      cloudinaryId: photos.cloudinaryId,
      title: photos.title,
    }).from(photos).where(eq(photos.category, "lacrosse")).orderBy(asc(photos.id));
    lacrossePhotos = rows;
  } catch {}

  return (
    <main className="pt-24">
      <div className="px-6 max-w-7xl mx-auto py-16">
        <p className="text-[#c8a96e] text-xs tracking-[0.4em] uppercase mb-4">Portfolio</p>
        <h1 className="text-5xl md:text-7xl font-light text-white mb-4">Photography</h1>
        <p className="text-[#666] text-lg max-w-md">Action-sports photography — races, courts, crags, and everything between.</p>
      </div>
      <EventsGallery lacrossePhotos={lacrossePhotos} />
    </main>
  );
}
