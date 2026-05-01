import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ErrorBoundary from '@/components/ErrorBoundary';
import RouteLoader from '@/components/RouteLoader';
import SplashScreen from '@/components/SplashScreen';

// Home is eagerly loaded (it's the landing page — we want zero TTI delay).
import Home from './pages/Home';

// All other pages are code-split so the initial bundle stays small.
const LeadConsultant = lazy(() => import('./pages/LeadConsultant'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const JobDetail = lazy(() => import('./pages/JobDetail'));
const CrewReporting = lazy(() => import('./pages/CrewReporting'));
const LocationsIndex = lazy(() => import('./pages/LocationsIndex'));
const LocationPage = lazy(() => import('./pages/LocationPage'));
const RichmondCommercial = lazy(() => import('./pages/RichmondCommercial'));
const ResidentialAsphalt = lazy(() => import('./pages/ResidentialAsphalt'));
const HomeServices = lazy(() => import('./pages/HomeServices'));
const GeneralContracting = lazy(() => import('./pages/GeneralContracting'));
const TarAndChip = lazy(() => import('./pages/TarAndChip'));
const ContractorAIPlatform = lazy(() => import('./pages/ContractorAIPlatform'));
const CommandCenter = lazy(() => import('./pages/CommandCenter'));
const DnsMigration = lazy(() => import('./pages/DnsMigration'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const CustomerPortal = lazy(() => import('./pages/CustomerPortal'));
const AdminDocuments = lazy(() => import('./pages/AdminDocuments'));
const AdminSlackSettings = lazy(() => import('./pages/AdminSlackSettings'));
const LeadInbox = lazy(() => import('./pages/LeadInbox'));
const VoiceCalls = lazy(() => import('./pages/VoiceCalls'));
const RevenueDashboard = lazy(() => import('./pages/RevenueDashboard'));
const CrewEta = lazy(() => import('./pages/CrewEta'));
// Add page imports here

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

// Gate only back-office pages behind auth. Public pages render without any auth check.
const RequireAuth = ({ children }) => {
  const { isAuthenticated, isLoadingAuth, authError, navigateToLogin } = useAuth();

  if (isLoadingAuth) return <LoadingSpinner />;

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (!isAuthenticated) {
    navigateToLogin();
    return null;
  }

  return children;
};

const AuthenticatedApp = () => {
  const { isLoadingPublicSettings } = useAuth();

  // Wait for app public settings to load before rendering routes
  if (isLoadingPublicSettings) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/locations" element={<LocationsIndex />} />
        <Route path="/locations/:slug" element={<LocationPage />} />
        <Route path="/commercial/richmond-va" element={<RichmondCommercial />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/crew-eta" element={<CrewEta />} />

        {/* Back-office (auth required) */}
        <Route path="/command-center" element={<RequireAuth><CommandCenter /></RequireAuth>} />
        <Route path="/residential" element={<RequireAuth><ResidentialAsphalt /></RequireAuth>} />
        <Route path="/home-services" element={<RequireAuth><HomeServices /></RequireAuth>} />
        <Route path="/general-contracting" element={<RequireAuth><GeneralContracting /></RequireAuth>} />
        <Route path="/tar-and-chip" element={<RequireAuth><TarAndChip /></RequireAuth>} />
        <Route path="/contractor-ai" element={<RequireAuth><ContractorAIPlatform /></RequireAuth>} />
        <Route path="/consultant" element={<RequireAuth><LeadConsultant /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/job" element={<RequireAuth><JobDetail /></RequireAuth>} />
        <Route path="/crew-reporting" element={<RequireAuth><CrewReporting /></RequireAuth>} />
        <Route path="/dns-migration" element={<RequireAuth><DnsMigration /></RequireAuth>} />
        <Route path="/portal" element={<RequireAuth><CustomerPortal /></RequireAuth>} />
        <Route path="/admin/documents" element={<RequireAuth><AdminDocuments /></RequireAuth>} />
        <Route path="/admin/slack" element={<RequireAuth><AdminSlackSettings /></RequireAuth>} />
        <Route path="/leads" element={<RequireAuth><LeadInbox /></RequireAuth>} />
        <Route path="/voice-calls" element={<RequireAuth><VoiceCalls /></RequireAuth>} />
        <Route path="/revenue" element={<RequireAuth><RevenueDashboard /></RequireAuth>} />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <SplashScreen />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App