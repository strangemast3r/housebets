export type Kit = {
  bg: string;
  fg: string;
  trim: string;
  initials: string;
  shape: "shield" | "circle";
};

const KITS: Record<string, Kit> = {
  "Manchester City": { bg: "#6CABDD", fg: "#072033", trim: "#c5e6f8", initials: "MCI", shape: "shield" },
  Arsenal: { bg: "#EF0107", fg: "#ffffff", trim: "#ffd3d3", initials: "AFC", shape: "shield" },
  "Bayern Munich": { bg: "#DC052D", fg: "#ffffff", trim: "#ffd0da", initials: "FCB", shape: "shield" },
  "Real Madrid": { bg: "#f8fafc", fg: "#111827", trim: "#c9a227", initials: "RMA", shape: "shield" },
  Barcelona: { bg: "#A50044", fg: "#ffffff", trim: "#ffd1e3", initials: "BAR", shape: "shield" },
  "Atlético Madrid": { bg: "#CB3524", fg: "#ffffff", trim: "#ffe0d8", initials: "ATM", shape: "shield" },
  Liverpool: { bg: "#C8102E", fg: "#ffffff", trim: "#ffd0d8", initials: "LFC", shape: "shield" },
  Chelsea: { bg: "#034694", fg: "#ffffff", trim: "#c9def8", initials: "CHE", shape: "shield" },
  Juventus: { bg: "#111111", fg: "#ffffff", trim: "#d4d4d4", initials: "JUV", shape: "shield" },
  "Inter Milan": { bg: "#010E80", fg: "#ffffff", trim: "#c7d2fe", initials: "INT", shape: "shield" },
  "Borussia Dortmund": { bg: "#FDE100", fg: "#111111", trim: "#111111", initials: "BVB", shape: "shield" },
  "Bayer Leverkusen": { bg: "#E32221", fg: "#ffffff", trim: "#111111", initials: "B04", shape: "shield" },
  "Brighton & Hove Albion": { bg: "#0057B8", fg: "#ffffff", trim: "#d6ecff", initials: "BHA", shape: "shield" },
  "Crystal Palace": { bg: "#1B458F", fg: "#ffffff", trim: "#C4122E", initials: "CRY", shape: "shield" },
  "New York Knicks": { bg: "#006BB6", fg: "#ffffff", trim: "#F58426", initials: "NYK", shape: "shield" },
  "Boston Celtics": { bg: "#007A33", fg: "#ffffff", trim: "#c8f5d8", initials: "BOS", shape: "shield" },
  "Oklahoma City Thunder": { bg: "#007AC1", fg: "#ffffff", trim: "#EF3B24", initials: "OKC", shape: "shield" },
  "Indiana Pacers": { bg: "#002D62", fg: "#FDBB30", trim: "#FDBB30", initials: "IND", shape: "shield" },
  "Miami Heat": { bg: "#98002E", fg: "#F9A01B", trim: "#F9A01B", initials: "MIA", shape: "shield" },
  "Philadelphia 76ers": { bg: "#006BB6", fg: "#ffffff", trim: "#ED174C", initials: "PHI", shape: "shield" },
  "L.A. Lakers": { bg: "#552583", fg: "#FDB927", trim: "#FDB927", initials: "LAL", shape: "shield" },
  "Nico Varga": { bg: "#0b1d36", fg: "#ffffff", trim: "#2ad4f4", initials: "NV", shape: "circle" },
  "Dario Melnik": { bg: "#1c1c1c", fg: "#ffffff", trim: "#a3a3a3", initials: "DM", shape: "circle" },
  India: { bg: "#0a3d91", fg: "#ffffff", trim: "#ff9933", initials: "IND", shape: "shield" },
  Australia: { bg: "#ffcd00", fg: "#0a3d2c", trim: "#0a3d2c", initials: "AUS", shape: "shield" },
  Sentinels: { bg: "#111111", fg: "#ffffff", trim: "#e11d48", initials: "SEN", shape: "shield" },
  Fnatic: { bg: "#ff5900", fg: "#111111", trim: "#111111", initials: "FNC", shape: "shield" },
  "Ilan Adeyemi": { bg: "#111827", fg: "#ffffff", trim: "#f5c518", initials: "IA", shape: "circle" },
  "Kai Romero": { bg: "#3f1d1d", fg: "#ffffff", trim: "#fb7185", initials: "KR", shape: "circle" },
};

export function kitFor(name: string): Kit {
  const known = KITS[name];
  if (known) return known;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 3)
    .toUpperCase();
  return { bg: "#1e293b", fg: "#f8fafc", trim: "#94a3b8", initials: initials || "HB", shape: "shield" };
}
