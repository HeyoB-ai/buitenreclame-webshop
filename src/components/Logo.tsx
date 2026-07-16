/**
 * Brand logo — the supplied AdPowers wordmark (transparent PNG).
 *
 * `Logo` renders the wordmark <img> at a given height (aspect ratio preserved);
 * this is what the header, topbar and footers use. `LogoMark` keeps the earlier
 * in-house SVG mark available for square contexts (e.g. a favicon) — not removed.
 */

const LOGO_SRC = '/assets/adpowers-logo.png';

interface LogoProps {
  /** Rendered height in px; width scales with the aspect ratio. */
  height?: number;
  className?: string;
}

export default function Logo({ height = 30, className = '' }: LogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="AdPowers"
      style={{ height }}
      className={`block w-auto max-w-full ${className}`}
    />
  );
}

/** In-house SVG mark (square) — kept for favicon / compact square uses. */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="8" fill="#2456E6" />
      <rect x="5" y="6" width="22" height="14" rx="3" fill="#FFFFFF" />
      <rect x="8.5" y="9.4" width="15" height="2.3" rx="1.15" fill="#2456E6" opacity="0.30" />
      <rect x="8.5" y="13.4" width="9.5" height="2.3" rx="1.15" fill="#2456E6" opacity="0.18" />
      <circle cx="23" cy="16" r="1.9" fill="#DE8A06" />
      <rect x="15" y="20" width="2" height="6" rx="1" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}
