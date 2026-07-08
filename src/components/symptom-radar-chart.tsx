"use client";

import { SymptomKey } from "@/lib/research-data";

export interface RadarDatum {
  symptom: SymptomKey;
  label: string;
  value: number; // 0-4
}

const SIZE = 320;
const CENTER = SIZE / 2;
const MAX_RADIUS = 78;
const LABEL_OFFSET = 20;
const MAX_VALUE = 4;
const RINGS = [1, 2, 3, 4];

// Short axis labels so text fits within the SVG viewBox without clipping —
// the full symptom label is still used everywhere else on the page.
const SHORT_LABELS: Partial<Record<SymptomKey, string>> = {
  irregular_periods: "Irregular periods",
  weight_gain: "Weight gain",
  hair_growth: "Hair growth",
  acne: "Acne",
  cravings_blood_sugar: "Cravings/energy",
};

function pointFor(index: number, count: number, radius: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

function labelAnchor(index: number, count: number): "start" | "middle" | "end" {
  const angle = (-Math.PI / 2 + (index * 2 * Math.PI) / count + 2 * Math.PI) % (2 * Math.PI);
  const cos = Math.cos(angle);
  if (Math.abs(cos) < 0.35) return "middle";
  return cos > 0 ? "start" : "end";
}

export function SymptomRadarChart({
  data,
  selected,
  onSelect,
}: {
  data: RadarDatum[];
  selected: SymptomKey | null;
  onSelect: (symptom: SymptomKey) => void;
}) {
  const count = data.length;
  if (count < 3) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough answered symptoms yet to draw a chart.
      </p>
    );
  }

  const dataPoints = data.map((d, i) => pointFor(i, count, (d.value / MAX_VALUE) * MAX_RADIUS));
  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto w-full max-w-[280px]"
      role="img"
      aria-label="Symptom severity radar chart"
    >
      {/* grid rings */}
      {RINGS.map((ring) => {
        const r = (ring / MAX_VALUE) * MAX_RADIUS;
        const pts = data.map((_, i) => pointFor(i, count, r));
        return (
          <polygon
            key={ring}
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            className="fill-none stroke-muted"
            strokeWidth={1}
          />
        );
      })}

      {/* axis lines */}
      {data.map((_, i) => {
        const p = pointFor(i, count, MAX_RADIUS);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={p.x}
            y2={p.y}
            className="stroke-muted"
            strokeWidth={1}
          />
        );
      })}

      {/* data polygon */}
      <polygon points={polygonPoints} className="fill-primary/15 stroke-primary" strokeWidth={2} />

      {/* labels + clickable vertices */}
      {data.map((d, i) => {
        const labelPoint = pointFor(i, count, MAX_RADIUS + LABEL_OFFSET);
        const dataPoint = dataPoints[i];
        const anchor = labelAnchor(i, count);
        const isSelected = selected === d.symptom;
        const shortLabel = SHORT_LABELS[d.symptom] ?? d.label;
        return (
          <g key={d.symptom}>
            <text
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className={`cursor-pointer text-[9px] transition-colors ${
                isSelected ? "fill-primary font-semibold" : "fill-muted-foreground"
              }`}
              onClick={() => onSelect(d.symptom)}
            >
              {shortLabel.length > 16 ? `${shortLabel.slice(0, 14)}…` : shortLabel}
            </text>
            <g
              role="button"
              tabIndex={0}
              aria-label={`${d.label}: ${d.value} out of 4`}
              onClick={() => onSelect(d.symptom)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(d.symptom);
                }
              }}
              className="cursor-pointer outline-none"
            >
              <circle cx={dataPoint.x} cy={dataPoint.y} r={10} className="fill-transparent" />
              <circle
                cx={dataPoint.x}
                cy={dataPoint.y}
                r={isSelected ? 5.5 : 4}
                className={isSelected ? "fill-primary" : "fill-primary/70"}
              />
            </g>
          </g>
        );
      })}
    </svg>
  );
}
