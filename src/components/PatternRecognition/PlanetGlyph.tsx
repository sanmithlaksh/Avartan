<<<<<<< HEAD
// Void Paradigm — Round 2 planet tokens.
=======
// Avartan — Round 2 planet tokens.
>>>>>>> 6fd5c2f989062b892081ab3e2c88b05f634bf2bb
//
// Hand-drawn SVG worlds: Mercury is a cratered rock, Earth is a cloud-wrapped
// ocean world, and Jupiter is a banded gas giant with its Great Red Spot and a
// faint ring. They stay readable down to ~28px, so the same glyph works on the
// palette chip and inside a grid cell.
import React, { useId } from 'react';
import { PatternItemId } from '../../engine/patterns';

interface PlanetGlyphProps {
  item: PatternItemId;
  className?: string;
  /** Dims the world for missed / unavailable states. */
  muted?: boolean;
}

const Mercury: React.FC<{ uid: string }> = ({ uid }) => {
  const craters: Array<[number, number, number]> = [
    [23, 21, 4.2],
    [38, 17, 3],
    [44, 29, 4.6],
    [30, 35, 5.4],
    [19, 33, 3],
    [36, 44, 3.4],
    [25, 46, 2.4],
    [46, 39, 2.2],
    [17, 25, 2]
  ];

  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-base`} cx="34%" cy="28%" r="82%">
          <stop offset="0%" stopColor="#efe9dd" />
          <stop offset="38%" stopColor="#c3b9ab" />
          <stop offset="72%" stopColor="#8b8175" />
          <stop offset="100%" stopColor="#4c453e" />
        </radialGradient>
        <radialGradient id={`${uid}-shade`} cx="32%" cy="28%" r="88%">
          <stop offset="52%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.62" />
        </radialGradient>
      </defs>

      <circle cx="32" cy="32" r="26" fill={`url(#${uid}-base)`} />

      <g>
        {craters.map(([cx, cy, r], idx) => (
          <g key={idx}>
            <ellipse
              cx={cx}
              cy={cy}
              rx={r}
              ry={r * 0.86}
              fill="#4f483f"
              opacity="0.45"
            />
            <path
              d={`M${cx - r} ${cy - r * 0.2} A ${r} ${r * 0.86} 0 0 1 ${cx + r * 0.2} ${cy - r * 0.8}`}
              fill="none"
              stroke="#f6efe2"
              strokeOpacity="0.5"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
            <ellipse
              cx={cx + r * 0.15}
              cy={cy + r * 0.2}
              rx={r * 0.55}
              ry={r * 0.42}
              fill="#2f2a24"
              opacity="0.28"
            />
          </g>
        ))}
      </g>

      <circle cx="32" cy="32" r="26" fill={`url(#${uid}-shade)`} />
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="none"
        stroke="#fdf7ea"
        strokeOpacity="0.35"
        strokeWidth="0.9"
      />
    </svg>
  );
};

const Earth: React.FC<{ uid: string }> = ({ uid }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
    <defs>
      <radialGradient id={`${uid}-ocean`} cx="35%" cy="27%" r="80%">
        <stop offset="0%" stopColor="#8ad4f5" />
        <stop offset="32%" stopColor="#3f97d8" />
        <stop offset="68%" stopColor="#1b5f9e" />
        <stop offset="100%" stopColor="#082742" />
      </radialGradient>
      <radialGradient id={`${uid}-night`} cx="34%" cy="30%" r="86%">
        <stop offset="55%" stopColor="#00112b" stopOpacity="0" />
        <stop offset="100%" stopColor="#00112b" stopOpacity="0.72" />
      </radialGradient>
      <clipPath id={`${uid}-sphere`}>
        <circle cx="32" cy="32" r="26" />
      </clipPath>
    </defs>

    <circle cx="32" cy="32" r="26" fill={`url(#${uid}-ocean)`} />

    <g clipPath={`url(#${uid}-sphere)`}>
      {/* Americas — two bold landmasses on the left limb */}
      <path
        d="M13 15 L20 13 L24 19 L22 26 L24 32 L20 41 L17 48 L13 41 L14 32 L11 25 Z"
        fill="#3f9a56"
      />
      <path d="M22 30 L27 34 L26 41 L22 46 L19 38 L21 33 Z" fill="#2e7c44" />
      {/* Africa + Europe — the big central continent */}
      <path
        d="M29 19 L37 17 L40 23 L38 29 L35 33 L37 39 L33 47 L27 44 L25 36 L23 29 L25 23 Z"
        fill="#4aa05c"
      />
      <path d="M28 12 L34 10 L38 13 L35 17 L29 18 Z" fill="#5cb06b" />
      {/* Asia */}
      <path d="M37 13 L49 11 L54 18 L52 26 L44 28 L39 23 L36 18 Z" fill="#468f55" />
      {/* Australia */}
      <path d="M44 38 L52 37 L54 44 L46 47 L43 42 Z" fill="#5aa161" />
      {/* Polar caps */}
      <ellipse cx="32" cy="7" rx="19" ry="5.5" fill="#f2fbff" opacity="0.9" />
      <ellipse cx="32" cy="58" rx="17" ry="5" fill="#eaf7ff" opacity="0.75" />

      {/* Sparse cloud swirls, kept thin so the continents stay readable */}
      <path
        d="M6 25 Q16 21 26 25 T44 24"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.4"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 46 Q30 42 40 46 T57 44"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.32"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M34 14 Q42 11 50 15"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.28"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </g>

    <circle cx="32" cy="32" r="26" fill={`url(#${uid}-night)`} />
    <circle
      cx="32"
      cy="32"
      r="27.5"
      fill="none"
      stroke="#7dd3fc"
      strokeOpacity="0.45"
      strokeWidth="1.6"
    />
    <circle
      cx="32"
      cy="32"
      r="26"
      fill="none"
      stroke="#e0f6ff"
      strokeOpacity="0.4"
      strokeWidth="0.8"
    />
  </svg>
);

const Jupiter: React.FC<{ uid: string }> = ({ uid }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
    <defs>
      <radialGradient id={`${uid}-gas`} cx="36%" cy="28%" r="82%">
        <stop offset="0%" stopColor="#fff3d6" />
        <stop offset="35%" stopColor="#f2d3a0" />
        <stop offset="68%" stopColor="#d09a5e" />
        <stop offset="100%" stopColor="#8a5227" />
      </radialGradient>
      <radialGradient id={`${uid}-spot`} cx="38%" cy="34%" r="72%">
        <stop offset="0%" stopColor="#e98a63" />
        <stop offset="55%" stopColor="#c65a37" />
        <stop offset="100%" stopColor="#8e3320" />
      </radialGradient>
      <radialGradient id={`${uid}-limb`} cx="34%" cy="30%" r="86%">
        <stop offset="55%" stopColor="#2b1403" stopOpacity="0" />
        <stop offset="100%" stopColor="#2b1403" stopOpacity="0.66" />
      </radialGradient>
      <clipPath id={`${uid}-planet`}>
        <circle cx="32" cy="32" r="26" />
      </clipPath>
    </defs>

    {/* Faint ring behind the planet */}
    <ellipse
      cx="32"
      cy="32"
      rx="31"
      ry="6.4"
      fill="none"
      stroke="#e6d3ae"
      strokeOpacity="0.5"
      strokeWidth="1.5"
      transform="rotate(-17 32 32)"
    />

    <circle cx="32" cy="32" r="26" fill={`url(#${uid}-gas)`} />

    <g clipPath={`url(#${uid}-planet)`}>
      {/* Banded cloud decks */}
      <path
        d="M4 14 Q16 10 26 14 T46 13 T60 15 L60 21 Q46 25 34 21 T8 22 Z"
        fill="#b9763d"
        opacity="0.55"
      />
      <path
        d="M4 22 Q16 18 28 22 T48 21 T60 23 L60 27 Q48 31 36 27 T6 28 Z"
        fill="#f7e3bd"
        opacity="0.7"
      />
      <path
        d="M5 29 Q17 25 29 30 T49 28 T60 31 L60 36 Q47 40 35 36 T7 36 Z"
        fill="#c4854d"
        opacity="0.6"
      />
      <path
        d="M6 38 Q18 34 30 38 T50 37 T60 39 L60 43 Q47 47 35 43 T8 44 Z"
        fill="#efd3a6"
        opacity="0.55"
      />
      <path
        d="M10 47 Q22 43 34 47 T58 46 L58 52 Q44 56 32 52 T12 53 Z"
        fill="#a76434"
        opacity="0.45"
      />

      {/* Great Red Spot */}
      <g transform="rotate(-12 41 41)">
        <ellipse cx="41" cy="41" rx="9" ry="5.4" fill={`url(#${uid}-spot)`} />
        <ellipse
          cx="41.5"
          cy="41"
          rx="5.4"
          ry="3"
          fill="none"
          stroke="#f6c8a6"
          strokeOpacity="0.55"
          strokeWidth="0.9"
        />
      </g>

      {/* Storm swirls */}
      <path
        d="M10 33 Q18 31 24 33.5"
        fill="none"
        stroke="#fff4de"
        strokeOpacity="0.45"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M30 12 Q38 10.5 46 13"
        fill="none"
        stroke="#8a4f22"
        strokeOpacity="0.35"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <ellipse cx="20" cy="44" rx="4" ry="2.2" fill="#f6dfb8" opacity="0.45" />
    </g>

    <circle cx="32" cy="32" r="26" fill={`url(#${uid}-limb)`} />
    <circle
      cx="32"
      cy="32"
      r="26"
      fill="none"
      stroke="#fff2d4"
      strokeOpacity="0.4"
      strokeWidth="0.9"
    />

    {/* Front half of the ring sweeping across the lower limb */}
    <path
      d="M3 40 Q32 48 61 30"
      fill="none"
      stroke="#f4e5c6"
      strokeOpacity="0.55"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const Star: React.FC<{ uid: string }> = ({ uid }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
    <defs>
      <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="38%" stopColor="#a5e7ff" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="22" fill={`url(#${uid}-glow)`} />
    <path
      d="M32 8 L35.2 28.8 L56 32 L35.2 35.2 L32 56 L28.8 35.2 L8 32 L28.8 28.8 Z"
      fill="#f8feff"
      opacity="0.95"
    />
    <circle cx="32" cy="32" r="3.6" fill="#ffffff" />
  </svg>
);

export const PlanetGlyph: React.FC<PlanetGlyphProps> = ({ item, className = '', muted = false }) => {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');

  const body =
    item === 'mercury' ? (
      <Mercury uid={uid} />
    ) : item === 'earth' ? (
      <Earth uid={uid} />
    ) : item === 'jupiter' ? (
      <Jupiter uid={uid} />
    ) : (
      <Star uid={uid} />
    );

  return (
    <span
      className={`inline-flex items-center justify-center ${muted ? 'opacity-45 saturate-50' : ''} ${className}`}
    >
      {body}
    </span>
  );
};

export default PlanetGlyph;
