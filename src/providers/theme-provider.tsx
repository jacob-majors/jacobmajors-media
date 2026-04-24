"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type SiteTheme = "dark" | "cream";

interface ThemeCtx {
  theme: SiteTheme;
  setTheme: (t: SiteTheme) => void;
  webgl: boolean;
  setWebgl: (v: boolean) => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: "dark",
  setTheme: () => {},
  webgl: true,
  setWebgl: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<SiteTheme>("dark");
  const [webgl, setWebglState] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = localStorage.getItem("pf-theme") as SiteTheme | null;
    const w = localStorage.getItem("pf-webgl");
    if (t === "dark" || t === "cream") setThemeState(t);
    if (w === "false") setWebglState(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("pf-theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("pf-webgl", String(webgl));
  }, [webgl, mounted]);

  return (
    <Ctx.Provider value={{
      theme,
      setTheme: setThemeState,
      webgl,
      setWebgl: setWebglState,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
