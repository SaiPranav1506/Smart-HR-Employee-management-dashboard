import React, { useEffect, useRef } from "react";

/**
 * Elegant cursor follower with smooth trailing effect.
 * Creates a professional, interactive visual element.
 */
export default function CursorFollower() {
  const cursorRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    const cursor = cursorRef.current;
    const circle = circleRef.current;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animateCursor = () => {
      // Smooth trailing effect
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;

      if (cursor) {
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
      }

      if (circle) {
        // Secondary circle with more lag
        const circleX = cursorX + (mouseX - cursorX) * 0.3;
        const circleY = cursorY + (mouseY - cursorY) * 0.3;
        circle.style.left = `${circleX}px`;
        circle.style.top = `${circleY}px`;
      }

      requestAnimationFrame(animateCursor);
    };

    animateCursor();
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <>
      <div ref={circleRef} className="cursorCircleOuter" aria-hidden="true" />
      <div ref={cursorRef} className="cursorDot" aria-hidden="true" />
    </>
  );
}
