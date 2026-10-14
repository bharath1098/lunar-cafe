const KEY = "lunar-staff";

/** This tab's staff login. Each tab keeps its own role. */
export function saveStaffSession(user: unknown) {
  sessionStorage.setItem(KEY, JSON.stringify(user));
  localStorage.removeItem(KEY);
}

export function readStaffSession<T>(): T | null {
  try {
    const tab = sessionStorage.getItem(KEY);
    if (tab) return JSON.parse(tab) as T;

    // Older builds stored one login for the whole window. Claim it for this
    // tab only, then drop the shared copy so other tabs can sign in separately.
    const shared = localStorage.getItem(KEY);
    if (!shared) return null;
    sessionStorage.setItem(KEY, shared);
    localStorage.removeItem(KEY);
    return JSON.parse(shared) as T;
  } catch {
    return null;
  }
}

export function clearStaffSession() {
  sessionStorage.removeItem(KEY);
  localStorage.removeItem(KEY);
}
