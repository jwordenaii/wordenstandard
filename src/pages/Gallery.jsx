import { useState } from 'react'
import GalleryUploadForm from '../components/GalleryUploadForm'
import SchemaMarkup from '../components/SchemaMarkup'
import { SITE_URL } from '../lib/businessInfo'
import { useGalleryImages } from '../hooks/useGalleryImages'
import { api } from '@/api/client'
import { useAuth } from '@/lib/AuthContext'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function ImageCard({ image, token, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  async function handleDelete() {
    if (!window.confirm(`Delete "${image.job_name}"?`)) return
    setDeleting(true)
    try {
      await api.deleteGalleryImage(image.id)
      if (onDeleted) onDeleted(image.id)
    } catch {
      alert('Could not delete image. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group hover:border-brand-amber/40 transition-colors">
        {/* Photo */}
        <button
          className="w-full aspect-video overflow-hidden block"
          onClick={() => setLightbox(true)}
          aria-label={`View full size: ${image.job_name}`}
        >
          <img
            src={image.url}
            alt={image.job_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </button>

        {/* Info */}
        <div className="p-4 space-y-1">
          <h3 className="font-display font-bold text-white text-sm leading-tight">
            {image.job_name}
          </h3>
          {image.description && (
            <p className="text-white/60 text-xs leading-relaxed line-clamp-2">
              {image.description}
            </p>
          )}
          <p className="text-white/40 text-xs">{formatDate(image.uploaded_at)}</p>

          {/* Admin delete */}
          {token && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="mt-2 text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Deleting…' : '✕ Delete'}
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
          <img
            src={image.url}
            alt={image.job_name}
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <p className="text-white font-semibold">{image.job_name}</p>
            {image.description && (
              <p className="text-white/60 text-sm mt-1">{image.description}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default function Gallery() {
  const { images, loading, error, reload, setImages } = useGalleryImages()
  const { accessToken, isAuthenticated } = useAuth()
  const [showUpload, setShowUpload] = useState(false)

  // Admin/upload UI is hidden from the public-facing gallery.
  // Operators reveal it by visiting /gallery?admin=1 (or with ?admin=1 in the
  // hash). This keeps the public page clean while still allowing internal use.
  const adminUiVisible =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('admin') === '1' ||
      window.location.hash.includes('admin=1'))

  function handleUploaded(newImage) {
    setImages((prev) => [newImage, ...prev])
    setShowUpload(false)
  }

  function handleDeleted(id) {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  function handleTokenSubmit(e) {
    e.preventDefault()
    setToken(tokenInput.trim())
    setShowTokenForm(false)
  }

  return (
    <div className="min-h-screen bg-brand-navy pt-20">
      <SchemaMarkup
        title="Project Photo Gallery — Real Paving Jobs"
        description="Real J. Worden & Sons asphalt paving jobs across Virginia — driveways, parking lots, KFC franchise sites, and more. See the quality before you book your free estimate."
        canonical="/gallery"
        breadcrumb={[
          { name: 'Home', path: '/' },
          { name: 'Gallery', path: '/gallery' },
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ImageGallery',
          name: 'J. Worden & Sons — Project Photo Gallery',
          description:
            'Real asphalt paving, driveway, and parking lot projects completed by J. Worden & Sons.',
          url: `${SITE_URL}/gallery`,
          // Each uploaded image is exposed as an ImageObject so Google can
          // surface the gallery in image search and rich-result eligible
          // gallery features. If the upload record carries location data
          // (`location`, `latitude`/`longitude`, or `address`), it is folded
          // into a contentLocation Place so Google Image Search can rank
          // the photo for location-relevant queries.
          image: images.map((img) => {
            const obj = {
              '@type': 'ImageObject',
              contentUrl: img.url,
              name: img.job_name,
              description: img.description || img.job_name,
              uploadDate: img.uploaded_at,
              creditText: 'J. Worden & Sons Asphalt Paving',
            }
            const hasGeo =
              typeof img.latitude === 'number' && typeof img.longitude === 'number'
            const locationName =
              img.location || img.city || img.address || (hasGeo ? 'Job site' : null)
            if (locationName || hasGeo) {
              obj.contentLocation = {
                '@type': 'Place',
                ...(locationName ? { name: locationName } : {}),
                ...(img.address || img.city || img.region
                  ? {
                      address: {
                        '@type': 'PostalAddress',
                        ...(img.address ? { streetAddress: img.address } : {}),
                        ...(img.city ? { addressLocality: img.city } : {}),
                        ...(img.region ? { addressRegion: img.region } : {}),
                        addressCountry: img.country || 'US',
                      },
                    }
                  : {}),
                ...(hasGeo
                  ? {
                      geo: {
                        '@type': 'GeoCoordinates',
                        latitude: img.latitude,
                        longitude: img.longitude,
                      },
                    }
                  : {}),
              }
            }
            return obj
          }),
        }}
      />
      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            Our Work
          </span>
          <h1 className="font-display font-black text-4xl md:text-5xl text-white mb-4">
            Job Photo Gallery
          </h1>
          <p className="text-white/60 text-lg">
            Real projects. Real results. From KFC parking lots to residential driveways — see the
            quality J. Worden &amp; Sons delivers on every job.
          </p>
        </div>
      </section>

      {/* Controls — hidden from public visitors. Operators access via ?admin=1 */}
      {adminUiVisible && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="btn-primary text-sm !py-2"
          >
            {showUpload ? '✕ Cancel Upload' : '+ Upload Photo'}
          </button>

          {isAuthenticated ? (
            <button
              onClick={reload}
              className="text-sm text-brand-amber hover:text-amber-400 transition-colors"
            >
              Refresh gallery
            </button>
          ) : null}
        </div>
      )}

      {/* Upload form */}
      {adminUiVisible && showUpload && isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="max-w-lg">
            <GalleryUploadForm onUploaded={handleUploaded} />
          </div>
        </div>
      )}

      {/* Gallery grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-amber border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={reload} className="btn-primary text-sm !py-2">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && images.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📷</p>
            <p className="text-white/60 text-lg">No photos yet.</p>
            <p className="text-white/40 text-sm mt-1">
              Use the upload button above to add the first job photo.
            </p>
          </div>
        )}

        {!loading && !error && images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((img) => (
              <ImageCard
                key={img.id}
                image={img}
                token={accessToken}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
