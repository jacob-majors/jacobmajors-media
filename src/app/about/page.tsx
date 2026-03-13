import type { Metadata } from "next";
import { auth } from "@/auth";
import { getSiteContent } from "@/app/actions/site-content";
import { AboutContent } from "@/components/about-content";

export const metadata: Metadata = {
  title: "About",
  description: "About Jacob Majors — photographer, engineer, and maker.",
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
  const values = await Promise.all(keys.map((k) => getSiteContent(`about.${k}`)));

  const data = Object.fromEntries(
    keys.map((k, i) => [k, values[i] ?? DEFAULTS[k]])
  ) as typeof DEFAULTS;

  return (
    <main className="pt-24 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-[#c8a96e] text-xs tracking-[0.4em] uppercase mb-6">About</p>
        <AboutContent data={data} isAdmin={isAdmin} />
      </div>
    </main>
  );
}
