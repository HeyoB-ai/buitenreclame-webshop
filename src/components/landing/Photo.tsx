import type { ReactNode } from 'react';

interface PhotoProps {
  /** Base asset name without extension, e.g. "photo-florist". Served from /assets. */
  base: string;
  alt: string;
  label: string;
  icon: ReactNode;
  className?: string;
  /** When the image fails, fall back here instead of hiding (used by the cinema poster). */
  fallbackSrc?: string;
}

/**
 * Photo tile with the reference's graceful degradation: try /assets/<base>.png,
 * on error swap to .jpg, and if that also fails hide the <img> so the labelled
 * placeholder (.ph-fallback) shows through — or swap to `fallbackSrc` if given.
 */
export default function Photo({ base, alt, label, icon, className = '', fallbackSrc }: PhotoProps) {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.dataset.f) {
      img.dataset.f = '1';
      img.src = `/assets/${base}.jpg`;
    } else if (fallbackSrc && !img.dataset.f2) {
      img.dataset.f2 = '1';
      img.src = fallbackSrc;
    } else {
      img.style.display = 'none';
    }
  };

  return (
    <div className={`photo ${className}`}>
      <img src={`/assets/${base}.png`} alt={alt} onError={handleError} />
      <div className="ph-fallback">
        {icon}
        <span>{label}</span>
      </div>
    </div>
  );
}
