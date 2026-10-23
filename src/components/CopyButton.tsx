"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({
  value,
  label = "Copy",
  iconOnly = false,
}: {
  value: string;
  label?: string;
  iconOnly?: boolean;
}) {
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      className={iconOnly ? "copy-btn is-icon" : "copy-btn"}
      aria-label={done ? "Copied" : label}
      title={done ? "Copied" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          window.setTimeout(() => setDone(false), 1600);
        } catch {
          setDone(false);
        }
      }}
    >
      {done ? <Check size={15} strokeWidth={2.2} /> : <Copy size={15} strokeWidth={2.2} />}
      {!iconOnly && <span>{done ? "Copied" : label}</span>}
    </button>
  );
}
