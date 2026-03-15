import type { Metadata } from "next";
import { auth } from "@/auth";
import { getSiteContent } from "@/app/actions/site-content";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AboutContent as _AboutContent } from "@/components/about-content"; // TEMP: restore by replacing SocialLinks-only view
import { SocialLinks } from "@/components/social-links";

export const metadata: Metadata = {
  title: "About",
  description: "Jacob Majors — 16-year-old action sports photographer at Sonoma Academy, Sonoma County CA.",
};

const DEFAULTS = {
  headline: "Jacob Majors",
  bio1: "I'm a photographer and engineer based in Sonoma County, California. I shoot action sports — mountain bike races, basketball, soccer, and climbing — capturing the moments that happen in fractions of a second.",
  bio2: "On the engineering side, I build things. From 3D-printed accessibility hardware to full-stack web applications, I care about making things that actually work for real people.",
  bio3: "This site is a living record of it all — the photos I take, the projects I build, the places I travel, and the ideas I am working through.",
  col1Label: "Photography",
  col1Text: "Action sports, mountain biking, basketball, soccer, climbing.",
  col2Label: "Engineering",
  col2Text: "3D printing, accessibility hardware, full-stack web, embedded systems.",
  col3Label: "Contact",
  col3Text: "Reach out on Instagram or via email.",
};

export default async function AboutPage() {
  const session = await auth();
  const isAdmin = !!session?.user;

  const keys = Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[];
  const [values, personalUrl, mediaUrl] = await Promise.all([
    Promise.all(keys.map((k) => getSiteContent(`about.${k}`))),
    getSiteContent("about.instagram_personal"),
    getSiteContent("about.instagram_media"),
  ]);

  // TEMP: data unused while showing socials-only; restore with <AboutContent data={data} isAdmin={isAdmin} />
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _data = Object.fromEntries(
    keys.map((k, i) => [k, values[i] ?? DEFAULTS[k]])
  ) as typeof DEFAULTS;

  const instagramPersonal = personalUrl ?? "https://www.instagram.com/_jacobmajors_/";
  const instagramMedia = mediaUrl ?? "https://www.instagram.com/jacobmajorsmedia/";

  return (
    <main className="pt-24 min-h-screen flex flex-col">
      <div className="max-w-3xl mx-auto px-6 py-20 flex-1 w-full flex flex-col items-center justify-center gap-6 text-center">
        <p className="text-[#c8a96e] text-xs tracking-[0.4em] uppercase">Jacob Majors</p>
        <p className="text-[#888] text-sm leading-relaxed max-w-sm">
          16-year-old photographer based in Sonoma County, California. Currently attending Sonoma Academy.
          I shoot action sports — lacrosse, mountain bike races, basketball, soccer, and climbing.
        </p>

        {/* TEMP: showing socials only — restore <AboutContent> to bring back full bio */}
        <SocialLinks
          instagramPersonal={instagramPersonal}
          instagramMedia={instagramMedia}
          isAdmin={isAdmin}
          position="top"
        />
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-8">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#333] text-[10px] tracking-[0.3em] uppercase">Jacob Majors</p>
          <SocialLinks
            instagramPersonal={instagramPersonal}
            instagramMedia={instagramMedia}
            isAdmin={false}
            position="footer"
          />
        </div>
      </footer>
    </main>
  );
}
