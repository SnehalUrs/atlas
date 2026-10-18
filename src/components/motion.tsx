"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** Fades and lifts children into place the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Counts from 0 to `value` the first time it scrolls into view. */
export function CountUp({ value, decimals = 0, duration = 1.6 }: { value: number; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      setShown(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {shown.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}

export { elevationColor as intensityColor } from "@/lib/terrain";
