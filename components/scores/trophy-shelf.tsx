import type { ScoreTrophy } from "@/lib/queries";

/** A row of milestone trophy chips (streaks, most improved, perfect scores). Renders nothing once there's nothing to show yet. */
export function TrophyShelf({ trophies }: { trophies: ScoreTrophy[] }) {
  if (trophies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {trophies.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm"
          role="img"
          aria-label={`${t.label}: ${t.description}`}
          title={t.description}
        >
          <span aria-hidden>{t.icon}</span>
          {t.label}
        </span>
      ))}
    </div>
  );
}
