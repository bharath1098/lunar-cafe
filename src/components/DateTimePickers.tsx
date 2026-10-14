"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import {
  format,
  isValid,
  parse,
  startOfDay,
} from "date-fns";
import { CalendarDays, Clock } from "lucide-react";
import { CAFE } from "@/lib/cafe";

function buildTimeSlots(start: string, end: string, stepMin = 15) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const slots: string[] = [];
  let mins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  while (mins <= endMins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    mins += stepMin;
  }
  return slots;
}

function parseDisplayDate(raw: string): Date | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  for (const pattern of ["dd-MM-yyyy", "d-M-yyyy", "dd/MM/yyyy", "d/M/yyyy"]) {
    const d = parse(trimmed, pattern, new Date());
    if (!isValid(d) || trimmed.length < 8) continue;
    const y = d.getFullYear();
    if (y < 2000 || y > 2100) continue;
    return d;
  }
  return undefined;
}

/** Convert "HH:mm" (24h) → "h:mm AM/PM" */
function formatTo12Hour(hhmm: string): string {
  const [hRaw, mRaw] = hhmm.split(":");
  let h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${period}`;
}

/** Accept "5:00 PM", "5:00pm", "17:00", "5 pm" → "HH:mm" */
function parseDisplayTime(raw: string): string | undefined {
  const trimmed = raw.trim().toUpperCase().replace(/\s+/g, " ");
  if (!trimmed) return undefined;

  const withPeriod = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (withPeriod) {
    let h = Number(withPeriod[1]);
    const min = Number(withPeriod[2] ?? "0");
    const period = withPeriod[3];
    if (h < 1 || h > 12 || min > 59) return undefined;
    if (period === "AM") {
      if (h === 12) h = 0;
    } else if (h !== 12) {
      h += 12;
    }
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  const twentyFour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    const h = Number(twentyFour[1]);
    const min = Number(twentyFour[2]);
    if (h > 23 || min > 59) return undefined;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  return undefined;
}

function useOutsideClose(
  open: boolean,
  setOpen: (v: boolean) => void,
  root: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (root.current && !root.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen, root]);
}

export function DateField({
  name = "date",
  label = "Date",
  required,
  defaultValue,
}: {
  name?: string;
  label?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const initial = defaultValue
    ? parse(defaultValue, "yyyy-MM-dd", new Date())
    : undefined;
  const [selected, setSelected] = useState<Date | undefined>(
    initial && isValid(initial) ? initial : undefined,
  );
  const [text, setText] = useState(
    selected ? format(selected, "dd-MM-yyyy") : "",
  );
  const [invalid, setInvalid] = useState(false);

  useOutsideClose(open, setOpen, rootRef);

  const iso = selected ? format(selected, "yyyy-MM-dd") : "";

  function commitText(next: string) {
    setText(next);
    if (!next.trim()) {
      setSelected(undefined);
      setInvalid(false);
      return;
    }
    const parsed = parseDisplayDate(next);
    if (parsed) {
      setSelected(parsed);
      setInvalid(false);
    } else if (next.trim().length >= 8) {
      setSelected(undefined);
      setInvalid(true);
    } else {
      setSelected(undefined);
      setInvalid(false);
    }
  }

  function normalizeText() {
    const parsed = parseDisplayDate(text);
    if (parsed) {
      setSelected(parsed);
      setText(format(parsed, "dd-MM-yyyy"));
      setInvalid(false);
    } else if (text.trim()) {
      setInvalid(true);
    }
  }

  function onPick(day: Date | undefined) {
    if (!day) return;
    setSelected(day);
    setText(format(day, "dd-MM-yyyy"));
    setInvalid(false);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || (e.altKey && e.key === "ArrowDown")) {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div className="neo-field lunar-dt" ref={rootRef}>
      {label && <span id={`${id}-label`}>{label}</span>}
      <div className={`lunar-dt-control ${invalid ? "is-invalid" : ""}`}>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd-mm-yyyy"
          className="neo-input lunar-dt-input"
          value={text}
          onChange={(e) => commitText(e.target.value)}
          onBlur={normalizeText}
          onKeyDown={onKeyDown}
          aria-labelledby={label ? `${id}-label` : undefined}
          aria-invalid={invalid}
          required={required}
        />
        {/* Submitted value (ISO) — validated in the form handler */}
        <input type="hidden" name={name} value={iso} />
        <button
          type="button"
          className="lunar-dt-trigger"
          aria-label="Open calendar"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <CalendarDays size={18} />
        </button>
      </div>
      {invalid && (
        <small className="lunar-dt-hint">Use dd-mm-yyyy (e.g. 14-10-2026)</small>
      )}
      {open && (
        <div className="lunar-dt-popover" role="dialog" aria-label="Choose date">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={onPick}
            disabled={{ before: startOfDay(new Date()) }}
            defaultMonth={selected || new Date()}
            weekStartsOn={1}
            className="lunar-daypicker"
          />
          <div className="lunar-dt-popover-actions">
            <button type="button" onClick={() => onPick(new Date())}>
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setSelected(undefined);
                setText("");
                setInvalid(false);
                setOpen(false);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TimeField({
  name = "time",
  label = "Time",
  required,
  min = CAFE.hoursStart,
  max = CAFE.hoursEnd,
  defaultValue,
}: {
  name?: string;
  label?: string;
  required?: boolean;
  min?: string;
  max?: string;
  defaultValue?: string;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue || "");
  const [text, setText] = useState(
    defaultValue ? formatTo12Hour(defaultValue) : "",
  );
  const [invalid, setInvalid] = useState(false);
  const slots = useMemo(() => buildTimeSlots(min, max, 15), [min, max]);

  useOutsideClose(open, setOpen, rootRef);

  useEffect(() => {
    if (!open || !listRef.current || !value) return;
    const el = listRef.current.querySelector<HTMLButtonElement>(
      `[data-time="${value}"]`,
    );
    el?.scrollIntoView({ block: "center" });
  }, [open, value]);

  function commitText(next: string) {
    setText(next);
    const parsed = parseDisplayTime(next);
    if (!next.trim()) {
      setValue("");
      setInvalid(false);
      return;
    }
    if (parsed) {
      setValue(parsed);
      setInvalid(false);
    } else if (/\d/.test(next) && next.trim().length >= 4) {
      setValue("");
      setInvalid(true);
    } else {
      setValue("");
      setInvalid(false);
    }
  }

  function normalizeText() {
    const parsed = parseDisplayTime(text);
    if (parsed) {
      setValue(parsed);
      setText(formatTo12Hour(parsed));
      setInvalid(false);
    } else if (text.trim()) {
      setInvalid(true);
    }
  }

  function onPick(slot: string) {
    setValue(slot);
    setText(formatTo12Hour(slot));
    setInvalid(false);
    setOpen(false);
  }

  return (
    <div className="neo-field lunar-dt" ref={rootRef}>
      {label && <span id={`${id}-label`}>{label}</span>}
      <div className={`lunar-dt-control ${invalid ? "is-invalid" : ""}`}>
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          placeholder="e.g. 5:00 PM"
          className="neo-input lunar-dt-input"
          value={text}
          onChange={(e) => commitText(e.target.value)}
          onBlur={normalizeText}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          aria-labelledby={label ? `${id}-label` : undefined}
          aria-invalid={invalid}
          required={required}
        />
        <input type="hidden" name={name} value={value} />
        <button
          type="button"
          className="lunar-dt-trigger"
          aria-label="Open time list"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Clock size={18} />
        </button>
      </div>
      {invalid && (
        <small className="lunar-dt-hint">Use 12-hour time (e.g. 5:30 PM)</small>
      )}
      {open && (
        <div className="lunar-dt-popover lunar-time-popover" role="listbox" aria-label="Choose time">
          <div className="lunar-time-list" ref={listRef}>
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                data-time={slot}
                role="option"
                aria-selected={slot === value}
                className={slot === value ? "is-selected" : undefined}
                onClick={() => onPick(slot)}
              >
                {formatTo12Hour(slot)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
