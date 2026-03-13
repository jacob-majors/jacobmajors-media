import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writing",
  description: "Blog posts and trip reports by Jacob Majors.",
};

const PLACEHOLDER_POSTS = [
  {
    id: 1,
    slug: "welcome",
    title: "Welcome to my site",
    excerpt: "This is where I'll share thoughts on photography, engineering, and whatever else is on my mind. Check back soon.",
    content: "",
    category: "blog",
    coverCloudinaryId: null,
    coverCloudinaryUrl: null,
    published: true,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

function PostList({ posts }: { posts: typeof blogPosts.$inferSelect[] }) {
  return (
    <div className="divide-y divide-[#1a1a1a]">
      {posts.map((post) => (
        <article key={post.id} className="py-12">
          <Link href={`/blog/${post.slug}`} className="group block">
            {post.coverCloudinaryUrl && (
              <div className="relative aspect-[16/6] overflow-hidden rounded-xl mb-8">
                <Image
                  src={post.coverCloudinaryUrl}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 896px"
                />
              </div>
            )}
            <p className="text-[#666] text-xs tracking-widest uppercase mb-4">
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : ""}
            </p>
            <h2 className="text-white text-3xl font-light mb-4 group-hover:text-[#c8a96e] transition-colors duration-300">
              {post.title}
            </h2>
            {post.excerpt && <p className="text-[#666] leading-relaxed">{post.excerpt}</p>}
            <span className="inline-flex items-center gap-2 mt-6 text-[#c8a96e] text-sm group-hover:gap-4 transition-all duration-300">
              Read more →
            </span>
          </Link>
        </article>
      ))}
    </div>
  );
}

export default async function WritingPage() {
  let allPosts = PLACEHOLDER_POSTS as typeof blogPosts.$inferSelect[];
  let tripPosts: typeof blogPosts.$inferSelect[] = [];

  try {
    const dbPosts = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.published, true), eq(blogPosts.category, "blog")))
      .orderBy(desc(blogPosts.publishedAt));

    const dbTrips = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.published, true), eq(blogPosts.category, "trip")))
      .orderBy(desc(blogPosts.publishedAt));

    if (dbPosts.length > 0) allPosts = dbPosts;
    tripPosts = dbTrips;
  } catch {
    // DB not yet configured
  }

  return (
    <main className="pt-24">
      <div className="px-6 max-w-4xl mx-auto py-16">
        <p className="text-[#c8a96e] text-xs tracking-[0.4em] uppercase mb-4">Journal</p>
        <h1 className="text-5xl md:text-7xl font-light text-white mb-4">Writing</h1>
        <p className="text-[#666] text-lg">Ideas on technology, creativity, and the places I go.</p>
      </div>

      <div className="px-6 max-w-4xl mx-auto pb-32">
        {/* Blog posts */}
        <PostList posts={allPosts} />

        {/* Trip reports section */}
        {tripPosts.length > 0 && (
          <div className="mt-20 pt-16 border-t border-[#1a1a1a]">
            <p className="text-[#c8a96e] text-xs tracking-[0.4em] uppercase mb-2">On the road</p>
            <h2 className="text-3xl font-light text-white mb-12">Trip Reports</h2>
            <PostList posts={tripPosts} />
          </div>
        )}
      </div>
    </main>
  );
}
