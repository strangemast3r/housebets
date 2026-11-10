import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Search, Star, X } from "lucide-react";
import { Crest } from "@/components/brand";
import { useTickingClock } from "@/components/clock";
import { FollowTeam, MarketCard, useScore } from "@/components/odds";
import { ScrollTail } from "@/components/shell";
import { getMatch, tabsFor, type MarketGroup } from "@/lib/betting/data";
import { useBook } from "@/lib/betting/store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/match/$matchId")({
  head: ({ params }) => {
    const found = getMatch(params.matchId);
    return {
      meta: [
        { title: found ? `${found.home} v ${found.away} - Housebets` : "Housebets — Match" },
        {
          name: "description",
          content: found
            ? `${found.home} v ${found.away} odds in ${found.competition}: ${found.markets.length} markets.`
            : "Match odds on Housebets.",
        },
      ],
    };
  },
  component: MatchPage,
});

function MatchPage() {
  const { matchId } = Route.useParams();
  const match = getMatch(matchId);
  if (!match) return <Missing />;
  return <MatchBoard key={match.id} />;
}

function Missing() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Match not on the board</h1>
      <Link to="/" className="mt-3 inline-flex text-cyan">
        Back to sports
      </Link>
    </main>
  );
}

function MatchBoard() {
  const { matchId } = Route.useParams();
  const match = getMatch(matchId);
  const [tab, setTab] = useState<MarketGroup>("popular");
  const [query, setQuery] = useState("");
  const clock = useTickingClock(match?.clock ?? null);
  const score = useScore(match);
  const goal = useBook((state) => state.goal);
  const isLive = match?.status === "live";

  useEffect(() => {
    if (!isLive) return;
    const first = window.setTimeout(() => goal(matchId), 25000);
    const every = window.setInterval(() => goal(matchId), 70000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, [isLive, matchId, goal]);

  if (!match) return <Missing />;
  const tabs = tabsFor(match.sport).filter((item) => match.markets.some((market) => market.group === item.id));
  const needle = query.trim().toLowerCase();
  const searching = needle.length >= 2;
  const markets = searching
    ? match.markets.filter(
        (market) =>
          market.name.toLowerCase().includes(needle) ||
          market.selections.some((selection) => selection.label.toLowerCase().includes(needle)),
      )
    : match.markets.filter((market) => market.group === tab);
  const soccer = match.sport === "soccer";

  return (
    <main>
      <div className="border-b border-line px-3 py-3 lg:px-6">
        <p className="flex flex-wrap items-center gap-1 text-xs text-muted">
          {soccer ? (
            <Link to="/football" search={{ league: "all", when: "all" }} className="hover:text-cyan">
              Football
            </Link>
          ) : (
            <Link to="/" className="hover:text-cyan">
              Sports
            </Link>
          )}
          <ChevronRight className="size-3.5" />
          {soccer ? (
            <Link to="/football" search={{ league: match.leagueId, when: "all" }} className="truncate hover:text-cyan">
              {match.competition}
            </Link>
          ) : (
            <span className="truncate">{match.competition}</span>
          )}
          <ChevronRight className="size-3.5" />
          <span className="truncate text-ink">
            {match.homeShort} vs {match.awayShort}
          </span>
        </p>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 lg:gap-6">
          <div className="flex min-w-0 items-center gap-2">
            <FollowTeam name={match.home} />
            <Crest team={match.home} size="lg" />
            <h1 className="min-w-0 truncate text-lg font-semibold lg:text-2xl">{match.homeShort}</h1>
          </div>
          <div className="rounded-2xl border border-line bg-navy-900 px-3 py-3 text-center lg:px-6">
            {match.status === "live" ? (
              <p className="inline-flex items-center gap-1 text-xs font-semibold tracking-wide text-cyan">
                <span className="size-2 rounded-full bg-cyan" />
                LIVE
              </p>
            ) : (
              <p className="text-xs font-semibold tracking-wide text-muted">UPCOMING</p>
            )}
            <p key={score ? `${score[0]}-${score[1]}` : "none"} className="score-pop font-display text-3xl font-semibold tabular-nums lg:text-4xl">
              {score ? `${score[0]} - ${score[1]}` : match.scoreNote ?? "vs"}
            </p>
            <p className="text-sm text-muted">
              {match.status === "live" ? (
                <>
                  {clock?.period ? `${clock.period} · ` : ""}
                  <span className="tabular-nums">{clock?.text}</span>
                </>
              ) : (
                match.startLabel
              )}
            </p>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2">
            <h2 className="min-w-0 truncate text-right text-lg font-semibold lg:text-2xl">{match.awayShort}</h2>
            <Crest team={match.away} size="lg" />
            <FollowTeam name={match.away} />
          </div>
        </div>
      </div>

      <div className="px-3 py-3 lg:px-6">
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-line bg-navy-900 px-3">
          <Search className="size-4 shrink-0 text-muted" aria-hidden />
          <label htmlFor="market-search" className="sr-only">
            Search markets or players
          </label>
          <input
            id="market-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search markets or players"
            autoComplete="off"
            className="min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-faint"
          />
          {query ? (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="grid size-10 shrink-0 place-items-center text-muted">
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setQuery("");
              }}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-semibold",
                !searching && tab === item.id ? "border-cyan/40 bg-tab text-ink" : "border-line bg-navy-900 text-ink",
              )}
            >
              {item.id === "popular" && <Star className="size-4" />}
              {item.label}
              <span className={cn("text-xs font-medium tabular-nums", !searching && tab === item.id ? "text-cyan" : "text-muted")}>
                {match.markets.filter((market) => market.group === item.id).length}
              </span>
            </button>
          ))}
        </div>
        {searching && (
          <p className="mb-2 text-sm text-muted">
            {markets.length} market{markets.length === 1 ? "" : "s"} for “{query.trim()}”
          </p>
        )}
        <div className="grid gap-3 lg:grid-cols-2">
          {markets.map((market) => (
            <MarketCard key={market.id} match={match} market={market} />
          ))}
        </div>
        <p className="mt-3 text-right text-xs text-faint">All markets · 90 min</p>
      </div>
      <ScrollTail />
    </main>
  );
}
