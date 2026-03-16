import { HeroScroll } from "@/components/hero-scroll";
import { SectionIntro } from "@/components/section-intro";
import { FeaturedPhotos } from "@/components/featured-photos";
import { FeaturedProjects } from "@/components/featured-projects";
import { db } from "@/db";
import { heroSlides, projects } from "@/db/schema";
import { asc } from "drizzle-orm";
import { auth } from "@/auth";
import type { InferSelectModel } from "drizzle-orm";

type Project = InferSelectModel<typeof projects>;

const STATIC_PROJECTS: Project[] = [
  {
    id: -1,
    title: "Arduino Button Mapper",
    description: "A web app that programs an Arduino Leonardo to turn physical buttons, ports, and sensors into keyboard inputs — no Arduino IDE needed.",
    longDescription: null,
    tags: JSON.stringify(["Next.js", "TypeScript", "Arduino", "Express"]),
    githubUrl: null,
    liveUrl: "https://arduino.jacobmajors.com",
    cloudinaryId: null,
    cloudinaryUrl: null,
    featured: true,
    publishedAt: new Date().toISOString(),
  },
];

export default async function HomePage() {
  const session = await auth();
  const isAdmin = !!session?.user;

  let dbHeroSlides: { id: number; cloudinaryUrl: string; headline: string; sub: string }[] = [];
  let dbProjects: Project[] = [];

  try {
    dbHeroSlides = await db
      .select({ id: heroSlides.id, cloudinaryUrl: heroSlides.cloudinaryUrl, headline: heroSlides.headline, sub: heroSlides.sub })
      .from(heroSlides)
      .orderBy(asc(heroSlides.sortOrder));
  } catch {
    // DB not yet configured
  }

  try {
    const rows = await db.select().from(projects).orderBy(asc(projects.publishedAt));
    dbProjects = rows;
  } catch {
    // DB not yet configured
  }

  // Merge DB projects with static ones (static fill in if not already in DB by title)
  const dbTitles = new Set(dbProjects.map((p) => p.title));
  const featuredProjects = [
    ...STATIC_PROJECTS.filter((p) => !dbTitles.has(p.title)),
    ...dbProjects,
  ].filter((p) => p.featured);

  const heroSlidesData = dbHeroSlides.map((s) => ({ id: s.id, url: s.cloudinaryUrl, headline: s.headline, sub: s.sub }));

  return (
    <main>
      <HeroScroll dbSlides={heroSlidesData} isAdmin={isAdmin} />

      <SectionIntro
        eyebrow="Engineering"
        title="Building things that work."
        description="Web apps, hardware tools, and systems designed to solve real problems."
        href="/projects"
      />
      <FeaturedProjects projects={featuredProjects} />

      <SectionIntro
        eyebrow="Photography"
        title="The world through a different lens."
        description="Action-sports photography — races, courts, crags, and more."
        href="/photography"
      />
      <FeaturedPhotos />

      <footer className="border-t border-[#1a1a1a] mt-16 sm:mt-32 py-10 sm:py-16 px-4 sm:px-6 text-center">
        <p className="text-[#666] text-sm tracking-wider">
          © {new Date().getFullYear()} Jacob Majors — Photographer
        </p>
      </footer>
    </main>
  );
}
