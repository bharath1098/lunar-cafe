import { redirect } from "next/navigation";

/** Old URL: flavour pages now live at /menu/[slug]. */
export default async function LegacyExploreRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/menu/${slug}`);
}
