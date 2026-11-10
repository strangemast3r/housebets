import { createFileRoute } from "@tanstack/react-router";
import { MyBets } from "@/components/my-bets";
import { SlipBody } from "@/components/slip";
import { ScrollTail } from "@/components/shell";

export const Route = createFileRoute("/bets")({
  head: () => ({ meta: [{ title: "Housebets — Bet slip" }] }),
  component: BetsPage,
});

function BetsPage() {
  return (
    <main className="p-3 lg:p-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-navy-900 p-3 lg:p-4">
          <MyBets />
        </section>
        <section className="hidden rounded-2xl border border-line bg-navy-900 p-4 lg:block">
          <SlipBody />
        </section>
      </div>
      <ScrollTail />
    </main>
  );
}
