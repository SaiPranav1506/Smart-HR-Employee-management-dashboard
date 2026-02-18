import React, { useEffect, useRef } from "react";

/**
 * Professional, elegant mouse-parallax background with multiple interactive layers.
 * Creates smooth, responsive visual effects that follow cursor movement.
 */
export default function LiveMouseBackground({ className = "" }) {
  const layerRef = useRef(null);

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;

    let rafId = 0;
    let clientX = window.innerWidth / 2;
    let clientY = window.innerHeight / 2;

    const apply = () => {
      rafId = 0;
      const cx = clientX - window.innerWidth / 2;
      const cy = clientY - window.innerHeight / 2;

      // Multiple parallax layers at different depths
      el.style.setProperty("--orbAx", `${cx * 0.025}px`);
      el.style.setProperty("--orbAy", `${cy * 0.025}px`);
      el.style.setProperty("--orbBx", `${cx * 0.015}px`);
      el.style.setProperty("--orbBy", `${cy * 0.015}px`);
      el.style.setProperty("--orbCx", `${cx * 0.008}px`);
      el.style.setProperty("--orbCy", `${cy * 0.008}px`);
      el.style.setProperty("--cursorGlow", `${cx}px`, `${cy}px`);
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

    apply();
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
      <div className="liveOrb liveOrbC" />
      <div className="cursorGlowEffect" />
    </div>
  );
}
