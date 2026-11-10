import { create } from "zustand";
import {
  getMatch,
  initialQuotes,
  liveSelectionIds,
  matchLabel,
  type Quote,
  type SportId,
} from "@/lib/betting/data";
import { money, parseStake, round2 } from "@/lib/betting/format";

export type SlipItem = {
  lineId: string;
  selectionId: string;
  matchId: string;
  marketName: string;
  competition: string;
  matchLabel: string;
  selectionLabel: string;
  acceptedOdds: number;
  /** Per-selection stake, as typed. */
  stake: string;
};

export type BetPhase = "live" | "upcoming" | "settled";

export type Bet = {
  id: string;
  matchId: string;
  competition: string;
  matchLabel: string;
  marketName: string;
  selectionLabel: string;
  odds: number;
  stake: number;
  potential: number;
  phase: BetPhase;
  startLabel: string;
  period: string;
  note?: string;
  cashOutOffer?: number;
  settlement?: "won" | "lost" | "cashed";
  payout?: number;
};

export type Receipt =
  | { kind: "placed"; singles: number; totalStake: number; potential: number }
  | { kind: "failed"; message: string }
  | null;

export type DialogId = "settings" | "support" | null;

type Persisted = {
  balance: number;
  slip: SlipItem[];
  bets: Bet[];
  quotes: Record<string, Quote>;
  promoClaimed: boolean;
  followedTeams?: string[];
  followedLeagues?: string[];
};

const STORAGE_KEY = "housebets.v3";

let lineSeq = 1;

export function nextLineId() {
  lineSeq += 1;
  return `line-${lineSeq}`;
}

function ensureLineIds(slip: SlipItem[]): SlipItem[] {
  return slip.map((row) => ({
    ...row,
    lineId: row.lineId || nextLineId(),
    stake: typeof row.stake === "string" && row.stake.length > 0 ? row.stake : "10.00",
  }));
}

/** One single per match. Picking another price on that match replaces it. */
export function applySelection(
  slip: SlipItem[],
  item: Omit<SlipItem, "acceptedOdds" | "lineId" | "stake">,
  odds: number,
): SlipItem[] {
  if (slip.some((row) => row.selectionId === item.selectionId)) return slip;
  return [...slip, { ...item, lineId: nextLineId(), acceptedOdds: odds, stake: "10.00" }];
}

function sampleSlip(): SlipItem[] {
  return [
    {
      lineId: "line-heat",
      selectionId: "heat-phi:ml:heat",
      matchId: "heat-phi",
      marketName: "Moneyline",
      competition: "NBA",
      matchLabel: "Miami Heat vs Philadelphia 76ers",
      selectionLabel: "Miami Heat",
      acceptedOdds: 2.1,
      stake: "25.00",
    },
    {
      lineId: "line-varga",
      selectionId: "varga-melnik:mw:varga",
      matchId: "varga-melnik",
      marketName: "Match Winner",
      competition: "ATP Finals",
      matchLabel: "Nico Varga vs Dario Melnik",
      selectionLabel: "Nico Varga",
      acceptedOdds: 1.45,
      stake: "10.00",
    },
  ];
}

function sampleBets(): Bet[] {
  return [
    {
      id: "b-knicks",
      matchId: "nyk-bos",
      competition: "NBA",
      matchLabel: "New York Knicks vs Boston Celtics",
      marketName: "Moneyline",
      selectionLabel: "New York Knicks",
      odds: 1.72,
      stake: 50,
      potential: 86,
      phase: "live",
      startLabel: "Today, 01:30",
      period: "1st Half",
      cashOutOffer: 64.2,
    },
    {
      id: "b-thunder",
      matchId: "okc-ind",
      competition: "NBA",
      matchLabel: "Oklahoma City Thunder vs Indiana Pacers",
      marketName: "Moneyline",
      selectionLabel: "Oklahoma City Thunder",
      odds: 1.68,
      stake: 30,
      potential: 50.4,
      phase: "upcoming",
      startLabel: "Tomorrow, 20:00",
      period: "",
      note: "NBA",
    },
    {
      id: "b-liverpool",
      matchId: "liv-cry",
      competition: "Premier League",
      matchLabel: "Liverpool vs Crystal Palace",
      marketName: "1X2",
      selectionLabel: "Liverpool",
      odds: 1.36,
      stake: 25,
      potential: 34,
      phase: "upcoming",
      startLabel: "Tomorrow, 15:00",
      period: "",
      note: "Premier League",
    },
    {
      id: "b-won",
      matchId: "rma-bar",
      competition: "LaLiga",
      matchLabel: "Real Madrid vs Barcelona",
      marketName: "1X2",
      selectionLabel: "Real Madrid",
      odds: 1.9,
      stake: 40,
      potential: 76,
      phase: "settled",
      startLabel: "Yesterday",
      period: "",
      note: "LaLiga",
      settlement: "won",
      payout: 76,
    },
    {
      id: "b-lost",
      matchId: "liv-che",
      competition: "Premier League",
      matchLabel: "Liverpool vs Chelsea",
      marketName: "1X2",
      selectionLabel: "Chelsea",
      odds: 4.5,
      stake: 20,
      potential: 90,
      phase: "settled",
      startLabel: "Yesterday",
      period: "",
      settlement: "lost",
      payout: 0,
    },
  ];
}

function freshCore() {
  return {
    balance: 1234.56,
    quotes: initialQuotes(),
    slip: sampleSlip(),
    bets: sampleBets(),
    promoClaimed: false,
    followedTeams: [] as string[],
    followedLeagues: [] as string[],
    boardSport: "all" as SportId | "all",
  };
}

function mergeQuotes(saved?: Record<string, Quote>) {
  const base = initialQuotes();
  if (!saved) return base;
  for (const id of Object.keys(base)) {
    const next = saved[id];
    if (!next || typeof next.odds !== "number") continue;
    base[id] = {
      odds: next.odds,
      prev: typeof next.prev === "number" ? next.prev : null,
      dir: next.dir === "up" || next.dir === "down" ? next.dir : null,
      suspended: Boolean(next.suspended),
    };
  }
  return base;
}

function isPersisted(value: unknown): value is Persisted {
  if (!value || typeof value !== "object") return false;
  const row = value as Persisted;
  return (
    typeof row.balance === "number" &&
    Array.isArray(row.slip) &&
    Array.isArray(row.bets) &&
    !!row.quotes &&
    typeof row.quotes === "object"
  );
}

export type SlipRow = {
  item: SlipItem;
  suspended: boolean;
  changed: boolean;
  odds: number;
  stake: number;
  potential: number;
};

export function evaluate(state: { slip: SlipItem[]; quotes: Record<string, Quote> }) {
  const rows: SlipRow[] = state.slip.map((item) => {
    const quote = state.quotes[item.selectionId];
    const suspended = !quote || quote.suspended;
    const odds = quote?.odds ?? item.acceptedOdds;
    const changed = !suspended && Math.abs(odds - item.acceptedOdds) > 0.001;
    const stake = parseStake(item.stake ?? "0");
    return { item, suspended, changed, odds, stake, potential: round2(stake * odds) };
  });
  const ready = rows.filter((row) => !row.suspended && !row.changed);
  const needsAccept = rows.some((row) => row.changed);
  const hasSuspended = rows.some((row) => row.suspended);
  const stakeTotal = round2(ready.reduce((sum, row) => sum + row.stake, 0));
  const potential = round2(ready.reduce((sum, row) => sum + row.potential, 0));
  const badStake = rows.some((row) => row.stake === 13);
  return {
    rows,
    ready,
    needsAccept,
    hasSuspended,
    badStake,
    totalStake: stakeTotal,
    potential,
    profit: round2(potential - stakeTotal),
  };
}

let seq = 200;

type BookState = {
  balance: number;
  quotes: Record<string, Quote>;
  slip: SlipItem[];
  bets: Bet[];
  receipt: Receipt;
  placing: boolean;
  slipOpen: boolean;
  slipExpanded: boolean;
  hydrated: boolean;
  refreshIn: number;
  dialog: DialogId;
  promoClaimed: boolean;
  followedTeams: string[];
  followedLeagues: string[];
  boardSport: SportId | "all";
  menuOpen: boolean;
  scoreAdd: Record<string, [number, number]>;
  holding: boolean;
  goal: (matchId: string) => void;
  setLineStake: (lineId: string, value: string) => void;
  setAllStakes: (value: string) => void;
  toggle: (item: Omit<SlipItem, "acceptedOdds" | "lineId" | "stake">) => void;
  remove: (lineId: string) => void;
  clearSlip: () => void;
  accept: (lineId: string) => void;
  acceptAll: () => void;
  place: () => void;
  dismissReceipt: () => void;
  cashOut: (id: string) => number | null;
  drift: () => void;
  setSlipOpen: (open: boolean) => void;
  setSlipExpanded: (open: boolean) => void;
  setDialog: (dialog: DialogId) => void;
  setMenuOpen: (open: boolean) => void;
  setBoardSport: (sport: SportId | "all") => void;
  toggleFollowTeam: (name: string) => void;
  toggleFollowLeague: (id: string) => void;
  claimPromo: () => boolean;
  restoreSampleSlip: () => void;
  resetDemo: () => void;
  hydrate: () => void;
};

function pickPersisted(state: BookState): Persisted {
  return {
    balance: state.balance,
    slip: state.slip,
    bets: state.bets,
    quotes: state.quotes,
    promoClaimed: state.promoClaimed,
    followedTeams: state.followedTeams,
    followedLeagues: state.followedLeagues,
  };
}

export const useBook = create<BookState>((set, get) => ({
  ...freshCore(),
  receipt: null,
  placing: false,
  slipOpen: false,
  slipExpanded: false,
  hydrated: false,
  scoreAdd: {},
  holding: false,
  refreshIn: 10,
  dialog: null,
  menuOpen: false,

  setLineStake: (lineId, value) =>
    set({
      slip: get().slip.map((row) => (row.lineId === lineId ? { ...row, stake: value } : row)),
      receipt: get().receipt?.kind === "failed" ? null : get().receipt,
    }),

  setAllStakes: (value) =>
    set({
      slip: get().slip.map((row) => ({ ...row, stake: value })),
      receipt: get().receipt?.kind === "failed" ? null : get().receipt,
    }),

  toggle: (item) => {
    const existing = get().slip.find((row) => row.selectionId === item.selectionId);
    if (existing) {
      set({ slip: get().slip.filter((row) => row.lineId !== existing.lineId), receipt: null });
      return;
    }
    const quote = get().quotes[item.selectionId];
    if (!quote || quote.suspended) return;
    set({
      slip: applySelection(get().slip, item, quote.odds),
      slipExpanded: false,
      receipt: null,
    });
  },

  remove: (lineId) => set({ slip: get().slip.filter((row) => row.lineId !== lineId) }),

  goal: (matchId) => {
    const match = getMatch(matchId);
    if (!match || match.status !== "live" || !match.score) return;
    const add = get().scoreAdd[matchId] ?? [0, 0];
    if (add[0] + add[1] >= 3 || get().holding) return;
    const nextAdd: [number, number] = Math.random() < 0.5 ? [add[0] + 1, add[1]] : [add[0], add[1] + 1];
    const ids = match.markets.flatMap((market) => market.selections.map((selection) => selection.id));
    const quotes = { ...get().quotes };
    const stayClosed = new Set(ids.filter((id) => quotes[id]?.suspended));
    for (const id of ids) {
      const quote = quotes[id];
      if (quote) quotes[id] = { ...quote, suspended: true, dir: null };
    }
    set({ scoreAdd: { ...get().scoreAdd, [matchId]: nextAdd }, quotes, holding: true });
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      const reopened = { ...useBook.getState().quotes };
      for (const id of ids) {
        const quote = reopened[id];
        if (!quote) continue;
        if (stayClosed.has(id)) {
          reopened[id] = { ...quote, suspended: true };
          continue;
        }
        const next = round2(Math.min(30, Math.max(1.05, quote.odds * (0.82 + Math.random() * 0.4))));
        reopened[id] = { odds: next, prev: quote.odds, dir: next > quote.odds ? "up" : "down", suspended: false };
      }
      useBook.setState({ quotes: reopened, holding: false });
    }, 4000);
  },

  clearSlip: () => set({ slip: [], receipt: null }),

  accept: (lineId) => {
    const row = get().slip.find((item) => item.lineId === lineId);
    if (!row) return;
    const quote = get().quotes[row.selectionId];
    if (!quote || quote.suspended) return;
    set({
      slip: get().slip.map((item) => (item.lineId === lineId ? { ...item, acceptedOdds: quote.odds } : item)),
      receipt: get().receipt?.kind === "failed" ? null : get().receipt,
    });
  },

  acceptAll: () => {
    const { slip, quotes } = get();
    set({
      slip: slip.map((row) => {
        const quote = quotes[row.selectionId];
        if (!quote || quote.suspended) return row;
        return { ...row, acceptedOdds: quote.odds };
      }),
      receipt: get().receipt?.kind === "failed" ? null : get().receipt,
    });
  },

  place: () => {
    const state = get();
    if (state.placing) return;
    const view = evaluate(state);
    if (view.rows.length === 0 || view.hasSuspended || view.needsAccept) return;
    if (view.ready.some((row) => row.stake <= 0)) return;
    if (view.badStake) {
      set({
        receipt: {
          kind: "failed",
          message: "Bet failed. The book rejected a 13 USDT stake.",
        },
      });
      return;
    }
    if (view.totalStake > state.balance + 0.001) {
      set({
        receipt: {
          kind: "failed",
          message: `Bet failed. ${money(view.totalStake)} USDT is above your ${money(state.balance)} USDT balance.`,
        },
      });
      return;
    }

    const snapshot = view.ready.map((row) => ({ ...row }));
    const totalStake = view.totalStake;
    const potential = view.potential;
    set({ placing: true, receipt: null });

    setTimeout(() => {
      const now = get();
      if (totalStake > now.balance + 0.001) {
        set({
          placing: false,
          receipt: { kind: "failed", message: "Bet failed. Balance changed before the bet was accepted." },
        });
        return;
      }

      const placedIds = new Set(snapshot.map((row) => row.item.lineId));
      const nextBets: Bet[] = snapshot.map((row) => {
        const fixture = getMatch(row.item.matchId);
        const live = fixture?.status === "live";
        seq += 1;
        return {
          id: `b-${seq}`,
          matchId: row.item.matchId,
          competition: row.item.competition,
          matchLabel: row.item.matchLabel,
          marketName: row.item.marketName,
          selectionLabel: row.item.selectionLabel,
          odds: row.odds,
          stake: row.stake,
          potential: row.potential,
          phase: live ? "live" : "upcoming",
          startLabel: fixture?.startLabel ?? "",
          period: fixture?.clock?.period ?? "",
          note: fixture?.note,
          cashOutOffer: live ? round2(row.stake * (1 + (row.odds - 1) * 0.45)) : undefined,
        };
      });

      set({
        placing: false,
        balance: round2(now.balance - totalStake),
        slip: now.slip.filter((row) => !placedIds.has(row.lineId)),
        bets: [...nextBets, ...now.bets],
        receipt: { kind: "placed", singles: snapshot.length, totalStake, potential },
      });
    }, 650);
  },

  dismissReceipt: () => set({ receipt: null }),

  cashOut: (id) => {
    const bet = get().bets.find((row) => row.id === id);
    if (!bet || bet.phase === "settled" || !bet.cashOutOffer) return null;
    const payout = bet.cashOutOffer;
    set({
      balance: round2(get().balance + payout),
      bets: get().bets.map((row) =>
        row.id === id
          ? { ...row, phase: "settled", settlement: "cashed", payout, cashOutOffer: undefined }
          : row,
      ),
    });
    return payout;
  },

  drift: () => {
    const quotes = { ...get().quotes };
    const pool = liveSelectionIds().filter((id) => quotes[id] && !quotes[id].suspended);
    const picks = Math.min(3, pool.length);
    for (let index = 0; index < picks; index += 1) {
      const choice = Math.floor(Math.random() * pool.length);
      const id = pool.splice(choice, 1)[0];
      if (!id) continue;
      const current = quotes[id];
      if (!current) continue;
      const delta = (Math.random() < 0.5 ? -1 : 1) * (0.02 + Math.random() * 0.06);
      const next = round2(Math.min(30, Math.max(1.05, current.odds + delta)));
      if (next === current.odds) continue;
      quotes[id] = {
        odds: next,
        prev: current.odds,
        dir: next > current.odds ? "up" : "down",
        suspended: false,
      };
    }
    set({ quotes });
  },

  setSlipOpen: (slipOpen) => set({ slipOpen }),
  setSlipExpanded: (slipExpanded) => set({ slipExpanded }),
  setDialog: (dialog) => set({ dialog }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setBoardSport: (boardSport) => set({ boardSport }),

  toggleFollowTeam: (name) => {
    const current = get().followedTeams ?? [];
    set({
      followedTeams: current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    });
  },

  toggleFollowLeague: (id) => {
    const current = get().followedLeagues ?? [];
    set({
      followedLeagues: current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    });
  },

  claimPromo: () => {
    if (get().promoClaimed) return false;
    set({ promoClaimed: true, balance: round2(get().balance + 10) });
    return true;
  },

  restoreSampleSlip: () => {
    const quotes = { ...get().quotes };
    quotes["heat-phi:ml:heat"] = { odds: 2.35, prev: 2.1, dir: "up", suspended: false };
    quotes["varga-melnik:mw:varga"] = { odds: 1.45, prev: null, dir: null, suspended: true };
    set({ slip: sampleSlip(), quotes, receipt: null, slipExpanded: true, slipOpen: true });
  },

  resetDemo: () => {
    set({
      ...freshCore(),
      scoreAdd: {},
      receipt: null,
      placing: false,
      slipOpen: false,
      slipExpanded: false,
      hydrated: true,
      refreshIn: 10,
      dialog: "settings",
      menuOpen: false,
    });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore quota / private mode */
    }
  },

  hydrate: () => {
    if (get().hydrated) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isPersisted(parsed)) {
          set({
            balance: parsed.balance,
            slip: ensureLineIds(parsed.slip),
            bets: parsed.bets,
            quotes: mergeQuotes(parsed.quotes),
            promoClaimed: Boolean(parsed.promoClaimed),
            followedTeams: Array.isArray(parsed.followedTeams)
              ? parsed.followedTeams.filter((name) => typeof name === "string")
              : [],
            followedLeagues: Array.isArray(parsed.followedLeagues)
              ? parsed.followedLeagues.filter((id) => typeof id === "string")
              : [],
            hydrated: true,
          });
          return;
        }
      }
    } catch {
      /* keep the seeded book */
    }
    set({ hydrated: true });
  },
}));

export function persistBook(state: BookState) {
  if (!state.hydrated || state.holding) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pickPersisted(state)));
  } catch {
    /* ignore quota */
  }
}

export function selectionMeta(matchId: string, marketName: string, selectionLabel: string) {
  const fixture = getMatch(matchId);
  return {
    competition: fixture?.competition ?? "",
    matchLabel: fixture ? matchLabel(fixture) : selectionLabel,
    marketName,
  };
}
