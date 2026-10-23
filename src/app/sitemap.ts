import type { MetadataRoute } from "next";
import { EXPLORE } from "@/lib/explore";
import { withSlugs } from "@/lib/slug";
import { absoluteUrl } from "@/lib/site";
import { getPublicMenu } from "@/lib/store";

const STATIC_PAGES: { path: string; changeFrequency: "weekly" | "monthly"; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/menu", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/reserve", changeFrequency: "monthly", priority: 0.8 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/gallery", changeFrequency: "monthly", priority: 0.6 },
  { path: "/loyalty", changeFrequency: "monthly", priority: 0.5 },
  { path: "/feedback", changeFrequency: "monthly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.2 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.2 },
];

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const slugs = new Set(EXPLORE.map((item) => item.slug));
  try {
    for (const dish of withSlugs(await getPublicMenu())) slugs.add(dish.slug);
  } catch {
    // Static pages still ship if the menu store is unavailable.
  }

  for (const slug of slugs) {
    pages.push({
      url: absoluteUrl(`/menu/${slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return pages;
}
