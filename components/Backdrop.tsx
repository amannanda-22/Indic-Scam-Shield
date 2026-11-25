"use client";

import { useEffect, useRef } from "react";

/** Fixed atmospheric layer: grid, aurora blobs and a cursor-following spotlight (disabled for reduced-motion / touch). */
export default function Backdrop() {
  const spot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduce || !fine) return;
    let raf = 0;
    let x = window.innerWidth / 2;
    let y = 200;
    let tx = x;
    let ty = y;
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const tick = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      if (spot.current) spot.current.style.transform = `translate3d(${x - 260}px, ${y - 260}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="grid-bg absolute inset-x-0 top-0 h-[780px]" />
      <div className="absolute -left-40 top-[-12rem] h-[34rem] w-[34rem] animate-floaty rounded-full bg-signal/[0.09] blur-[120px]" />
      <div className="absolute right-[-10rem] top-24 h-[30rem] w-[30rem] animate-floaty rounded-full bg-violet/[0.09] blur-[120px] [animation-delay:-3s]" />
      <div className="absolute bottom-[-14rem] left-1/3 h-[32rem] w-[32rem] rounded-full bg-cyan/[0.06] blur-[130px]" />
      <div
        ref={spot}
        className="absolute left-0 top-0 hidden h-[520px] w-[520px] rounded-full opacity-70 will-change-transform [@media(pointer:fine)]:block"
        style={{ background: "radial-gradient(circle, rgba(61,255,160,0.10), transparent 62%)" }}
      />
    </div>
  );
}
