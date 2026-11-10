export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function money(n: number) {
  return round2(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function oddsText(n: number) {
  return round2(n).toFixed(2);
}

export function parseStake(raw: string) {
  const n = Number(raw.replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return round2(n);
}
