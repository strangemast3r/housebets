import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Check, ChevronDown, Lock, Star } from "lucide-react";
import { Crest, SportIcon } from "@/components/brand";
import { useTickingClock } from "@/components/clock";
import type { Market, Match, Selection } from "@/lib/betting/data";
import { oddsText } from "@/lib/betting/format";
import { useBook } from "@/lib/betting/store";
import { cn } from "@/lib/cn";

function useFlash(value: string) {
  const [flash, setFlash] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setFlash(true);
    const id = window.setTimeout(() => setFlash(false), 700);
    return () => window.clearTimeout(id);
  }, [value]);
  return flash;
}

export function useScore(match: Match | undefined): [number, number] | null {
  const add = useBook((state) => (match ? state.scoreAdd[match.id] : undefined));
  if (!match?.score) return null;
  return add ? [match.score[0] + add[0], match.score[1] + add[1]] : match.score;
}

function StripChip({ match }: { match: Match }) {
  const clock = useTickingClock(match.clock);
  const score = useScore(match);
  const short = (name: string) => name.slice(0, 3).toUpperCase();
  return (
    <Link
      to="/match/$matchId"
      params={{ matchId: match.id }}
      className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-navy-900 px-3 py-1.5 text-xs"
    >
      <span className="size-1.5 rounded-full bg-live" aria-hidden />
      <span className="font-semibold tabular-nums">
        {short(match.home)} {score ? `${score[0]}-${score[1]}` : "v"} {short(match.away)}
      </span>
      <span className="text-muted tabular-nums">{clock?.text ?? match.scoreNote ?? "Live"}</span>
    </Link>
  );
}

export function LiveStrip({ matches }: { matches: Match[] }) {
  if (matches.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Live scores">
      {matches.map((match) => (
        <StripChip key={match.id} match={match} />
      ))}
    </div>
  );
}

export function OddsButton({
  match,
  market,
  selection,
  variant = "tile",
  code,
}: {
  match: Match;
  market: Market;
  selection: Selection;
  variant?: "tile" | "row" | "inline" | "mini";
  code?: string;
}) {
  const quote = useBook((state) => state.quotes[selection.id]);
  const selected = useBook((state) => state.slip.some((item) => item.selectionId === selection.id));
  const toggle = useBook((state) => state.toggle);
  const odds = quote?.odds ?? selection.odds;
  const suspended = quote?.suspended ?? Boolean(selection.suspended);
  const dir = quote?.dir ?? null;
  const flash = useFlash(oddsText(odds));
  const label = code ?? selection.label;

  function add(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (suspended) return;
    toggle({
      selectionId: selection.id,
      matchId: match.id,
      marketName: market.name,
      competition: match.sport === "tennis" ? "Tennis" : match.competition,
      matchLabel: `${match.homeShort} vs ${match.awayShort}`,
      selectionLabel: selection.label,
    });
  }

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={add}
        disabled={suspended}
        aria-pressed={selected}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-3 border-t border-line px-1 py-2 text-left",
          selected && "rounded-md bg-cyan-dim px-2 text-cyan",
          suspended && "cursor-not-allowed opacity-70",
        )}
      >
        <span className="text-sm text-ink">{selection.label}</span>
        <span className={cn("inline-flex items-center gap-1 font-display text-lg font-semibold tabular-nums", flash && "odds-flash rounded-md px-1", suspended ? "text-muted" : "text-cyan")}>
          {dir === "up" && <ArrowUp className="size-3.5 text-up" aria-label="Price up" />}
          {dir === "down" && <ArrowDown className="size-3.5 text-down" aria-label="Price down" />}
          {suspended ? <Lock className="size-3.5" /> : oddsText(odds)}
        </span>
      </button>
    );
  }

  const stacked = variant === "tile" || variant === "mini";

  return (
    <button
      type="button"
      onClick={add}
      disabled={suspended}
      aria-pressed={selected}
      className={cn(
        "relative flex justify-center rounded-lg border transition-colors duration-200",
        variant === "mini" ? "min-h-10 items-start px-2.5 py-1.5" : "min-h-11 items-center px-2 py-2",
        stacked ? "flex-col gap-0" : "justify-between gap-2",
        selected ? "border-sel-line bg-sel text-white" : "border-line bg-navy-800 text-ink hover:border-cyan",
        suspended && "cursor-not-allowed border-line bg-navy-900 text-muted hover:border-line",
        flash && !suspended && "odds-flash",
      )}
    >
      {selected && !suspended ? <Check className="absolute top-1 right-1 size-3.5" aria-hidden /> : null}
      <span className={cn("max-w-full truncate text-xs leading-4", selected ? "text-white/80" : "text-muted")}>{label}</span>
      {suspended ? (
        <span className="inline-flex items-center gap-1 font-display text-lg text-muted">
          {variant !== "mini" && <span className="tabular-nums">{oddsText(odds)}</span>}
          <Lock className="size-3.5" />
        </span>
      ) : (
        <span className={cn("font-display font-semibold tabular-nums", variant === "mini" ? "text-[15px] leading-5" : "text-lg", selected ? "text-white" : "text-cyan")}>{oddsText(odds)}</span>
      )}
    </button>
  );
}

export function MarketCard({ match, market }: { match: Match; market: Market }) {
  const quotes = useBook((state) => state.quotes);
  const suspended = market.selections.some((selection) => quotes[selection.id]?.suspended || selection.suspended);
  const rows = market.selections.length > 3 || /total|line|corner|card|points|method|maps|spread/i.test(market.name);
  const wideTiles = market.selections.length <= 3 && !rows;
  const [open, setOpen] = useState(true);

  return (
    <section className="rounded-xl border border-line bg-navy-900 p-3">
      <header className={cn("flex items-center justify-between gap-3", open && "mb-2")}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-h-9 flex-1 items-center justify-between gap-3 text-left"
        >
          <h3 className="text-base font-semibold text-ink">{market.name}</h3>
          <span className="inline-flex items-center gap-2">
            {suspended && (
              <span className="inline-flex items-center gap-1 text-xs text-gold">
                <Lock className="size-3.5" />
                Suspended
              </span>
            )}
            <ChevronDown className={cn("size-5 text-muted transition-transform", open && "rotate-180")} aria-hidden />
          </span>
        </button>
      </header>
      {!open ? null : wideTiles ? (
        <div className={cn("grid gap-2", market.selections.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
          {market.selections.map((selection) => (
            <OddsButton key={selection.id} match={match} market={market} selection={selection} variant="tile" />
          ))}
        </div>
      ) : (
        <div>
          {market.selections.map((selection) => (
            <OddsButton key={selection.id} match={match} market={market} selection={selection} variant="row" />
          ))}
        </div>
      )}
      {open && market.note && <p className="mt-2 text-xs text-faint">{market.note}</p>}
    </section>
  );
}

export function LiveCard({ match }: { match: Match }) {
  const clock = useTickingClock(match.clock);
  const score = useScore(match);
  const main = match.markets.find((item) => item.group === "popular") ?? match.markets[0];
  if (!main) return null;
  const three = main.selections.length === 3;
  const codes = three ? [match.homeShort, "Draw", match.awayShort] : main.selections.map((selection) => selection.label);
  const home = score ? String(score[0]) : null;
  const away = score ? String(score[1]) : null;

  return (
    <article className="rounded-xl border border-line bg-navy-900 p-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded bg-live px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-ink">LIVE</span>
          <span className="inline-flex shrink-0 items-center gap-1 font-medium text-ink tabular-nums">
            <span className="size-1.5 rounded-full bg-cyan" />
            {clock?.text ?? match.scoreNote ?? "Live"}
          </span>
          <span className="truncate text-muted">{match.competition}</span>
        </div>
        <SportIcon sport={match.sport} className="shrink-0 text-cyan" />
      </div>
      <Link to="/match/$matchId" params={{ matchId: match.id }} className="mt-3 block space-y-2">
        <span className="flex items-center gap-2">
          <Crest team={match.home} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{match.homeShort}</span>
          {home !== null ? (
            <span className="grid min-w-7 place-items-center rounded-md bg-navy-950 px-1.5 py-0.5 text-sm font-semibold tabular-nums">{home}</span>
          ) : null}
        </span>
        <span className="flex items-center gap-2">
          <Crest team={match.away} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{match.awayShort}</span>
          {away !== null ? (
            <span className="grid min-w-7 place-items-center rounded-md bg-navy-950 px-1.5 py-0.5 text-sm font-semibold tabular-nums">{away}</span>
          ) : null}
        </span>
        {score === null ? (
          <span className="block text-xs text-muted">{match.scoreNote ?? "vs"}</span>
        ) : null}
      </Link>
      <div className={cn("mt-3 grid gap-2", main.selections.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
        {main.selections.map((selection, index) => (
          <OddsButton
            key={selection.id}
            match={match}
            market={main}
            selection={selection}
            variant="mini"
            code={codes[index]}
          />
        ))}
      </div>
    </article>
  );
}

export function FixtureRow({ match }: { match: Match }) {
  const clock = useTickingClock(match.clock);
  const score = useScore(match);
  const main = match.markets.find((item) => item.group === "popular") ?? match.markets[0];
  if (!main) return null;
  const three = main.selections.length >= 3;
  const picks = three ? main.selections.slice(0, 3) : main.selections.slice(0, 2);
  const first = picks[0];
  const second = picks[1];
  const third = picks[2];
  if (!first) return null;
  const codes = three ? [match.homeShort, "Draw", match.awayShort] : picks.map((pick) => pick.label);

  return (
    <article className="rounded-xl border border-line bg-navy-900 p-3">
      <p className="truncate text-xs text-muted">{match.competition}</p>
      <div className="mt-1 flex items-center gap-1">
        <FollowTeam name={match.home} />
        <Link to="/match/$matchId" params={{ matchId: match.id }} className="flex min-w-0 flex-1 items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-semibold">{match.homeShort}</span>
          <span className="text-xs text-faint">{match.status === "live" && score ? `${score[0]}-${score[1]}` : "vs"}</span>
          <span className="min-w-0 flex-1 truncate text-right font-semibold">{match.awayShort}</span>
        </Link>
        <FollowTeam name={match.away} />
      </div>
      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
        {match.status === "live" ? (
          <>
            <span className="rounded bg-live px-1.5 py-0.5 font-bold text-ink">LIVE</span>
            <span className="tabular-nums">{clock?.text}</span>
          </>
        ) : (
          match.startLabel
        )}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <OddsButton match={match} market={main} selection={first} variant="mini" code={codes[0]} />
        {picks.length === 2 ? (
          <span className="grid min-h-11 place-items-center rounded-lg border border-line bg-navy-800 text-faint">—</span>
        ) : (
          second && <OddsButton match={match} market={main} selection={second} variant="mini" code={codes[1]} />
        )}
        {picks.length === 2
          ? second && <OddsButton match={match} market={main} selection={second} variant="mini" code="2" />
          : third && <OddsButton match={match} market={main} selection={third} variant="mini" code={codes[2]} />}
      </div>
    </article>
  );
}

export function FollowTeam({ name }: { name: string }) {
  const on = useBook((state) => state.followedTeams.includes(name));
  const toggle = useBook((state) => state.toggleFollowTeam);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Unfollow ${name}` : `Follow ${name}`}
      onClick={() => toggle(name)}
      className="grid size-11 shrink-0 place-items-center rounded-lg"
    >
      <Star className={cn("size-4", on ? "fill-cyan text-cyan" : "text-muted")} />
    </button>
  );
}

export function SoonRow({ match }: { match: Match }) {
  return (
    <Link
      to="/match/$matchId"
      params={{ matchId: match.id }}
      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-line px-1 py-3 first:border-t-0"
    >
      <SportIcon sport={match.sport} className="text-muted" />
      <span className="min-w-0">
        <span className="block text-xs text-muted">{match.competition}</span>
        <span className="block truncate text-sm font-medium">
          {match.homeShort} <span className="text-faint">vs</span> {match.awayShort}
        </span>
      </span>
      <span className="text-right">
        <span className="block text-sm font-medium tabular-nums">{match.startLabel.split(",")[1]?.trim() || match.startLabel}</span>
        {match.countdown && <span className="block text-xs text-cyan">{match.countdown}</span>}
      </span>
    </Link>
  );
}
