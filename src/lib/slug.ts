/** URL slugs for menu dishes: "Plain Omelette" -> "plain-omelette" */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Adds a unique `slug` to every dish. If two dishes share a name the later one
 * gets its category appended (then a number), so URLs never collide.
 */
export function withSlugs<T extends { id: string; name: string; category: string }>(
  items: T[],
): (T & { slug: string })[] {
  const used = new Set<string>();
  return items.map((item) => {
    const base = slugify(item.name) || "dish";
    let slug = base;
    if (used.has(slug)) slug = `${base}-${slugify(item.category)}`;
    let n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;
    used.add(slug);
    return { ...item, slug };
  });
}
