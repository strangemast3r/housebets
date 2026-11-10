import { useEffect, useState } from "react";
import type { Clock } from "@/lib/betting/data";

export function useTickingClock(clock: Clock | null | undefined) {
  const [extra, setExtra] = useState(0);
  const running = Boolean(clock?.running);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setExtra((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  if (!clock) return null;
  let total = clock.minute * 60 + clock.second;
  if (clock.running) {
    total = clock.direction === "down" ? Math.max(0, total - extra) : total + extra;
  }
  const minute = Math.floor(total / 60);
  const second = total % 60;
  return {
    text: `${minute}:${String(second).padStart(2, "0")}`,
    period: clock.period,
  };
}
