import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url || !url.includes("instructables.com")) {
    return NextResponse.json({ error: "Invalid Instructables URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; portfolio-scraper/1.0)" },
    });
    const html = await res.text();

    // Extract INITIAL_STATE JSON blob that Instructables embeds
    const stateIdx = html.indexOf("window.INITIAL_STATE");
    let stateJson: string | null = null;
    if (stateIdx !== -1) {
      const chunk = html.slice(stateIdx);
      const jsonStart = chunk.indexOf("{");
      const scriptEnd = chunk.indexOf("</script>");
      if (jsonStart !== -1 && scriptEnd !== -1) {
        // trim trailing "; before </script>
        stateJson = chunk.slice(jsonStart, scriptEnd).replace(/;\s*$/, "");
      }
    }
    const stateMatch: [unknown, string] | null = stateJson ? [null, stateJson] : null;

    let title = "";
    let description = "";
    let longDescription = "";
    let coverUrl = "";
    const tags: string[] = [];
    const photos: string[] = [];

    if (stateMatch) {
      try {
        const state = JSON.parse(stateMatch[1]);
        const ible = Object.values(state?.instructable ?? {})[0] as Record<string, unknown> | undefined;

        if (ible) {
          title = (ible.title as string) ?? "";
          description = (ible.titleSlug as string) ? `${ible.title}` : "";

          // Extract intro/body from the first step
          const steps = (ible.steps as { body?: string; title?: string }[]) ?? [];
          if (steps[0]?.body) {
            // Strip HTML tags for plain text
            description = steps[0].body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
            longDescription = steps
              .map((s, i) => `## ${s.title || `Step ${i + 1}`}\n${(s.body ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}`)
              .join("\n\n");
          }

          // Tags
          const channelTitle = ible.channelTitle as string | undefined;
          if (channelTitle) tags.push(channelTitle);
          const classification = ible.classification as { type?: { title?: string } } | undefined;
          if (classification?.type?.title) tags.push(classification.type.title);

          // Cover image
          const cover = ible.coverImage as { url?: string } | undefined;
          if (cover?.url) coverUrl = cover.url;

          // All step images
          for (const step of steps) {
            const imgs = (step as { files?: { downloadUrl?: string }[] }).files ?? [];
            for (const img of imgs) {
              if (img.downloadUrl) photos.push(img.downloadUrl);
            }
          }
        }
      } catch {
        // Fall through to HTML parsing
      }
    }

    // Fallback: parse from HTML meta tags
    if (!title) {
      const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/);
      title = ogTitle?.[1] ?? "";
    }
    if (!description) {
      const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/);
      description = ogDesc?.[1] ?? "";
    }
    if (!coverUrl) {
      const ogImg = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/);
      coverUrl = ogImg?.[1] ?? "";
    }

    // Extract all content images from HTML if we don't have photos yet
    if (photos.length === 0) {
      const imgMatches = html.matchAll(/<img[^>]+src="(https:\/\/content\.instructables\.com\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi);
      for (const match of imgMatches) {
        if (!photos.includes(match[1])) photos.push(match[1]);
      }
    }

    return NextResponse.json({
      title,
      description,
      longDescription,
      coverUrl,
      tags,
      photos: photos.slice(0, 20),
      sourceUrl: url,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch Instructables page" }, { status: 500 });
  }
}
