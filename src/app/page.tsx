import { HeroScroll } from "@/components/hero-scroll";
import { SectionIntro } from "@/components/section-intro";
import { FeaturedPhotos } from "@/components/featured-photos";
import { db } from "@/db";
import { photos, heroSlides } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  const isAdmin = !!session?.user;

  let lacrossePhotos: typeof photos.$inferSelect[] = [];
  let dbHeroSlides: { id: number; cloudinaryUrl: string; headline: string; sub: string }[] = [];

  try {
    [lacrossePhotos, dbHeroSlides] = await Promise.all([
      db.select().from(photos).where(eq(photos.category, "lacrosse")).orderBy(asc(photos.id)).limit(6),
      db.select({ id: heroSlides.id, cloudinaryUrl: heroSlides.cloudinaryUrl, headline: heroSlides.headline, sub: heroSlides.sub })
        .from(heroSlides).orderBy(asc(heroSlides.sortOrder)),
    ]);
  } catch {
    // DB not yet configured
  }

  const heroSlidesData = dbHeroSlides.map((s) => ({ id: s.id, url: s.cloudinaryUrl, headline: s.headline, sub: s.sub }));
  const featuredPhotos = lacrossePhotos.map((p) => ({
    id: p.id,
    cloudinaryId: p.cloudinaryId,
    cloudinaryUrl: p.cloudinaryUrl,
    title: p.title,
  }));

  return (
    <main>
      <HeroScroll dbSlides={heroSlidesData} isAdmin={isAdmin} />

      <SectionIntro
        eyebrow="Photography"
        title="The world through a different lens."
        description="Action-sports photography — races, courts, crags, and more."
        href="/photography"
      />
      <FeaturedPhotos photos={featuredPhotos} isAdmin={isAdmin} />

      <footer className="border-t border-[#1a1a1a] mt-32 py-16 px-6 text-center">
        <p className="text-[#666] text-sm tracking-wider">
          © {new Date().getFullYear()} Jacob Majors — Photographer &amp; Engineer
        </p>
      </footer>
    </main>
  );
}
