import type { StatusFilter } from "../types";

interface Props {
  value: StatusFilter;
  onChange: (next: StatusFilter) => void;
}

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "failing", label: "Failing" },
  { value: "passing", label: "Passing" },
];

export function FilterBar({ value, onChange }: Props) {
  return (
    <div role="group" aria-label="Filter checks" className="filters">
      {OPTIONS.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
