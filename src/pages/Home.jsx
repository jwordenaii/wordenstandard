import React from 'react';
import SEO from '../components/SEO';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ServicePanels from '../components/ServicePanels';
import NationalFootprintMap from '../components/NationalFootprintMap';
import CaseStudyPreview from '../components/CaseStudyPreview';
import QuoteEngine from '../components/QuoteEngine';
import Footer from '../components/Footer';
import HomeSchema from '../components/HomeSchema';

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-body relative">
      <SEO 
        title="J. Worden | The Premier Pavement Asset Partner"
        description="Institutional-grade paving solutions for national logistics, healthcare, and industrial infrastructure. 40+ years of technical excellence."
      />
      <HomeSchema />
      <Navbar />
      <HeroSection />
      <NationalFootprintMap />
      <ServicePanels />
      <CaseStudyPreview />
      <QuoteEngine />
      <Footer />
    </div>
  );
}
