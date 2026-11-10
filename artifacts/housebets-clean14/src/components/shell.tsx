import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  Globe,
  Headphones,
  Home,
  Menu,
  Radio,
  Receipt,
  Settings,
  Ticket,
  X,
} from "lucide-react";
import { Coin, Logo, SportIcon } from "@/components/brand";
import { DesktopSlip, MobileSlip } from "@/components/slip";
import { LEAGUES, MATCHES, SPORTS } from "@/lib/betting/data";
import { money } from "@/lib/betting/format";
import { persistBook, useBook, type DialogId } from "@/lib/betting/store";
import { cn } from "@/lib/cn";

function BookEngine() {
  const hydrate = useBook((state) => state.hydrate);
  const drift = useBook((state) => state.drift);

  useEffect(() => {
    hydrate();
    const unsub = useBook.subscribe((state) => persistBook(state));
    return unsub;
  }, [hydrate]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const left = useBook.getState().refreshIn - 1;
      if (left <= 0) {
        drift();
        useBook.setState({ refreshIn: 10 });
      } else {
        useBook.setState({ refreshIn: left });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [drift]);

  return null;
}

const DIALOG_COPY: Record<Exclude<DialogId, null>, { title: string; body: string }> = {
  settings: {
    title: "Settings",
    body: "Odds format is decimal. Stakes are USDT. Only singles can be placed.",
  },
  support: {
    title: "24/7 Support",
    body: "This is a clickable prototype. No bets are monitored and nothing here is a real wager.",
  },
};

function Dialogs() {
  const dialog = useBook((state) => state.dialog);
  const setDialog = useBook((state) => state.setDialog);
  const balance = useBook((state) => state.balance);
  const resetDemo = useBook((state) => state.resetDemo);

  useEffect(() => {
    if (!dialog) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDialog(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, setDialog]);

  if (!dialog) return null;
  const copy = DIALOG_COPY[dialog];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-navy-950/75" aria-label="Close dialog" onClick={() => setDialog(null)} />
      <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="relative z-10 m-3 w-full max-w-md rounded-2xl border border-line bg-navy-900 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 id="dialog-title" className="text-lg font-semibold">{copy.title}</h2>
          <button type="button" aria-label="Close" onClick={() => setDialog(null)} className="grid size-10 place-items-center rounded-lg border border-line">
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">{copy.body}</p>
        {dialog === "settings" && (
          <button type="button" onClick={resetDemo} className="mt-4 min-h-11 w-full rounded-lg border border-danger text-sm font-semibold text-down">
            Reset demo balance and bets
          </button>
        )}
        {dialog === "support" && <p className="mt-4 text-sm text-cyan">Balance on this device: {money(balance)} USDT</p>}
      </div>
    </div>
  );
}

function liveCount(sport: string) {
  return MATCHES.filter((match) => match.status === "live" && (sport === "all" || match.sport === sport)).length;
}

function FollowingBlock({ onNavigate }: { onNavigate?: () => void }) {
  const teams = useBook((state) => state.followedTeams);
  const leagues = useBook((state) => state.followedLeagues);
  const items = [
    ...leagues.map((id) => ({ key: `l-${id}`, label: LEAGUES.find((league) => league.id === id)?.name ?? id, league: id, matchId: null as string | null })),
    ...teams.map((name) => ({
      key: `t-${name}`,
      label: name,
      league: null as string | null,
      matchId: MATCHES.find((match) => match.home === name || match.away === name)?.id ?? null,
    })),
  ].slice(0, 6);
  return (
    <div className="pt-3">
      <p className="px-3 pb-1 text-xs font-semibold tracking-widest text-muted">FOLLOWING</p>
      {items.length === 0 ? (
        <p className="px-3 text-xs text-faint">Tap the star on a team or competition to keep it here.</p>
      ) : (
        items.map((item) =>
          item.league ? (
            <Link
              key={item.key}
              to="/football"
              search={{ league: item.league, when: "all" }}
              onClick={onNavigate}
              className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-muted hover:bg-navy-850 hover:text-ink"
            >
              <span className="truncate">{item.label}</span>
            </Link>
          ) : item.matchId ? (
            <Link
              key={item.key}
              to="/match/$matchId"
              params={{ matchId: item.matchId }}
              onClick={onNavigate}
              className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-muted hover:bg-navy-850 hover:text-ink"
            >
              <span className="truncate">{item.label}</span>
            </Link>
          ) : (
            <p key={item.key} className="min-h-10 px-3 py-2 text-sm text-muted">
              <span className="truncate">{item.label}</span>
            </p>
          ),
        )
      )}
    </div>
  );
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const boardSport = useBook((state) => state.boardSport);
  const setBoardSport = useBook((state) => state.setBoardSport);
  const setDialog = useBook((state) => state.setDialog);

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1 p-3" aria-label="Sports">
        <p className="px-3 pb-1 text-xs font-semibold tracking-widest text-muted">SPORTS</p>
        {SPORTS.map((sport) => {
          const active = path === "/" && boardSport === sport.id;
          return (
            <Link
              key={sport.id}
              to="/"
              onClick={() => {
                setBoardSport(sport.id);
                onNavigate?.();
              }}
              className={cn(
                "flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm",
                active ? "bg-navy-800 font-semibold text-cyan" : "text-muted hover:bg-navy-850 hover:text-ink",
              )}
            >
              <SportIcon sport={sport.id} />
              <span className="flex-1">{sport.label}</span>
              {liveCount(sport.id) > 0 ? <span className="text-xs text-faint tabular-nums">{liveCount(sport.id)}</span> : null}
            </Link>
          );
        })}
        <FollowingBlock onNavigate={onNavigate} />
      </nav>
      <div className="space-y-2 border-t border-line p-3">
        <Link
          to="/live"
          onClick={onNavigate}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm",
            path === "/live" ? "bg-navy-800 font-semibold text-cyan" : "text-muted hover:bg-navy-850 hover:text-ink",
          )}
        >
          <Radio className="size-4" />
          Live
        </Link>
        <Link
          to="/football"
          search={{ league: "all", when: "all" }}
          onClick={onNavigate}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm",
            path === "/football" ? "bg-navy-800 font-semibold text-cyan" : "text-muted hover:bg-navy-850 hover:text-ink",
          )}
        >
          <SportIcon sport="soccer" />
          Football
        </Link>
        <Link
          to="/bets"
          onClick={onNavigate}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm",
            path === "/bets" ? "bg-navy-800 font-semibold text-cyan" : "text-muted hover:bg-navy-850 hover:text-ink",
          )}
        >
          <Receipt className="size-4" />
          My bets
        </Link>
        <button type="button" onClick={() => setDialog("settings")} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm text-muted hover:bg-navy-850 hover:text-ink">
          <Settings className="size-4" />
          Settings
        </button>
        <button type="button" onClick={() => setDialog("support")} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm text-muted hover:bg-navy-850 hover:text-ink">
          <Headphones className="size-4" />
          Support
        </button>
        <button type="button" onClick={() => setDialog("settings")} className="flex min-h-11 w-full items-center justify-between rounded-lg border border-line px-3 text-sm">
          <span className="inline-flex items-center gap-2"><Globe className="size-4 text-muted" /> EN · Decimal</span>
          <ChevronDown className="size-4 text-muted" />
        </button>
      </div>
    </div>
  );
}

function TopBar() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const balance = useBook((state) => state.balance);
  const count = useBook((state) => state.slip.length);
  const setSlipOpen = useBook((state) => state.setSlipOpen);
  const slipOpen = useBook((state) => state.slipOpen);
  const setMenu = useBook((state) => state.setMenuOpen);
  const setDialog = useBook((state) => state.setDialog);
  const quotes = useBook((state) => state.quotes);
  const slip = useBook((state) => state.slip);
  const changed = slip.some((item) => {
    const quote = quotes[item.selectionId];
    return quote && !quote.suspended && Math.abs(quote.odds - item.acceptedOdds) > 0.001;
  });

  const links = [
    { to: "/" as const, label: "Sports", active: path === "/" },
    { to: "/live" as const, label: "Live", active: path === "/live" },
    { to: "/football" as const, label: "Football", active: path === "/football" || path.startsWith("/match") },
    { to: "/bets" as const, label: "My bets", active: path === "/bets" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-navy-950/95 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-3 lg:px-5">
        <button type="button" className="grid size-10 place-items-center lg:hidden" aria-label="Open menu" onClick={() => setMenu(true)}>
          <Menu className="size-5" />
        </button>
        <Link to="/" className="mr-2 hidden lg:inline-flex" aria-label="Housebets home">
          <Logo />
        </Link>
        <Link to="/" className="absolute left-1/2 -translate-x-1/2 lg:hidden" aria-label="Housebets home">
          <Logo compact />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) =>
            link.to === "/football" ? (
              <Link
                key={link.to}
                to="/football"
                search={{ league: "all", when: "all" }}
                className={cn(
                  "min-h-10 rounded-lg px-3 text-sm font-semibold",
                  link.active ? "text-cyan" : "text-muted hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            ) : (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "min-h-10 rounded-lg px-3 text-sm font-semibold",
                  link.active ? "text-cyan" : "text-muted hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <p className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-navy-900 px-3 text-sm font-semibold tabular-nums">
            <Coin className="text-cyan" />
            {money(balance)} USDT
          </p>
          <button type="button" aria-label="Notifications" onClick={() => setDialog("support")} className="relative grid size-10 place-items-center rounded-lg border border-line">
            <Bell className="size-4" />
            {changed && <span className="absolute top-2 right-2 size-2 rounded-full bg-cyan" />}
          </button>
          {path !== "/bets" && (
            <button type="button" onClick={() => setSlipOpen(!slipOpen)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold">
              <Ticket className="size-4 text-cyan" />
              Slip
              <span className="grid size-5 place-items-center rounded-full bg-aqua text-xs text-navy-950">{count}</span>
            </button>
          )}
        </div>
        <button type="button" aria-label="Notifications" onClick={() => setDialog("support")} className="relative ml-auto grid size-10 place-items-center md:hidden">
          <Bell className="size-5" />
          {changed && <span className="absolute top-2 right-2 size-2 rounded-full bg-cyan" />}
        </button>
      </div>
    </header>
  );
}

function MobileNav() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 border-t border-line bg-navy-950 lg:hidden" aria-label="Primary">
      <Link to="/" className={cn("flex flex-col items-center justify-center gap-0.5 text-xs", path === "/" ? "text-cyan" : "text-muted")}>
        <Home className="size-5" />
        Home
      </Link>
      <Link to="/football" search={{ league: "all", when: "all" }} className={cn("flex flex-col items-center justify-center gap-0.5 text-xs", path === "/football" ? "text-cyan" : "text-muted")}>
        <SportIcon sport="soccer" />
        Football
      </Link>
      <Link to="/live" className={cn("flex flex-col items-center justify-center gap-0.5 text-xs", path === "/live" ? "text-cyan" : "text-muted")}>
        <Radio className="size-5" />
        Live
      </Link>
      <Link to="/bets" className={cn("flex flex-col items-center justify-center gap-0.5 text-xs", path === "/bets" ? "text-cyan" : "text-muted")}>
        <Receipt className="size-5" />
        My bets
      </Link>
    </nav>
  );
}

function MenuDrawer() {
  const open = useBook((state) => state.menuOpen);
  const setOpen = useBook((state) => state.setMenuOpen);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" className="absolute inset-0 bg-navy-950/70" aria-label="Close menu" onClick={() => setOpen(false)} />
      <div className="absolute top-0 bottom-0 left-0 flex w-72 flex-col border-r border-line bg-navy-900">
        <div className="flex items-center justify-between border-b border-line px-3 py-3">
          <Logo compact />
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="grid size-10 place-items-center">
            <X className="size-4" />
          </button>
        </div>
        <SideNav onNavigate={() => setOpen(false)} />
      </div>
    </div>
  );
}

export function ScrollTail() {
  const count = useBook((state) => state.slip.length);
  const expanded = useBook((state) => state.slipExpanded);
  return (
    <>
      <p className="px-4 py-6 text-center text-xs text-faint">
        Housebets is a simulated sportsbook. Singles only, decimal odds, play-money USDT. No real wagering.
      </p>
      <div className={cn("lg:hidden", count === 0 && !expanded ? "h-32" : expanded ? "scroll-tail-open" : "h-36")} />
    </>
  );
}

export function BookShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const slipOpen = useBook((state) => state.slipOpen);

  return (
    <div className="min-h-svh bg-navy-950 text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-navy-900 focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <BookEngine />
      <TopBar />
      <div className={cn("flex", slipOpen && path !== "/bets" && "lg:pr-96")}>
        <aside className="side-scroll sticky top-14 hidden h-[calc(100svh-3.5rem)] w-56 shrink-0 overflow-y-auto border-r border-line bg-navy-950 lg:block">
          <SideNav />
        </aside>
        <div id="main" className="min-w-0 flex-1">
          {children}
        </div>
      </div>
      <MobileNav />
      {path !== "/bets" && <MobileSlip />}
      {path !== "/bets" && <DesktopSlip />}
      <MenuDrawer />
      <Dialogs />
    </div>
  );
}

export function SportChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {SPORTS.map((sport) => (
        <button
          key={sport.id}
          type="button"
          onClick={() => onChange(sport.id)}
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium",
            value === sport.id ? "border-cyan/40 bg-tab text-ink" : "border-line bg-navy-900 text-ink",
          )}
        >
          <SportIcon sport={sport.id} />
          {sport.label}
        </button>
      ))}
    </div>
  );
}
