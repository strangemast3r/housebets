import { useId } from "react";
import { kitFor } from "@/lib/betting/kits";
import type { SportId } from "@/lib/betting/data";
import { cn } from "@/lib/cn";

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M16 3.2 27.2 8v8.4c0 6.6-4.4 11.2-11.2 13.4C9.2 27.6 4.8 23 4.8 16.4V8L16 3.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M11.2 14.2h9.6M16 14.2v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <img
      src="/housebets-logo.png"
      alt="Housebets"
      width={compact ? 111 : 127}
      height={compact ? 28 : 32}
      className={compact ? "h-7 w-auto" : "h-8 w-auto"}
    />
  );
}

export function Crest({ team, size = "md" }: { team: string; size?: "sm" | "md" | "lg" }) {
  const kit = kitFor(team);
  const dim = size === "lg" ? 68 : size === "sm" ? 28 : 40;
  const uid = useId().replace(/:/g, "");
  const fontSize = size === "lg" ? 16 : 13;
  return (
    <svg width={dim} height={dim} viewBox="0 0 64 64" className="shrink-0" aria-hidden>
      {kit.shape === "shield" ? (
        <>
          <path d="M32 4 56 14v18c0 14-10 24-24 28C18 56 8 46 8 32V14L32 4z" fill={kit.bg} />
          <path d="M32 4 56 14v18c0 14-10 24-24 28C18 56 8 46 8 32V14L32 4z" fill="none" stroke={kit.trim} strokeWidth="2" />
        </>
      ) : (
        <>
          <circle cx="32" cy="32" r="26" fill={kit.bg} />
          <circle cx="32" cy="32" r="26" fill="none" stroke={kit.trim} strokeWidth="2" />
        </>
      )}
      <text
        x="32"
        y={kit.shape === "shield" ? 38 : 37}
        textAnchor="middle"
        fontFamily="Barlow Condensed, Arial Narrow, sans-serif"
        fontSize={fontSize}
        fontWeight="700"
        fill={kit.fg}
      >
        {kit.initials}
      </text>
      <title id={uid}>{team}</title>
    </svg>
  );
}

export function Coin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("size-4", className)} aria-hidden>
      <circle cx="10" cy="10" r="8" fill="currentColor" />
      <text x="10" y="13.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--color-cyan-ink)">
        T
      </text>
    </svg>
  );
}

export function SportIcon({ sport, className }: { sport: SportId | "all"; className?: string }) {
  const cls = cn("size-4", className);
  if (sport === "all") {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
      </svg>
    );
  }
  if (sport === "soccer") {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden>
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 8.2 14.6 10l-1 2.8h-3.2L9.4 10 12 8.2z" fill="currentColor" />
        <path d="M12 4.2 14.2 7.2M9.8 7.2 12 4.2M6.2 9.2l3 1.2M14.8 10.4l3-1.2M7.2 16.6 9.4 13.8M14.6 13.8l2.2 2.8M10 18.2h4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (sport === "basketball") {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden>
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 4v16M4 12h16M6.2 6.6c2.2 1.6 3.6 3.4 3.8 5.4-2 .2-3.8 1.6-5.4 3.8M17.8 6.6c-2.2 1.6-3.6 3.4-3.8 5.4 2 .2 3.8 1.6 5.4 3.8" fill="none" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }
  if (sport === "tennis") {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden>
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5.2 8.2c3 1.2 5.4 1.2 8.4 0M6.4 16.4c2.8-1.4 5.2-1.4 8.2 0M8 4.8c1.2 3.2 1.2 6.4 0 9.6M16 6.4c-1.4 2.8-1.4 6-0.2 9" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (sport === "esports") {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden>
        <rect x="3" y="8" width="18" height="9" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 12.5h3M9.5 11v3M16 12h.01M18 14h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (sport === "mma") {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden>
        <path d="M8 14V7.5A2.5 2.5 0 0 1 10.5 5h3A2.5 2.5 0 0 1 16 7.5V9" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 14h10.5a2.5 2.5 0 0 1 0 5H9.5A2.5 2.5 0 0 1 7 16.5V14z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={cls} aria-hidden>
      <path d="M5 16c2-6 5-9 8-9 2 0 3 2 6 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
