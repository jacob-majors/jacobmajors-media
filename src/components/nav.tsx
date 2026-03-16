"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useEditMode } from "@/hooks/use-edit-mode";
import { publishToGitHub } from "@/app/actions/publish";

const BASE_LINKS = [
  { href: "/photography", label: "Photography", settingKey: null, defaultVisible: true },
  { href: "/projects", label: "Engineering", settingKey: "showEngineering", defaultVisible: true },
  { href: "/blog", label: "Writing", settingKey: "showWriting", defaultVisible: false },
  { href: "/about", label: "About", settingKey: null, defaultVisible: true },
];

export function Nav({ isAdmin, navSettings }: {
  isAdmin?: boolean;
  navSettings?: { showEngineering?: boolean; showWriting?: boolean };
}) {
  const links = BASE_LINKS.filter((l) => {
    if (!l.settingKey) return true;
    const setting = navSettings?.[l.settingKey as keyof typeof navSettings];
    return setting ?? l.defaultVisible;
  });
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const pathname = usePathname();
  const { editMode, setEditMode } = useEditMode();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handlePublish() {
    setPublishing(true);
    setPublishMsg(null);
    const result = await publishToGitHub();
    setPublishMsg(result.ok ? "Pushed ✓" : "Error");
    setPublishing(false);
    setTimeout(() => setPublishMsg(null), 3000);
  }

  return (
    <nav
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled ? "bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
        <Link href="/" className="text-sm font-medium tracking-widest uppercase text-white hover:text-[#c8a96e] transition-colors">
          Jacob Majors
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-10">
          {links.filter(l => !l.hidden).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "text-sm tracking-wider uppercase transition-colors",
                pathname.startsWith(link.href)
                  ? "text-[#c8a96e]"
                  : "text-[#999] hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}

          {isAdmin && (
            <div className="flex items-center gap-2">
              {/* View / Edit toggle */}
              <div className="flex items-center gap-1 border border-[#2a2a2a] rounded-full p-0.5">
                <button
                  onClick={() => setEditMode(false)}
                  className={clsx(
                    "px-3 py-1 rounded-full text-[10px] tracking-widest uppercase font-medium transition-all",
                    !editMode ? "bg-white text-black" : "text-[#555] hover:text-white"
                  )}
                >
                  View
                </button>
                <button
                  onClick={() => setEditMode(true)}
                  className={clsx(
                    "px-3 py-1 rounded-full text-[10px] tracking-widest uppercase font-medium transition-all",
                    editMode ? "bg-[#c8a96e] text-black" : "text-[#555] hover:text-[#c8a96e]"
                  )}
                >
                  Edit
                </button>
              </div>

              {/* Publish button */}
              {editMode && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className={clsx(
                    "px-3 py-1 rounded-full text-[10px] tracking-widest uppercase font-medium border transition-all disabled:opacity-50",
                    publishMsg === "Pushed ✓"
                      ? "border-green-600/60 text-green-400"
                      : publishMsg === "Error"
                      ? "border-red-600/60 text-red-400"
                      : "border-[#2a2a2a] text-[#666] hover:border-[#c8a96e]/60 hover:text-[#c8a96e]"
                  )}
                >
                  {publishing ? "Pushing…" : (publishMsg ?? "Push")}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-3 -mr-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={clsx("block w-6 h-px bg-white transition-all duration-300", menuOpen && "translate-y-2 rotate-45")} />
          <span className={clsx("block w-6 h-px bg-white transition-all duration-300", menuOpen && "opacity-0")} />
          <span className={clsx("block w-6 h-px bg-white transition-all duration-300", menuOpen && "-translate-y-2 -rotate-45")} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={clsx(
        "md:hidden overflow-hidden transition-all duration-500",
        menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-6 pb-6 flex flex-col gap-6 border-b border-[#1a1a1a]">
          {links.filter(l => !l.hidden).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={clsx(
                "text-sm tracking-wider uppercase",
                pathname.startsWith(link.href) ? "text-[#c8a96e]" : "text-[#999]"
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setEditMode(false)}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-[10px] tracking-widest uppercase font-medium border transition-all",
                  !editMode ? "bg-white text-black border-white" : "border-[#333] text-[#555]"
                )}
              >
                View
              </button>
              <button
                onClick={() => setEditMode(true)}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-[10px] tracking-widest uppercase font-medium border transition-all",
                  editMode ? "bg-[#c8a96e] text-black border-[#c8a96e]" : "border-[#333] text-[#555]"
                )}
              >
                Edit
              </button>
              {editMode && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-3 py-1.5 rounded-full text-[10px] tracking-widest uppercase font-medium border border-[#2a2a2a] text-[#666] transition-all"
                >
                  {publishing ? "Pushing…" : (publishMsg ?? "Push")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
