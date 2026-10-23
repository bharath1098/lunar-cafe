"use client";

import { useEffect, useState } from "react";

type CloseClock = {
  closingSoon?: boolean;
  minutesUntilClose?: number | null;
  allowAfterHours?: boolean;
  ordersOpen?: boolean;
  fetchedAt?: number;
};

function minutesLeft(clock: CloseClock | null, tick: number) {
  void tick;
  if (!clock?.closingSoon || clock.minutesUntilClose == null) return null;
  const elapsed = clock.fetchedAt
    ? Math.floor((Date.now() - clock.fetchedAt) / 60000)
    : 0;
  const mins = clock.minutesUntilClose - elapsed;
  return mins > 0 ? mins : null;
}

export function ClosingSoonBanner({
  ordering,
}: {
  ordering?: CloseClock | null;
}) {
  const [remote, setRemote] = useState<CloseClock | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (ordering) return;
    let stop = false;
    async function pull() {
      try {
        const res = await fetch("/api/public", {
          cache: "no-store",
          headers: { "X-Lunar-Quiet": "1" },
        });
        if (!res.ok || stop) return;
        const data = await res.json();
        setRemote({ ...(data.ordering || {}), fetchedAt: Date.now() });
      } catch {
        /* banner stays quiet if the hours request fails */
      }
    }
    void pull();
    const timer = setInterval(pull, 15000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [ordering]);

  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  const clock = ordering ? { ...ordering, fetchedAt: undefined } : remote;
  const mins = minutesLeft(clock, tick);
  if (mins == null || clock?.allowAfterHours || clock?.ordersOpen === false) return null;
  const label = mins === 1 ? "1 minute" : `${mins} minutes`;

  return (
    <div className="closing-soon-banner" role="status">
      Cafe closes in {label}
    </div>
  );
}
