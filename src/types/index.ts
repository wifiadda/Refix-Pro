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

export interface AdminUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin';
  createdAt?: unknown;
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
  googleReviewsUrl: string;
  logoUrl: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string;
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
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  serviceAreasText: string;
  homeFaqs: FaqItem[];
  pageContent: PageContentSettings;
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

export interface RepairEnquiry {
  id: string;
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
  updatedAt?: unknown;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
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
