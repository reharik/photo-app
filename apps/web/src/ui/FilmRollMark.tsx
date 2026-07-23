// FilmRollMark.tsx — placeholder empty-state illustration.
// Line art strokes `currentColor`, so the parent (e.g. <EmptyState>) sets the tint.
// Swap for the Nikon art later by passing a different `illustration` to <EmptyState>.
export const FilmRollMark = () => (
  <svg
    width="150"
    height="90"
    viewBox="0 0 150 90"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="30" y="20" width="90" height="50" rx="4" />
    <line x1="30" y1="31" x2="120" y2="31" />
    <line x1="30" y1="59" x2="120" y2="59" />
    <g strokeWidth={1.8}>
      <rect x="36" y="24" width="4" height="3.5" rx="1" />
      <rect x="47" y="24" width="4" height="3.5" rx="1" />
      <rect x="58" y="24" width="4" height="3.5" rx="1" />
      <rect x="69" y="24" width="4" height="3.5" rx="1" />
      <rect x="80" y="24" width="4" height="3.5" rx="1" />
      <rect x="91" y="24" width="4" height="3.5" rx="1" />
      <rect x="102" y="24" width="4" height="3.5" rx="1" />
      <rect x="110" y="24" width="4" height="3.5" rx="1" />
      <rect x="36" y="62.5" width="4" height="3.5" rx="1" />
      <rect x="47" y="62.5" width="4" height="3.5" rx="1" />
      <rect x="58" y="62.5" width="4" height="3.5" rx="1" />
      <rect x="69" y="62.5" width="4" height="3.5" rx="1" />
      <rect x="80" y="62.5" width="4" height="3.5" rx="1" />
      <rect x="91" y="62.5" width="4" height="3.5" rx="1" />
      <rect x="102" y="62.5" width="4" height="3.5" rx="1" />
      <rect x="110" y="62.5" width="4" height="3.5" rx="1" />
    </g>
    <path d="M30 24 C 14 22, 8 30, 8 45 C 8 60, 14 68, 30 66" />
    <circle cx="17" cy="45" r="7" />
    <path
      d="M75 40.5 l-1-1 a2.4 2.4 0 0 0-3.4 3.4 l4.4 4.3 4.4-4.3 a2.4 2.4 0 0 0-3.4-3.4z"
      strokeWidth={1.8}
    />
  </svg>
);
