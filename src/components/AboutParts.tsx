"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

/** Number that counts up the first time it scrolls into view. */
export function CountUp({
  to,
  decimals = 0,
  suffix = "",
  duration = 1.8,
}: {
  to: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, reduce, to, duration]);

  return (
    <span ref={ref}>
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/** Gentle vertical drift for badges sitting on photos. */
export function Floaty({
  children,
  className,
  delay = 0,
  amplitude = 10,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  amplitude?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={reduce ? undefined : { y: [0, -amplitude, 0] }}
      transition={{
        duration: 4.6,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

/** Bar that fills to a share of `max` when it enters the viewport. */
export function StatBar({
  value,
  max,
  delay = 0,
}: {
  value: number;
  max: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const pct = Math.max(8, Math.round((value / Math.max(max, 1)) * 100));

  return (
    <div ref={ref} className="about-bar" aria-hidden>
      <motion.span
        initial={{ scaleX: reduce ? 1 : 0 }}
        animate={inView || reduce ? { scaleX: 1 } : undefined}
        transition={{ duration: 1.15, delay, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: `${pct}%`, transformOrigin: "left center" }}
      />
    </div>
  );
}

/** Image wrapper that drifts slightly as the page scrolls. */
export function ParallaxFrame({
  children,
  className,
  range = 36,
}: {
  children: ReactNode;
  className?: string;
  range?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [range, -range]);

  return (
    <div ref={ref} className={className}>
      <motion.div
        style={{ y: reduce ? 0 : y, position: "absolute", inset: "-8% 0" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Vertical timeline whose gold line fills as the user scrolls through it. */
export function ScrollTimeline({
  steps,
}: {
  steps: { time: string; title: string; text: string; icon: ReactNode }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 55%"],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <div ref={ref} className="about-timeline">
      <div className="about-timeline-rail" aria-hidden>
        <motion.span className="about-timeline-fill" style={{ scaleY }} />
      </div>
      {steps.map((s, i) => (
        <motion.div
          key={s.time}
          className={`about-timeline-item ${i % 2 ? "is-right" : ""}`}
          initial={{ opacity: 0, x: i % 2 ? 36 : -36 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="about-timeline-dot" aria-hidden>
            {s.icon}
          </span>
          <div className="about-timeline-card">
            <span className="about-timeline-time">{s.time}</span>
            <h3 className="h-display h-md">{s.title}</h3>
            <p>{s.text}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
