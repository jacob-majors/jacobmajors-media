"use server";

import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function saveBlogPost(data: {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  category?: string;
  coverCloudinaryId?: string;
  coverCloudinaryUrl?: string;
  published: boolean;
  publishedAt?: string;
}) {
  await db.insert(blogPosts).values(data);
  revalidatePath("/");
  revalidatePath("/blog");
}
