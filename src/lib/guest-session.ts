/** Active guest table visit — lets diners browse the public site and return to their order. */

export type ActiveGuestVisit = {
  sessionId: string;
  memberId: string;
  tableId: string;
  /** Short label like O3 / I2 */
  tableLabel: string;
  savedAt: string;
};

const ACTIVE_KEY = "lunar-active-guest";

export function tableLabelFromId(tableId: string) {
  return tableId.replace(/^lunar-/i, "").toUpperCase();
}

export function sessionStorageKey(sessionId: string) {
  return `lunar-session-${sessionId}`;
}

export function saveGuestSession(input: {
  sessionId: string;
  memberId: string;
  tableId: string;
  isHost?: boolean;
}) {
  if (typeof window === "undefined") return;
  const visit: ActiveGuestVisit = {
    sessionId: input.sessionId,
    memberId: input.memberId,
    tableId: input.tableId,
    tableLabel: tableLabelFromId(input.tableId),
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(visit));
  localStorage.setItem(
    sessionStorageKey(input.sessionId),
    JSON.stringify({ memberId: input.memberId, isHost: Boolean(input.isHost) }),
  );
  try {
    // Fresh join / order load — show the return bar again if it was dismissed.
    if (sessionStorage.getItem("lunar-guest-bar-hidden") === input.sessionId) {
      sessionStorage.removeItem("lunar-guest-bar-hidden");
    }
  } catch {
    /* ignore */
  }
}

export function readActiveGuest(): ActiveGuestVisit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveGuestVisit;
    if (!parsed?.sessionId || !parsed?.memberId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearActiveGuest(sessionId?: string) {
  if (typeof window === "undefined") return;
  const current = readActiveGuest();
  if (!sessionId || current?.sessionId === sessionId) {
    localStorage.removeItem(ACTIVE_KEY);
  }
  if (sessionId) localStorage.removeItem(sessionStorageKey(sessionId));
}

export function orderPath(sessionId: string) {
  return `/order/${sessionId}`;
}
