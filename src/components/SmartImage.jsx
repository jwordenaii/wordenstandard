import { useEffect, useState } from 'react'

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
  fallbackSrc,
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
  const [activeSrc, setActiveSrc] = useState(src)

  useEffect(() => {
    setActiveSrc(src)
    setFailed(false)
  }, [src])

  const showFallback = !activeSrc || failed

  const handleError = () => {
    if (fallbackSrc && activeSrc !== fallbackSrc) {
      setActiveSrc(fallbackSrc)
      return
    }
    setFailed(true)
  }

  if (showFallback) {
    return (
      <div
        role="img"
        aria-label={alt || label || 'Project photo placeholder'}
        className={`image-presentation-premium flex items-center justify-center ${className}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          aria-hidden="true"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #FFD700 0, #FFD700 1px, transparent 0, transparent 14px)',
            backgroundSize: '24px 24px',
          }}
        />
        {(label || sublabel) && (
          <div className="relative text-center px-8">
            {label && (
              <div className="font-editorial italic text-white/50 text-2xl lg:text-3xl leading-tight mb-2">
                {label}
              </div>
            )}
            {sublabel && (
              <div className="font-display tracking-[0.4em] uppercase text-primary text-[10px] mt-2 brightness-75">{sublabel}</div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`image-presentation-premium image-reveal-obsidian ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
      <img
        src={activeSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setFailed(false)}
        onError={handleError}
        className="w-full h-full object-cover"
        sizes={sizes}
      />
      {/* Editorial Title Overlay for Real Images */}
      {label && (
        <div className="absolute bottom-10 left-10 z-20 pointer-events-none opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-100">
          <p className="font-display text-primary text-[10px] tracking-[0.5em] uppercase mb-1">{sublabel || 'Project Gallery'}</p>
          <h4 className="font-editorial italic text-white text-3xl">{label}</h4>
        </div>
      )}
    </div>
  )
}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      sizes={sizes}
      onError={handleError}
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
