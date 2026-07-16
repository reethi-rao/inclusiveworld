"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Type } from "lucide-react";
import {
  TEXT_SCALES,
  LINE_SPACINGS,
  READING_FONTS,
  type DisplayPrefs,
  type DisplayPrefKey,
} from "@/lib/preferences";
import { setDisplayPreference } from "@/lib/actions/preferences";
import { cn } from "@/lib/utils";

/**
 * Reading & display controls: text size, line spacing, and an easy-read font.
 *
 * Every change is applied optimistically by stamping the matching data-*
 * attribute onto <html> right away, then saved. If a save fails we put the old
 * value back. Available to every signed-in user.
 */
export function ReadingSettings({ prefs: initial }: { prefs: DisplayPrefs }) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(initial);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setPrefs(initial), [initial]);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const DATA_ATTR: Record<DisplayPrefKey, string> = {
    textScale: "textScale", // -> data-text-scale via dataset camelCase
    lineSpacing: "lineSpacing",
    readingFont: "readingFont",
  };

  function apply(key: DisplayPrefKey, value: string) {
    const previous = prefs[key];
    setPrefs((p) => ({ ...p, [key]: value }));
    document.documentElement.dataset[DATA_ATTR[key]] = value;

    startTransition(async () => {
      const res = await setDisplayPreference(key, value);
      if (!res.ok) {
        setPrefs((p) => ({ ...p, [key]: previous }));
        document.documentElement.dataset[DATA_ATTR[key]] = previous;
      }
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Reading and text settings"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-brand-600"
      >
        <Type className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="font-bold text-gray-900">Reading settings</p>
            <p className="text-xs text-gray-500">Make the words comfy to read.</p>
          </div>

          <div className="space-y-4 p-4">
            <Segmented
              label="Text size"
              options={TEXT_SCALES}
              value={prefs.textScale}
              onSelect={(v) => apply("textScale", v)}
            />
            <Segmented
              label="Line spacing"
              options={LINE_SPACINGS}
              value={prefs.lineSpacing}
              onSelect={(v) => apply("lineSpacing", v)}
            />
            <Segmented
              label="Font"
              options={READING_FONTS}
              value={prefs.readingFont}
              onSelect={(v) => apply("readingFont", v)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onSelect: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-gray-700">{label}</p>
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onSelect(o.id)}
            aria-pressed={value === o.id}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
              value === o.id
                ? "bg-white text-brand-700 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
