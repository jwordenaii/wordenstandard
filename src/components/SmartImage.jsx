import { useState } from 'react'

/**
 * SmartImage — drop-in <img> with a clean branded fallback.
 *
 * Why this exists:
 *   We previously hot-linked photos from `github.com/user-attachments/...`,
 *   which 404 for public visitors and leave a broken-image icon on the live
 *   site. Even when a real photo is present we want explicit width/height to
 *   prevent layout shift, async decode, and lazy loading by default.
 *
 * If the image fails to load (or no `src` is supplied yet), the component
 * renders a labeled gradient panel that matches the site's brand palette so
 * the layout still looks intentional and presentable.
 *
 * Props:
 *   src            string  — image URL (local /work/*.jpg recommended)
 *   webpSrc        string  — optional .webp companion for <picture> source
 *   alt            string  — required for a11y
 *   label          string  — short label shown on the fallback panel
 *   sublabel       string  — optional secondary line on the fallback panel
 *   width/height   number  — intrinsic size (used by browser to reserve space)
 *   priority       bool    — true for above-the-fold LCP images
 *   className      string  — applied to the <img> / fallback wrapper
 *   gradient       string  — Tailwind gradient classes for the fallback bg
 */
export default function SmartImage({
  src,
  webpSrc,
  alt,
  label,
  sublabel,
  width = 800,
  height = 600,
  priority = false,
  className = '',
  gradient = 'from-brand-navy via-brand-charcoal to-brand-navy',
  sizes,
}) {
  const [failed, setFailed] = useState(false)
  const showFallback = !src || failed

  if (showFallback) {
    return (
      <div
        role="img"
        aria-label={alt || label || 'Project photo placeholder'}
        className={`relative flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {/* Subtle diagonal texture so the panel reads as a designed surface,
            not an empty box. */}
        <div
          className="absolute inset-0 opacity-10"
          aria-hidden="true"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #f5a623 0, #f5a623 1px, transparent 0, transparent 14px)',
            backgroundSize: '14px 14px',
          }}
        />
        {(label || sublabel) && (
          <div className="relative text-center px-4">
            {label && (
              <div className="font-display font-bold text-white text-base sm:text-lg leading-tight">
                {label}
              </div>
            )}
            {sublabel && (
              <div className="text-white/60 text-xs mt-1">{sublabel}</div>
            )}
          </div>
        )}
      </div>
    )
  }

  const imgEl = (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      sizes={sizes}
      onError={() => setFailed(true)}
      className={className}
    />
  )

  if (webpSrc) {
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        {imgEl}
      </picture>
    )
  }

  return imgEl
}
