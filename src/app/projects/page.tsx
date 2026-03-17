import { ProjectsGrid } from "@/components/projects-grid";
import { db } from "@/db";
import { projects } from "@/db/schema";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Engineering",
  description: "Engineering projects by Jacob Majors.",
};

// Always-shown static projects (merged with DB projects)
const STATIC_PROJECTS: typeof projects.$inferSelect[] = [
  {
    id: -1,
    title: "Arduino Button Mapper",
    description:
      "A web app that programs an Arduino Leonardo to turn physical buttons, ports, and sensors into keyboard inputs — no Arduino IDE needed. Open the site, configure which pins map to which keys, set the logic mode (hold, toggle, or power toggle), wire up optional status LEDs, and click Upload — the app generates the Arduino sketch, compiles it using arduino-cli on a local backend, and flashes it straight to your board over USB. Supports back-panel 3.5mm jack ports, IR proximity sensors, analog sip-and-puff sensors, and analog joysticks. Includes a Test tab with a visual device mockup styled after the Xbox Adaptive Controller, and two playable canvas games — a Chrome-style Dino game and Snake — that respond to your configured inputs in real time. Built with Next.js and TypeScript on the frontend, a small Express server on the backend for hardware access, and deployed on Vercel.",
    longDescription: null,
    tags: JSON.stringify(["Next.js", "TypeScript", "Arduino", "Express", "Vercel"]),
    githubUrl: null,
    liveUrl: "https://arduino.jacobmajors.com",
    cloudinaryId: null,
    cloudinaryUrl: null,
    featured: true,
    publishedAt: new Date().toISOString(),
  },
  {
    id: -2,
    title: "This Portfolio Site",
    description:
      "A full-stack portfolio built with Next.js 15, Turso (edge SQLite), Cloudinary image hosting, and GSAP scroll animations. Designed to feel cinematic, not templated.",
    longDescription: null,
    tags: JSON.stringify(["Next.js", "TypeScript", "Turso", "GSAP", "Vercel"]),
    githubUrl: null,
    liveUrl: null,
    cloudinaryId: null,
    cloudinaryUrl: null,
    featured: true,
    publishedAt: new Date().toISOString(),
  },
];

export default async function ProjectsPage() {
  let dbProjects: typeof projects.$inferSelect[] = [];

  try {
    dbProjects = await db.select().from(projects).orderBy(projects.publishedAt);
  } catch {
    // DB not yet configured
  }

  // Merge: static projects fill in if not already in DB by title
  const dbTitles = new Set(dbProjects.map((p) => p.title));
  const allProjects = [
    ...STATIC_PROJECTS.filter((p) => !dbTitles.has(p.title)),
    ...dbProjects,
  ];

  return (
    <main className="pt-24">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto py-10 sm:py-16">
        <p className="text-[#c8a96e] text-xs tracking-[0.4em] uppercase mb-4">Portfolio</p>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-light text-white mb-4">Engineering</h1>
        <p className="text-[#666] text-base sm:text-lg max-w-md">Building systems that solve real problems.</p>
      </div>
      <ProjectsGrid projects={allProjects} />
    </main>
  );
}
