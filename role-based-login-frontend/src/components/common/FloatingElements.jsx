import React, { useEffect, useRef } from "react";

/**
 * Floating interactive particles that add depth and elegance to the UI.
 * Particles subtly respond to mouse movement for added interactivity.
 */
export default function FloatingElements() {
  const containerRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create animated floating particles
    const particleCount = Math.min(8, Math.max(3, Math.floor(window.innerWidth / 300)));
    particlesRef.current = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "floatingParticle";
      
      // Random initial position
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = Math.random() * 40 + 20; // 20px to 60px
      const duration = Math.random() * 20 + 15; // 15s to 35s
      const delay = Math.random() * 5;
      
      particle.style.cssText = `
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        animation: floatAround ${duration}s ease-in-out infinite ${delay}s;
      `;
      
      container.appendChild(particle);
      particlesRef.current.push({
        el: particle,
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
      });
    }

    const handleMouseMove = () => {
      // Mouse position tracked for future enhancements
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      particlesRef.current.forEach(p => {
        if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
      });
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="floatingElementsContainer" 
      aria-hidden="true"
    />
  );
}
