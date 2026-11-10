import { useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronUp, CircleAlert, Loader2, Lock, TriangleAlert, X } from "lucide-react";
import { Coin } from "@/components/brand";
import { money, oddsText } from "@/lib/betting/format";
import { evaluate, useBook, type SlipRow } from "@/lib/betting/store";
import { cn } from "@/lib/cn";
import { MyBets } from "@/components/my-bets";

const CHIPS = [1, 10, 50, 100];

function SlipCard({ row }: { row: SlipRow }) {
  const accept = useBook((state) => state.accept);
  const remove = useBook((state) => state.remove);
  const setLineStake = useBook((state) => state.setLineStake);
  const setExpanded = useBook((state) => state.setSlipExpanded);
  const balance = useBook((state) => state.balance);
  const slip = useBook((state) => state.slip);
  const { item, suspended, changed, odds, potential } = row;
  const stakeId = useId();
  const others = slip.reduce((sum, line) => (line.lineId === item.lineId ? sum : sum + (Number(line.stake) || 0)), 0);
  const maxStake = Math.max(0, Math.floor((balance - others) * 100) / 100);

  return (
    <article
      className={cn(
        "flex overflow-hidden rounded-xl border",
        suspended && "border-danger/50 bg-danger-dim",
        changed && "border-gold/70 bg-navy-900",
        !suspended && !changed && "border-line bg-navy-850",
      )}
    >
      <button
        type="button"
        onClick={() => remove(item.lineId)}
        aria-label={`Remove ${item.selectionLabel}`}
        className="grid w-9 shrink-0 place-items-center bg-navy-800/70 text-muted hover:text-ink"
      >
        <X className="size-4" />
      </button>
      <div className="min-w-0 flex-1 p-2.5">
        {changed && (
          <div className="mb-2 flex items-center rounded-lg bg-warn-dim px-2 py-1.5 text-sm font-medium text-gold">
            <span className="inline-flex items-center gap-1.5">
              <TriangleAlert className="size-4" />
              Odds have changed
            </span>
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <Link
            to="/match/$matchId"
            params={{ matchId: item.matchId }}
            onClick={() => setExpanded(false)}
            className="min-w-0 truncate text-sm font-semibold hover:text-cyan"
          >
            {item.selectionLabel}
          </Link>
          {suspended && (
            <span className="shrink-0 rounded-md bg-live px-2 py-0.5 text-[11px] font-bold tracking-wide text-ink">SUSPENDED</span>
          )}
        </div>
        <p className="truncate text-xs text-muted">{item.matchLabel}</p>
        <p className="truncate text-xs text-muted">
          {item.competition} · {item.marketName}
        </p>
        {suspended && (
          <p className="mt-2 text-sm text-down">This selection is suspended. Remove it to place the rest.</p>
        )}
        {changed && (
          <button
            data-accept-odds=""
            type="button"
            onClick={() => accept(item.lineId)}
            className="mt-2 min-h-10 w-full rounded-lg border border-gold/60 bg-warn-soft font-semibold text-gold"
          >
            Accept odds
          </button>
        )}
        {!suspended && (
          <>
            <div className="mt-2 flex items-center justify-between gap-2">
              {changed ? (
                <span className="inline-flex items-center gap-1.5 font-display text-base tabular-nums">
                  <span className="text-faint line-through">{oddsText(item.acceptedOdds)}</span>
                  <span className="font-semibold">{oddsText(odds)}</span>
                </span>
              ) : (
                <span className="font-display text-lg font-semibold text-cyan tabular-nums">{oddsText(odds)}</span>
              )}
              <div className="flex items-center gap-1.5">
                <label htmlFor={stakeId} className="sr-only">
                  Stake in USDT
                </label>
                <div className="flex items-center rounded-lg border border-line bg-navy-950 pr-2 pl-1">
                  <input
                    id={stakeId}
                    inputMode="decimal"
                    value={item.stake}
                    onChange={(event) => setLineStake(item.lineId, event.target.value.replace(/[^0-9.]/g, ""))}
                    className="min-h-9 w-16 bg-transparent text-right font-display text-base font-semibold tabular-nums outline-none"
                    aria-label={`Stake for ${item.selectionLabel} in USDT`}
                  />
                  <span className="ml-1 inline-flex items-center gap-1 text-xs text-muted">
                    USDT
                    <Coin className="text-cyan" />
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLineStake(item.lineId, maxStake.toFixed(2))}
                  className="min-h-9 rounded-lg bg-navy-800 px-2.5 text-xs font-bold tracking-wide"
                >
                  MAX
                </button>
              </div>
            </div>
            <p className="mt-1 text-right text-xs text-muted">
              Returns <span className="font-semibold text-cyan tabular-nums">{potential > 0 ? `${money(potential)} USDT` : "—"}</span>
            </p>
          </>
        )}
      </div>
    </article>
  );
}

export function SlipBody({ showHeader = true }: { showHeader?: boolean }) {
  const slip = useBook((state) => state.slip);
  const quotes = useBook((state) => state.quotes);
  const balance = useBook((state) => state.balance);
  const receipt = useBook((state) => state.receipt);
  const placing = useBook((state) => state.placing);
  const place = useBook((state) => state.place);
  const clearSlip = useBook((state) => state.clearSlip);
  const dismissReceipt = useBook((state) => state.dismissReceipt);
  const restoreSampleSlip = useBook((state) => state.restoreSampleSlip);
  const acceptAll = useBook((state) => state.acceptAll);
  const setAllStakes = useBook((state) => state.setAllStakes);
  const setSlipExpanded = useBook((state) => state.setSlipExpanded);
  const view = evaluate({ slip, quotes });
  const blocked = slip.length === 0 || view.hasSuspended || view.needsAccept || view.ready.some((row) => row.stake <= 0);
  const why = view.hasSuspended
    ? "Place bet is off. Remove the suspended selection."
    : view.needsAccept
      ? "Place bet is off. Accept the new odds first."
      : view.ready.some((row) => row.stake <= 0)
        ? "Place bet is off. Enter a stake on every selection."
        : null;

  return (
    <div className="flex flex-col gap-2">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            Bet Slip
            <span className="grid size-6 place-items-center rounded-full bg-navy-700 text-xs">{slip.length}</span>
          </h2>
        </div>
      )}

      <div aria-live="polite">
        {receipt?.kind === "placed" && (
          <div className="rounded-xl border border-up/50 bg-up/10 p-3">
            <p className="inline-flex items-center gap-2 font-semibold text-up">
              <Check className="size-4" />
              Bet placed
            </p>
            <p className="mt-1 text-sm text-muted">
              {receipt.singles} single{receipt.singles === 1 ? "" : "s"} · Stake {money(receipt.totalStake)} USDT
            </p>
            <p className="text-sm">
              Potential return <span className="font-semibold text-up">{money(receipt.potential)} USDT</span>
            </p>
            <p className="mt-1 text-sm text-muted">The slip is clear. Open bets are under My bets.</p>
            <div className="mt-3 flex gap-2">
              <Link to="/bets" className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-up text-sm font-semibold text-navy-950">
                View my bets
              </Link>
              <button type="button" onClick={dismissReceipt} className="min-h-10 rounded-lg border border-line px-3 text-sm">
                Done
              </button>
            </div>
          </div>
        )}
        {receipt?.kind === "failed" && (
          <div className="rounded-xl border border-danger/50 bg-danger-dim p-3">
            <p className="inline-flex items-center gap-2 font-semibold text-down">
              <CircleAlert className="size-4" />
              Bet failed
            </p>
            <p className="mt-1 text-sm text-ink">{receipt.message}</p>
            <p className="mt-1 text-sm text-muted">Your selections are still in the slip. Change the stake and try again.</p>
            <button type="button" onClick={dismissReceipt} className="mt-3 min-h-10 rounded-lg border border-line px-3 text-sm">
              Retry
            </button>
          </div>
        )}
      </div>

      {slip.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-3 py-8 text-center">
          <p className="font-medium">Your bet slip is empty</p>
          <p className="mt-1 text-sm text-muted">Tap any odds to add a selection. Every selection is placed as its own single bet.</p>
          <Link
            to="/live"
            onClick={() => setSlipExpanded(false)}
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-cyan/40 bg-tab px-4 text-sm font-semibold text-ink"
          >
            Browse live events
          </Link>
          <div>
            <button type="button" onClick={restoreSampleSlip} className="mt-2 min-h-9 px-3 text-xs text-muted">
              Restore sample slip
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <p>
              <span className="font-semibold">Singles</span>
              <span className="text-muted"> · {slip.length} selection{slip.length === 1 ? "" : "s"}</span>
            </p>
            <button type="button" onClick={clearSlip} className="min-h-9 px-1 font-semibold text-muted hover:text-ink">
              Clear all
            </button>
          </div>
          {view.rows.map((row) => (
            <SlipCard key={row.item.lineId} row={row} />
          ))}
          <div className="grid grid-cols-4 gap-1.5">
            {CHIPS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setAllStakes(amount.toFixed(2))}
                className={cn(
                  "min-h-9 rounded-full border text-sm font-medium",
                  slip.length > 0 && slip.every((row) => row.stake === amount.toFixed(2))
                    ? "border-cyan/40 bg-tab text-ink"
                    : "border-line bg-navy-800 text-ink",
                )}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-right text-sm text-cyan">Balance: {money(balance)} USDT</p>
      {view.totalStake > balance && view.ready.length > 0 && !why && (
        <p className="text-sm text-down">Stake is above your USDT balance. Place bet will fail until you lower it.</p>
      )}
      <dl className="grid grid-cols-2 gap-3 border-t border-line pt-2 text-sm">
        <div>
          <dt className="text-xs text-muted">Total stake{view.ready.length > 1 ? ` · ${view.ready.length} singles` : ""}</dt>
          <dd className="font-semibold tabular-nums">{money(view.totalStake)} USDT</dd>
        </div>
        <div className="text-right">
          <dt className="text-xs text-muted">Potential return</dt>
          <dd className="font-semibold text-cyan tabular-nums">{money(view.potential)} USDT</dd>
        </div>
      </dl>
      <p className="text-xs text-faint">Tip: stake 13 to see a failed bet.</p>
      {view.needsAccept && view.rows.filter((row) => row.changed).length > 1 && (
        <button type="button" onClick={acceptAll} className="min-h-10 rounded-lg border border-gold text-sm font-semibold text-gold">
          Accept all odds
        </button>
      )}
      {why && <p className="text-sm text-gold">{why}</p>}
      <button
        type="button"
        disabled={blocked || placing}
        onClick={() => place()}
        className={cn(
          "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl text-base font-bold",
          blocked || placing ? "bg-navy-700 text-muted" : "bg-aqua text-navy-950",
        )}
      >
        {placing ? <Loader2 className="size-4 animate-spin" /> : null}
        {placing ? "Placing…" : "Place bet"}
        {blocked && !placing ? <Lock className="size-4" /> : null}
      </button>
      <p className="text-center text-xs text-faint">All bets are final and cannot be undone. Singles only · decimal odds · play USDT.</p>
    </div>
  );
}

type PanelTab = "slip" | "bets";

function PanelTabs({ tab, setTab }: { tab: PanelTab; setTab: (tab: PanelTab) => void }) {
  const slipCount = useBook((state) => state.slip.length);
  const openBets = useBook((state) => state.bets.filter((bet) => bet.phase !== "settled").length);
  const items: { id: PanelTab; label: string; count: number }[] = [
    { id: "slip", label: "Bet slip", count: slipCount },
    { id: "bets", label: "My bets", count: openBets },
  ];
  return (
    <div role="tablist" className="flex items-center gap-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={tab === item.id}
          onClick={() => setTab(item.id)}
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold",
            tab === item.id ? "bg-tab text-ink" : "text-muted",
          )}
        >
          {item.label}
          <span
            className={cn(
              "grid min-w-5 place-items-center rounded-full px-1 text-xs",
              tab === item.id ? "bg-aqua text-navy-950" : "bg-navy-800 text-muted",
            )}
          >
            {item.count}
          </span>
        </button>
      ))}
    </div>
  );
}

export function DesktopSlip() {
  const open = useBook((state) => state.slipOpen);
  const setOpen = useBook((state) => state.setSlipOpen);
  const [tab, setTab] = useState<PanelTab>("slip");
  if (!open) return null;
  return (
    <aside className="fixed top-14 right-0 bottom-0 z-30 hidden w-96 flex-col border-l border-line bg-navy-900 lg:flex">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <PanelTabs tab={tab} setTab={setTab} />
        <button type="button" onClick={() => setOpen(false)} aria-label="Close bet slip" className="grid size-10 place-items-center">
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "slip" ? <SlipBody showHeader={false} /> : <MyBets embedded />}
      </div>
    </aside>
  );
}

export function MobileSlip() {
  const count = useBook((state) => state.slip.length);
  const expanded = useBook((state) => state.slipExpanded);
  const setExpanded = useBook((state) => state.setSlipExpanded);
  const quotes = useBook((state) => state.quotes);
  const slip = useBook((state) => state.slip);
  const openBets = useBook((state) => state.bets.filter((bet) => bet.phase !== "settled").length);
  const [tab, setTab] = useState<PanelTab>("slip");
  const view = evaluate({ slip, quotes });
  const alert = view.needsAccept || view.hasSuspended;
  const hint = view.needsAccept ? "Odds changed" : view.hasSuspended ? "Suspended" : `${money(view.potential)} USDT`;
  const first = view.rows[0];
  const summary = count === 1 && first ? `${first.item.selectionLabel} @ ${oddsText(first.odds)}` : `${count} selections`;

  if (!expanded) {
    return (
      <div className="fixed inset-x-0 bottom-16 z-40 flex gap-2 px-2 pb-2 lg:hidden">
        <button
          type="button"
          onClick={() => {
            setTab("slip");
            setExpanded(true);
          }}
          aria-label="Open bet slip"
          className={cn(
            "flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 text-left shadow-2xl",
            count === 0
              ? "border border-line bg-navy-900 text-ink"
              : alert
                ? "border border-gold/50 bg-warn-soft text-gold"
                : "border border-cyan/40 bg-tab text-ink",
          )}
        >
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-lg text-sm font-bold",
              count === 0 ? "bg-navy-800 text-muted" : alert ? "bg-gold text-navy-950" : "bg-aqua text-navy-950",
            )}
          >
            {count}
          </span>
          {count === 0 ? (
            <span className="min-w-0 flex-1 truncate">
              <span className="font-semibold">Bet slip</span>
              <span className="text-xs text-muted"> · tap odds to add</span>
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate font-semibold">{summary}</span>
          )}
          {alert && count > 0 ? <span className="shrink-0 text-xs font-bold">{hint}</span> : null}
          <ChevronUp className={cn("size-5 shrink-0", alert && count > 0 ? "text-gold" : "text-cyan")} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("bets");
            setExpanded(true);
          }}
          aria-label="Open my bets"
          className="flex min-h-12 shrink-0 items-center gap-2 rounded-2xl border border-line bg-navy-900 px-3 text-sm font-semibold shadow-2xl"
        >
          My bets
          <span className="grid min-w-5 place-items-center rounded-full bg-navy-800 px-1 text-xs text-muted">{openBets}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 px-2 lg:hidden">
      <div className="overflow-hidden rounded-t-2xl border border-line bg-navy-900 shadow-2xl">
        <div className="flex items-center justify-between px-2 py-1.5">
          <PanelTabs tab={tab} setTab={setTab} />
          <button type="button" onClick={() => setExpanded(false)} className="inline-flex min-h-10 items-center gap-1 px-1 text-xs font-semibold tracking-wide text-muted">
            HIDE
            <ChevronUp className="size-4 rotate-180" />
          </button>
        </div>
        <div className="slip-sheet overflow-y-auto px-3 pb-3">
          {tab === "slip" ? (
            <>
              {alert ? <p className="mb-2 text-xs text-gold">{hint}</p> : null}
              <SlipBody showHeader={false} />
            </>
          ) : (
            <MyBets embedded />
          )}
        </div>
      </div>
    </div>
  );
}
