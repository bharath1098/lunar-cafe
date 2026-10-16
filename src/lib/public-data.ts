import { quietInit } from "@/lib/api-client";

export type PublicMenuItem = {
  id: string;
  slug: string;
  category: string;
  name: string;
  description: string;
  image?: string;
  isVeg?: boolean;
  isNew?: boolean;
  isHighlighted?: boolean;
  hasDiscount?: boolean;
};

export type PublicPayload = {
  cafe?: unknown;
  menu?: PublicMenuItem[];
  feedback?: Array<{
    id: string;
    category: string;
    type: string;
    message: string;
    rating?: number;
  }>;
  tables?: Array<{ id: string; label: string; section: string }>;
  ordering?: { acceptingOrders?: boolean; reason?: string };
};

let memory: PublicPayload | null = null;
let inflight: Promise<PublicPayload> | null = null;

/** Shared public payload — splash, menu, and explore all hit the same in-flight request. */
export function loadPublicData(): Promise<PublicPayload> {
  if (memory) return Promise.resolve(memory);
  if (inflight) return inflight;
  inflight = fetch("/api/public", quietInit())
    .then(async (res) => {
      if (!res.ok) throw new Error(`public ${res.status}`);
      const data = (await res.json()) as PublicPayload;
      memory = data;
      return data;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });
  return inflight;
}

export function prefetchPublicData() {
  void loadPublicData().catch(() => {});
}
