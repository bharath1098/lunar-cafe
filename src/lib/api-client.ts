/** Mark a client fetch as background so the global loader stays hidden. */
export const QUIET_API = { "X-Lunar-Quiet": "1" } as const;

export function quietInit(init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: { ...(init?.headers || {}), ...QUIET_API },
  };
}
