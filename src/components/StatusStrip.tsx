interface Props {
  results: boolean[];
}

/** A row of small bars, one per recent check, green for pass and red for fail, oldest on the left. */
export function StatusStrip({ results }: Props) {
  if (results.length === 0) return null;
  const failed = results.filter((ok) => !ok).length;
  const label = `Last ${results.length} checks: ${results.length - failed} passed, ${failed} failed`;
  return (
    <span className="strip" role="img" aria-label={label} title={label}>
      {results.map((ok, i) => (
        <span key={i} className={ok ? "strip-ok" : "strip-fail"} />
      ))}
    </span>
  );
}
