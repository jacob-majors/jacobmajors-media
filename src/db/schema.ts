import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const photos = sqliteTable("photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  cloudinaryId: text("cloudinary_id").notNull(),
  cloudinaryUrl: text("cloudinary_url").notNull(),
  category: text("category").notNull().default("general"),
  width: integer("width"),
  height: integer("height"),
  featured: integer("featured", { mode: "boolean" }).default(false),
  publishedAt: text("published_at").default(sql`(datetime('now'))`),
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  tags: text("tags").notNull().default("[]"), // JSON array
  githubUrl: text("github_url"),
  liveUrl: text("live_url"),
  cloudinaryId: text("cloudinary_id"),
  cloudinaryUrl: text("cloudinary_url"),
  stlUrl: text("stl_url"),
  featured: integer("featured", { mode: "boolean" }).default(false),
  publishedAt: text("published_at").default(sql`(datetime('now'))`),
});

export const heroSlides = sqliteTable("hero_slides", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cloudinaryId: text("cloudinary_id").notNull(),
  cloudinaryUrl: text("cloudinary_url").notNull(),
  headline: text("headline").notNull(),
  sub: text("sub").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// Generic key-value store for editable site content (About page, etc.)
export const siteContent = sqliteTable("site_content", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const blogPosts = sqliteTable("blog_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  category: text("category").notNull().default("blog"), // 'blog' | 'trip'
  coverCloudinaryId: text("cover_cloudinary_id"),
  coverCloudinaryUrl: text("cover_cloudinary_url"),
  published: integer("published", { mode: "boolean" }).default(false),
  publishedAt: text("published_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});
