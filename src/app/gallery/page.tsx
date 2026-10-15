"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PageHero, PublicShell } from "@/components/PublicShell";
import { GALLERY, CAFE_MEDIA } from "@/lib/media";

export default function GalleryPage() {
  const [active, setActive] = useState<(typeof GALLERY)[number] | null>(null);

  return (
    <PublicShell>
      <PageHero
        eyebrow="Gallery"
        title="Moments that matter"
        subtitle="Patio nights, latte art, and the dishes you keep coming back for."
        image={CAFE_MEDIA.arch}
      />
      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="wrap masonry">
          {GALLERY.map((g, i) => (
            <motion.button
              key={g.src}
              className="masonry-item"
              onClick={() => setActive(g)}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.6 }}
              aria-label={`Open ${g.title}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.src} alt={g.title} loading="lazy" />
              <span className="masonry-caption">{g.title}</span>
            </motion.button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {active && (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.src} alt={active.title} />
          </motion.div>
        )}
      </AnimatePresence>
    </PublicShell>
  );
}
