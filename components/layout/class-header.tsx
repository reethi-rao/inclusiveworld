export function ClassHeader({
  emoji,
  color,
  name,
  subtitle,
}: {
  emoji: string;
  color: string;
  name: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-sm"
        style={{ backgroundColor: color }}
      >
        {emoji}
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
        {subtitle && <p className="text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}
