const R = 105;

/**
 * Axis (index in `AXES`) drawn at each corner, clockwise from the top: Gameplay on top, Visuals top
 * right, Audio top left, the genre axes bottom left and right, the signature at the bottom.
 */
const CORNERS = [0, 1, 4, 5, 3, 2];

/** Corner `i` of the hexagonal radar at radius `r`, in a 300×300 box. */
function point(i: number, r: number) {
  const angle = -Math.PI / 2 + (i * Math.PI) / 3;
  return [150 + r * Math.cos(angle), 150 + r * Math.sin(angle)] as const;
}

const polygon = (radii: number[]) => radii.map((r, i) => point(i, r).map((n) => n.toFixed(1)).join(",")).join(" ");

/** Six-axis 0–10 radar with labelled corners, in the order of `AXES`; a null value draws at the centre and shows a dash. */
export function Radar({ values: axisValues, labels: axisLabels, format }: { values: (number | null)[]; labels: string[]; format: Intl.NumberFormat }) {
  const values = CORNERS.map((axis) => axisValues[axis] ?? null);
  const labels = CORNERS.map((axis) => axisLabels[axis] ?? "");
  const rings = [5, 4, 3, 2, 1].map((k) => polygon(Array(6).fill((R * k) / 5)));
  const axes = labels.map((_, i) => `M150 150 L${point(i, R).map((n) => n.toFixed(1)).join(" ")}`).join(" ");

  return (
    <div className="relative mx-auto aspect-square w-[calc(100%-64px)] max-w-120">
      <svg viewBox="0 0 300 300" aria-hidden className="absolute inset-0 overflow-visible size-full">
        {rings.map((points, index) => (
          <polygon key={index} points={points} className={`stroke-line ${index ? "fill-none" : "fill-surface"}`} />
        ))}
        <path d={axes} className="stroke-line" />
        <polygon points={polygon(labels.map((_, i) => (R * (values[i] ?? 0)) / 10))} className="fill-acc2/80 stroke-acc2 stroke-2 [stroke-linejoin:round]" />
      </svg>
      {labels.map((label, i) => {
        const [x, y] = point(i, R + 34);
        const value = values[i];
        return (
          <div key={i} style={{ left: `${x / 3}%`, top: `${y / 3}%` }} className="absolute flex w-max max-w-32 flex-col items-center gap-0.5 text-center font-display font-bold -translate-x-1/2 -translate-y-1/2">
            <span className="text-[13px] leading-tight tracking-widest text-balance text-fg-muted uppercase">{label}</span>
            <span className="text-[22px] leading-none text-acc">{value != null ? format.format(value) : "—"}</span>
          </div>
        );
      })}
    </div>
  );
}
