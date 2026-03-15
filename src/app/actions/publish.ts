"use server";

import { execSync } from "child_process";
import path from "path";

export async function publishToGitHub(): Promise<{ ok: boolean; message: string }> {
  // On Vercel, use a deploy hook URL if configured
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (hookUrl) {
    try {
      const res = await fetch(hookUrl, { method: "POST" });
      if (res.ok) return { ok: true, message: "Deploy triggered." };
      return { ok: false, message: `Deploy hook returned ${res.status}` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  // Local fallback: git commit + push
  try {
    const cwd = path.resolve(process.cwd());
    execSync('git add -A', { cwd });
    try {
      execSync('git commit -m "Content update via admin"', { cwd });
    } catch {
      // Nothing new to commit — that's fine
    }
    execSync('git push origin main', { cwd });
    return { ok: true, message: "Pushed to GitHub." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: msg };
  }
}
