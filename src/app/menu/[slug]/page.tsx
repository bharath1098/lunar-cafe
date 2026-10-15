import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExplore } from "@/lib/explore";
import { getPublicMenu } from "@/lib/store";
import { withSlugs } from "@/lib/slug";
import { ExploreView } from "@/components/explore/ExploreView";
import { DishView } from "@/components/explore/DishView";

// the menu is edited by staff at any time, so always read it fresh
export const dynamic = "force-dynamic";

async function loadMenu() {
  return withSlugs(await getPublicMenu());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const flavour = getExplore(slug);
  if (flavour) {
    return { title: `${flavour.name} | Lunar Cafe`, description: flavour.story };
  }
  const dish = (await loadMenu()).find((d) => d.slug === slug);
  if (!dish) return {};
  return {
    title: `${dish.name} | Lunar Cafe`,
    description: dish.description || `${dish.name}, from our ${dish.category} menu at Lunar Cafe.`,
  };
}

export default async function MenuSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // flavour collections (wood-fired-pizza, lunar-lattes, ...)
  if (getExplore(slug)) return <ExploreView slug={slug} />;

  // single dishes (plain-omelette, lunar-sky-latte, ...)
  const menu = await loadMenu();
  const dish = menu.find((d) => d.slug === slug);
  if (!dish) notFound();

  const inCategory = menu.filter((d) => d.category === dish.category);
  const i = inCategory.findIndex((d) => d.id === dish.id);
  const many = inCategory.length > 1;
  const prev = many ? inCategory[(i - 1 + inCategory.length) % inCategory.length] : undefined;
  const next = many ? inCategory[(i + 1) % inCategory.length] : undefined;
  const related = inCategory.filter((d) => d.id !== dish.id);

  return <DishView dish={dish} related={related} prev={prev} next={next} />;
}
