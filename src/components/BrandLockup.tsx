import Link from "next/link";

type Tone = "light" | "dark" | "foam";

const tones: Record<Tone, { company: string; product: string }> = {
  light: { company: "text-ink-soft", product: "text-lagoon-deep" },
  dark: { company: "text-ink-soft/80", product: "text-ink" },
  foam: { company: "text-foam/70", product: "text-foam" },
};

/** Meckvy (company) on top, DirectStay (product) underneath — used in headers. */
export function BrandLockup({
  href = "/",
  tone = "dark",
  size = "md",
}: {
  href?: string;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
}) {
  const t = tones[tone];
  const companySize = size === "lg" ? "text-sm" : size === "sm" ? "text-[10px]" : "text-xs";
  const productSize =
    size === "lg" ? "text-2xl md:text-3xl" : size === "sm" ? "text-base" : "text-xl";

  return (
    <Link href={href} className="group inline-flex flex-col leading-none">
      <span
        className={`${companySize} font-semibold uppercase tracking-[0.18em] ${t.company}`}
      >
        Meckvy
      </span>
      <span
        className={`mt-0.5 font-[family-name:var(--font-display)] font-semibold tracking-tight ${productSize} ${t.product} group-hover:opacity-90`}
      >
        DirectStay
      </span>
    </Link>
  );
}
