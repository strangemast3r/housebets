import { round2 } from "@/lib/betting/format";

export type SportId = "soccer" | "basketball" | "tennis" | "esports" | "mma" | "cricket";

export type MarketGroup = "popular" | "goals" | "halves" | "handicaps" | "scorers" | "corners";

export type Dir = "up" | "down";

export type Selection = {
  id: string;
  label: string;
  odds: number;
  suspended?: boolean;
  prev?: number;
  dir?: Dir | null;
};

export type Market = {
  id: string;
  name: string;
  group: MarketGroup;
  note?: string;
  suspended?: boolean;
  selections: Selection[];
};

export type Clock = {
  running: boolean;
  direction: "up" | "down";
  minute: number;
  second: number;
  period: string;
};

export type Match = {
  id: string;
  sport: SportId;
  leagueId: string;
  competition: string;
  region: string;
  home: string;
  away: string;
  homeShort: string;
  awayShort: string;
  status: "live" | "upcoming";
  startLabel: string;
  countdown?: string;
  score: [number, number] | null;
  scoreNote?: string;
  clock: Clock | null;
  note?: string;
  /** Minutes from now until kickoff. Live matches omit this. */
  kickoffMin?: number;
  homeSlot?: boolean;
  soonSlot?: boolean;
  featured?: boolean;
  markets: Market[];
};

export type Quote = {
  odds: number;
  prev: number | null;
  dir: Dir | null;
  suspended: boolean;
};

type Side = {
  key: string;
  label: string;
  odds: number;
  suspended?: boolean;
  prev?: number;
  dir?: Dir | null;
};

function market(id: string, name: string, group: MarketGroup, sides: Side[], note?: string): Market {
  return {
    id,
    name,
    group,
    note,
    selections: sides.map((side) => ({
      id: `${id}:${side.key}`,
      label: side.label,
      odds: round2(side.odds),
      suspended: side.suspended,
      prev: side.prev,
      dir: side.dir ?? null,
    })),
  };
}

function odd(n: number) {
  return round2(Math.min(26, Math.max(1.08, n)));
}

const SCORERS: Record<string, string[]> = {
  Arsenal: ["Noah Ellis", "Callum Ward", "Mateo Ruiz", "Leo Hart"],
  "Brighton & Hove Albion": ["Sam Okoye", "Kenji Arai", "Paolo Mendes", "Yaro Diallo"],
  "Manchester City": ["Erik Solberg", "Finn Adler", "Owen Blake", "Luca Moretti"],
  "Bayern Munich": ["Jonas Keller", "Amir Haddad", "Felix Braun", "Timo Vogel"],
  "Real Madrid": ["Diego Navarro", "Marco Silva", "Andre Costa", "Hugo Ferreira"],
  Barcelona: ["Rafa Ortega", "Nico Alvarez", "Enzo Vidal", "Pablo Serra"],
  "Atlético Madrid": ["Iker Molina", "Julian Vargas", "Andres Cruz", "Marcos Leon"],
  Liverpool: ["Malik Sow", "Luis Ortega", "Dario Novak", "Cody Brooks"],
  Chelsea: ["Cole Bennett", "Nick Archer", "Nolan Marsh", "Chris Lang"],
  Juventus: ["Dusan Petrov", "Kenan Rossi", "Teo Marino", "Federico Greco"],
  "Inter Milan": ["Lauro Bianchi", "Marcus Holm", "Nico Barone", "Hakan Demir"],
  "Borussia Dortmund": ["Sven Kruger", "Julian Kraft", "Karim Diallo", "Marcel Weiss"],
  "Bayer Leverkusen": ["Victor Mensah", "Florian Eck", "Jerome Frings", "Granit Novak"],
  "Crystal Palace": ["Emeka Obi", "Jean Matisse", "Miles Harper", "Ousmane Diop"],
};

function soccerMarkets(input: {
  id: string;
  home: string;
  away: string;
  w1: number;
  x: number;
  w2: number;
  drawSuspended?: boolean;
  over?: number;
  under?: number;
  exact?: number;
  overDir?: Dir;
  underDir?: Dir;
  overPrev?: number;
  underPrev?: number;
  bttsY?: number;
  bttsN?: number;
  nextH?: number;
  nextN?: number;
  nextA?: number;
  goalLine?: 2.5 | 3.5;
  hideBtts?: boolean;
  hideExact?: boolean;
  nextSuspended?: boolean;
  skipLines?: boolean;
}): Market[] {
  const { id, home, away } = input;
  const homeName =
    home === "Manchester City"
      ? "Man City"
      : home === "Brighton & Hove Albion"
        ? "Brighton"
        : home === "Atlético Madrid"
          ? "Atlético"
          : home === "Borussia Dortmund"
            ? "Dortmund"
            : home === "Bayer Leverkusen"
              ? "Leverkusen"
              : home === "Bayern Munich"
                ? "Bayern"
                : home === "Inter Milan"
                  ? "Inter"
                  : home;
  const awayName =
    away === "Manchester City"
      ? "Man City"
      : away === "Brighton & Hove Albion"
        ? "Brighton"
        : away === "Atlético Madrid"
          ? "Atlético"
          : away === "Borussia Dortmund"
            ? "Dortmund"
            : away === "Bayer Leverkusen"
              ? "Leverkusen"
              : away === "Bayern Munich"
                ? "Bayern"
                : away === "Inter Milan"
                  ? "Inter"
                  : away;
  const line = input.goalLine ?? 2.5;
  const over = input.over ?? odd(input.w1 < 1.7 ? 1.72 : 1.91);
  const under = input.under ?? odd(input.w1 < 1.7 ? 2.1 : 1.9);
  const exact = input.exact ?? 3.4;
  const fav = Math.min(input.w1, input.w2);
  const homeFav = input.w1 <= input.w2;
  const minus = odd(fav * 1.62);
  const plus = fav < 1.55 ? 1.58 : 1.74;
  const scorers = [
    ...(SCORERS[home] ?? []).slice(0, 4).map((name, index) => ({
      key: `h${index}`,
      label: name,
      odds: odd(2.1 + index * 0.85 + (homeFav ? 0 : 0.4)),
    })),
    ...(SCORERS[away] ?? []).slice(0, 3).map((name, index) => ({
      key: `a${index}`,
      label: name,
      odds: odd(2.4 + index * 0.9 + (homeFav ? 0.7 : 0)),
    })),
  ];
  const lineKey = line === 3.5 ? "35" : "25";
  const totals = [
    { key: `o${lineKey}`, label: `Over ${line}`, odds: over, dir: input.overDir, prev: input.overPrev },
    ...(input.hideExact || line === 3.5
      ? []
      : [{ key: "e25", label: "Exactly 2.5", odds: exact }]),
    { key: `u${lineKey}`, label: `Under ${line}`, odds: under, dir: input.underDir, prev: input.underPrev },
  ];

  const boards: Market[] = [
    market(
      `${id}:1x2`,
      "Match Result",
      "popular",
      [
        { key: "1", label: homeName, odds: input.w1 },
        { key: "x", label: "Draw", odds: input.x, suspended: input.drawSuspended },
        { key: "2", label: awayName, odds: input.w2 },
      ],
      "Winner of 90 minutes. Extra time does not count.",
    ),
    market(`${id}:tg`, "Total Goals", "popular", totals, "Total goals in the match (90 min)"),
  ];
  if (!input.hideBtts) {
    boards.push(
      market(
        `${id}:btts`,
        "Both Teams to Score",
        "popular",
        [
          { key: "y", label: "Yes", odds: input.bttsY ?? 1.72 },
          { key: "n", label: "No", odds: input.bttsN ?? 2.1 },
        ],
        "Both teams to score at least one goal (90 min).",
      ),
    );
  }
  boards.push(
    market(
      `${id}:next`,
      "Next Goal",
      "popular",
      [
        { key: "h", label: homeName, odds: input.nextH ?? odd(input.w1 + 0.4), suspended: input.nextSuspended },
        { key: "n", label: "No Goal", odds: input.nextN ?? 8.5, suspended: input.nextSuspended },
        { key: "a", label: awayName, odds: input.nextA ?? odd(input.w2 * 0.45 + 1.2), suspended: input.nextSuspended },
      ],
      "The team to score the next goal.",
    ),
  );
  if (!input.skipLines) {
    boards.push(
      market(`${id}:lines`, "Goal Lines", "goals", [
        { key: "o15", label: "Over 1.5", odds: odd(over - 0.42) },
        { key: "u15", label: "Under 1.5", odds: odd(under + 0.85) },
        ...(line === 3.5
          ? []
          : [
              { key: "o35", label: "Over 3.5", odds: odd(over + 0.7) },
              { key: "u35", label: "Under 3.5", odds: odd(under - 0.35) },
            ]),
        { key: "ho15", label: `${homeName} over 1.5`, odds: odd(homeFav ? 1.55 : 2.4) },
        { key: "ao05", label: `${awayName} over 0.5`, odds: odd(homeFav ? 2.15 : 1.48) },
      ]),
    );
  }
  boards.push(
    market(`${id}:ht`, "1st Half Result", "halves", [
      { key: "1", label: homeName, odds: odd(input.w1 + 0.72) },
      { key: "x", label: "Draw", odds: odd(input.x - 0.85) },
      { key: "2", label: awayName, odds: odd(input.w2 + 0.35) },
    ], "Result at half time."),
    market(`${id}:2h`, "2nd Half Result", "halves", [
      { key: "1", label: homeName, odds: odd(input.w1 + 0.48) },
      { key: "x", label: "Draw", odds: odd(Math.max(2.1, input.x - 1.1)) },
      { key: "2", label: awayName, odds: odd(input.w2 + 0.15) },
    ]),
    market(`${id}:hcap`, "Handicap", "handicaps", [
      { key: "hm15", label: `${homeName} -1.5`, odds: homeFav ? minus : odd(input.w1 + 1.4) },
      { key: "ap15", label: `${awayName} +1.5`, odds: homeFav ? plus : odd(input.w2 * 0.55) },
      { key: "hp05", label: `${homeName} -0.5`, odds: odd(input.w1 + 0.08) },
      { key: "ap05", label: `${awayName} +0.5`, odds: odd(Math.min(input.w2, 3.4)) },
    ], "90 minutes. Handicap applies to the match score."),
    market(`${id}:scorers`, "Anytime Goalscorer", "scorers", scorers, "Player to score at any time (90 min)."),
    market(`${id}:corners`, "Total Corners", "corners", [
      { key: "o85", label: "Over 8.5", odds: 1.72 },
      { key: "u85", label: "Under 8.5", odds: 2.08 },
      { key: "o95", label: "Over 9.5", odds: 1.95 },
      { key: "u95", label: "Under 9.5", odds: 1.83 },
      { key: "o105", label: "Over 10.5", odds: 2.25 },
      { key: "u105", label: "Under 10.5", odds: 1.62 },
    ], "Match corners, 90 minutes."),
    market(`${id}:cards`, "Total Cards", "corners", [
      { key: "o35", label: "Over 3.5", odds: 1.8 },
      { key: "u35", label: "Under 3.5", odds: 1.95 },
      { key: "o45", label: "Over 4.5", odds: 2.35 },
      { key: "u45", label: "Under 4.5", odds: 1.55 },
    ], "Booking points are not used. Cards only."),
  );
  return boards;
}

function basketballMarkets(input: {
  id: string;
  home: string;
  away: string;
  homeOdds: number;
  awayOdds: number;
  spread: string;
  spreadHome: number;
  spreadAway: number;
  total: string;
  over: number;
  under: number;
}): Market[] {
  const { id, home, away } = input;
  return [
    market(`${id}:ml`, "Moneyline", "popular", [
      { key: "home", label: home, odds: input.homeOdds },
      { key: "away", label: away, odds: input.awayOdds },
    ], "Includes overtime."),
    market(`${id}:spread`, "Spread", "popular", [
      { key: "h", label: `${home} ${input.spread}`, odds: input.spreadHome },
      { key: "a", label: `${away} ${input.spread.startsWith("-") ? input.spread.replace("-", "+") : input.spread.replace("+", "-")}`, odds: input.spreadAway },
    ]),
    market(`${id}:tot`, "Total Points", "popular", [
      { key: "o", label: `Over ${input.total}`, odds: input.over },
      { key: "u", label: `Under ${input.total}`, odds: input.under },
    ]),
    market(`${id}:q`, "1st Quarter Moneyline", "halves", [
      { key: "h", label: home, odds: odd(input.homeOdds + 0.35) },
      { key: "a", label: away, odds: odd(input.awayOdds + 0.22) },
    ]),
    market(`${id}:hcap`, "Alternate Spread", "handicaps", [
      { key: "h", label: `${home} -2.5`, odds: odd(input.homeOdds - 0.12) },
      { key: "a", label: `${away} +2.5`, odds: odd(input.awayOdds + 0.18) },
    ]),
    market(`${id}:props`, "Player Points", "scorers", [
      { key: "p1", label: `${home} top scorer over 24.5`, odds: 1.87 },
      { key: "p2", label: `${away} top scorer over 24.5`, odds: 1.91 },
    ]),
  ];
}

export const SPORTS: { id: SportId | "all"; label: string }[] = [
  { id: "all", label: "All Sports" },
  { id: "soccer", label: "Soccer" },
  { id: "basketball", label: "Basketball" },
  { id: "tennis", label: "Tennis" },
  { id: "esports", label: "Esports" },
  { id: "mma", label: "MMA" },
  { id: "cricket", label: "Cricket" },
];

export const LEAGUES = [
  { id: "premier-league", name: "Premier League", region: "England" },
  { id: "champions-league", name: "Champions League", region: "Europe" },
  { id: "laliga", name: "LaLiga", region: "Spain" },
  { id: "serie-a", name: "Serie A", region: "Italy" },
  { id: "bundesliga", name: "Bundesliga", region: "Germany" },
  { id: "nba", name: "NBA", region: "USA" },
  { id: "tennis", name: "ATP Finals", region: "Turin" },
];

function match(partial: Match): Match {
  return partial;
}

export const MATCHES: Match[] = [
  match({
    id: "mci-ars",
    sport: "soccer",
    leagueId: "premier-league",
    competition: "Premier League",
    region: "England",
    home: "Manchester City",
    away: "Arsenal",
    homeShort: "Man City",
    awayShort: "Arsenal",
    status: "upcoming",
    startLabel: "Tomorrow, 15:00",
    kickoffMin: 900,
    score: null,
    clock: null,
    markets: soccerMarkets({ id: "mci-ars", home: "Manchester City", away: "Arsenal", w1: 1.62, x: 4.1, w2: 5.4 }),
  }),
  match({
    id: "bay-rma",
    sport: "soccer",
    leagueId: "champions-league",
    competition: "Champions League",
    region: "Europe",
    home: "Bayern Munich",
    away: "Real Madrid",
    homeShort: "Bayern",
    awayShort: "Real Madrid",
    status: "live",
    startLabel: "Today, 21:00",
    score: [2, 1],
    clock: { running: true, direction: "up", minute: 68, second: 11, period: "2nd Half" },
    homeSlot: true,
    markets: soccerMarkets({
      id: "bay-rma",
      home: "Bayern Munich",
      away: "Real Madrid",
      w1: 1.91,
      x: 3.6,
      w2: 3.75,
      goalLine: 3.5,
      hideBtts: true,
      hideExact: true,
      skipLines: true,
    }),
  }),
  match({
    id: "bar-atm",
    sport: "soccer",
    leagueId: "laliga",
    competition: "LaLiga",
    region: "Spain",
    home: "Barcelona",
    away: "Atlético Madrid",
    homeShort: "Barcelona",
    awayShort: "Atlético",
    status: "live",
    startLabel: "Today, 18:15",
    score: [0, 0],
    clock: { running: true, direction: "up", minute: 33, second: 47, period: "1st Half" },
    homeSlot: true,
    markets: soccerMarkets({ id: "bar-atm", home: "Barcelona", away: "Atlético Madrid", w1: 2.05, x: 3.3, w2: 3.4 }),
  }),
  match({
    id: "ars-bha",
    sport: "soccer",
    leagueId: "premier-league",
    competition: "Premier League",
    region: "England",
    home: "Arsenal",
    away: "Brighton & Hove Albion",
    homeShort: "Arsenal",
    awayShort: "Brighton",
    status: "live",
    startLabel: "Today, 16:00",
    score: [2, 1],
    clock: { running: true, direction: "up", minute: 63, second: 24, period: "2nd Half" },
    featured: true,
    markets: soccerMarkets({
      id: "ars-bha",
      home: "Arsenal",
      away: "Brighton & Hove Albion",
      w1: 1.36,
      x: 4.2,
      w2: 7.5,
      goalLine: 3.5,
      hideBtts: true,
      hideExact: true,
      nextSuspended: true,
      skipLines: true,
      over: 1.72,
      under: 2.1,
      overDir: "up",
      underDir: "down",
      overPrev: 1.66,
      underPrev: 2.22,
    }),
  }),
  match({
    id: "nyk-bos",
    sport: "basketball",
    leagueId: "nba",
    competition: "NBA",
    region: "USA",
    home: "New York Knicks",
    away: "Boston Celtics",
    homeShort: "Knicks",
    awayShort: "Celtics",
    status: "live",
    startLabel: "Today, 01:30",
    score: [52, 48],
    clock: { running: true, direction: "down", minute: 23, second: 47, period: "1st Half" },
    note: "NBA",
    markets: basketballMarkets({
      id: "nyk-bos",
      home: "New York Knicks",
      away: "Boston Celtics",
      homeOdds: 1.72,
      awayOdds: 2.15,
      spread: "-1.5",
      spreadHome: 1.9,
      spreadAway: 1.9,
      total: "214.5",
      over: 1.87,
      under: 1.93,
    }),
  }),
  match({
    id: "ind-aus",
    sport: "cricket",
    leagueId: "cricket",
    competition: "ODI",
    region: "International",
    home: "India",
    away: "Australia",
    homeShort: "India",
    awayShort: "Australia",
    status: "live",
    startLabel: "Today, 10:30",
    score: null,
    scoreNote: "180/4 vs 42/1",
    clock: { running: false, direction: "up", minute: 14, second: 2, period: "2nd inns" },
    markets: [
      market("ind-aus:mw", "Match Winner", "popular", [
        { key: "ind", label: "India", odds: 1.44 },
        { key: "aus", label: "Australia", odds: 2.75 },
      ]),
      market("ind-aus:tot", "Total Runs", "goals", [
        { key: "o", label: "Over 285.5", odds: 1.83 },
        { key: "u", label: "Under 285.5", odds: 1.95 },
      ]),
    ],
  }),
  match({
    id: "liv-che",
    sport: "soccer",
    leagueId: "premier-league",
    competition: "Premier League",
    region: "England",
    home: "Liverpool",
    away: "Chelsea",
    homeShort: "Liverpool",
    awayShort: "Chelsea",
    status: "upcoming",
    startLabel: "Today, 20:00",
    kickoffMin: 151,
    countdown: "2h 31m",
    score: null,
    clock: null,
    soonSlot: true,
    markets: soccerMarkets({ id: "liv-che", home: "Liverpool", away: "Chelsea", w1: 1.72, x: 3.8, w2: 4.6 }),
  }),
  match({
    id: "juv-int",
    sport: "soccer",
    leagueId: "serie-a",
    competition: "Serie A",
    region: "Italy",
    home: "Juventus",
    away: "Inter Milan",
    homeShort: "Juventus",
    awayShort: "Inter",
    status: "upcoming",
    startLabel: "Today, 20:45",
    kickoffMin: 196,
    countdown: "3h 16m",
    score: null,
    clock: null,
    soonSlot: true,
    markets: soccerMarkets({ id: "juv-int", home: "Juventus", away: "Inter Milan", w1: 2.85, x: 3.25, w2: 2.5 }),
  }),
  match({
    id: "bvb-b04",
    sport: "soccer",
    leagueId: "bundesliga",
    competition: "Bundesliga",
    region: "Germany",
    home: "Borussia Dortmund",
    away: "Bayer Leverkusen",
    homeShort: "Dortmund",
    awayShort: "Leverkusen",
    status: "upcoming",
    startLabel: "Today, 18:30",
    kickoffMin: 61,
    countdown: "1h 01m",
    score: null,
    clock: null,
    soonSlot: true,
    markets: soccerMarkets({ id: "bvb-b04", home: "Borussia Dortmund", away: "Bayer Leverkusen", w1: 2.2, x: 3.55, w2: 3.1 }),
  }),
  match({
    id: "liv-cry",
    sport: "soccer",
    leagueId: "premier-league",
    competition: "Premier League",
    region: "England",
    home: "Liverpool",
    away: "Crystal Palace",
    homeShort: "Liverpool",
    awayShort: "Crystal Palace",
    status: "upcoming",
    startLabel: "Tomorrow, 15:00",
    kickoffMin: 900,
    score: null,
    clock: null,
    note: "Premier League",
    markets: soccerMarkets({ id: "liv-cry", home: "Liverpool", away: "Crystal Palace", w1: 1.36, x: 5.1, w2: 8.4 }),
  }),
  match({
    id: "okc-ind",
    sport: "basketball",
    leagueId: "nba",
    competition: "NBA",
    region: "USA",
    home: "Oklahoma City Thunder",
    away: "Indiana Pacers",
    homeShort: "Thunder",
    awayShort: "Pacers",
    status: "upcoming",
    startLabel: "Tomorrow, 20:00",
    kickoffMin: 1100,
    score: null,
    clock: null,
    note: "NBA",
    markets: basketballMarkets({
      id: "okc-ind",
      home: "Oklahoma City Thunder",
      away: "Indiana Pacers",
      homeOdds: 1.68,
      awayOdds: 2.22,
      spread: "-4.5",
      spreadHome: 1.9,
      spreadAway: 1.9,
      total: "221.5",
      over: 1.87,
      under: 1.93,
    }),
  }),
  match({
    id: "rma-bar",
    sport: "soccer",
    leagueId: "laliga",
    competition: "LaLiga",
    region: "Spain",
    home: "Real Madrid",
    away: "Barcelona",
    homeShort: "Real Madrid",
    awayShort: "Barcelona",
    status: "upcoming",
    startLabel: "Tomorrow, 21:00",
    kickoffMin: 1200,
    score: null,
    clock: null,
    markets: soccerMarkets({ id: "rma-bar", home: "Real Madrid", away: "Barcelona", w1: 1.9, x: 3.4, w2: 3.75 }),
  }),
  match({
    id: "lal-bos",
    sport: "basketball",
    leagueId: "nba",
    competition: "NBA",
    region: "USA",
    home: "L.A. Lakers",
    away: "Boston Celtics",
    homeShort: "Lakers",
    awayShort: "Celtics",
    status: "upcoming",
    startLabel: "Tomorrow, 01:30",
    kickoffMin: 500,
    score: null,
    clock: null,
    markets: basketballMarkets({
      id: "lal-bos",
      home: "L.A. Lakers",
      away: "Boston Celtics",
      homeOdds: 1.75,
      awayOdds: 2.05,
      spread: "-1.5",
      spreadHome: 1.91,
      spreadAway: 1.87,
      total: "226.5",
      over: 1.9,
      under: 1.9,
    }),
  }),
  match({
    id: "heat-phi",
    sport: "basketball",
    leagueId: "nba",
    competition: "NBA",
    region: "USA",
    home: "Miami Heat",
    away: "Philadelphia 76ers",
    homeShort: "Heat",
    awayShort: "76ers",
    status: "upcoming",
    startLabel: "Tomorrow, 03:00",
    kickoffMin: 560,
    score: null,
    clock: null,
    markets: basketballMarkets({
      id: "heat-phi",
      home: "Miami Heat",
      away: "Philadelphia 76ers",
      homeOdds: 2.35,
      awayOdds: 1.62,
      spread: "+3.5",
      spreadHome: 1.9,
      spreadAway: 1.9,
      total: "218.5",
      over: 1.87,
      under: 1.93,
    }).map((item) => {
      if (item.id !== "heat-phi:ml") return item;
      return {
        ...item,
        selections: item.selections.map((selection) =>
          selection.id === "heat-phi:ml:home"
            ? { ...selection, id: "heat-phi:ml:heat", prev: 2.1, dir: "up" as const, odds: 2.35 }
            : selection,
        ),
      };
    }),
  }),
  match({
    id: "varga-melnik",
    sport: "tennis",
    leagueId: "tennis",
    competition: "ATP Finals",
    region: "Turin",
    home: "Nico Varga",
    away: "Dario Melnik",
    homeShort: "Varga",
    awayShort: "Melnik",
    status: "upcoming",
    startLabel: "Tomorrow, 14:00",
    kickoffMin: 800,
    score: null,
    clock: null,
    note: "ATP Finals",
    markets: [
      market("varga-melnik:mw", "Match Winner", "popular", [
        { key: "varga", label: "Nico Varga", odds: 1.45, suspended: true },
        { key: "melnik", label: "Dario Melnik", odds: 2.75 },
      ], "This market is partly suspended."),
      market("varga-melnik:sets", "Set Betting", "goals", [
        { key: "20", label: "Varga 2-0", odds: 2.05 },
        { key: "21", label: "Varga 2-1", odds: 3.6 },
        { key: "12", label: "Melnik 2-1", odds: 5.5 },
        { key: "02", label: "Melnik 2-0", odds: 6.4 },
      ]),
      market("varga-melnik:games", "Total Games", "handicaps", [
        { key: "o", label: "Over 22.5", odds: 1.83 },
        { key: "u", label: "Under 22.5", odds: 1.95 },
      ]),
    ],
  }),
  match({
    id: "sen-fnc",
    sport: "esports",
    leagueId: "esports",
    competition: "VCT",
    region: "EMEA",
    home: "Sentinels",
    away: "Fnatic",
    homeShort: "Sentinels",
    awayShort: "Fnatic",
    status: "upcoming",
    startLabel: "Today, 19:00",
    kickoffMin: 117,
    score: null,
    clock: null,
    markets: [
      market("sen-fnc:mw", "Match Winner", "popular", [
        { key: "sen", label: "Sentinels", odds: 1.72 },
        { key: "fnc", label: "Fnatic", odds: 2.1 },
      ]),
      market("sen-fnc:maps", "Total Maps", "goals", [
        { key: "o", label: "Over 2.5", odds: 2.05 },
        { key: "u", label: "Under 2.5", odds: 1.74 },
      ]),
    ],
  }),
  match({
    id: "ade-per",
    sport: "mma",
    leagueId: "mma",
    competition: "UFC",
    region: "Las Vegas",
    home: "Ilan Adeyemi",
    away: "Kai Romero",
    homeShort: "Adeyemi",
    awayShort: "Romero",
    status: "upcoming",
    startLabel: "Tomorrow, 22:00",
    kickoffMin: 1300,
    score: null,
    clock: null,
    markets: [
      market("ade-per:mw", "Fight Winner", "popular", [
        { key: "ade", label: "Ilan Adeyemi", odds: 2.45 },
        { key: "per", label: "Kai Romero", odds: 1.55 },
      ]),
      market("ade-per:dist", "Method", "goals", [
        { key: "ko", label: "Fight goes to decision", odds: 2.2 },
        { key: "fin", label: "Fight ends inside distance", odds: 1.66 },
      ]),
    ],
  }),
];

export function getMatch(id: string) {
  return MATCHES.find((item) => item.id === id);
}

export function matchLabel(matchItem: Pick<Match, "home" | "away">) {
  return `${matchItem.home} vs ${matchItem.away}`;
}

export function initialQuotes(): Record<string, Quote> {
  const quotes: Record<string, Quote> = {};
  for (const item of MATCHES) {
    for (const board of item.markets) {
      for (const selection of board.selections) {
        quotes[selection.id] = {
          odds: selection.odds,
          prev: selection.prev ?? null,
          dir: selection.dir ?? null,
          suspended: Boolean(selection.suspended || board.suspended),
        };
      }
    }
  }
  return quotes;
}

export function tabsFor(sport: SportId): { id: MarketGroup; label: string }[] {
  if (sport === "basketball") {
    return [
      { id: "popular", label: "Popular" },
      { id: "goals", label: "Points" },
      { id: "halves", label: "Quarters" },
      { id: "handicaps", label: "Handicaps" },
      { id: "scorers", label: "Player Props" },
    ];
  }
  if (sport === "tennis") {
    return [
      { id: "popular", label: "Popular" },
      { id: "goals", label: "Sets" },
      { id: "handicaps", label: "Games" },
    ];
  }
  if (sport === "soccer") {
    return [
      { id: "popular", label: "Popular" },
      { id: "goals", label: "Goals" },
      { id: "halves", label: "Halves" },
      { id: "handicaps", label: "Handicaps" },
      { id: "scorers", label: "Goalscorers" },
      { id: "corners", label: "Corners & Cards" },
    ];
  }
  return [
    { id: "popular", label: "Popular" },
    { id: "goals", label: "Totals" },
  ];
}

export function liveSelectionIds() {
  const ids: string[] = [];
  for (const item of MATCHES) {
    const include = item.status === "live" || item.id === "heat-phi";
    if (!include) continue;
    for (const board of item.markets) {
      if (board.group !== "popular") continue;
      for (const selection of board.selections) ids.push(selection.id);
    }
  }
  return ids;
}

export const FEATURED_STATS = [
  { label: "Possession", home: 58, away: 42, suffix: "%" },
  { label: "Shots", home: 14, away: 7, suffix: "" },
  { label: "Shots on target", home: 6, away: 2, suffix: "" },
  { label: "Corners", home: 7, away: 3, suffix: "" },
  { label: "Fouls", home: 8, away: 11, suffix: "" },
];

export const FEATURED_EVENTS = [
  { minute: "12'", text: "Goal · Noah Ellis", side: "Arsenal" },
  { minute: "41'", text: "Goal · Sam Okoye", side: "Brighton" },
  { minute: "58'", text: "Goal · Leo Hart", side: "Arsenal" },
];

export function derivedStats(item: Match) {
  const home = item.score?.[0] ?? 0;
  const away = item.score?.[1] ?? 0;
  return [
    { label: "Attacks", home: 48 + home * 6, away: 41 + away * 6, suffix: "" },
    { label: "Shots", home: 6 + home * 3, away: 5 + away * 3, suffix: "" },
    { label: "Corners", home: 3 + home, away: 2 + away, suffix: "" },
    { label: "Fouls", home: 8 + away, away: 7 + home, suffix: "" },
  ];
}

export type SearchKind = "Team" | "Player" | "Competition" | "Market";

export type SearchHit = {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  matchId: string;
  leagueId: string;
  sport: SportId;
};

function fold(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ø/g, "o")
    .replace(/ł/g, "l")
    .replace(/đ/g, "d")
    .replace(/ß/g, "ss");
}

export function searchBoard(raw: string): SearchHit[] {
  const query = fold(raw.trim());
  if (query.length < 2) return [];
  const hits: SearchHit[] = [];
  const seen = new Set<string>();
  const push = (hit: SearchHit) => {
    if (seen.has(hit.id)) return;
    seen.add(hit.id);
    hits.push(hit);
  };
  for (const item of MATCHES) {
    const fixture = `${item.homeShort} vs ${item.awayShort}`;
    for (const name of [item.home, item.away, item.homeShort, item.awayShort]) {
      if (!fold(name).includes(query)) continue;
      push({
        id: `team:${item.id}:${fold(name)}`,
        kind: "Team",
        title: name,
        subtitle: `${item.competition} · ${fixture}`,
        matchId: item.id,
        leagueId: item.leagueId,
        sport: item.sport,
      });
    }
    if (fold(item.competition).includes(query)) {
      push({
        id: `comp:${item.leagueId}`,
        kind: "Competition",
        title: item.competition,
        subtitle: item.region,
        matchId: item.id,
        leagueId: item.leagueId,
        sport: item.sport,
      });
    }
    for (const board of item.markets) {
      if (fold(board.name).includes(query)) {
        push({
          id: `mkt:${board.id}`,
          kind: "Market",
          title: board.name,
          subtitle: fixture,
          matchId: item.id,
          leagueId: item.leagueId,
          sport: item.sport,
        });
      }
      if (board.group !== "scorers") continue;
      for (const selection of board.selections) {
        if (!fold(selection.label).includes(query)) continue;
        push({
          id: `pl:${selection.id}`,
          kind: "Player",
          title: selection.label,
          subtitle: `${fixture} · ${board.name}`,
          matchId: item.id,
          leagueId: item.leagueId,
          sport: item.sport,
        });
      }
    }
  }
  const order: Record<SearchKind, number> = { Team: 0, Player: 1, Competition: 2, Market: 3 };
  return hits.sort((a, b) => order[a.kind] - order[b.kind] || a.title.localeCompare(b.title));
}

export function byKickoff(a: Match, b: Match) {
  return (a.kickoffMin ?? 99_999) - (b.kickoffMin ?? 99_999);
}

export function competitionsIn(sport: SportId | "all") {
  const seen = new Set<string>();
  const list: { id: string; name: string }[] = [];
  for (const item of MATCHES) {
    if (sport !== "all" && item.sport !== sport) continue;
    if (seen.has(item.leagueId)) continue;
    seen.add(item.leagueId);
    list.push({ id: item.leagueId, name: item.competition });
  }
  return list;
}
