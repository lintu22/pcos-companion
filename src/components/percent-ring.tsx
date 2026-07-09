// Small circular progress ring used to show a community stat as a fill
// percentage, with the number rendered in the center.
export function PercentRing({
  percent,
  size = 56,
  strokeWidth = 6,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden="true">
      {/* rotate just the progress circles so the fill starts at 12 o'clock; the
          percentage label is a separate, unrotated element */}
      <g transform={`rotate(-90 ${center} ${center})`}>
        <circle cx={center} cy={center} r={radius} strokeWidth={strokeWidth} className="fill-none stroke-muted" />
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="fill-none stroke-primary transition-[stroke-dashoffset] duration-500"
        />
      </g>
      <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-xs font-bold">
        {percent}%
      </text>
    </svg>
  );
}
