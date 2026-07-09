// Static 6-axis radar used as the landing-page "app preview". Replaces the old
// flat PNG whose corner letters (A–F) were baked-in pixels and couldn't be
// relabelled. Labels here are real symptoms and editable in code.

const SIZE = 640;
const CX = SIZE / 2;
const CY = 206;
const MAX_RADIUS = 150;
const LABEL_OFFSET = 26;
const RINGS = [1, 2, 3, 4, 5];
const MAX_VALUE = 5;

// Corner order matches the original mockup: A top-left, B top-right, C right,
// D bottom-right, E bottom-left, F left. Walked here by axis angle.
const AXES = [
  { label: "Mood", angle: 0 }, // C, right
  { label: "Acne", angle: 60 }, // B, top-right
  { label: "Fatigue", angle: 120 }, // A, top-left
  { label: "Weight gain", angle: 180 }, // F, left
  { label: ["Irregular", "period"], angle: 240 }, // E, bottom-left
  { label: "Hair changes", angle: 300 }, // D, bottom-right
];

// A few overlapping data rings echo the layered look of the original design.
const SERIES = [
  { values: [5, 3, 4, 2, 4, 3], className: "fill-emerald-500/25 stroke-emerald-500" },
  { values: [3, 5, 2, 4, 2, 5], className: "fill-amber-400/30 stroke-amber-400" },
  { values: [2, 2, 3, 3, 3, 2], className: "fill-rose-400/30 stroke-rose-400" },
];

function point(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

function anchorFor(x: number): "start" | "middle" | "end" {
  if (Math.abs(x - CX) < 12) return "middle";
  return x > CX ? "start" : "end";
}

export function AppPreviewChart() {
  return (
    <svg
      viewBox={`0 0 ${SIZE} 412`}
      className="mx-auto w-full max-w-md"
      role="img"
      aria-label="Symptom severity radar preview"
    >
      {/* grid rings */}
      {RINGS.map((ring) => {
        const r = (ring / MAX_VALUE) * MAX_RADIUS;
        const pts = AXES.map((a) => point(a.angle, r));
        return (
          <polygon
            key={ring}
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            className="fill-none stroke-muted-foreground/25"
            strokeWidth={1}
          />
        );
      })}

      {/* axis spokes */}
      {AXES.map((a, i) => {
        const p = point(a.angle, MAX_RADIUS);
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={p.x}
            y2={p.y}
            className="stroke-muted-foreground/25"
            strokeWidth={1}
          />
        );
      })}

      {/* data series */}
      {SERIES.map((s, i) => {
        const pts = AXES.map((a, j) => point(a.angle, (s.values[j] / MAX_VALUE) * MAX_RADIUS));
        return (
          <polygon
            key={i}
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            className={s.className}
            strokeWidth={2}
          />
        );
      })}

      {/* corner labels */}
      {AXES.map((a, i) => {
        const p = point(a.angle, MAX_RADIUS + LABEL_OFFSET);
        const anchor = anchorFor(p.x);
        const lines = Array.isArray(a.label) ? a.label : [a.label];
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-muted-foreground text-[13px] font-medium"
          >
            {lines.map((line, li) => (
              <tspan key={li} x={p.x} dy={li === 0 ? `${-(lines.length - 1) * 0.6}em` : "1.2em"}>
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}
