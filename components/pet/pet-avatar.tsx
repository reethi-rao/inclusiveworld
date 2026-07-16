import type { PetSpecies } from "@/lib/pet";

/**
 * The buddy creature, drawn from scratch as SVG (no external art / IP).
 *
 * One friendly body; the `species` swaps the ears/head feature and the `level`
 * (1–5) grows it and adds cosmetic milestones — rosy cheeks, a sparkle, a
 * scarf, a crown. Bigger level = visibly more special, so growth reads at a
 * glance.
 */
export function PetAvatar({
  species,
  color,
  level,
  size = 160,
}: {
  species: PetSpecies;
  color: string;
  level: number; // 1..5
  size?: number;
}) {
  // Darker shade for outlines/feet, lighter for belly — derived from the body
  // color so any palette choice stays coherent.
  const dark = shade(color, -0.28);
  const light = shade(color, 0.34);
  const cheek = "#ff9db0";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`Your ${species}, level ${level}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Level 5 sparkles behind the creature */}
      {level >= 5 && (
        <g fill="#ffd569">
          <Sparkle x={34} y={44} r={7} />
          <Sparkle x={166} y={54} r={6} />
          <Sparkle x={158} y={150} r={5} />
        </g>
      )}

      {/* Ears / head feature by species (behind the head) */}
      <Ears species={species} color={color} dark={dark} />

      {/* Body */}
      <ellipse cx="100" cy="150" rx="34" ry="20" fill={dark} opacity="0.18" />
      <circle cx="100" cy="108" r="52" fill={color} />
      {/* Belly */}
      <ellipse cx="100" cy="122" rx="30" ry="34" fill={light} />

      {/* Feet */}
      <ellipse cx="80" cy="156" rx="12" ry="8" fill={dark} />
      <ellipse cx="120" cy="156" rx="12" ry="8" fill={dark} />

      {/* Cheeks appear from level 2 */}
      {level >= 2 && (
        <>
          <circle cx="72" cy="112" r="8" fill={cheek} opacity="0.75" />
          <circle cx="128" cy="112" r="8" fill={cheek} opacity="0.75" />
        </>
      )}

      {/* Eyes */}
      <g fill="#2b2f38">
        <circle cx="84" cy="100" r="8" />
        <circle cx="116" cy="100" r="8" />
      </g>
      <g fill="#ffffff">
        <circle cx="86.5" cy="97.5" r="2.6" />
        <circle cx="118.5" cy="97.5" r="2.6" />
      </g>

      {/* Smile */}
      <path
        d="M88 116 q12 11 24 0"
        fill="none"
        stroke="#2b2f38"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Level 3: a little sparkle on the belly */}
      {level >= 3 && level < 5 && (
        <g fill="#fff2b8">
          <Sparkle x={100} y={134} r={5} />
        </g>
      )}

      {/* Level 4: a cozy scarf */}
      {level >= 4 && (
        <g>
          <path d="M70 132 q30 14 60 0 l0 8 q-30 14 -60 0 z" fill="#e2557a" />
          <path d="M118 138 l10 22 l-9 -3 l-6 3 z" fill="#c33f63" />
        </g>
      )}

      {/* Level 5: a crown */}
      {level >= 5 && (
        <path
          d="M78 62 l6 12 l16 -14 l16 14 l6 -12 l-4 20 l-36 0 z"
          fill="#ffd569"
          stroke="#e9b93f"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function Ears({
  species,
  color,
  dark,
}: {
  species: PetSpecies;
  color: string;
  dark: string;
}) {
  switch (species) {
    case "cat":
      return (
        <g fill={color}>
          <path d="M64 74 L58 40 L86 62 Z" />
          <path d="M136 74 L142 40 L114 62 Z" />
          <path d="M67 66 L64 48 L78 60 Z" fill={dark} opacity="0.5" />
          <path d="M133 66 L136 48 L122 60 Z" fill={dark} opacity="0.5" />
        </g>
      );
    case "bear":
      return (
        <g>
          <circle cx="66" cy="64" r="16" fill={color} />
          <circle cx="134" cy="64" r="16" fill={color} />
          <circle cx="66" cy="64" r="8" fill={dark} opacity="0.45" />
          <circle cx="134" cy="64" r="8" fill={dark} opacity="0.45" />
        </g>
      );
    case "bunny":
      return (
        <g fill={color}>
          <ellipse cx="80" cy="46" rx="10" ry="30" />
          <ellipse cx="120" cy="46" rx="10" ry="30" />
          <ellipse cx="80" cy="48" rx="5" ry="20" fill="#ffd5dd" />
          <ellipse cx="120" cy="48" rx="5" ry="20" fill="#ffd5dd" />
        </g>
      );
    case "dino":
      return (
        <g fill={dark}>
          <path d="M100 46 l7 16 l-14 0 z" />
          <path d="M84 52 l6 12 l-12 0 z" />
          <path d="M116 52 l6 12 l-12 0 z" />
        </g>
      );
    default:
      return null;
  }
}

function Sparkle({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <path
      d={`M${x} ${y - r} l${r * 0.35} ${r * 0.65} l${r * 0.65} ${r * 0.35} l${-r * 0.65} ${r * 0.35} l${-r * 0.35} ${r * 0.65} l${-r * 0.35} ${-r * 0.65} l${-r * 0.65} ${-r * 0.35} l${r * 0.65} ${-r * 0.35} z`}
    />
  );
}

/** Lighten (t>0) or darken (t<0) a #rrggbb hex color by fraction t. */
function shade(hex: string, t: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const chan = (h: string) => {
    const v = parseInt(h, 16);
    const next = t < 0 ? v * (1 + t) : v + (255 - v) * t;
    return Math.max(0, Math.min(255, Math.round(next)));
  };
  const to2 = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to2(chan(m[1]))}${to2(chan(m[2]))}${to2(chan(m[3]))}`;
}
