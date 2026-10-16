"use client";

import { useEffect, useState } from "react";

const QUIET = "x-lunar-quiet";
const SHOW_AFTER_MS = 180;

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function isQuiet(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (headers.get(QUIET) === "1") return true;
  if (typeof Request !== "undefined" && input instanceof Request) {
    return new Headers(input.headers).get(QUIET) === "1";
  }
  return false;
}

function isApi(input: RequestInfo | URL) {
  return requestUrl(input).includes("/api/");
}

export function ApiLoader() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const orig = window.fetch.bind(window);
    let inflight = 0;
    let timer = 0;

    const start = () => {
      inflight += 1;
      if (inflight === 1) {
        timer = window.setTimeout(() => setOn(true), SHOW_AFTER_MS);
      }
    };

    const stop = () => {
      inflight = Math.max(0, inflight - 1);
      if (inflight === 0) {
        window.clearTimeout(timer);
        timer = 0;
        setOn(false);
      }
    };

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const track = isApi(input) && !isQuiet(input, init);
      if (!track) return orig(input, init);
      start();
      return orig(input, init).finally(stop);
    };

    return () => {
      window.fetch = orig;
      window.clearTimeout(timer);
    };
  }, []);

  if (!on) return null;

  return (
    <div className="api-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="api-loader-card">
        <span className="api-loader-ring" aria-hidden />
        <strong>Please wait</strong>
        <span>Working on that…</span>
      </div>
    </div>
  );
}
