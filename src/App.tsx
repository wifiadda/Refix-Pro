import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MotionConfig } from 'motion/react';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { ErpProvider } from './context/ErpContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FloatingActions } from './components/FloatingActions';
import { LiveGoogleReviewsSync } from './components/LiveGoogleReviewsSync';
import { DocumentPreviewHost } from './components/DocumentPreviewModal';
import { EmailComposerHost } from './components/EmailComposerModal';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { ModelsPage } from './pages/ModelsPage';
import { BookRepairPage } from './pages/BookRepairPage';
import { TrackRepairPage } from './pages/TrackRepairPage';
import { PayRepairPage } from './pages/PayRepairPage';
import { AboutPage } from './pages/AboutPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { ContactPage } from './pages/ContactPage';
import { LegalPage } from './pages/LegalPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { FaqPage } from './pages/FaqPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';

const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((mod) => ({ default: mod.AdminPage }))
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function DynamicRedirectGuard() {
  const { pathname } = useLocation();
  const { settings } = useApp();
  const match = (settings.erpConfig?.redirectRules || []).find(
    (r) => r.fromPath && r.toPath && r.fromPath === pathname && r.toPath !== pathname
  );
  if (match) {
    return <Navigate to={match.toPath} replace />;
  }
  return <Navigate to="/" replace />;
}

function AppShell() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const appTree = (
    <div className="min-h-screen flex flex-col bg-white text-[#1D1D1F] antialiased">
      <ScrollToTop />

      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {!isAdminRoute && <Navbar />}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage quotaExceeded={quotaExceeded} onNotify={notify} />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/book" element={<BookRepairPage onNotify={notify} />} />
          <Route path="/track" element={<TrackRepairPage onNotify={notify} />} />
          <Route path="/pay" element={<PayRepairPage onNotify={notify} />} />
          <Route path="/reviews" element={<ReviewsPage onNotify={notify} />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route
            path="/contact"
            element={<ContactPage onNotify={notify} quotaExceeded={quotaExceeded} />}
          />
          <Route path="/privacy-policy" element={<LegalPage type="privacy" />} />
          <Route path="/terms-and-conditions" element={<LegalPage type="terms" />} />
          <Route path="/warranty-and-refund-policy" element={<LegalPage type="warranty" />} />
          <Route path="/warranty-policy" element={<Navigate to="/warranty-and-refund-policy" replace />} />
          <Route path="/data-protection-policy" element={<LegalPage type="data" />} />
          <Route path="/cookie-policy" element={<LegalPage type="cookies" />} />
          <Route path="/repair-disclaimer" element={<LegalPage type="disclaimer" />} />
          <Route path="/dashboard" element={<CustomerDashboardPage onNotify={notify} />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={['super_admin', 'admin', 'staff', 'technician']}
                onAuthError={(msg) => notify('error', msg)}
              >
                <Suspense
                  fallback={
                    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
                      <div className="text-center space-y-2">
                        <div className="w-7 h-7 border-2 border-[#0066CC] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-medium text-[#6E6E73]">Loading Refix Pro ERP Console...</p>
                      </div>
                    </div>
                  }
                >
                  <AdminPage onNotify={notify} />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<DynamicRedirectGuard />} />
        </Routes>
      </div>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <FloatingActions />}
      <DocumentPreviewHost />
      <EmailComposerHost onNotify={notify} />
    </div>
  );

  if (mapsApiKey && !quotaExceeded) {
    return (
      <APIProvider
        apiKey={mapsApiKey}
        libraries={['places', 'marker']}
        language="en"
        region="IN"
      >
        <LiveGoogleReviewsSync />
        {appTree}
      </APIProvider>
    );
  }

  return appTree;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <ErpProvider>
              <AppShell />
            </ErpProvider>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}
