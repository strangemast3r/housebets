import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { FixtureRow, LiveStrip } from "@/components/odds";
import { ScrollTail } from "@/components/shell";
import { LEAGUES, MATCHES } from "@/lib/betting/data";
import { useBook } from "@/lib/betting/store";
import { cn } from "@/lib/cn";

type FootballSearch = {
  league: string;
  when: "all" | "live" | "upcoming";
};

export const Route = createFileRoute("/football")({
  validateSearch: (search: Record<string, unknown>): FootballSearch => ({
    league: typeof search.league === "string" ? search.league : "all",
    when: search.when === "live" || search.when === "upcoming" ? search.when : "all",
  }),
  head: () => ({ meta: [{ title: "Housebets — Football" }] }),
  component: FootballPage,
});

function FootballPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [followingOnly, setFollowingOnly] = useState(false);
  const followedTeams = useBook((state) => state.followedTeams);
  const followedLeagues = useBook((state) => state.followedLeagues);
  const toggleFollowLeague = useBook((state) => state.toggleFollowLeague);
  const soccer = MATCHES.filter((match) => match.sport === "soccer");
  const filtered = useMemo(
    () =>
      soccer.filter((match) => {
        if (search.league !== "all" && match.leagueId !== search.league) return false;
        if (search.when === "live" && match.status !== "live") return false;
        if (search.when === "upcoming" && match.status !== "upcoming") return false;
        if (followingOnly) {
          const team = followedTeams.includes(match.home) || followedTeams.includes(match.away);
          const league = followedLeagues.includes(match.leagueId);
          if (!team && !league) return false;
        }
        return true;
      }),
    [search.league, search.when, soccer, followingOnly, followedTeams, followedLeagues],
  );
  const groups = LEAGUES.filter((league) => league.id !== "nba" && league.id !== "tennis")
    .map((league) => ({
      league,
      matches: filtered.filter((match) => match.leagueId === league.id),
    }))
    .filter((group) => group.matches.length > 0);

  return (
    <main className="space-y-4 p-3 lg:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted">SOCCER</p>
          <h1 className="text-xl font-semibold">Football</h1>
        </div>
      </div>
      <LiveStrip matches={soccer.filter((match) => match.status === "live")} />
      <div className="flex gap-2 overflow-x-auto">
        <Chip active={followingOnly} onClick={() => setFollowingOnly((value) => !value)}>
          {followedTeams.length + followedLeagues.length > 0
            ? `Following ${followedTeams.length + followedLeagues.length}`
            : "Following"}
        </Chip>
        <Chip active={search.when === "all"} onClick={() => navigate({ search: { ...search, when: "all" } })}>
          All
        </Chip>
        <Chip active={search.when === "live"} onClick={() => navigate({ search: { ...search, when: "live" } })}>
          Live
        </Chip>
        <Chip active={search.when === "upcoming"} onClick={() => navigate({ search: { ...search, when: "upcoming" } })}>
          Upcoming
        </Chip>
        <Chip active={search.league === "all"} onClick={() => navigate({ search: { ...search, league: "all" } })}>
          All leagues
        </Chip>
        {LEAGUES.filter((league) => ["premier-league", "champions-league", "laliga", "serie-a", "bundesliga"].includes(league.id)).map(
          (league) => (
            <Chip
              key={league.id}
              active={search.league === league.id}
              onClick={() => navigate({ search: { ...search, league: league.id } })}
            >
              {league.name}
            </Chip>
          ),
        )}
      </div>
      {groups.length === 0 && (
        <p className="rounded-xl border border-line bg-navy-900 p-6 text-sm text-muted">
          {followingOnly
            ? "Nothing you follow is in this filter. Turn Following off, then star a team or follow a competition."
            : "No fixtures for this filter."}
        </p>
      )}
      {groups.map((group) => {
        const following = followedLeagues.includes(group.league.id);
        return (
          <section key={group.league.id}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="min-w-0 truncate text-sm font-semibold text-muted">
                {group.league.name}
                <span className="ml-2 font-normal text-faint">{group.league.region}</span>
              </h2>
              <button
                type="button"
                aria-pressed={following}
                aria-label={following ? `Unfollow ${group.league.name}` : `Follow ${group.league.name}`}
                onClick={() => toggleFollowLeague(group.league.id)}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold",
                  following ? "border-cyan bg-cyan-dim text-cyan" : "border-line bg-navy-900 text-ink",
                )}
              >
                <Star className={cn("size-3.5", following && "fill-cyan")} />
                {following ? "Following" : "Follow"}
              </button>
            </div>
            <div className="space-y-2">
              {group.matches.map((match) => (
                <FixtureRow key={match.id} match={match} />
              ))}
            </div>
          </section>
        );
      })}
      <ScrollTail />
    </main>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-10 shrink-0 rounded-full border px-3 text-sm",
        active ? "border-cyan/40 bg-tab text-ink" : "border-line bg-navy-900 text-ink",
      )}
    >
      {children}
    </button>
  );
}
