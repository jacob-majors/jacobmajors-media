import { HeroScroll } from "@/components/hero-scroll";
import { SectionIntro } from "@/components/section-intro";
import { FeaturedPhotos } from "@/components/featured-photos";
import { db } from "@/db";
import { heroSlides } from "@/db/schema";
import { asc } from "drizzle-orm";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  const isAdmin = !!session?.user;

  let dbHeroSlides: { id: number; cloudinaryUrl: string; headline: string; sub: string }[] = [];

  try {
    dbHeroSlides = await db
      .select({ id: heroSlides.id, cloudinaryUrl: heroSlides.cloudinaryUrl, headline: heroSlides.headline, sub: heroSlides.sub })
      .from(heroSlides)
      .orderBy(asc(heroSlides.sortOrder));
  } catch {
    // DB not yet configured
  }

  const heroSlidesData = dbHeroSlides.map((s) => ({ id: s.id, url: s.cloudinaryUrl, headline: s.headline, sub: s.sub }));

  return (
    <main>
      <HeroScroll dbSlides={heroSlidesData} isAdmin={isAdmin} />

      <SectionIntro
        eyebrow="Photography"
        title="The world through a different lens."
        description="Action-sports photography — races, courts, crags, and more."
        href="/photography"
      />
      <FeaturedPhotos />

      <footer className="border-t border-[#1a1a1a] mt-32 py-16 px-6 text-center">
        <p className="text-[#666] text-sm tracking-wider">
          © {new Date().getFullYear()} Jacob Majors — Photographer
        </p>
      </footer>
    </main>
  );
}
