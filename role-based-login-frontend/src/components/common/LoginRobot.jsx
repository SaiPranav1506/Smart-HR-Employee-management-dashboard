import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * Expressive animated robot for the login page.
 *
 * Props:
 *  - emailLength   : number
 *  - focusField    : "email" | "password" | null
 *  - isSubmitting  : boolean
 *  - hasError      : boolean
 *  - themeFlip     : number  (increments on every theme toggle → triggers dizzy)
 */
const LoginRobot = ({ emailLength = 0, focusField, isSubmitting, hasError, themeFlip = 0 }) => {
  const svgRef = useRef(null);

  /* ── mouse-based eye tracking ── */
  const [mouseEye, setMouseEye] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.35; // eye center approximation
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const maxR = 6;
      const r = Math.min(dist / 8, maxR);
      setMouseEye({ x: (dx / dist) * r, y: (dy / dist) * r });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  /* ── email typing → horizontal eye shift ── */
  const maxShift = 8;
  const emailShift = focusField === "email"
    ? -maxShift + (Math.min(emailLength, 30) / 30) * maxShift * 2
    : 0;

  /* ── combine eye position ── */
  const covering = focusField === "password";
  const eyeX = covering ? 0 : emailShift + (focusField === "email" ? mouseEye.x * 0.3 : mouseEye.x);
  const eyeY = covering ? 0 : (focusField === "email" ? 0 : mouseEye.y * 0.6);

  /* ── theme toggle → dizzy spin ── */
  const [dizzy, setDizzy] = useState(false);
  const prevFlip = useRef(themeFlip);
  useEffect(() => {
    if (themeFlip !== prevFlip.current) {
      prevFlip.current = themeFlip;
      setDizzy(true);
      const t = setTimeout(() => setDizzy(false), 1200);
      return () => clearTimeout(t);
    }
  }, [themeFlip]);

  /* ── pupil "jitter" on each keystroke ── */
  const [jitter, setJitter] = useState(false);
  const jitterTimer = useRef(null);
  const triggerJitter = useCallback(() => {
    setJitter(true);
    clearTimeout(jitterTimer.current);
    jitterTimer.current = setTimeout(() => setJitter(false), 120);
  }, []);
  useEffect(() => { triggerJitter(); }, [emailLength, triggerJitter]);

  const excited = isSubmitting;
  const sad = hasError;

  /* ── derived "mood" class on the wrapper ── */
  const moodClass = dizzy ? "robotDizzy" : excited ? "robotExcited" : sad ? "robotSad" : "";

  /* ── little sparkle pupils ── */
  const pupilRx = jitter ? 4.5 : 3.5;
  const pupilRy = jitter ? 4.5 : 3.5;

  return (
    <div className={`loginRobot ${moodClass}`} aria-hidden="true">
      <svg
        ref={svgRef}
        viewBox="0 0 200 220"
        width="180"
        height="180"
        style={{ display: "block", margin: "0 auto", overflow: "visible" }}
      >
        {/* ── antenna ── */}
        <g className={`robotAntennaGroup ${excited ? "robotAntennaBounce" : ""} ${dizzy ? "robotAntennaWobble" : ""}`}>
          <line x1="100" y1="28" x2="100" y2="8" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="6" r="6" fill="var(--gold)" className="robotAntennaOrb" />
          {/* antenna spark */}
          {(excited || dizzy) && (
            <>
              <line x1="94" y1="2" x2="90" y2="-4" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              <line x1="106" y1="2" x2="110" y2="-4" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              <line x1="100" y1="0" x2="100" y2="-6" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            </>
          )}
        </g>

        {/* ── ears ── */}
        <rect x="38" y="52" width="12" height="20" rx="4" fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="1.5" />
        <rect x="150" y="52" width="12" height="20" rx="4" fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="1.5" />

        {/* ── head ── */}
        <rect
          x="50" y="28" width="100" height="80" rx="22"
          fill="var(--panel-solid)"
          stroke="var(--border)"
          strokeWidth="2"
          className="robotHead"
        />

        {/* ── face plate (visor) ── */}
        <rect
          x="60" y="42" width="80" height="52" rx="16"
          fill="var(--input-bg)"
          stroke="var(--border)"
          strokeWidth="1.5"
          className="robotVisor"
        />

        {/* ── eyes ── */}
        <g className={`robotEyes ${covering ? "robotEyesCovered" : ""}`}
           style={{ transition: "opacity 0.3s ease" }}
        >
          {/* left eye socket */}
          <ellipse cx="82" cy="64" rx="14" ry="13" fill="var(--bg)" opacity="0.3" />
          {/* left eye */}
          <ellipse
            cx={82 + eyeX} cy={64 + eyeY}
            rx={sad ? 8 : dizzy ? 10 : 11}
            ry={sad ? 7 : dizzy ? 10 : 11}
            fill="var(--gold)"
            className="robotEye"
          />
          {/* left pupil */}
          <ellipse
            cx={82 + eyeX * 1.3 + 1} cy={62 + eyeY * 1.2}
            rx={pupilRx} ry={pupilRy}
            fill="rgba(255,255,255,0.85)"
          />
          {/* left micro-highlight */}
          <circle cx={82 + eyeX * 1.3 + 3} cy={60 + eyeY * 1.2} r="1.5" fill="#fff" opacity="0.9" />

          {/* right eye socket */}
          <ellipse cx="118" cy="64" rx="14" ry="13" fill="var(--bg)" opacity="0.3" />
          {/* right eye */}
          <ellipse
            cx={118 + eyeX} cy={64 + eyeY}
            rx={sad ? 8 : dizzy ? 10 : 11}
            ry={sad ? 7 : dizzy ? 10 : 11}
            fill="var(--gold)"
            className="robotEye"
          />
          {/* right pupil */}
          <ellipse
            cx={118 + eyeX * 1.3 + 1} cy={62 + eyeY * 1.2}
            rx={pupilRx} ry={pupilRy}
            fill="rgba(255,255,255,0.85)"
          />
          {/* right micro-highlight */}
          <circle cx={118 + eyeX * 1.3 + 3} cy={60 + eyeY * 1.2} r="1.5" fill="#fff" opacity="0.9" />

          {/* dizzy spirals */}
          {dizzy && (
            <>
              <circle cx="82" cy="64" r="12" fill="none" stroke="var(--gold)" strokeWidth="1.5"
                strokeDasharray="4 4" className="robotDizzySpin" opacity="0.5" />
              <circle cx="118" cy="64" r="12" fill="none" stroke="var(--gold)" strokeWidth="1.5"
                strokeDasharray="4 4" className="robotDizzySpinReverse" opacity="0.5" />
            </>
          )}

          {/* sad eyebrows */}
          {sad && (
            <>
              <line x1="70" y1="48" x2="90" y2="53" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" />
              <line x1="130" y1="48" x2="110" y2="53" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" />
            </>
          )}

          {/* happy eyebrows when excited */}
          {excited && (
            <>
              <line x1="72" y1="53" x2="88" y2="48" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="128" y1="53" x2="112" y2="48" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
        </g>

        {/* ── cheek blush ── */}
        {(excited || (focusField === "email" && emailLength > 10)) && (
          <>
            <ellipse cx="66" cy="76" rx="7" ry="4" fill="var(--error)" opacity="0.15" />
            <ellipse cx="134" cy="76" rx="7" ry="4" fill="var(--error)" opacity="0.15" />
          </>
        )}

        {/* ── mouth ── */}
        {dizzy ? (
          /* wobbly dizzy mouth */
          <path d="M85 84 Q92 88 100 82 Q108 76 115 84"
            fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round"
            className="robotDizzyMouth" />
        ) : sad ? (
          <path d="M82 86 Q100 76 118 86"
            fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" />
        ) : excited ? (
          /* big grin */
          <>
            <path d="M80 80 Q100 96 120 80"
              fill="var(--gold)" opacity="0.15" stroke="var(--gold)" strokeWidth="2" />
            <path d="M84 80 Q100 92 116 80"
              fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : focusField === "email" ? (
          /* slight 'o' of concentration */
          <ellipse cx="100" cy="84" rx="5" ry="4" fill="var(--gold)" opacity="0.6" />
        ) : (
          /* default gentle smile */
          <path d="M85 80 Q100 90 115 80"
            fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" />
        )}

        {/* ── hands / arms (cover eyes for password) ── */}
        <g className={`robotHands ${covering ? "robotHandsCover" : ""}`}>
          {/* left arm + hand */}
          <path className="robotArmLeft"
            d="M50 90 Q30 90 28 70 Q26 55 40 50"
            fill="none" stroke="var(--panel-solid)" strokeWidth="12" strokeLinecap="round" />
          <circle className="robotHandLeft" cx="40" cy="50" r="14"
            fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="1.5" />
          <circle className="robotFingerL1" cx="32" cy="44" r="5.5"
            fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="1" />
          <circle className="robotFingerL2" cx="38" cy="39" r="5.5"
            fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="1" />
          <circle className="robotFingerL3" cx="46" cy="39" r="5.5"
            fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="1" />

          {/* right arm + hand */}
          <path className="robotArmRight"
            d="M150 90 Q170 90 172 70 Q174 55 160 50"
            fill="none" stroke="var(--panel-solid)" strokeWidth="12" strokeLinecap="round" />
          <circle className="robotHandRight" cx="160" cy="50" r="14"
            fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="1.5" />
          <circle className="robotFingerR1" cx="168" cy="44" r="5.5"
            fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="1" />
          <circle className="robotFingerR2" cx="162" cy="39" r="5.5"
            fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="1" />
          <circle className="robotFingerR3" cx="154" cy="39" r="5.5"
            fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="1" />
        </g>

        {/* ── body ── */}
        <rect x="62" y="112" width="76" height="56" rx="16"
          fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="2" />

        {/* chest panel */}
        <rect x="78" y="120" width="44" height="28" rx="8"
          fill="var(--input-bg)" stroke="var(--border)" strokeWidth="1" />

        {/* chest light */}
        <circle cx="100" cy="130" r="7"
          fill={excited ? "var(--success)" : sad ? "var(--error)" : dizzy ? "var(--warning)" : "var(--gold)"}
          className="robotChestLight" />

        {/* chest vents */}
        <line x1="84" y1="142" x2="116" y2="142" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="88" y1="146" x2="112" y2="146" stroke="var(--border)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

        {/* ── legs ── */}
        <rect x="72" y="168" width="10" height="16" rx="4" fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="1.5" />
        <rect x="118" y="168" width="10" height="16" rx="4" fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="1.5" />

        {/* ── feet ── */}
        <rect x="66" y="184" width="22" height="10" rx="5" fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="1.5" />
        <rect x="112" y="184" width="22" height="10" rx="5" fill="var(--panel-solid)" stroke="var(--border)" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

export default LoginRobot;
