import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Radio, RefreshCw } from "lucide-react";
import { LiveCard, SoonRow } from "@/components/odds";
import { ScrollTail, SportChips } from "@/components/shell";
import { MATCHES, byKickoff, competitionsIn, type SportId } from "@/lib/betting/data";
import { useBook } from "@/lib/betting/store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/live")({
  head: () => ({ meta: [{ title: "Housebets — Live" }] }),
  component: LivePage,
});

function LivePage() {
  const [sport, setSport] = useState<SportId | "all">("all");
  const [comp, setComp] = useState("all");
  const refreshIn = useBook((state) => state.refreshIn);
  const comps = competitionsIn(sport);
  const compId = comp === "all" || comps.some((item) => item.id === comp) ? comp : "all";
  const filtered = sport !== "all" || compId !== "all";
  const inFilter = (match: (typeof MATCHES)[number]) =>
    (sport === "all" || match.sport === sport) && (compId === "all" || match.leagueId === compId);
  const live = MATCHES.filter((match) => match.status === "live" && inFilter(match));
  const soon = MATCHES.filter((match) => match.status === "upcoming" && inFilter(match)).sort(byKickoff);
  const featured = live.find((match) => match.featured) ?? live[0];
  const rest = live.filter((match) => match.id !== featured?.id);

  return (
    <main className="space-y-4 p-3 lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="inline-flex items-center gap-2 text-xl font-semibold">
          <Radio className="size-4 text-live" />
          Live
        </h1>
        <p className="inline-flex items-center gap-2 text-sm text-muted">
          <span className="size-2 rounded-full bg-cyan" />
          Auto refresh in {refreshIn}s
          <RefreshCw className="size-4" />
        </p>
      </div>
      <SportChips
        value={sport}
        onChange={(id) => {
          setSport(id as SportId | "all");
          setComp("all");
        }}
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        <CompChip active={compId === "all"} onClick={() => setComp("all")}>
          All competitions
        </CompChip>
        {comps.map((item) => (
          <CompChip key={item.id} active={compId === item.id} onClick={() => setComp(item.id)}>
            {item.name}
          </CompChip>
        ))}
      </div>
      {live.length === 0 ? (
        <section className="space-y-3">
          <div className="rounded-xl border border-line bg-navy-900 p-4">
            <h2 className="text-lg font-semibold">Nothing live right now</h2>
            <p className="mt-1 text-sm text-muted">This filter has no in-play events.</p>
            {filtered && (
              <button
                type="button"
                onClick={() => {
                  setSport("all");
                  setComp("all");
                }}
                className="mt-3 min-h-11 rounded-lg border border-cyan px-3 text-sm font-semibold text-cyan"
              >
                Clear filters
              </button>
            )}
          </div>
          <h2 className="inline-flex items-center gap-2 font-semibold">
            <Clock className="size-4 text-muted" />
            Starting soon
          </h2>
          {soon.length === 0 ? (
            <p className="rounded-xl border border-line bg-navy-900 p-6 text-sm text-muted">Nothing starting soon either.</p>
          ) : (
            <div className="rounded-xl border border-line bg-navy-900 px-3">
              {soon.map((match) => (
                <SoonRow key={match.id} match={match} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {featured && (
            <div className="lg:max-w-3xl">
              <LiveCard match={featured} />
            </div>
          )}
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {rest.map((match) => (
              <LiveCard key={match.id} match={match} />
            ))}
          </div>
        </>
      )}
      <ScrollTail />
    </main>
  );
}

function CompChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 shrink-0 rounded-full border px-3 text-sm",
        active ? "border-cyan/40 bg-tab text-ink" : "border-line bg-navy-900 text-ink",
      )}
    >
      {children}
    </button>
  );
}
