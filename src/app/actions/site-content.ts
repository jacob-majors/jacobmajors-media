"use server";

import { db } from "@/db";
import { siteContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSiteContent(key: string): Promise<string | null> {
  try {
    const rows = await db.select().from(siteContent).where(eq(siteContent.key, key));
    return rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

export async function setSiteContent(key: string, value: string) {
  await db
    .insert(siteContent)
    .values({ key, value })
    .onConflictDoUpdate({ target: siteContent.key, set: { value, updatedAt: new Date().toISOString() } });
  revalidatePath("/about");
}
