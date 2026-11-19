export type EnquiryStatus =
  | 'New'
  | 'Contacted'
  | 'Inspection'
  | 'Estimate Sent'
  | 'Approved'
  | 'In Repair'
  | 'Ready for Delivery'
  | 'Completed'
  | 'Cancelled';

export const ENQUIRY_STATUSES: EnquiryStatus[] = [
  'New',
  'Contacted',
  'Inspection',
  'Estimate Sent',
  'Approved',
  'In Repair',
  'Ready for Delivery',
  'Completed',
  'Cancelled',
];

export type JobWorkflowStatus =
  | 'New Booking'
  | 'Received'
  | 'Inspection'
  | 'Diagnosis'
  | 'Estimate Sent'
  | 'Awaiting Approval'
  | 'Approved'
  | 'In Repair'
  | 'Quality Check'
  | 'Ready for Delivery'
  | 'Delivered'
  | 'Completed'
  | 'Rejected Estimate'
  | 'Cancelled Repair'
  | 'On Hold'
  | 'Warranty Repair';

export const DEFAULT_JOB_WORKFLOW_STATUSES: JobWorkflowStatus[] = [
  'New Booking',
  'Received',
  'Inspection',
  'Diagnosis',
  'Estimate Sent',
  'Awaiting Approval',
  'Approved',
  'In Repair',
  'Quality Check',
  'Ready for Delivery',
  'Delivered',
  'Completed',
  'Rejected Estimate',
  'Cancelled Repair',
  'On Hold',
  'Warranty Repair',
];

export const PRIMARY_WORKFLOW_TIMELINE: JobWorkflowStatus[] = [
  'New Booking',
  'Received',
  'Inspection',
  'Diagnosis',
  'Estimate Sent',
  'Awaiting Approval',
  'Approved',
  'In Repair',
  'Quality Check',
  'Ready for Delivery',
  'Delivered',
  'Completed',
];

export type ServiceCategory =
  | 'Hardware Repair'
  | 'Display Repair'
  | 'Battery & Charging'
  | 'Liquid Damage Repair'
  | 'Software & Performance'
  | 'Other Repairs';

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Hardware Repair',
  'Display Repair',
  'Battery & Charging',
  'Liquid Damage Repair',
  'Software & Performance',
  'Other Repairs',
];

export type MacBookCategory =
  | 'MacBook Air'
  | 'MacBook Pro'
  | 'Intel MacBook'
  | 'Apple Silicon M1'
  | 'Apple Silicon M2'
  | 'Apple Silicon M3'
  | 'Apple Silicon M4'
  | 'Newer Compatible Models'
  | 'iPad & Tablet'
  | 'iPhone';

export const MACBOOK_CATEGORIES: MacBookCategory[] = [
  'MacBook Air',
  'MacBook Pro',
  'Intel MacBook',
  'Apple Silicon M1',
  'Apple Silicon M2',
  'Apple Silicon M3',
  'Apple Silicon M4',
  'Newer Compatible Models',
  'iPad & Tablet',
  'iPhone',
];

export type StaffRole = 'super_admin' | 'admin' | 'staff' | 'technician' | 'user';
export type UserRole = 'user' | 'staff' | 'technician' | 'admin' | 'super_admin';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'export'
  | 'manage_settings';

export type AdminModuleKey =
  | 'overview'
  | 'jobs'
  | 'enquiries'
  | 'customers'
  | 'appointments'
  | 'technicians'
  | 'inventory'
  | 'payments'
  | 'invoices'
  | 'expenses'
  | 'reports'
  | 'services'
  | 'models'
  | 'blogs'
  | 'messages'
  | 'reviews'
  | 'pages'
  | 'seo'
  | 'settings'
  | 'users'
  | 'logs';

export interface AdminPermissions {
  actions: PermissionAction[];
  modules: AdminModuleKey[];
}

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  actions: ['view', 'create', 'edit', 'approve', 'export'],
  modules: [
    'overview',
    'jobs',
    'enquiries',
    'customers',
    'appointments',
    'technicians',
    'inventory',
    'payments',
    'invoices',
    'expenses',
    'reports',
    'services',
    'models',
    'blogs',
    'messages',
    'reviews',
  ],
};

export const DEFAULT_STAFF_PERMISSIONS: AdminPermissions = {
  actions: ['view', 'create', 'edit'],
  modules: [
    'overview',
    'jobs',
    'enquiries',
    'customers',
    'appointments',
    'inventory',
    'payments',
    'invoices',
    'messages',
    'reviews',
  ],
};

export const ALL_ADMIN_MODULES: { id: AdminModuleKey; label: string }[] = [
  { id: 'overview', label: 'Executive Dashboard' },
  { id: 'jobs', label: 'Repair Jobs & Cards' },
  { id: 'enquiries', label: 'Repair Enquiries' },
  { id: 'customers', label: 'Customers CRM' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'technicians', label: 'Technicians & Staff' },
  { id: 'inventory', label: 'Inventory & Parts' },
  { id: 'payments', label: 'Payments & Razorpay' },
  { id: 'invoices', label: 'Invoices & Receipts' },
  { id: 'expenses', label: 'Business Expenses' },
  { id: 'reports', label: 'Reports & Analytics' },
  { id: 'services', label: 'Services Catalog' },
  { id: 'models', label: 'Apple Models Catalog' },
  { id: 'blogs', label: 'Blog CMS' },
  { id: 'messages', label: 'Messages' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'pages', label: 'Website CMS & Preview' },
  { id: 'seo', label: 'SEO Control Panel' },
  { id: 'settings', label: 'System & Backup Settings' },
  { id: 'users', label: 'Users & Permissions' },
  { id: 'logs', label: 'Audit & Security Logs' },
];

export interface AdminUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin' | 'staff' | 'technician';
  isActive?: boolean;
  permissions?: AdminPermissions;
  createdAt?: unknown;
}

export interface AppUserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  role: UserRole;
  isActive?: boolean;
  permissions?: AdminPermissions;
  createdAt?: unknown;
  lastLoginAt?: unknown;
}

export interface NavLinkItem {
  label: string;
  to: string;
  visible: boolean;
}

export interface FooterLinkItem {
  label: string;
  to: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface HeroSlideItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
}

export interface PageSeoEntry {
  path: string;
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImageAlt?: string;
}

export interface RedirectRuleItem {
  fromPath: string;
  toPath: string;
  statusCode: '301' | '302';
}

export interface PageContentSettings {
  home: {
    heroEyebrow: string;
    servicesEyebrow: string;
    servicesHeading: string;
    toolsEyebrow: string;
    toolsHeading: string;
    toolsSubheading: string;
    whyEyebrow: string;
    whyHeading: string;
    whyDescription: string;
    modelsEyebrow: string;
    modelsHeading: string;
    modelsSubheading: string;
    problemsHeading: string;
    processHeading: string;
    reviewsHeading: string;
    faqHeading: string;
    blogHeading: string;
    locationHeading: string;
    finalCtaHeadline: string;
    finalCtaSubheadline: string;
  };
  services: {
    headline: string;
    subheadline: string;
    noticeText: string;
  };
  models: {
    headline: string;
    subheadline: string;
    selectorHeading: string;
    selectorSubheading: string;
    selectorNotice: string;
  };
  book: {
    headline: string;
    subheadline: string;
    securityNote: string;
  };
  track: {
    headline: string;
    subheadline: string;
  };
  about: {
    headline: string;
    subheadline: string;
    workshopImageUrl: string;
    approachHeading: string;
    approachDescription: string;
    galleryHeading: string;
    gallerySubheading: string;
  };
  blog: {
    headline: string;
    subheadline: string;
    sidebarCtaTitle: string;
    sidebarCtaText: string;
  };
  contact: {
    headline: string;
    subheadline: string;
    formHeading: string;
    mapHeading: string;
  };
}

export interface SystemErpSettings {
  currency?: string;
  timezone?: string;
  dateFormat?: string;
  invoicePrefix?: string;
  jobCardPrefix?: string;
  gstNumber?: string;
  defaultTaxRate?: number;
  workflowStatuses?: string[];
  whatsappAlertsEnabled?: boolean;
  emailAlertsEnabled?: boolean;
  pageSeoOverrides?: PageSeoEntry[];
  robotsTxtCustom?: string;
  redirectRules?: RedirectRuleItem[];
  lastBackupAt?: string;
}

export interface WebsiteSettings {
  businessName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  websiteUrl: string;
  address: string;
  businessHours: string;
  googleRating: number;
  googleReviewCount: number;
  googlePlaceId: string;
  googleReviewsUrl: string;
  logoUrl: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string;
  heroSlides: HeroSlideItem[];
  headerCtaText: string;
  headerCtaUrl: string;
  navLinks: NavLinkItem[];
  footerDescription: string;
  footerTagline: string;
  footerLegalText: string;
  footerQuickLinks: FooterLinkItem[];
  footerServiceLinks: FooterLinkItem[];
  socialInstagram: string;
  socialFacebook: string;
  socialYoutube: string;
  socialLinkedin: string;
  socialTwitter: string;
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  razorpayPaymentLinkUrl: string;
  manualPaymentEnabled: boolean;
  manualUpiId: string;
  manualUpiQrUrl: string;
  manualBankDetails: string;
  manualPaymentNote: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  serviceAreasText: string;
  homeFaqs: FaqItem[];
  pageContent: PageContentSettings;
  erpConfig?: SystemErpSettings;
  updatedAt?: unknown;
}

export interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  category: ServiceCategory;
  shortDescription: string;
  repairInfo: string;
  symptoms: string[];
  imageUrl: string;
  priceDisplay: string;
  showPrice: boolean;
  isActive: boolean;
  sortOrder: number;
  updatedAt?: unknown;
}

export interface MacBookModelItem {
  id: string;
  category: MacBookCategory;
  name: string;
  yearRange: string;
  processor: string;
  modelIdentifiers: string;
  commonIssues: string[];
  availabilityNote: string;
  isActive: boolean;
  updatedAt?: unknown;
}

export type PaymentStatus = 'Unpaid' | 'Pending Verification' | 'Paid' | 'Partial' | 'Refunded';
export type PaymentMethodType = 'Razorpay' | 'Manual UPI / Bank' | 'UPI' | 'Bank Transfer' | 'Cash';

export interface RepairEnquiry {
  id: string;
  userId?: string;
  enquiryCode: string;
  customerName: string;
  mobile: string;
  whatsapp: string;
  email: string;
  macbookModel: string;
  macbookYear: string;
  processorType: string;
  serviceName: string;
  problemDescription: string;
  preferredContactMethod: 'WhatsApp' | 'Phone Call' | 'Email';
  preferredVisitDate: string;
  additionalNotes: string;
  imageUrls: string[];
  status: EnquiryStatus;
  technicianNotes: string;
  repairEstimate: string;
  followUpDate: string;
  payableAmount?: number;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RepairTrackingRecord {
  id: string;
  enquiryCode: string;
  macbookModel: string;
  serviceName: string;
  status: EnquiryStatus;
  repairEstimate: string;
  followUpDate: string;
  publicUpdateNote: string;
  payableAmount?: number;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  updatedAt?: unknown;
}

export interface JobPartUsage {
  partId: string;
  sku: string;
  partName: string;
  quantity: number;
  unitPrice: number;
}

export interface RepairJobCard {
  id: string;
  jobCardCode: string;
  enquiryId?: string;
  enquiryCode?: string;
  customerId?: string;
  customerUid?: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  deviceType: 'MacBook' | 'iPad' | 'iPhone' | 'Other Apple';
  macbookModel: string;
  modelNumber?: string;
  serialNumber?: string;
  deviceCondition: string;
  accessoriesReceived: string;
  reportedProblem: string;
  inspectionDetails: string;
  diagnosis: string;
  estimatedCost: number;
  finalCost?: number;
  technicianUid?: string;
  technicianName?: string;
  partsUsed: JobPartUsage[];
  approvalStatus: 'Not Sent' | 'Pending' | 'Approved' | 'Rejected';
  status: JobWorkflowStatus;
  deliveryDate?: string;
  warrantyPeriod?: string;
  warrantyExpiry?: string;
  qualityChecklist?: {
    displayTested: boolean;
    batteryTested: boolean;
    portsTested: boolean;
    thermalTested: boolean;
    backupVerified: boolean;
    cleanFinish: boolean;
  };
  beforeImages: string[];
  afterImages: string[];
  internalNotes: string;
  customerUpdates: string;
  paymentStatus: PaymentStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CustomerRecord {
  id: string;
  customerCode: string;
  uid?: string;
  name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  deviceHistory: string[];
  notes: string;
  followUpDate: string;
  totalBusinessValue: number;
  repairCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TechnicianProfile {
  id: string;
  uid?: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  availability: 'Available' | 'Busy' | 'On Leave' | 'Inactive';
  notes: string;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AppointmentRecord {
  id: string;
  appointmentCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerUid?: string;
  macbookModel: string;
  serviceType: string;
  scheduledDate: string;
  scheduledSlot: string;
  technicianUid?: string;
  technicianName?: string;
  status: 'Scheduled' | 'Confirmed' | 'Rescheduled' | 'Completed' | 'Cancelled';
  notes: string;
  reminderSent: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface InventoryItem {
  id: string;
  partCode: string;
  name: string;
  compatibleModels: string;
  sku: string;
  supplierName: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minStock: number;
  location: string;
  purchaseDate: string;
  updatedAt?: unknown;
}

export interface StockMovement {
  id: string;
  partId: string;
  partName: string;
  sku: string;
  type: 'IN' | 'OUT' | 'REPAIR_USE' | 'ADJUSTMENT';
  quantityDelta: number;
  previousQty: number;
  nextQty: number;
  jobCardCode?: string;
  actorUid: string;
  actorName: string;
  note: string;
  createdAt?: unknown;
}

export interface SupplierRecord {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  notes: string;
  createdAt?: unknown;
}

export interface PurchaseOrderRecord {
  id: string;
  poNumber: string;
  supplierName: string;
  itemsSummary: string;
  totalAmount: number;
  status: 'Draft' | 'Ordered' | 'Received' | 'Cancelled';
  expectedDate: string;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PaymentSubmission {
  id: string;
  userId?: string;
  enquiryCode: string;
  jobCardCode?: string;
  invoiceNumber?: string;
  customerName: string;
  mobile: string;
  amount: number;
  method: PaymentMethodType;
  transactionRef: string;
  notes?: string;
  refundAmount?: number;
  refundNote?: string;
  status: 'Pending Verification' | 'Verified Paid' | 'Rejected' | 'Refunded';
  createdAt?: unknown;
  verifiedAt?: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  jobCardCode?: string;
  enquiryCode?: string;
  customerId?: string;
  customerUid?: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  customerAddress?: string;
  deviceSummary: string;
  repairSummary: string;
  serviceCharges: number;
  partsCharges: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  outstandingAmount: number;
  status: 'Unpaid' | 'Partial' | 'Paid' | 'Refunded';
  warrantyNote: string;
  issuedDate: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExpenseRecord {
  id: string;
  category:
    | 'Spare Parts'
    | 'Rent & Utilities'
    | 'Tools & Equipment'
    | 'Salaries'
    | 'Marketing'
    | 'Courier & Logistics'
    | 'Other';
  description: string;
  amount: number;
  expenseDate: string;
  paymentMethod: 'UPI' | 'Bank Transfer' | 'Cash' | 'Card';
  referenceNumber: string;
  documentNote: string;
  createdAt?: unknown;
}

export interface NotificationItem {
  id: string;
  recipientUid?: string;
  recipientEmail?: string;
  audience: 'customer' | 'staff' | 'all_admins';
  title: string;
  message: string;
  category: 'booking' | 'repair' | 'estimate' | 'payment' | 'appointment' | 'system';
  relatedCode?: string;
  isRead: boolean;
  createdAt?: unknown;
}

export interface ActivityLogRecord {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetCollection: string;
  targetId: string;
  summary: string;
  metadata?: string;
  createdAt?: unknown;
}

export interface ContactMessage {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  adminReply?: string;
  repliedAt?: string;
  createdAt?: unknown;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt?: unknown;
}

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  authorName: string;
  status: 'draft' | 'published' | 'scheduled';
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  faqs: BlogFaq[];
  isFeatured: boolean;
  views: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ReviewItem {
  id: string;
  authorLabel: string;
  rating: number;
  quote: string;
  source: string;
  dateLabel: string;
  isVisible: boolean;
  createdAt?: unknown;
}

export interface GalleryImageItem {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  category: string;
  sortOrder: number;
  createdAt?: unknown;
}

export interface GoogleLiveReview {
  id: string;
  authorName: string;
  authorUri: string | null;
  authorPhotoUri: string | null;
  rating: number;
  text: string;
  relativeTime: string;
  googleMapsUri: string | null;
}

export interface GoogleLiveProfile {
  loaded: boolean;
  loading: boolean;
  error: string | null;
  placeId: string | null;
  displayName: string | null;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsUri: string | null;
  writeAReviewUri: string | null;
  reviews: GoogleLiveReview[];
}
