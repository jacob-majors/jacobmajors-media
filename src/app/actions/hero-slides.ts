"use server";

import { db } from "@/db";
import { heroSlides } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getHeroSlides() {
  return db.select().from(heroSlides).orderBy(heroSlides.sortOrder);
}

export async function saveHeroSlide(data: {
  cloudinaryId: string;
  cloudinaryUrl: string;
  headline: string;
  sub: string;
  sortOrder: number;
}) {
  await db.insert(heroSlides).values(data);
  revalidatePath("/");
}

export async function deleteHeroSlide(id: number) {
  await db.delete(heroSlides).where(eq(heroSlides.id, id));
  revalidatePath("/");
}

export async function updateHeroSlideOrder(id: number, sortOrder: number) {
  await db.update(heroSlides).set({ sortOrder }).where(eq(heroSlides.id, id));
  revalidatePath("/");
}
