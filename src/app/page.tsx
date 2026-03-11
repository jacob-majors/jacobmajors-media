import { HeroScroll } from "@/components/hero-scroll";
import { SectionIntro } from "@/components/section-intro";
import { FeaturedPhotos } from "@/components/featured-photos";
import { FeaturedProjects } from "@/components/featured-projects";
import { LatestPosts } from "@/components/latest-posts";
import { db } from "@/db";
import { projects, blogPosts, heroSlides } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export default async function HomePage() {
  // Gracefully handle DB not being set up yet
  let featuredProjects: typeof projects.$inferSelect[] = [];
  let latestPosts: typeof blogPosts.$inferSelect[] = [];
  let dbHeroSlides: { cloudinaryUrl: string; headline: string; sub: string }[] = [];

  try {
    [featuredProjects, latestPosts, dbHeroSlides] = await Promise.all([
      db.select().from(projects).where(eq(projects.featured, true)).limit(3),
      db.select().from(blogPosts).where(eq(blogPosts.published, true)).orderBy(desc(blogPosts.publishedAt)).limit(3),
      db.select({ cloudinaryUrl: heroSlides.cloudinaryUrl, headline: heroSlides.headline, sub: heroSlides.sub })
        .from(heroSlides).orderBy(asc(heroSlides.sortOrder)),
    ]);
  } catch {
    // DB not yet configured — pages will show empty state
  }

  const heroSlidesData = dbHeroSlides.map((s) => ({ url: s.cloudinaryUrl, headline: s.headline, sub: s.sub }));

  return (
    <main>
      <HeroScroll dbSlides={heroSlidesData} />

      <SectionIntro
        eyebrow="Photography"
        title="The world through a different lens."
        description="Action-sports photography — races, courts, crags, and more."
        href="/photography"
      />
      <FeaturedPhotos />

      <SectionIntro
        eyebrow="Engineering"
        title="Building things that matter."
        description="From embedded systems to full-stack applications — engineering as a craft."
        href="/projects"
      />
      <FeaturedProjects projects={featuredProjects} />

      <SectionIntro
        eyebrow="Writing"
        title="Ideas worth exploring."
        description="Thoughts on technology, creativity, and the spaces between them."
        href="/blog"
      />
      <LatestPosts posts={latestPosts} />

      <footer className="border-t border-[#1a1a1a] mt-32 py-16 px-6 text-center">
        <p className="text-[#666] text-sm tracking-wider">
          © {new Date().getFullYear()} Jacob Majors — Photographer &amp; Engineer
        </p>
      </footer>
    </main>
  );
}
