import { useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Clock, Radio, RefreshCw, Search, Trophy, X } from "lucide-react";
import { SportIcon } from "@/components/brand";
import { FixtureRow, LiveCard, LiveStrip, SoonRow } from "@/components/odds";
import { ScrollTail, SportChips } from "@/components/shell";
import { LEAGUES, MATCHES, byKickoff, searchBoard, type SearchKind, type SportId } from "@/lib/betting/data";
import { useBook } from "@/lib/betting/store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Housebets — Sports" }] }),
  component: HomePage,
});

const CARD_TONE: Record<string, string> = {
  "premier-league": "border-l-league-pl",
  "champions-league": "border-l-league-ucl",
  laliga: "border-l-league-liga",
};

const SEARCH_ORDER: SearchKind[] = ["Team", "Player", "Competition", "Market"];

function HomePage() {
  const sport = useBook((state) => state.boardSport);
  const setSport = useBook((state) => state.setBoardSport);
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");
  const refreshIn = useBook((state) => state.refreshIn);
  const needle = query.trim();
  const searching = needle.length >= 2;
  const hits = useMemo(
    () => (searching ? searchBoard(needle).filter((hit) => sport === "all" || hit.sport === sport) : []),
    [needle, searching, sport],
  );
  const homeLive = MATCHES.filter((match) => match.homeSlot && (sport === "all" || match.sport === sport));
  const soon = MATCHES.filter((match) => match.soonSlot && (sport === "all" || match.sport === sport)).sort(byKickoff);
  const list = MATCHES.filter((match) => sport === "all" || match.sport === sport);
  const visible = showAll ? list : list.slice(0, 4);

  return (
    <main>
      <div className="px-3 pt-3 lg:px-5 lg:pt-5">
        <BoardSearch value={query} onChange={setQuery} />
        <div className="mt-3">
          <LiveStrip matches={MATCHES.filter((match) => match.status === "live")} />
        </div>
      </div>

      {searching ? (
        <div className="space-y-4 p-3 lg:p-5">
          <SportChips value={sport} onChange={(id) => setSport(id as SportId | "all")} />
          {hits.length === 0 ? (
            <div className="rounded-xl border border-line bg-navy-900 p-6">
              <h2 className="text-lg font-semibold">No results</h2>
              <p className="mt-1 text-sm text-muted">Nothing matches “{needle}”. Try a team, player, competition, or market.</p>
            </div>
          ) : (
            SEARCH_ORDER.map((kind) => {
              const group = hits.filter((hit) => hit.kind === kind);
              if (group.length === 0) return null;
              return (
                <section key={kind}>
                  <h2 className="mb-2 text-xs font-semibold tracking-widest text-muted">{kind.toUpperCase()}S</h2>
                  <div className="space-y-2">
                    {group.map((hit) =>
                      hit.kind === "Competition" ? (
                        <Link
                          key={hit.id}
                          to="/football"
                          search={{ league: hit.leagueId, when: "all" }}
                          className="block rounded-xl border border-line bg-navy-900 p-3"
                        >
                          <p className="text-xs text-cyan">{hit.kind}</p>
                          <p className="mt-1 truncate font-semibold">{hit.title}</p>
                          <p className="mt-1 truncate text-xs text-muted">{hit.subtitle}</p>
                        </Link>
                      ) : (
                        <Link
                          key={hit.id}
                          to="/match/$matchId"
                          params={{ matchId: hit.matchId }}
                          className="block rounded-xl border border-line bg-navy-900 p-3"
                        >
                          <p className="text-xs text-cyan">{hit.kind}</p>
                          <p className="mt-1 truncate font-semibold">{hit.title}</p>
                          <p className="mt-1 truncate text-xs text-muted">{hit.subtitle}</p>
                        </Link>
                      ),
                    )}
                  </div>
                </section>
              );
            })
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-6 px-3 pb-3 lg:mt-6 lg:px-5 lg:pb-5">
          <div className="flex items-center justify-between gap-2">
            <h1 className="inline-flex items-center gap-2 text-lg font-semibold lg:text-xl">
              <Radio className="size-4 text-live" />
              Live now
            </h1>
            <p className="inline-flex items-center gap-2 text-xs text-muted lg:text-sm">
              <span className="size-2 rounded-full bg-cyan" />
              <span className="lg:hidden">{refreshIn}s</span>
              <span className="hidden lg:inline">Auto refresh in {refreshIn}s</span>
              <RefreshCw className="hidden size-4 lg:block" />
            </p>
          </div>
          {homeLive.length === 0 ? (
            <p className="rounded-xl border border-line bg-navy-900 p-4 text-sm text-muted lg:p-6">No live events on the board.</p>
          ) : (
            <div className="grid gap-3 xl:grid-cols-3">
              {homeLive.map((match) => (
                <LiveCard key={match.id} match={match} />
              ))}
            </div>
          )}

          <section className="rounded-xl border border-line bg-navy-900 p-3 lg:p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="inline-flex items-center gap-2 font-semibold">
                <Clock className="size-4 text-muted" /> Starting soon
              </h2>
              <Link to="/football" search={{ league: "all", when: "upcoming" }} className="text-sm text-cyan">
                View all
              </Link>
            </div>
            {soon.length === 0 ? (
              <p className="text-sm text-muted">Nothing starting soon in this sport.</p>
            ) : (
              soon.map((match) => <SoonRow key={match.id} match={match} />)
            )}
          </section>

          <section>
            <h2 className="mb-3 inline-flex items-center gap-2 font-semibold">
              <Trophy className="size-4 text-gold" /> Top competitions
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {LEAGUES.slice(0, 3).map((league) => (
                <Link
                  key={league.id}
                  to="/football"
                  search={{ league: league.id, when: "all" }}
                  className={cn("block rounded-2xl border border-line border-l-4 bg-navy-900 p-4", CARD_TONE[league.id])}
                >
                  <SportIcon sport="soccer" className="text-cyan" />
                  <p className="mt-3 text-lg font-semibold">{league.name}</p>
                  <p className="text-sm text-muted">{league.region}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm text-cyan">
                    View Markets <ChevronRight className="size-4" />
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-widest text-muted">MATCHES</h2>
          </div>
          <SportChips value={sport} onChange={(id) => setSport(id as SportId | "all")} />
          <div className="grid gap-3 xl:grid-cols-2">
            {visible.map((match) => (
              <FixtureRow key={match.id} match={match} />
            ))}
          </div>
          {!showAll && list.length > 4 && (
            <button type="button" onClick={() => setShowAll(true)} className="w-full py-2 text-center text-xs font-semibold tracking-wide text-muted">
              + {list.length - 4} MORE EVENTS
            </button>
          )}
        </div>
      )}
      <ScrollTail />
    </main>
  );
}

function BoardSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-navy-900 px-3">
      <Search className="size-4 shrink-0 text-muted" aria-hidden />
      <label htmlFor="board-search" className="sr-only">
        Search teams, players, competitions, markets
      </label>
      <input
        id="board-search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Teams, players, competitions, markets"
        autoComplete="off"
        className="min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-faint"
      />
      {value ? (
        <button type="button" aria-label="Clear search" onClick={() => onChange("")} className="grid size-11 shrink-0 place-items-center text-muted">
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
