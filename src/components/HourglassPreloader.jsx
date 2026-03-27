import { useEffect, useState } from "react";

// Brand colours used throughout the animation
const COLOR_NAVY    = "#0a1628";
const COLOR_BLUE    = "#1a5ea8";
const COLOR_BLUE_LT = "#2d79d1";

/**
 * Full-screen hourglass preloader with XFA branding.
 * Shows for a random 1–4 seconds on every page visit.
 */
export function HourglassPreloader({ show }) {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(!show);

  useEffect(() => {
    if (show) {
      setHidden(false);
      setFading(false);
    } else {
      // Start fade-out, then fully hide after the transition completes
      setFading(true);
      const t = setTimeout(() => setHidden(true), 500);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (hidden) return null;

  return (
    <div
      role="status"
      aria-label="Loading page"
      aria-live="assertive"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: COLOR_NAVY,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "2rem",
        transition: "opacity 0.5s ease",
        opacity: fading ? 0 : 1,
        pointerEvents: show ? "all" : "none",
      }}
    >
      {/* Visually-hidden text for screen readers */}
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        Loading page, please wait…
      </span>

      {/* XFA brand (decorative) */}
      <div aria-hidden="true" style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "2rem",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "6px",
            lineHeight: 1,
          }}
        >
          XFA
        </div>
        <div
          style={{
            fontSize: "0.5rem",
            color: COLOR_BLUE_LT,
            letterSpacing: "3px",
            textTransform: "uppercase",
            marginTop: "4px",
          }}
        >
          A DIVISION OF MAREX
        </div>
      </div>

      {/* Hourglass (decorative) */}
      <div aria-hidden="true" className="xfa-hg-wrapper">
        <svg
          className="xfa-hg-svg"
          viewBox="0 0 60 100"
          width="60"
          height="100"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ── Top cap ── */}
          <rect x="5" y="2" width="50" height="7" rx="3" fill={COLOR_BLUE_LT} />
          {/* ── Bottom cap ── */}
          <rect x="5" y="91" width="50" height="7" rx="3" fill={COLOR_BLUE_LT} />

          {/* ── Side lines ── */}
          <line x1="8"  y1="8"  x2="28" y2="48" stroke={COLOR_BLUE_LT} strokeWidth="2.5" />
          <line x1="52" y1="8"  x2="32" y2="48" stroke={COLOR_BLUE_LT} strokeWidth="2.5" />
          <line x1="8"  y1="92" x2="28" y2="52" stroke={COLOR_BLUE_LT} strokeWidth="2.5" />
          <line x1="52" y1="92" x2="32" y2="52" stroke={COLOR_BLUE_LT} strokeWidth="2.5" />

          {/* ── Animated sand – top bulb ── */}
          <clipPath id="xfa-hg-top-clip">
            <polygon points="8,8 52,8 30,48" />
          </clipPath>
          <rect
            x="0" y="0" width="60" height="100"
            fill={COLOR_BLUE}
            clipPath="url(#xfa-hg-top-clip)"
            className="xfa-hg-sand-top"
          />

          {/* ── Animated sand – bottom bulb ── */}
          <clipPath id="xfa-hg-bot-clip">
            <polygon points="30,52 8,92 52,92" />
          </clipPath>
          <rect
            x="0" y="0" width="60" height="100"
            fill={COLOR_BLUE}
            clipPath="url(#xfa-hg-bot-clip)"
            className="xfa-hg-sand-bot"
          />

          {/* ── Drip dot at the neck ── */}
          <circle cx="30" cy="50" r="2.5" fill={COLOR_BLUE_LT} className="xfa-hg-drip" />
        </svg>

        <style>{`
          .xfa-hg-svg {
            transform-origin: 30px 50px;
            animation: xfaHgFlip 2.4s ease-in-out infinite;
          }
          .xfa-hg-sand-top {
            transform-origin: 30px 48px;
            transform-box: fill-box;
            animation: xfaSandTop 2.4s ease-in infinite;
          }
          .xfa-hg-sand-bot {
            transform-origin: 30px 52px;
            transform-box: fill-box;
            animation: xfaSandBot 2.4s ease-in infinite;
          }
          .xfa-hg-drip {
            animation: xfaDrip 2.4s ease-in infinite;
          }
          @keyframes xfaSandTop {
            0%   { transform: scaleY(1); opacity: 1;   }
            75%  { transform: scaleY(0); opacity: 0.3; }
            85%  { transform: scaleY(0); opacity: 0;   }
            100% { transform: scaleY(0); opacity: 0;   }
          }
          @keyframes xfaSandBot {
            0%   { transform: scaleY(0); opacity: 0;   }
            15%  { transform: scaleY(0); opacity: 0.3; }
            75%  { transform: scaleY(1); opacity: 1;   }
            100% { transform: scaleY(1); opacity: 1;   }
          }
          @keyframes xfaDrip {
            0%, 10%  { opacity: 0; transform: translateY(-4px); }
            20%, 60% { opacity: 1; transform: translateY(0);    }
            75%, 100%{ opacity: 0; transform: translateY(3px);  }
          }
          @keyframes xfaHgFlip {
            0%   { transform: rotate(0deg);   }
            78%  { transform: rotate(0deg);   }
            90%  { transform: rotate(180deg); }
            100% { transform: rotate(180deg); }
          }
        `}</style>
      </div>

      {/* Pulsing dots (decorative) */}
      <div aria-hidden="true" style={{ display: "flex", gap: "8px" }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: COLOR_BLUE_LT,
              display: "inline-block",
              animation: `xfaDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
        <style>{`
          @keyframes xfaDot {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40%            { transform: scale(1.2); opacity: 1;   }
          }
        `}</style>
      </div>
    </div>
  );
}
