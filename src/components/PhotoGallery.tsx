"use client";

import { useCallback, useEffect, useState } from "react";

export function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);

  const step = useCallback(
    (dir: 1 | -1) =>
      setOpen((i) => (i === null ? i : (i + dir + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, step]);

  if (photos.length === 0) return null;
  const shown = photos.slice(0, 5);

  return (
    <>
      <div className="grid h-72 grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl md:h-96">
        {shown.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpen(i)}
            className={`group relative overflow-hidden bg-sand-deep ${
              i === 0
                ? shown.length === 1
                  ? "col-span-4 row-span-2"
                  : "col-span-2 row-span-2"
                : shown.length === 2
                  ? "col-span-2 row-span-2"
                  : shown.length === 3 || (shown.length === 4 && i === 1)
                    ? "col-span-2"
                    : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${name} photo ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            {i === shown.length - 1 && photos.length > shown.length && (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-lg font-semibold text-foam">
                +{photos.length - shown.length} more
              </span>
            )}
          </button>
        ))}
      </div>
      {photos.length > 1 && (
        <button
          type="button"
          onClick={() => setOpen(0)}
          className="mt-3 text-sm font-semibold text-lagoon-deep hover:underline"
        >
          View all {photos.length} photos →
        </button>
      )}

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-ink/95"
          style={{ animationDuration: "200ms" }}
          onClick={() => setOpen(null)}
        >
          <div className="flex items-center justify-between px-5 py-4 text-foam">
            <span className="text-sm">
              {open + 1} / {photos.length}
            </span>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(null)}
              className="rounded-full bg-foam/10 px-4 py-2 text-sm hover:bg-foam/20"
            >
              Close ✕
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={open}
              src={photos[open]}
              alt={`${name} photo ${open + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="animate-fade-in max-h-full max-w-full rounded-2xl object-contain"
              style={{ animationDuration: "300ms" }}
            />
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-foam/15 text-2xl text-foam hover:bg-foam/30"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-foam/15 text-2xl text-foam hover:bg-foam/30"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
