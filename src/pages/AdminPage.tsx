import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  CreditCard,
  Database,
  FileText,
  Laptop,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  Star,
  Users,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';
import { AdminEnquiriesTab } from '../components/admin/AdminEnquiriesTab';
import { AdminPaymentsTab } from '../components/admin/AdminPaymentsTab';
import { AdminServicesAndModelsTab } from '../components/admin/AdminServicesAndModelsTab';
import { AdminBlogTab } from '../components/admin/AdminBlogTab';
import { AdminMessagesReviewsTab } from '../components/admin/AdminMessagesReviewsTab';
import { AdminSettingsAndUsersTab } from '../components/admin/AdminSettingsAndUsersTab';
import { AdminPageContentTab } from '../components/admin/AdminPageContentTab';

type AdminTab =
  | 'overview'
  | 'enquiries'
  | 'payments'
  | 'services'
  | 'models'
  | 'blogs'
  | 'messages'
  | 'reviews'
  | 'pages'
  | 'settings'
  | 'users';

export function AdminPage({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const {
    user,
    authReady,
    isAdmin,
    adminLogin,
    adminLogout,
    enquiries,
    contactMessages,
    adminBlogPosts,
    blogPosts,
    hasFirestoreSeed,
    seedCatalogToFirestore,
    adminLoading,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [seeding, setSeeding] = useState(false);

  useSeoMeta({
    title: 'Admin Dashboard | Refix Pro',
    description: 'Protected administration workspace for Refix Pro MacBook Repair.',
    canonicalPath: '/admin',
  });

  const stats = useMemo(() => {
    const total = enquiries.length;
    const newCount = enquiries.filter((e) => e.status === 'New').length;
    const pending = enquiries.filter((e) =>
      ['Contacted', 'Inspection', 'Estimate Sent', 'Approved'].includes(e.status)
    ).length;
    const inProgress = enquiries.filter((e) =>
      ['In Repair', 'Ready for Delivery'].includes(e.status)
    ).length;
    const completed = enquiries.filter((e) => e.status === 'Completed').length;
    const cancelled = enquiries.filter((e) => e.status === 'Cancelled').length;
    const totalMessages = contactMessages.length;
    const totalBlogs = adminBlogPosts.length > 0 ? adminBlogPosts.length : blogPosts.length;
    return {
      total,
      newCount,
      pending,
      inProgress,
      completed,
      cancelled,
      totalMessages,
      totalBlogs,
    };
  }, [enquiries, contactMessages, adminBlogPosts, blogPosts]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
        <p className="text-sm text-[#424245]">Checking authentication...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E5EA] p-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6 text-[#0066CC]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#1D1D1F]">Refix Pro Admin Portal</h1>
            <p className="text-sm text-[#424245]">
              Sign in with Google using your authorized Refix Pro Admin email (<span className="font-mono font-semibold text-[#1D1D1F]">refixpro.in@gmail.com</span>) to manage repair enquiries, live tracking statuses, services, blogs, and website settings.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await adminLogin();
              } catch (err) {
                console.error(err);
                onNotify('error', 'Google sign-in was cancelled or blocked.');
              }
            }}
            className="w-full py-3 px-4 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-sm font-semibold transition-colors"
          >
            Sign in with Google (refixpro.in@gmail.com)
          </button>
          <Link to="/" className="block text-xs text-[#6E6E73] hover:text-[#1D1D1F]">
            Return to Public Website
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E5EA] p-8 text-center space-y-5">
          <h1 className="text-xl font-bold text-[#1D1D1F]">Admin Access Required</h1>
          <p className="text-sm text-[#424245]">
            Your Google account (<span className="font-mono">{user.email}</span>) does not currently have admin permissions. Please sign in with <span className="font-mono font-semibold">refixpro.in@gmail.com</span> or request Super Admin access.
          </p>
          <p className="text-xs text-[#6E6E73] font-mono bg-[#F5F5F7] p-3 rounded-lg break-all">
            UID: {user.uid}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={adminLogout}
              className="px-4 py-2 rounded-lg bg-[#1D1D1F] text-white text-xs font-semibold"
            >
              Switch Account / Sign Out
            </button>
            <Link
              to="/"
              className="px-4 py-2 rounded-lg border border-[#D2D2D7] text-xs font-semibold text-[#1D1D1F]"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'enquiries', label: 'Repair Enquiries', icon: ClipboardList },
    { id: 'payments', label: 'Payments & Razorpay', icon: CreditCard },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'models', label: 'MacBook, iPad & iPhone', icon: Laptop },
    { id: 'blogs', label: 'Blog CMS', icon: FileText },
    { id: 'messages', label: 'Messages', icon: Mail },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'pages', label: 'Header, Footer & Pages', icon: LayoutTemplate },
    { id: 'settings', label: 'Website Settings', icon: Settings },
    { id: 'users', label: 'Admin Users', icon: Users },
  ];

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedCatalogToFirestore();
      onNotify('success', 'Default services, models, blogs, reviews, and settings synced to Firestore.');
    } catch (err) {
      console.error(err);
      onNotify('error', 'Failed to sync default catalog.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-[#E5E5EA] shrink-0">
        <div className="p-5 border-b border-[#E5E5EA] flex items-center justify-between lg:block">
          <div>
            <p className="text-sm font-bold text-[#1D1D1F]">Refix Pro Admin</p>
            <p className="text-xs text-[#6E6E73] truncate max-w-[190px]">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={adminLogout}
            className="lg:hidden inline-flex items-center gap-1 text-xs font-semibold text-red-600"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#1D1D1F] text-white font-semibold'
                    : 'text-[#424245] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:block p-4 mt-4 border-t border-[#E5E5EA] space-y-2">
          <Link
            to="/"
            className="block w-full text-center px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs font-semibold text-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            View Live Website
          </Link>
          <button
            type="button"
            onClick={adminLogout}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5EA]">
          <div>
            <p className="text-xs text-[#6E6E73]">Refix Pro Console / {navItems.find((n) => n.id === activeTab)?.label}</p>
            <h1 className="text-2xl font-bold text-[#1D1D1F]">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>

          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] whitespace-nowrap"
          >
            <Database className="w-4 h-4 text-[#0066CC]" />
            {seeding ? 'Syncing Catalog...' : hasFirestoreSeed ? 'Re-sync Default Catalog' : 'Initialize Catalog in Firestore'}
          </button>
        </div>

        {!hasFirestoreSeed && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p>
              Firestore catalog collections are not yet seeded. Click <strong>Initialize Catalog in Firestore</strong> to persist the default 42 MacBook services, models, 10 blog guides, verified reviews, and business settings.
            </p>
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="px-4 py-2 rounded-lg bg-[#1D1D1F] text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              {seeding ? 'Initializing...' : 'Initialize Now'}
            </button>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Repair Enquiries', value: stats.total },
                { label: 'New Enquiries', value: stats.newCount },
                { label: 'Pending Enquiries', value: stats.pending },
                { label: 'In Progress', value: stats.inProgress },
                { label: 'Completed', value: stats.completed },
                { label: 'Cancelled', value: stats.cancelled },
                { label: 'Total Contact Messages', value: stats.totalMessages },
                { label: 'Total Blog Posts', value: stats.totalBlogs },
              ].map((kpi) => (
                <div key={kpi.label} className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
                  <p className="text-xs text-[#6E6E73]">{kpi.label}</p>
                  <p className="text-2xl font-bold text-[#1D1D1F] font-mono tabular-nums mt-2">
                    {adminLoading ? '—' : kpi.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1D1D1F]">Recent Repair Enquiries</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('enquiries')}
                  className="text-xs font-semibold text-[#0066CC] hover:underline"
                >
                  View All Enquiries
                </button>
              </div>
              <AdminEnquiriesTab onNotify={onNotify} />
            </div>
          </div>
        )}

        {activeTab === 'enquiries' && <AdminEnquiriesTab onNotify={onNotify} />}
        {activeTab === 'payments' && <AdminPaymentsTab onNotify={onNotify} />}
        {activeTab === 'services' && <AdminServicesAndModelsTab mode="services" onNotify={onNotify} />}
        {activeTab === 'models' && <AdminServicesAndModelsTab mode="models" onNotify={onNotify} />}
        {activeTab === 'blogs' && <AdminBlogTab onNotify={onNotify} />}
        {activeTab === 'messages' && <AdminMessagesReviewsTab mode="messages" onNotify={onNotify} />}
        {activeTab === 'reviews' && <AdminMessagesReviewsTab mode="reviews" onNotify={onNotify} />}
        {activeTab === 'pages' && <AdminPageContentTab onNotify={onNotify} />}
        {activeTab === 'settings' && <AdminSettingsAndUsersTab mode="settings" onNotify={onNotify} />}
        {activeTab === 'users' && <AdminSettingsAndUsersTab mode="users" onNotify={onNotify} />}
      </main>
    </div>
  );
}
