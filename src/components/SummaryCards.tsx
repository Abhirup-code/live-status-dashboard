import { formatLatency, type Stats } from "../lib/stats";

interface Props {
  stats: Stats;
}

export function SummaryCards({ stats }: Props) {
  const cards = [
    { label: "Checks", value: String(stats.total), tone: "neutral" },
    { label: "Passing", value: String(stats.passed), tone: "good" },
    { label: "Failing", value: String(stats.failed), tone: stats.failed > 0 ? "bad" : "neutral" },
    { label: "Avg latency", value: formatLatency(stats.avgLatencyMs), tone: "neutral" },
  ];

  return (
    <section aria-label="Summary" className="cards">
      {cards.map((c) => (
        <div key={c.label} className={`card card-${c.tone}`}>
          <div className="card-label">{c.label}</div>
          <div className="card-value" data-testid={`card-${c.label.toLowerCase().replace(" ", "-")}`}>
            {c.value}
          </div>
        </div>
      ))}
    </section>
  );
}
