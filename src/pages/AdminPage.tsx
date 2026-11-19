import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Database,
  FileText,
  Globe,
  Laptop,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Mail,
  Menu,
  Package,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Star,
  User,
  UserCheck,
  Users,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useErp } from '../context/ErpContext';
import { useSeoMeta } from '../utils/seo';
import type { AdminModuleKey } from '../types';
import { AdminOverviewDashboard } from '../components/admin/AdminOverviewDashboard';
import { TechnicianWorkspace } from '../components/admin/TechnicianWorkspace';
import { StaffWorkspace } from '../components/admin/StaffWorkspace';
import { AdminJobsTab } from '../components/admin/AdminJobsTab';
import { AdminEnquiriesTab } from '../components/admin/AdminEnquiriesTab';
import { AdminCustomersTab } from '../components/admin/AdminCustomersTab';
import { AdminStaffAppointmentsTab } from '../components/admin/AdminStaffAppointmentsTab';
import { AdminInventoryTab } from '../components/admin/AdminInventoryTab';
import { AdminPaymentsTab } from '../components/admin/AdminPaymentsTab';
import { AdminFinanceTab } from '../components/admin/AdminFinanceTab';
import { AdminReportsTab } from '../components/admin/AdminReportsTab';
import { AdminServicesAndModelsTab } from '../components/admin/AdminServicesAndModelsTab';
import { AdminBlogTab } from '../components/admin/AdminBlogTab';
import { AdminMessagesReviewsTab } from '../components/admin/AdminMessagesReviewsTab';
import { AdminPageContentTab } from '../components/admin/AdminPageContentTab';
import { AdminSeoTab } from '../components/admin/AdminSeoTab';
import { AdminAuditBackupTab } from '../components/admin/AdminAuditBackupTab';
import { AdminSettingsAndUsersTab } from '../components/admin/AdminSettingsAndUsersTab';

interface NavGroup {
  groupLabel: string;
  items: {
    id: AdminModuleKey;
    label: string;
    techLabel?: string;
    staffLabel?: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: 'Executive & Repair ERP',
    items: [
      {
        id: 'overview',
        label: 'Executive Dashboard',
        staffLabel: 'Front Desk Overview',
        techLabel: 'Bench Workspace',
        icon: LayoutDashboard,
      },
      { id: 'jobs', label: 'Repair Job Cards', techLabel: 'Assigned Jobs', icon: Wrench },
      { id: 'enquiries', label: 'Repair Enquiries', icon: ClipboardList },
      { id: 'customers', label: 'Customers CRM', icon: Users },
      { id: 'appointments', label: 'Appointments', techLabel: 'My Schedule', icon: Calendar },
      { id: 'technicians', label: 'Technicians & Staff', icon: UserCheck },
      { id: 'inventory', label: 'Inventory & POs', techLabel: 'Spare Parts Lookup', icon: Package },
    ],
  },
  {
    groupLabel: 'Finance & Analytics',
    items: [
      { id: 'payments', label: 'Payments & Razorpay', icon: CreditCard },
      { id: 'invoices', label: 'Invoices & Receipts', icon: Receipt },
      { id: 'expenses', label: 'Business Expenses', icon: Wallet },
      { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    ],
  },
  {
    groupLabel: 'Website, CMS & SEO',
    items: [
      { id: 'services', label: 'Services Catalog', icon: Wrench },
      { id: 'models', label: 'Apple Models Catalog', icon: Laptop },
      { id: 'blogs', label: 'Blog CMS', icon: FileText },
      { id: 'messages', label: 'Contact Messages', icon: Mail },
      { id: 'reviews', label: 'Customer Reviews', icon: Star },
      { id: 'pages', label: 'Header, Footer & Pages', icon: LayoutTemplate },
      { id: 'seo', label: 'SEO Control Panel', icon: Globe },
    ],
  },
  {
    groupLabel: 'Security & System',
    items: [
      { id: 'users', label: 'Users & Permissions', icon: ShieldCheck },
      { id: 'logs', label: 'Audit & Security Logs', icon: Activity },
      { id: 'settings', label: 'Settings & Backup', icon: Settings },
    ],
  },
];

interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  module: AdminModuleKey;
  kind: string;
}

export function AdminPage({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const {
    user,
    authReady,
    isStaff,
    isSuperAdmin,
    isAdmin,
    isFrontDeskStaff,
    isTechnician,
    userRole,
    userProfile,
    hasPermission,
    refreshUserRole,
    adminLogin,
    adminLogout,
    hasFirestoreSeed,
    seedCatalogToFirestore,
    enquiries,
  } = useApp();

  const {
    repairJobs,
    customers,
    invoices,
    inventory,
    notifications,
    markNotificationRead,
    refreshErpData,
    erpLoading,
  } = useErp();

  const [activeTab, setActiveTab] = useState<AdminModuleKey>('overview');
  const [seeding, setSeeding] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  useSeoMeta({
    title: 'Staff & ERP Management Console | Refix Pro',
    description: 'Protected Refix Pro MacBook Repair ERP, Inventory, Invoicing & Website Console.',
    canonicalPath: '/admin',
  });

  const visibleGroups = useMemo(() => {
    return NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (isTechnician && !isAdmin && !isFrontDeskStaff) {
          return item.id === 'overview';
        }
        return hasPermission(item.id, 'view');
      }),
    })).filter((g) => g.items.length > 0);
  }, [hasPermission, isTechnician, isAdmin, isFrontDeskStaff]);

  const flatVisibleItems = useMemo(
    () => visibleGroups.flatMap((g) => g.items),
    [visibleGroups]
  );

  useEffect(() => {
    if (!isStaff || flatVisibleItems.length === 0) return;
    const isAllowed = flatVisibleItems.some((i) => i.id === activeTab);
    if (!isAllowed) {
      setActiveTab(flatVisibleItems[0].id);
    }
  }, [isStaff, activeTab, flatVisibleItems]);

  const staffNotifications = useMemo(
    () => notifications.filter((n) => n.audience !== 'customer').slice(0, 15),
    [notifications]
  );
  const unreadNotifCount = useMemo(
    () => staffNotifications.filter((n) => !n.isRead).length,
    [staffNotifications]
  );

  // Global search across Jobs, Enquiries, Customers, Invoices & Parts
  const globalSearchHits = useMemo<SearchHit[]>(() => {
    const q = globalSearch.trim().toLowerCase();
    if (q.length < 2) return [];
    const hits: SearchHit[] = [];

    if (hasPermission('jobs', 'view')) {
      for (const j of repairJobs) {
        if (
          j.jobCardCode.toLowerCase().includes(q) ||
          j.customerName.toLowerCase().includes(q) ||
          j.macbookModel.toLowerCase().includes(q) ||
          (j.serialNumber || '').toLowerCase().includes(q)
        ) {
          hits.push({
            id: `job-${j.id}`,
            title: `${j.jobCardCode} · ${j.customerName}`,
            subtitle: `${j.macbookModel} · ${j.status}`,
            module: 'jobs',
            kind: 'Job Card',
          });
        }
        if (hits.length >= 10) break;
      }
    }

    if (hasPermission('enquiries', 'view') && hits.length < 10) {
      for (const e of enquiries) {
        if (
          e.enquiryCode.toLowerCase().includes(q) ||
          e.customerName.toLowerCase().includes(q) ||
          e.mobile.toLowerCase().includes(q)
        ) {
          hits.push({
            id: `enq-${e.id}`,
            title: `${e.enquiryCode} · ${e.customerName}`,
            subtitle: `${e.macbookModel} · ${e.status}`,
            module: 'enquiries',
            kind: 'Enquiry',
          });
        }
        if (hits.length >= 10) break;
      }
    }

    if (hasPermission('customers', 'view') && hits.length < 10) {
      for (const c of customers) {
        if (
          c.name.toLowerCase().includes(q) ||
          c.mobile.toLowerCase().includes(q) ||
          c.customerCode.toLowerCase().includes(q)
        ) {
          hits.push({
            id: `cust-${c.id}`,
            title: `${c.name} (${c.customerCode})`,
            subtitle: c.mobile,
            module: 'customers',
            kind: 'Customer',
          });
        }
        if (hits.length >= 10) break;
      }
    }

    if (hasPermission('invoices', 'view') && hits.length < 10) {
      for (const inv of invoices) {
        if (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q)
        ) {
          hits.push({
            id: `inv-${inv.id}`,
            title: `${inv.invoiceNumber} · ${inv.customerName}`,
            subtitle: `₹${inv.totalAmount.toLocaleString('en-IN')} · ${inv.status}`,
            module: 'invoices',
            kind: 'Invoice',
          });
        }
        if (hits.length >= 10) break;
      }
    }

    if (hasPermission('inventory', 'view') && hits.length < 10) {
      for (const p of inventory) {
        if (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) {
          hits.push({
            id: `part-${p.id}`,
            title: `${p.name} (${p.sku})`,
            subtitle: `Stock: ${p.quantity} · ₹${p.sellingPrice}`,
            module: 'inventory',
            kind: 'Part',
          });
        }
        if (hits.length >= 10) break;
      }
    }

    return hits;
  }, [globalSearch, repairJobs, enquiries, customers, invoices, inventory, hasPermission]);

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
            <h1 className="text-2xl font-bold text-[#1D1D1F]">Refix Pro Staff &amp; ERP Portal</h1>
            <p className="text-sm text-[#424245]">
              Sign in with Google using your authorized Refix Pro account (
              <span className="font-mono font-semibold text-[#1D1D1F]">refixpro.in@gmail.com</span> or an assigned Admin / Staff / Technician email) to open your role workspace.
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
            Sign in with Google
          </button>
          <Link to="/" className="block text-xs text-[#6E6E73] hover:text-[#1D1D1F]">
            Return to Public Website
          </Link>
        </div>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E5EA] p-8 text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 text-[#0066CC]" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#0066CC]">Customer Mode Active</p>
            <h1 className="text-xl font-bold text-[#1D1D1F]">Staff Access Required</h1>
            <p className="text-sm text-[#424245]">
              Your account (<span className="font-mono font-semibold">{user.email}</span>) is currently in standard{' '}
              <strong>Customer Mode</strong>. Ask a Super Admin to assign Admin, Front-Desk Staff, or Technician access if you work at Refix Pro.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-1">
            <Link
              to="/dashboard"
              className="px-4 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold whitespace-nowrap"
            >
              Open Customer Portal
            </Link>
            <button
              type="button"
              onClick={async () => {
                await refreshUserRole();
                onNotify('success', 'Account role permission checked.');
              }}
              className="px-4 py-2.5 rounded-xl border border-[#D2D2D7] hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] whitespace-nowrap"
            >
              Re-check Role
            </button>
            <button
              type="button"
              onClick={adminLogout}
              className="px-4 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold whitespace-nowrap"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getLabelFor = (item: NavGroup['items'][number]) => {
    if (isTechnician && !isAdmin && !isFrontDeskStaff && item.techLabel) return item.techLabel;
    if (isFrontDeskStaff && !isAdmin && item.staffLabel) return item.staffLabel;
    return item.label;
  };

  const activeNavMeta = flatVisibleItems.find((n) => n.id === activeTab);
  const activeTabLabel = activeNavMeta ? getLabelFor(activeNavMeta) : 'Workspace';

  const roleDisplayLabel = isSuperAdmin
    ? 'Super Admin Console'
    : isAdmin
      ? 'Admin Workspace'
      : isFrontDeskStaff
        ? 'Front-Desk Staff'
        : 'Technician Bench';

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

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[#E5E5EA] flex items-center justify-between gap-2">
        {(!sidebarCollapsed || isMobile) && (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-[#1D1D1F] truncate">Refix Pro ERP</p>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066CC]">
                {userRole.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] text-[#6E6E73] truncate">{user.email}</p>
          </div>
        )}
        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="p-1.5 rounded-lg border border-[#D2D2D7] text-[#424245]"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="p-1.5 rounded-lg border border-[#E5E5EA] text-[#424245] hover:bg-[#F5F5F7] shrink-0"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.groupLabel} className="space-y-1">
            {(!sidebarCollapsed || isMobile) && (
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]">
                {group.groupLabel}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                const label = getLabelFor(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={sidebarCollapsed && !isMobile ? label : undefined}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      sidebarCollapsed && !isMobile ? 'justify-center' : ''
                    } ${
                      active
                        ? 'bg-[#0F172A] text-white font-semibold'
                        : 'text-[#424245] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {(!sidebarCollapsed || isMobile) && <span className="truncate">{label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[#E5E5EA] space-y-1.5">
        {(!sidebarCollapsed || isMobile) && (
          <Link
            to="/"
            className="block w-full text-center px-3 py-2 rounded-xl border border-[#D2D2D7] text-xs font-semibold text-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            View Public Website
          </Link>
        )}
        <button
          type="button"
          onClick={adminLogout}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {(!sidebarCollapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  // Dedicated mobile-first layout for Technician role
  const isPureTechnician = isTechnician && !isAdmin && !isFrontDeskStaff;

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col lg:flex-row">
      {!isPureTechnician && (
        <aside
          className={`hidden lg:flex flex-col bg-white border-r border-[#E5E5EA] shrink-0 transition-all duration-200 sticky top-0 h-screen ${
            sidebarCollapsed ? 'w-[72px]' : 'w-64'
          }`}
        >
          {renderSidebarContent(false)}
        </aside>
      )}

      {!isPureTechnician && mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white h-full border-r border-[#E5E5EA] shadow-2xl">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Executive / Role Top Header */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-3">
            {!isPureTechnician && (
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-[#D2D2D7] bg-white text-[#1D1D1F]"
                aria-label="Open ERP navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div>
              <p className="text-xs text-[#6E6E73]">
                {roleDisplayLabel} / {activeTabLabel}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1D1D1F]">{activeTabLabel}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 relative">
            {/* Global Search (Jobs, Enquiries, Customers, Invoices, Parts) */}
            {!isPureTechnician && (
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Global search: JC ID, phone, invoice..."
                  className="w-full min-h-[38px] pl-9 pr-3 py-1.5 rounded-xl border border-[#D2D2D7] bg-white text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30"
                />
                {globalSearchHits.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#E5E5EA] shadow-xl z-40 max-h-72 overflow-y-auto divide-y divide-[#E5E5EA]">
                    {globalSearchHits.map((hit) => (
                      <button
                        key={hit.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(hit.module);
                          setGlobalSearch('');
                        }}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-[#F5F5F7] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1D1D1F] truncate">{hit.title}</p>
                          <p className="text-[11px] text-[#6E6E73] truncate">{hit.subtitle}</p>
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-[#0066CC] shrink-0">
                          {hit.kind}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]"
                aria-label="Staff notifications"
              >
                <Bell className="w-4 h-4 text-[#0066CC]" />
                <span className="hidden sm:inline">Alerts</span>
                {unreadNotifCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-[#0066CC] text-white text-[10px] font-bold font-mono">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-[#E5E5EA] shadow-xl z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E5E5EA] flex items-center justify-between bg-[#F5F5F7]">
                    <span className="text-xs font-bold text-[#1D1D1F]">
                      Operational Alerts ({unreadNotifCount} unread)
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-[#6E6E73] hover:text-[#1D1D1F]"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E5E5EA]">
                    {staffNotifications.length === 0 ? (
                      <p className="p-4 text-xs text-[#6E6E73] text-center">
                        No recent operational notifications.
                      </p>
                    ) : (
                      staffNotifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs space-y-1 ${n.isRead ? 'bg-white' : 'bg-blue-50/40'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#1D1D1F]">{n.title}</span>
                            {!n.isRead && (
                              <button
                                type="button"
                                onClick={() => void markNotificationRead(n.id)}
                                className="text-[11px] font-semibold text-[#0066CC] hover:underline shrink-0"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                          <p className="text-[#424245]">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => void refreshErpData()}
              disabled={erpLoading}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0066CC] ${erpLoading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] whitespace-nowrap"
              >
                <Database className="w-3.5 h-3.5 text-[#0066CC]" />
                {seeding ? 'Syncing...' : hasFirestoreSeed ? 'Re-sync Catalog' : 'Init Catalog'}
              </button>
            )}

            {/* Account Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((p) => !p);
                  setNotifOpen(false);
                }}
                className="inline-flex items-center gap-2 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]"
              >
                <User className="w-3.5 h-3.5 text-[#0066CC]" />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {userProfile?.displayName || user.displayName || userRole}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-[#E5E5EA] shadow-xl z-40 p-3 space-y-2 text-xs">
                  <div className="pb-2 border-b border-[#E5E5EA]">
                    <p className="font-bold text-[#1D1D1F] truncate">
                      {userProfile?.displayName || user.displayName || 'Refix Pro User'}
                    </p>
                    <p className="text-[11px] font-mono text-[#6E6E73] truncate">{user.email}</p>
                    <p className="text-[11px] font-semibold text-[#0066CC] mt-0.5">{roleDisplayLabel}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setProfileOpen(false)}
                    className="block px-2.5 py-2 rounded-lg hover:bg-[#F5F5F7] font-medium text-[#1D1D1F]"
                  >
                    Switch to Customer Portal
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setProfileOpen(false)}
                    className="block px-2.5 py-2 rounded-lg hover:bg-[#F5F5F7] font-medium text-[#1D1D1F]"
                  >
                    Open Public Website
                  </Link>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('users');
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F5F5F7] font-medium text-[#1D1D1F]"
                    >
                      Manage Roles &amp; Users
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      void adminLogout();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-50 font-semibold text-red-600"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {!hasFirestoreSeed && isSuperAdmin && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p>
              Firestore catalog collections are not yet seeded. Click <strong>Init Catalog</strong> to persist default MacBook services, models, blog guides, reviews, and business settings.
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

        {/* Active Module Workspace Routed by Role */}
        {isPureTechnician ? (
          <TechnicianWorkspace onNotify={onNotify} />
        ) : (
          <>
            {activeTab === 'overview' &&
              (isFrontDeskStaff && !isAdmin ? (
                <StaffWorkspace onNavigate={setActiveTab} onNotify={onNotify} />
              ) : (
                <AdminOverviewDashboard onNavigate={setActiveTab} />
              ))}
            {activeTab === 'jobs' && (
              <AdminJobsTab
                onNotify={onNotify}
                onCreatedInvoice={() => setActiveTab('invoices')}
                onNavigateTab={setActiveTab}
              />
            )}
            {activeTab === 'enquiries' && (
              <AdminEnquiriesTab onNotify={onNotify} onCreatedJob={() => setActiveTab('jobs')} />
            )}
            {activeTab === 'customers' && <AdminCustomersTab onNotify={onNotify} />}
            {activeTab === 'appointments' && (
              <AdminStaffAppointmentsTab mode="appointments" onNotify={onNotify} />
            )}
            {activeTab === 'technicians' && (
              <AdminStaffAppointmentsTab mode="technicians" onNotify={onNotify} />
            )}
            {activeTab === 'inventory' && <AdminInventoryTab onNotify={onNotify} />}
            {activeTab === 'payments' && <AdminPaymentsTab onNotify={onNotify} />}
            {activeTab === 'invoices' && <AdminFinanceTab mode="invoices" onNotify={onNotify} />}
            {activeTab === 'expenses' && <AdminFinanceTab mode="expenses" onNotify={onNotify} />}
            {activeTab === 'reports' && <AdminReportsTab />}
            {activeTab === 'services' && <AdminServicesAndModelsTab mode="services" onNotify={onNotify} />}
            {activeTab === 'models' && <AdminServicesAndModelsTab mode="models" onNotify={onNotify} />}
            {activeTab === 'blogs' && <AdminBlogTab onNotify={onNotify} />}
            {activeTab === 'messages' && <AdminMessagesReviewsTab mode="messages" onNotify={onNotify} />}
            {activeTab === 'reviews' && <AdminMessagesReviewsTab mode="reviews" onNotify={onNotify} />}
            {activeTab === 'pages' && <AdminPageContentTab onNotify={onNotify} />}
            {activeTab === 'seo' && <AdminSeoTab onNotify={onNotify} />}
            {activeTab === 'users' && <AdminSettingsAndUsersTab mode="users" onNotify={onNotify} />}
            {activeTab === 'logs' && <AdminAuditBackupTab mode="logs" onNotify={onNotify} />}
            {activeTab === 'settings' && <AdminSettingsAndUsersTab mode="settings" onNotify={onNotify} />}
          </>
        )}
      </main>
    </div>
  );
}
