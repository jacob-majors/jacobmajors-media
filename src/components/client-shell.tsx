"use client";

import dynamic from "next/dynamic";
import { ThemeProvider, useTheme } from "@/providers/theme-provider";
import type { ReactNode } from "react";

const WebGLBackground = dynamic(
  () => import("./webgl-background").then((m) => m.WebGLBackground),
  { ssr: false },
);

function Inner({ children }: { children: ReactNode }) {
  const { theme, webgl } = useTheme();
  return (
    <>
      {webgl && <WebGLBackground theme={theme} />}
      {/* Sit content above the WebGL canvas */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </>
  );
}

export function ClientShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <Inner>{children}</Inner>
    </ThemeProvider>
  );
}
