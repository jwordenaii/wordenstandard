import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { JOB_LOCATIONS } from '@/lib/job-locations';
import LocationPhotoPanel from './LocationPhotoPanel';

// Custom red pin icon — pure SVG, no asset downloads
const redPinIcon = L.divIcon({
  className: 'custom-red-pin',
  html: `
    <div style="
      width: 28px;
      height: 28px;
      background: #ef4444;
      border: 3px solid #fff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: #fff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export default function NationalFootprintMap() {
  const [selected, setSelected] = useState(null);

  return (
    <section id="footprint" className="py-20 md:py-28 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-10 md:mb-12"
        >
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">
            // Virginia Service Area
          </p>
          <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95] max-w-3xl">
            Commercial & Residential<br />
            <span className="text-primary">Jobsites Across Virginia</span>
          </h2>
          <p className="font-body text-muted-foreground text-base md:text-lg mt-6 max-w-2xl leading-relaxed">
            Red pins mark completed commercial builds, lot rebuilds, and residential projects throughout Virginia — from Hampton Roads to the Blue Ridge. Click any pin to load jobsite photos.
          </p>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="border border-border bg-card overflow-hidden"
          style={{ height: 480 }}
        >
          <MapContainer
            center={[39.5, -88]}
            zoom={5}
            minZoom={4}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%', background: 'hsl(0 0% 10%)' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {JOB_LOCATIONS.map((loc) => (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={redPinIcon}
                eventHandlers={{
                  click: () => {
                    setSelected(loc);
                    // Smooth-scroll the photo panel into view
                    setTimeout(() => {
                      const el = document.getElementById('location-photos');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  },
                }}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}>
                    <strong style={{ color: '#111', fontSize: 14 }}>
                      {loc.client} · {loc.city}, {loc.state}
                    </strong>
                    <br />
                    <span style={{ color: '#555', fontSize: 12 }}>
                      {loc.jobType} · {loc.year}
                    </span>
                    <br />
                    <span style={{ color: '#777', fontSize: 11 }}>Click pin to view photos</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </motion.div>

        {/* Location chip list — quick-access under the map */}
        <div className="flex flex-wrap gap-2 mt-6">
          {JOB_LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              onClick={() => {
                setSelected(loc);
                setTimeout(() => {
                  const el = document.getElementById('location-photos');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
              }}
              className={`flex items-center gap-2 border px-3 py-2 font-display text-xs tracking-wider uppercase transition-colors ${
                selected?.id === loc.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <MapPin className="w-3 h-3" />
              {loc.city}, {loc.state}
            </button>
          ))}
        </div>

        {/* Photo panel — lazy rendered */}
        <div id="location-photos">
          <LocationPhotoPanel location={selected} onClose={() => setSelected(null)} />
        </div>
      </div>
    </section>
  );
}