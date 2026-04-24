"use server";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function saveProject(data: {
  title: string;
  description: string;
  longDescription?: string;
  tags: string;
  githubUrl?: string;
  liveUrl?: string;
  cloudinaryId?: string;
  cloudinaryUrl?: string;
  stlUrl?: string;
  featured: boolean;
}) {
  await db.insert(projects).values(data);
  revalidatePath("/");
  revalidatePath("/projects");
}
