/**
 * Brand logo — the ESH Media wordmark (SVG).
 *
 * `Logo` renders the wordmark <img> at a given height (aspect ratio preserved);
 * this is what the header, topbar and footers use. `LogoMark` is the square
 * "ESH" block lifted straight out of that same wordmark, for contexts that need
 * a square (favicon, compact spots) — same artwork, no invented shapes.
 */

const LOGO_SRC = '/assets/esh-media-logo.svg';

/** ESH house navy, taken from the supplied logo. */
export const ESH_NAVY = '#273580';

interface LogoProps {
  /** Rendered height in px; width scales with the aspect ratio. */
  height?: number;
  className?: string;
}

export default function Logo({ height = 30, className = '' }: LogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="ESH Media"
      style={{ height }}
      className={`block w-auto max-w-full ${className}`}
    />
  );
}

/**
 * The square "ESH" mark from the wordmark: the letters inside their frame,
 * without the "MEDIA" text (which is unreadable at small sizes).
 */
export function LogoMark({ size = 34, color = ESH_NAVY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 61.7 84" fill="none" aria-hidden="true" className="shrink-0">
      <g fill={color}>
        <path d="m30.8 0c-18.2 0-30.8 4.2-30.8 4.2v22.6h3.9v-19.5c8.8-2.2 17.6-3.3 26.9-3.3s18.2 1.1 26.9 3.3v19.5h3.9v-22.6s-12.6-4.2-30.8-4.2z" />
        <path d="m30.8 84c-18.2 0-30.8-4.2-30.8-4.2v-22.6h3.9v19.5c8.8 2.2 17.6 3.3 26.9 3.3s18.2-1.1 26.9-3.3v-19.5h3.9v22.6s-12.6 4.2-30.8 4.2z" />
        <path d="m16.2 30.5v3.7h-12.3v6.1h11.1v3.5h-11.1v6.2h12.7v3.7h-16.6v-23.2z" />
        <path d="m42.4 53.5v-23h3.9v9.7h11.5v-9.7h3.9v23.1h-3.9v-9.8h-11.5v9.8z" />
        <path d="m35.8 42.6c-1.2-1-3-1.8-5.3-2.4-2.4-.6-3.9-1.1-4.6-1.6s-1.1-1.2-1.1-2.1.4-1.6 1.1-2.1 1.7-.7 2.8-.7 2.3.2 3.4.6c1.2.4 2.1.9 2.8 1.5l2.1-2.9c-1.1-.9-2.3-1.6-3.8-2-1.5-.5-2.9-.7-4.4-.7-2.3 0-4.2.6-5.8 1.7-1.6 1.2-2.3 2.8-2.3 4.9s.7 3.7 2 4.8c.7.5 1.5 1 2.3 1.3.9.3 2.2.7 3.9 1.1s2.9.9 3.6 1.4 1 1.2 1 2.1-.4 1.6-1.1 2.1-1.7.8-3 .8c-2.5 0-4.9-1-7.3-3l-2.4 2.9c2.8 2.5 6 3.7 9.6 3.7 2.5 0 4.5-.6 6-1.9s2.3-2.9 2.3-4.9-.6-3.6-1.8-4.6z" />
      </g>
    </svg>
  );
}
