type MetatronsCubeProps = {
  className?: string;
};

const INNER_RADIUS = 30;
const OUTER_RADIUS = INNER_RADIUS * Math.sqrt(3);

function point(radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
}

const points = [
  { x: 0, y: 0 },
  ...Array.from({ length: 6 }, (_, index) => point(INNER_RADIUS, index * 60 - 90)),
  ...Array.from({ length: 6 }, (_, index) => point(OUTER_RADIUS, index * 60 - 60)),
];

const connections = points.flatMap((from, fromIndex) =>
  points.slice(fromIndex + 1).map((to, offset) => ({
    from,
    to,
    key: `${fromIndex}-${fromIndex + offset + 1}`,
  })),
);

export function MetatronsCube({ className }: MetatronsCubeProps) {
  return (
    <svg
      className={className}
      viewBox="-68 -68 136 136"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        vectorEffect="non-scaling-stroke"
        suppressHydrationWarning
      >
        <g opacity="0.82">
          <circle r="62.5" strokeWidth="0.38" />
          <circle r="60.5" strokeWidth="0.22" />
        </g>
        <g strokeWidth="0.22" opacity="0.48">
          {connections.map(({ from, to, key }) => (
            <line key={key} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
          ))}
        </g>
        <g strokeWidth="0.36" opacity="0.72">
          {points.map(({ x, y }, index) => (
            <circle key={index} cx={x} cy={y} r="15" />
          ))}
        </g>
        <circle r="3" strokeWidth="0.3" opacity="0.72" />
      </g>
    </svg>
  );
}
