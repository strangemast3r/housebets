import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Calendar, ChevronDown, Clock, History, Target } from "lucide-react";
import { useTickingClock } from "@/components/clock";
import { getMatch } from "@/lib/betting/data";
import { money, oddsText } from "@/lib/betting/format";
import { useBook, type Bet } from "@/lib/betting/store";
import { cn } from "@/lib/cn";

function LiveClock({ matchId, fallback }: { matchId: string; fallback: string }) {
  const fixture = getMatch(matchId);
  const clock = useTickingClock(fixture?.status === "live" ? fixture.clock : null);
  if (!clock) return <span>{fallback}</span>;
  return (
    <span>
      {clock.period ? `${clock.period} ` : ""}
      {clock.text}
    </span>
  );
}

function BetCard({ bet, onCash }: { bet: Bet; onCash: (amount: number) => void }) {
  const cashOut = useBook((state) => state.cashOut);
  const [open, setOpen] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const settled = bet.phase === "settled";

  return (
    <article className="rounded-xl border border-line bg-navy-850 p-2.5">
      <div className="flex items-center justify-between gap-2">
        {bet.phase === "live" ? (
          <span className="rounded bg-live px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-ink">LIVE</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Calendar className="size-3.5" />
            {bet.startLabel}
          </span>
        )}
        {bet.phase === "live" ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted tabular-nums">
            <Clock className="size-3.5" />
            <LiveClock matchId={bet.matchId} fallback={bet.period} />
          </span>
        ) : (
          <button type="button" aria-label={open ? "Collapse bet" : "Expand bet"} onClick={() => setOpen((value) => !value)} className="grid size-8 place-items-center text-muted">
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>
      {open && (
        <div className="mt-1.5">
          {bet.note && <p className="text-xs text-muted">{bet.note}</p>}
          <Link to="/match/$matchId" params={{ matchId: bet.matchId }} className="text-sm font-medium leading-snug hover:text-cyan">
            {bet.matchLabel}
          </Link>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1 text-xs text-muted">
                <Target className="size-3" />
                {bet.marketName}
              </p>
              <p className="truncate text-sm font-medium">
                {bet.selectionLabel}{" "}
                <span className="font-display font-semibold text-cyan tabular-nums">@ {oddsText(bet.odds)}</span>
              </p>
            </div>
            {bet.phase === "live" && bet.cashOutOffer ? (
              confirm ? (
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p className="text-xs text-cyan">Cash out {money(bet.cashOutOffer)} USDT?</p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="min-h-9 rounded-md bg-aqua px-2 text-xs font-bold text-navy-950"
                      onClick={() => {
                        const paid = cashOut(bet.id);
                        if (paid != null) onCash(paid);
                        setConfirm(false);
                      }}
                    >
                      Confirm
                    </button>
                    <button type="button" className="min-h-9 rounded-md border border-line px-2 text-xs" onClick={() => setConfirm(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirm(true)} className="min-h-9 shrink-0 rounded-md bg-aqua px-3 text-xs font-bold tracking-wide text-navy-950">
                  Cash out
                </button>
              )
            ) : null}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-2">
            <div>
              <p className="text-xs text-muted">Stake</p>
              <p className="text-sm font-medium tabular-nums">{money(bet.stake)} USDT</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">{settled ? "Result" : "Potential return"}</p>
              {settled ? (
                <p className={cn("text-sm font-semibold tabular-nums", bet.settlement === "lost" ? "text-down" : "text-up")}>
                  {bet.settlement === "won" && `Won ${money(bet.payout ?? 0)} USDT`}
                  {bet.settlement === "cashed" && `Cashed out ${money(bet.payout ?? 0)} USDT`}
                  {bet.settlement === "lost" && "Lost"}
                </p>
              ) : (
                <p className="text-sm font-medium tabular-nums">{money(bet.potential)} USDT</p>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export function MyBets({ onHistory, embedded = false }: { onHistory?: () => void; embedded?: boolean }) {
  const bets = useBook((state) => state.bets);
  const [tab, setTab] = useState<"open" | "settled">("open");
  const [flash, setFlash] = useState<string | null>(null);
  const open = bets.filter((bet) => bet.phase !== "settled");
  const settled = bets.filter((bet) => bet.phase === "settled");
  const live = open.filter((bet) => bet.phase === "live");
  const upcoming = open.filter((bet) => bet.phase === "upcoming");
  const shown = tab === "open" ? open : settled;

  return (
    <div>
      {!embedded && <h1 className="text-xl font-semibold">My bets</h1>}
      <div className={cn("grid grid-cols-2 border-b border-line", !embedded && "mt-3")}>
        {(["open", "settled"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "min-h-10 border-b-2 text-sm font-semibold",
              tab === key ? "border-cyan text-ink" : "border-transparent text-muted",
            )}
          >
            {key === "open" ? "Open" : "Settled"}
          </button>
        ))}
      </div>
      {flash && (
        <p className="mt-3 rounded-lg border border-cyan/40 bg-cyan-dim px-3 py-2 text-sm text-cyan" aria-live="polite">
          {flash}
        </p>
      )}
      {tab === "open" ? (
        <div className="mt-3 space-y-3">
          <section>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted">LIVE BETS ({live.length})</h2>
            <div className="space-y-2">
              {live.length === 0 && <p className="text-sm text-faint">No live bets.</p>}
              {live.map((bet) => (
                <BetCard key={bet.id} bet={bet} onCash={(amount) => setFlash(`Cashed out ${money(amount)} USDT. The bet is now settled.`)} />
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted">UPCOMING BETS ({upcoming.length})</h2>
            <div className="space-y-2">
              {upcoming.length === 0 && <p className="text-sm text-faint">No upcoming bets.</p>}
              {upcoming.map((bet) => (
                <BetCard key={bet.id} bet={bet} onCash={() => undefined} />
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {shown.length === 0 && <p className="text-sm text-faint">No settled bets yet.</p>}
          {settled.map((bet) => (
            <BetCard key={bet.id} bet={bet} onCash={() => undefined} />
          ))}
        </div>
      )}
      {!embedded && (
        <button
          type="button"
          onClick={() => {
            setTab("settled");
            onHistory?.();
          }}
          className="mt-3 flex min-h-11 w-full items-center justify-between rounded-xl border border-line px-3 text-sm"
        >
          <span className="inline-flex items-center gap-2">
            <History className="size-4 text-muted" />
            View Bet History
          </span>
          <span className="text-muted">›</span>
        </button>
      )}
    </div>
  );
}
