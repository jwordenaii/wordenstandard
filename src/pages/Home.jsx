import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import TrustedBy from '../components/TrustedBy';
import ServicePanels from '../components/ServicePanels';
import StatsBar from '../components/StatsBar';
import FeaturedProjectBanner from '../components/FeaturedProjectBanner';
import CommercialCapabilities from '../components/CommercialCapabilities';
import LandmarkProjects from '../components/LandmarkProjects';
import NationalFootprintMap from '../components/NationalFootprintMap';
import ServiceAreaMap from '../components/ServiceAreaMap';
import ProjectGallery from '../components/ProjectGallery';
import BeforeAfterGallery from '../components/BeforeAfterGallery';
import CaseStudyPreview from '../components/CaseStudyPreview';
import BeatAnyQuoteBadge from '../components/BeatAnyQuoteBadge';
import AboutSection from '../components/AboutSection';
import Credentials from '../components/Credentials';
import SafetyCompliance from '../components/SafetyCompliance';
import TechStack from '../components/TechStack';
import LocalReviews from '../components/LocalReviews';
import MaintenanceCalculator from '../components/MaintenanceCalculator';
import AIPhotoInspector from '../components/AIPhotoInspector';
import QuoteEngine from '../components/QuoteEngine';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';
import HomeSchema from '../components/HomeSchema';
import AIConciergeBubble from '../components/AIConciergeBubble';

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-body relative">
      <HomeSchema />
      <Navbar />
      <HeroSection />
      <TrustedBy />
      <ServicePanels />
      <StatsBar />
      <CommercialCapabilities />
      <FeaturedProjectBanner />
      <BeforeAfterGallery />
      <LandmarkProjects />
      <CaseStudyPreview />
      <AboutSection />
      <ServiceAreaMap />
      <NationalFootprintMap />
      <ProjectGallery />
      <LocalReviews />
      <BeatAnyQuoteBadge />
      <Credentials />
      <SafetyCompliance />
      <TechStack />
      <MaintenanceCalculator />
      <AIPhotoInspector />
      <FAQSection />
      <QuoteEngine />
      <Footer />
      <AIConciergeBubble />
    </div>
  );
}