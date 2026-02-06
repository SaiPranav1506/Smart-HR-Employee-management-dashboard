import React, { useEffect, useRef } from "react";

/**
 * Subtle, professional mouse-parallax background.
 * Intended to be mounted once per page.
 */
export default function LiveMouseBackground({ className = "" }) {
  const layerRef = useRef(null);

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;

    let rafId = 0;
    let clientX = 0;
    let clientY = 0;

    const apply = () => {
      rafId = 0;
      const cx = clientX - window.innerWidth / 2;
      const cy = clientY - window.innerHeight / 2;

      el.style.setProperty("--orbAx", `${cx * 0.02}px`);
      el.style.setProperty("--orbAy", `${cy * 0.02}px`);
      el.style.setProperty("--orbBx", `${cx * 0.012}px`);
      el.style.setProperty("--orbBy", `${cy * 0.012}px`);
    };

    const schedule = () => {
      if (!rafId) rafId = window.requestAnimationFrame(apply);
    };

    const onMove = (e) => {
      clientX = e.clientX;
      clientY = e.clientY;
      schedule();
    };

    const onLeave = () => {
      clientX = window.innerWidth / 2;
      clientY = window.innerHeight / 2;
      schedule();
    };

    onLeave();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={layerRef} className={`liveMouseLayerFixed ${className}`} aria-hidden="true">
      <div className="liveOrb liveOrbA" />
      <div className="liveOrb liveOrbB" />
    </div>
  );
}
