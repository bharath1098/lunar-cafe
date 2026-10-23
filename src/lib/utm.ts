export type Utm = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
};

const KEY = "lunar-utm";

export function campaignLabel(utm: Utm | null | undefined): string {
  if (!utm) return "";
  return [utm.source, utm.medium, utm.campaign].filter(Boolean).join(" / ");
}

/** Remember campaign tags from the landing URL for this browser tab. */
export function captureUtm() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const utm: Utm = {
    source: params.get("utm_source") || undefined,
    medium: params.get("utm_medium") || undefined,
    campaign: params.get("utm_campaign") || undefined,
    content: params.get("utm_content") || undefined,
    term: params.get("utm_term") || undefined,
  };
  if (!campaignLabel(utm)) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(utm));
  } catch {
    /* private mode */
  }
}

export function readUtm(): Utm | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Utm) : null;
  } catch {
    return null;
  }
}
