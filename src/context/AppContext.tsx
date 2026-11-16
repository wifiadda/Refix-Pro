import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  ADMIN_BOOTSTRAP_EMAILS,
  OperationType,
  auth,
  computeTrackingId,
  db,
  handleFirestoreError,
  testFirestoreConnection,
} from '../lib/firebase';
import {
  DEFAULT_BLOG_CATEGORIES,
  DEFAULT_BLOG_POSTS,
  DEFAULT_GALLERY_IMAGES,
  DEFAULT_REVIEWS,
  DEFAULT_WEBSITE_SETTINGS,
} from '../data/seedBlogsAndSettings';
import { DEFAULT_MACBOOK_MODELS, DEFAULT_SERVICES } from '../data/seedServicesAndModels';
import type {
  AdminUser,
  BlogCategory,
  BlogPost,
  ContactMessage,
  GalleryImageItem,
  GoogleLiveProfile,
  MacBookModelItem,
  PaymentMethodType,
  PaymentSubmission,
  RepairEnquiry,
  RepairTrackingRecord,
  ReviewItem,
  ServiceItem,
  WebsiteSettings,
} from '../types';

export const DEFAULT_GOOGLE_LIVE_PROFILE: GoogleLiveProfile = {
  loaded: false,
  loading: false,
  error: null,
  placeId: null,
  displayName: null,
  rating: null,
  userRatingCount: null,
  googleMapsUri: null,
  reviews: [],
};

interface NewRepairEnquiryInput {
  customerName: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  macbookModel: string;
  macbookYear?: string;
  processorType?: string;
  serviceName: string;
  problemDescription?: string;
  preferredContactMethod?: 'WhatsApp' | 'Phone Call' | 'Email';
  preferredVisitDate?: string;
  additionalNotes?: string;
  imageUrls?: string[];
}

interface NewContactMessageInput {
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
}

interface NewPaymentSubmissionInput {
  enquiryId?: string;
  enquiryCode: string;
  customerName: string;
  mobile: string;
  amount: number;
  method: PaymentMethodType;
  transactionRef: string;
  notes?: string;
}

interface AppContextValue {
  settings: WebsiteSettings;
  services: ServiceItem[];
  models: MacBookModelItem[];
  blogPosts: BlogPost[];
  blogCategories: BlogCategory[];
  reviews: ReviewItem[];
  galleryImages: GalleryImageItem[];
  publicLoading: boolean;

  // Auth & Admin / Customer
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  adminLogin: () => Promise<void>;
  adminLogout: () => Promise<void>;
  customerLogin: () => Promise<void>;
  customerLogout: () => Promise<void>;
  customerEnquiries: RepairEnquiry[];
  customerMessages: ContactMessage[];
  customerPayments: PaymentSubmission[];
  customerLoading: boolean;
  refreshCustomerData: () => Promise<void>;

  // Admin datasets
  adminServices: ServiceItem[];
  adminModels: MacBookModelItem[];
  adminBlogPosts: BlogPost[];
  adminReviews: ReviewItem[];
  enquiries: RepairEnquiry[];
  paymentSubmissions: PaymentSubmission[];
  contactMessages: ContactMessage[];
  adminUsers: AdminUser[];
  adminLoading: boolean;
  hasFirestoreSeed: boolean;
  refreshPublicData: () => Promise<void>;
  refreshAdminData: () => Promise<void>;
  seedCatalogToFirestore: () => Promise<void>;

  // Public submissions & tracking & payments
  submitRepairEnquiry: (input: NewRepairEnquiryInput) => Promise<{ enquiryId: string; enquiryCode: string }>;
  trackRepairEnquiry: (enquiryCode: string, mobile: string) => Promise<RepairTrackingRecord | null>;
  submitRepairPayment: (input: NewPaymentSubmissionInput) => Promise<{ paymentId: string }>;
  submitContactMessage: (input: NewContactMessageInput) => Promise<void>;
  submitPublicReview: (input: { name: string; device?: string; rating: number; quote: string }) => Promise<void>;

  // Admin mutations
  updateEnquiry: (id: string, patch: Partial<RepairEnquiry>) => Promise<void>;
  deleteEnquiry: (id: string) => Promise<void>;
  verifyPaymentSubmission: (
    paymentId: string,
    decision: 'Verified Paid' | 'Rejected',
    notes?: string
  ) => Promise<void>;
  deletePaymentSubmission: (paymentId: string) => Promise<void>;
  saveService: (item: Omit<ServiceItem, 'updatedAt'>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  saveMacBookModel: (item: Omit<MacBookModelItem, 'updatedAt'>) => Promise<void>;
  deleteMacBookModel: (id: string) => Promise<void>;
  saveBlogPost: (item: Omit<BlogPost, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  deleteBlogPost: (id: string) => Promise<void>;
  saveBlogCategory: (item: Omit<BlogCategory, 'createdAt'>) => Promise<void>;
  deleteBlogCategory: (id: string) => Promise<void>;
  markMessageRead: (id: string, isRead: boolean) => Promise<void>;
  replyToContactMessage: (id: string, adminReply: string) => Promise<void>;
  deleteContactMessage: (id: string) => Promise<void>;
  saveReview: (item: Omit<ReviewItem, 'createdAt'>) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  saveGalleryImage: (item: Omit<GalleryImageItem, 'createdAt'>) => Promise<void>;
  deleteGalleryImage: (id: string) => Promise<void>;
  saveWebsiteSettings: (next: WebsiteSettings) => Promise<void>;
  saveAdminUser: (adminUser: Omit<AdminUser, 'id' | 'createdAt'>) => Promise<void>;
  removeAdminUser: (uid: string) => Promise<void>;

  // Live Google Business Profile sync (transient Places SDK state)
  googleLiveProfile: GoogleLiveProfile;
  setGoogleLiveProfile: React.Dispatch<React.SetStateAction<GoogleLiveProfile>>;
  googleSyncNonce: number;
  triggerGoogleProfileSync: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function makeValidId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36);
  return `${prefix}-${ts}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 140) || 'item'
  );
}

function getTimestampMillis(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'object' && val !== null && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function mergeWebsiteSettings(raw?: Partial<WebsiteSettings>): WebsiteSettings {
  const def = DEFAULT_WEBSITE_SETTINGS;
  const src = raw || {};
  const srcPage = src.pageContent || ({} as Partial<WebsiteSettings['pageContent']>);
  const rawAddress = (src.address || '').trim();
  const normalizedAddress =
    !rawAddress || rawAddress.toLowerCase().includes('sector 14 main market')
      ? def.address
      : rawAddress;
  const rawServiceAreas = (src.serviceAreasText || '').trim();
  const normalizedServiceAreas = /cyber city|mg road|golf course|sohna road/i.test(rawServiceAreas)
    ? ''
    : rawServiceAreas;

  const baseQuickLinks =
    Array.isArray(src.footerQuickLinks) && src.footerQuickLinks.length > 0
      ? src.footerQuickLinks
      : def.footerQuickLinks;
  const withDashboardLink = baseQuickLinks.some((l) => l.to === '/dashboard')
    ? baseQuickLinks
    : [...baseQuickLinks, { label: 'Customer Dashboard', to: '/dashboard' }];
  const mergedQuickLinks = withDashboardLink.some((l) => l.to === '/pay')
    ? withDashboardLink
    : [...withDashboardLink, { label: 'Pay Online', to: '/pay' }];

  return {
    ...def,
    ...src,
    address: normalizedAddress,
    serviceAreasText: normalizedServiceAreas,
    heroSlides:
      Array.isArray(src.heroSlides) && src.heroSlides.length > 0 ? src.heroSlides : def.heroSlides,
    navLinks:
      Array.isArray(src.navLinks) && src.navLinks.length > 0 ? src.navLinks : def.navLinks,
    footerQuickLinks: mergedQuickLinks,
    footerServiceLinks:
      Array.isArray(src.footerServiceLinks) && src.footerServiceLinks.length > 0
        ? src.footerServiceLinks
        : def.footerServiceLinks,
    homeFaqs:
      Array.isArray(src.homeFaqs) && src.homeFaqs.length > 0 ? src.homeFaqs : def.homeFaqs,
    pageContent: {
      home: { ...def.pageContent.home, ...(srcPage.home || {}) },
      services: { ...def.pageContent.services, ...(srcPage.services || {}) },
      models: { ...def.pageContent.models, ...(srcPage.models || {}) },
      book: { ...def.pageContent.book, ...(srcPage.book || {}) },
      track: { ...def.pageContent.track, ...(srcPage.track || {}) },
      about: { ...def.pageContent.about, ...(srcPage.about || {}) },
      blog: { ...def.pageContent.blog, ...(srcPage.blog || {}) },
      contact: { ...def.pageContent.contact, ...(srcPage.contact || {}) },
    },
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<WebsiteSettings>(DEFAULT_WEBSITE_SETTINGS);
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [models, setModels] = useState<MacBookModelItem[]>(DEFAULT_MACBOOK_MODELS);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(DEFAULT_BLOG_POSTS);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>(DEFAULT_BLOG_CATEGORIES);
  const [reviews, setReviews] = useState<ReviewItem[]>(DEFAULT_REVIEWS);
  const [galleryImages, setGalleryImages] = useState<GalleryImageItem[]>(DEFAULT_GALLERY_IMAGES);
  const [publicLoading, setPublicLoading] = useState(true);
  const [hasFirestoreSeed, setHasFirestoreSeed] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [adminServices, setAdminServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [adminModels, setAdminModels] = useState<MacBookModelItem[]>(DEFAULT_MACBOOK_MODELS);
  const [adminBlogPosts, setAdminBlogPosts] = useState<BlogPost[]>(DEFAULT_BLOG_POSTS);
  const [adminReviews, setAdminReviews] = useState<ReviewItem[]>(DEFAULT_REVIEWS);
  const [enquiries, setEnquiries] = useState<RepairEnquiry[]>([]);
  const [paymentSubmissions, setPaymentSubmissions] = useState<PaymentSubmission[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [customerEnquiries, setCustomerEnquiries] = useState<RepairEnquiry[]>([]);
  const [customerMessages, setCustomerMessages] = useState<ContactMessage[]>([]);
  const [customerPayments, setCustomerPayments] = useState<PaymentSubmission[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [googleLiveProfile, setGoogleLiveProfile] = useState<GoogleLiveProfile>(
    DEFAULT_GOOGLE_LIVE_PROFILE
  );
  const [googleSyncNonce, setGoogleSyncNonce] = useState(0);

  const triggerGoogleProfileSync = useCallback(() => {
    setGoogleSyncNonce((n) => n + 1);
  }, []);

  const refreshPublicData = useCallback(async () => {
    setPublicLoading(true);
    try {
      const settingsSnap = await getDoc(doc(db, 'websiteSettings', 'main'));
      if (settingsSnap.exists()) {
        setHasFirestoreSeed(true);
        setSettings(mergeWebsiteSettings(settingsSnap.data() as Partial<WebsiteSettings>));
      } else {
        setHasFirestoreSeed(false);
        setSettings(DEFAULT_WEBSITE_SETTINGS);
      }

      const [srvSnap, mdlSnap, postSnap, catSnap, revSnap, galSnap] = await Promise.all([
        getDocs(query(collection(db, 'services'), where('isActive', '==', true))),
        getDocs(query(collection(db, 'macbookModels'), where('isActive', '==', true))),
        getDocs(query(collection(db, 'blogPosts'), where('status', '==', 'published'))),
        getDocs(collection(db, 'blogCategories')),
        getDocs(query(collection(db, 'reviews'), where('isVisible', '==', true))),
        getDocs(collection(db, 'galleryImages')),
      ]);

      if (!srvSnap.empty) {
        const list = srvSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceItem, 'id'>) }));
        list.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
        setServices(list);
      } else {
        setServices(DEFAULT_SERVICES);
      }

      if (!mdlSnap.empty) {
        setModels(mdlSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MacBookModelItem, 'id'>) })));
      } else {
        setModels(DEFAULT_MACBOOK_MODELS);
      }

      if (!postSnap.empty) {
        const posts = postSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) }));
        posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
        setBlogPosts(posts);
      } else {
        setBlogPosts(DEFAULT_BLOG_POSTS);
      }

      if (!catSnap.empty) {
        setBlogCategories(catSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogCategory, 'id'>) })));
      } else {
        setBlogCategories(DEFAULT_BLOG_CATEGORIES);
      }

      if (!revSnap.empty) {
        const loadedReviews = revSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReviewItem, 'id'>) }));
        loadedReviews.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
        if (!settingsSnap.exists()) {
          const existingIds = new Set(loadedReviews.map((r) => r.id));
          const missingDefaults = DEFAULT_REVIEWS.filter((r) => !existingIds.has(r.id));
          setReviews([...loadedReviews, ...missingDefaults]);
        } else {
          setReviews(loadedReviews);
        }
      } else {
        setReviews(DEFAULT_REVIEWS);
      }

      if (!galSnap.empty) {
        const imgs = galSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryImageItem, 'id'>) }));
        imgs.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
        setGalleryImages(imgs);
      } else {
        setGalleryImages(DEFAULT_GALLERY_IMAGES);
      }
    } catch (error) {
      console.error('Public load error:', error);
    } finally {
      setPublicLoading(false);
    }
  }, []);

  const refreshAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setAdminLoading(true);
    try {
      const [enqSnap, paySnap, msgSnap, srvSnap, mdlSnap, postSnap, revSnap, admSnap] = await Promise.all([
        getDocs(collection(db, 'repairEnquiries')).catch((e) => handleFirestoreError(e, OperationType.LIST, 'repairEnquiries')),
        getDocs(collection(db, 'paymentSubmissions')).catch((e) => handleFirestoreError(e, OperationType.LIST, 'paymentSubmissions')),
        getDocs(collection(db, 'contactMessages')).catch((e) => handleFirestoreError(e, OperationType.LIST, 'contactMessages')),
        getDocs(collection(db, 'services')).catch((e) => handleFirestoreError(e, OperationType.LIST, 'services')),
        getDocs(collection(db, 'macbookModels')).catch((e) => handleFirestoreError(e, OperationType.LIST, 'macbookModels')),
        getDocs(collection(db, 'blogPosts')).catch((e) => handleFirestoreError(e, OperationType.LIST, 'blogPosts')),
        getDocs(collection(db, 'reviews')).catch((e) => handleFirestoreError(e, OperationType.LIST, 'reviews')),
        getDocs(collection(db, 'admins')).catch((e) => handleFirestoreError(e, OperationType.LIST, 'admins')),
      ]);

      const enqList = enqSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RepairEnquiry, 'id'>) }));
      enqList.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
      setEnquiries(enqList);

      const payList = paySnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentSubmission, 'id'>) }));
      payList.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
      setPaymentSubmissions(payList);

      const msgList = msgSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ContactMessage, 'id'>) }));
      msgList.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
      setContactMessages(msgList);

      if (!srvSnap.empty) {
        const srvList = srvSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceItem, 'id'>) }));
        srvList.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
        setAdminServices(srvList);
      } else {
        setAdminServices([]);
      }

      if (!mdlSnap.empty) {
        setAdminModels(mdlSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MacBookModelItem, 'id'>) })));
      } else {
        setAdminModels([]);
      }

      if (!postSnap.empty) {
        const posts = postSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) }));
        posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
        setAdminBlogPosts(posts);
      } else {
        setAdminBlogPosts([]);
      }

      if (!revSnap.empty) {
        const revList = revSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReviewItem, 'id'>) }));
        revList.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
        setAdminReviews(revList);
      } else {
        setAdminReviews([]);
      }

      setAdminUsers(admSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminUser, 'id'>) })));
    } finally {
      setAdminLoading(false);
    }
  }, [isAdmin]);

  const seedCatalogToFirestore = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [existingCatsSnap, existingPostsSnap, existingReviewsSnap, existingGallerySnap] =
        await Promise.all([
          getDocs(collection(db, 'blogCategories')),
          getDocs(collection(db, 'blogPosts')),
          getDocs(collection(db, 'reviews')),
          getDocs(collection(db, 'galleryImages')),
        ]);

      const existingCatCreated = new Map(
        existingCatsSnap.docs.map((d) => [d.id, d.data()?.createdAt])
      );
      const existingPostCreated = new Map(
        existingPostsSnap.docs.map((d) => [d.id, d.data()?.createdAt])
      );
      const existingReviewCreated = new Map(
        existingReviewsSnap.docs.map((d) => [d.id, d.data()?.createdAt])
      );
      const existingGalleryCreated = new Map(
        existingGallerySnap.docs.map((d) => [d.id, d.data()?.createdAt])
      );

      const batch = writeBatch(db);

      batch.set(doc(db, 'websiteSettings', 'main'), {
        ...DEFAULT_WEBSITE_SETTINGS,
        updatedAt: serverTimestamp(),
      });

      for (const s of DEFAULT_SERVICES) {
        const { id, ...rest } = s;
        batch.set(doc(db, 'services', id), {
          ...rest,
          updatedAt: serverTimestamp(),
        });
      }

      for (const m of DEFAULT_MACBOOK_MODELS) {
        const { id, ...rest } = m;
        batch.set(doc(db, 'macbookModels', id), {
          ...rest,
          updatedAt: serverTimestamp(),
        });
      }

      for (const cat of DEFAULT_BLOG_CATEGORIES) {
        const { id, ...rest } = cat;
        const ref = doc(db, 'blogCategories', id);
        const prevCreatedAt = existingCatCreated.get(id);
        batch.set(ref, {
          name: rest.name,
          slug: rest.slug,
          description: rest.description || '',
          createdAt: prevCreatedAt || serverTimestamp(),
        });
      }

      for (const post of DEFAULT_BLOG_POSTS) {
        const { id, ...rest } = post;
        const ref = doc(db, 'blogPosts', id);
        const prevCreatedAt = existingPostCreated.get(id);
        batch.set(ref, {
          ...rest,
          createdAt: prevCreatedAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const rev of DEFAULT_REVIEWS) {
        const { id, ...rest } = rev;
        const ref = doc(db, 'reviews', id);
        const prevCreatedAt = existingReviewCreated.get(id);
        batch.set(ref, {
          ...rest,
          createdAt: prevCreatedAt || serverTimestamp(),
        });
      }

      for (const gal of DEFAULT_GALLERY_IMAGES) {
        const { id, ...rest } = gal;
        const ref = doc(db, 'galleryImages', id);
        const prevCreatedAt = existingGalleryCreated.get(id);
        batch.set(ref, {
          ...rest,
          createdAt: prevCreatedAt || serverTimestamp(),
        });
      }

      await batch.commit();
      setHasFirestoreSeed(true);
      await Promise.all([refreshPublicData(), refreshAdminData()]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch-seed');
    }
  }, [isAdmin, refreshAdminData, refreshPublicData]);

  useEffect(() => {
    testFirestoreConnection();
    refreshPublicData();
  }, [refreshPublicData]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.emailVerified) {
        const normalizedEmail = (currentUser.email || '').toLowerCase();
        if (ADMIN_BOOTSTRAP_EMAILS.includes(normalizedEmail)) {
          setIsAdmin(true);
          try {
            const adminRef = doc(db, 'admins', currentUser.uid);
            const snap = await getDoc(adminRef);
            if (!snap.exists()) {
              await setDoc(adminRef, {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || 'Refix Pro Owner',
                role: 'super_admin',
                createdAt: serverTimestamp(),
              });
            }
          } catch (err) {
            console.error('Admin bootstrap check:', err);
          }
        } else {
          try {
            const snap = await getDoc(doc(db, 'admins', currentUser.uid));
            setIsAdmin(snap.exists());
          } catch {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const refreshCustomerData = useCallback(async () => {
    if (!user) {
      setCustomerEnquiries([]);
      setCustomerMessages([]);
      setCustomerPayments([]);
      return;
    }
    setCustomerLoading(true);
    try {
      const enqQueries = [
        getDocs(query(collection(db, 'repairEnquiries'), where('userId', '==', user.uid))),
      ];
      const msgQueries = [
        getDocs(query(collection(db, 'contactMessages'), where('userId', '==', user.uid))),
      ];
      const payQuery = getDocs(
        query(collection(db, 'paymentSubmissions'), where('userId', '==', user.uid))
      );

      if (user.emailVerified && user.email) {
        enqQueries.push(
          getDocs(query(collection(db, 'repairEnquiries'), where('email', '==', user.email)))
        );
        msgQueries.push(
          getDocs(query(collection(db, 'contactMessages'), where('email', '==', user.email)))
        );
      }

      const [enqSnaps, msgSnaps, paySnapResult] = await Promise.all([
        Promise.allSettled(enqQueries),
        Promise.allSettled(msgQueries),
        Promise.allSettled([payQuery]),
      ]);

      const enqMap = new Map<string, RepairEnquiry>();
      for (const res of enqSnaps) {
        if (res.status === 'fulfilled') {
          for (const d of res.value.docs) {
            enqMap.set(d.id, { id: d.id, ...(d.data() as Omit<RepairEnquiry, 'id'>) });
          }
        }
      }
      const mergedEnqs = Array.from(enqMap.values()).sort(
        (a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt)
      );
      setCustomerEnquiries(mergedEnqs);

      const msgMap = new Map<string, ContactMessage>();
      for (const res of msgSnaps) {
        if (res.status === 'fulfilled') {
          for (const d of res.value.docs) {
            msgMap.set(d.id, { id: d.id, ...(d.data() as Omit<ContactMessage, 'id'>) });
          }
        }
      }
      const mergedMsgs = Array.from(msgMap.values()).sort(
        (a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt)
      );
      setCustomerMessages(mergedMsgs);

      if (paySnapResult[0]?.status === 'fulfilled') {
        const payList = paySnapResult[0].value.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PaymentSubmission, 'id'>),
        }));
        payList.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
        setCustomerPayments(payList);
      }
    } catch (error) {
      console.error('Customer data load error:', error);
    } finally {
      setCustomerLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      refreshAdminData();
    }
  }, [isAdmin, refreshAdminData]);

  useEffect(() => {
    if (authReady && user) {
      refreshCustomerData();
    } else if (authReady && !user) {
      setCustomerEnquiries([]);
      setCustomerMessages([]);
      setCustomerPayments([]);
    }
  }, [authReady, user, refreshCustomerData]);

  const adminLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  };

  const adminLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
    setEnquiries([]);
    setPaymentSubmissions([]);
    setContactMessages([]);
    setCustomerEnquiries([]);
    setCustomerMessages([]);
    setCustomerPayments([]);
  };

  const customerLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  };

  const customerLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
    setEnquiries([]);
    setPaymentSubmissions([]);
    setContactMessages([]);
    setCustomerEnquiries([]);
    setCustomerMessages([]);
    setCustomerPayments([]);
  };

  const submitRepairEnquiry = async (input: NewRepairEnquiryInput) => {
    const enquiryId = makeValidId('enq');
    const codeSuffix = Math.random().toString(36).slice(2, 6).toUpperCase() + Date.now().toString(36).slice(-3).toUpperCase();
    const enquiryCode = `RP-${codeSuffix}`;
    const trackingId = await computeTrackingId(enquiryCode, input.mobile);

    const payload = {
      ...(user?.uid ? { userId: user.uid } : {}),
      enquiryCode,
      customerName: input.customerName.trim().slice(0, 120),
      mobile: input.mobile.trim().slice(0, 25),
      whatsapp: (input.whatsapp || input.mobile).trim().slice(0, 25),
      email: (input.email || user?.email || '').trim().slice(0, 160),
      macbookModel: input.macbookModel.trim().slice(0, 140),
      macbookYear: (input.macbookYear || '').trim().slice(0, 40),
      processorType: (input.processorType || 'Confirmed at Inspection').trim().slice(0, 80),
      serviceName: (input.serviceName || 'General MacBook Diagnostic Inspection').trim().slice(0, 160),
      problemDescription: (input.problemDescription || '').trim().slice(0, 2000),
      preferredContactMethod: input.preferredContactMethod || ('Phone Call' as const),
      preferredVisitDate: (input.preferredVisitDate || '').trim().slice(0, 40),
      additionalNotes: (input.additionalNotes || '').trim().slice(0, 1000),
      imageUrls: (input.imageUrls || []).slice(0, 4),
      status: 'New' as const,
      technicianNotes: '',
      repairEstimate: '',
      followUpDate: '',
      payableAmount: 0,
      paymentStatus: 'Unpaid' as const,
      paymentMethod: '',
      paymentReference: '',
      paidAt: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const trackingPayload = {
      enquiryCode,
      macbookModel: payload.macbookModel,
      serviceName: payload.serviceName,
      status: 'New' as const,
      repairEstimate: '',
      followUpDate: '',
      publicUpdateNote: '',
      payableAmount: 0,
      paymentStatus: 'Unpaid' as const,
      paymentMethod: '',
      paymentReference: '',
      paidAt: '',
      updatedAt: serverTimestamp(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'repairEnquiries', enquiryId), payload);
      batch.set(doc(db, 'repairTracking', trackingId), trackingPayload);
      await batch.commit();

      if (user) {
        await refreshCustomerData();
      }
      if (isAdmin) {
        await refreshAdminData();
      }
      return { enquiryId, enquiryCode };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `repairEnquiries/${enquiryId}`);
    }
  };

  const trackRepairEnquiry = async (enquiryCode: string, mobile: string): Promise<RepairTrackingRecord | null> => {
    const trackingId = await computeTrackingId(enquiryCode, mobile);
    try {
      const snap = await getDoc(doc(db, 'repairTracking', trackingId));
      if (!snap.exists()) {
        return null;
      }
      return {
        id: snap.id,
        ...(snap.data() as Omit<RepairTrackingRecord, 'id'>),
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `repairTracking/${trackingId}`);
    }
  };

  const submitRepairPayment = async (input: NewPaymentSubmissionInput) => {
    const paymentId = makeValidId('pay');
    const cleanCode = (input.enquiryCode || 'MANUAL-BILL').trim().toUpperCase().slice(0, 40) || 'MANUAL-BILL';
    const cleanRef = input.transactionRef.trim().slice(0, 140);
    const nowLabel = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const payload = {
      ...(user?.uid ? { userId: user.uid } : {}),
      enquiryCode: cleanCode,
      customerName: input.customerName.trim().slice(0, 120),
      mobile: input.mobile.trim().slice(0, 25),
      amount: Math.min(500000, Math.max(1, Math.round(Number(input.amount) || 0))),
      method: input.method,
      transactionRef: cleanRef,
      notes: (input.notes || '').trim().slice(0, 400),
      status: 'Pending Verification' as const,
      verifiedAt: '',
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'paymentSubmissions', paymentId), payload);

      if (user && input.enquiryId) {
        const owned = customerEnquiries.find((e) => e.id === input.enquiryId);
        if (owned && owned.userId === user.uid && owned.paymentStatus !== 'Paid') {
          await updateDoc(doc(db, 'repairEnquiries', input.enquiryId), {
            paymentStatus: 'Pending Verification',
            paymentMethod: input.method,
            paymentReference: cleanRef,
            paidAt: nowLabel.slice(0, 60),
            updatedAt: serverTimestamp(),
          });
        }
      }

      if (user) {
        await refreshCustomerData();
      }
      if (isAdmin) {
        await refreshAdminData();
      }
      return { paymentId };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `paymentSubmissions/${paymentId}`);
    }
  };

  const submitContactMessage = async (input: NewContactMessageInput) => {
    const messageId = makeValidId('msg');
    const payload = {
      ...(user?.uid ? { userId: user.uid } : {}),
      name: input.name.trim().slice(0, 120),
      phone: input.phone.trim().slice(0, 25),
      email: (input.email || user?.email || '').trim().slice(0, 160),
      subject: input.subject.trim().slice(0, 160),
      message: input.message.trim().slice(0, 2000),
      isRead: false,
      adminReply: '',
      repliedAt: '',
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'contactMessages', messageId), payload);
      if (user) {
        await refreshCustomerData();
      }
      if (isAdmin) {
        await refreshAdminData();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `contactMessages/${messageId}`);
    }
  };

  const updateEnquiry = async (id: string, patch: Partial<RepairEnquiry>) => {
    const existingItem = enquiries.find((e) => e.id === id);
    if (!existingItem) return;

    const cleanPayableAmount = Math.min(
      500000,
      Math.max(0, Number(patch.payableAmount ?? existingItem.payableAmount ?? 0) || 0)
    );
    const cleanPaymentStatus = patch.paymentStatus ?? existingItem.paymentStatus ?? 'Unpaid';
    const cleanPaymentMethod = (patch.paymentMethod ?? existingItem.paymentMethod ?? '').slice(0, 60);
    const cleanPaymentRef = (patch.paymentReference ?? existingItem.paymentReference ?? '').slice(0, 140);
    const cleanPaidAt = (patch.paidAt ?? existingItem.paidAt ?? '').slice(0, 60);

    const payload = {
      enquiryCode: existingItem.enquiryCode,
      customerName: (patch.customerName ?? existingItem.customerName).slice(0, 120),
      mobile: (patch.mobile ?? existingItem.mobile).slice(0, 25),
      whatsapp: (patch.whatsapp ?? existingItem.whatsapp).slice(0, 25),
      email: (patch.email ?? existingItem.email ?? '').slice(0, 160),
      macbookModel: (patch.macbookModel ?? existingItem.macbookModel).slice(0, 140),
      macbookYear: (patch.macbookYear ?? existingItem.macbookYear ?? '').slice(0, 40),
      processorType: (patch.processorType ?? existingItem.processorType).slice(0, 80),
      serviceName: (patch.serviceName ?? existingItem.serviceName).slice(0, 160),
      problemDescription: (patch.problemDescription ?? existingItem.problemDescription).slice(0, 2000),
      preferredContactMethod: patch.preferredContactMethod ?? existingItem.preferredContactMethod,
      preferredVisitDate: (patch.preferredVisitDate ?? existingItem.preferredVisitDate ?? '').slice(0, 40),
      additionalNotes: (patch.additionalNotes ?? existingItem.additionalNotes ?? '').slice(0, 1000),
      imageUrls: (existingItem.imageUrls ?? []).slice(0, 4),
      status: patch.status ?? existingItem.status,
      technicianNotes: (patch.technicianNotes ?? existingItem.technicianNotes ?? '').slice(0, 2000),
      repairEstimate: (patch.repairEstimate ?? existingItem.repairEstimate ?? '').slice(0, 120),
      followUpDate: (patch.followUpDate ?? existingItem.followUpDate ?? '').slice(0, 40),
      payableAmount: cleanPayableAmount,
      paymentStatus: cleanPaymentStatus,
      paymentMethod: cleanPaymentMethod,
      paymentReference: cleanPaymentRef,
      paidAt: cleanPaidAt,
      createdAt: existingItem.createdAt,
      updatedAt: serverTimestamp(),
    };

    const trackingId = await computeTrackingId(
      existingItem.enquiryCode,
      patch.mobile ?? existingItem.mobile
    );

    const trackingPayload = {
      enquiryCode: existingItem.enquiryCode,
      macbookModel: payload.macbookModel,
      serviceName: payload.serviceName,
      status: payload.status,
      repairEstimate: payload.repairEstimate,
      followUpDate: payload.followUpDate,
      publicUpdateNote: (payload.technicianNotes || '').slice(0, 500),
      payableAmount: cleanPayableAmount,
      paymentStatus: cleanPaymentStatus,
      paymentMethod: cleanPaymentMethod,
      paymentReference: cleanPaymentRef,
      paidAt: cleanPaidAt,
      updatedAt: serverTimestamp(),
    };

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'repairEnquiries', id), payload);
      batch.set(doc(db, 'repairTracking', trackingId), trackingPayload);
      await batch.commit();
      await refreshAdminData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `repairEnquiries/${id}`);
    }
  };

  const deleteEnquiry = async (id: string) => {
    const existingItem = enquiries.find((e) => e.id === id);
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'repairEnquiries', id));
      if (existingItem) {
        const trackingId = await computeTrackingId(existingItem.enquiryCode, existingItem.mobile);
        batch.delete(doc(db, 'repairTracking', trackingId));
      }
      await batch.commit();
      await refreshAdminData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `repairEnquiries/${id}`);
    }
  };

  const verifyPaymentSubmission = async (
    paymentId: string,
    decision: 'Verified Paid' | 'Rejected',
    notes?: string
  ) => {
    const submission = paymentSubmissions.find((p) => p.id === paymentId);
    if (!submission) return;

    const nowLabel = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'paymentSubmissions', paymentId), {
        status: decision,
        verifiedAt: decision === 'Verified Paid' ? nowLabel.slice(0, 60) : '',
        notes: (notes ?? submission.notes ?? '').trim().slice(0, 400),
      });

      const matchedEnquiry = enquiries.find(
        (e) => e.enquiryCode.toUpperCase() === submission.enquiryCode.toUpperCase()
      );
      if (matchedEnquiry) {
        const nextStatus = decision === 'Verified Paid' ? 'Paid' : 'Unpaid';
        const trackingId = await computeTrackingId(
          matchedEnquiry.enquiryCode,
          matchedEnquiry.mobile
        );
        const payableAmt =
          matchedEnquiry.payableAmount && matchedEnquiry.payableAmount > 0
            ? matchedEnquiry.payableAmount
            : submission.amount;

        batch.update(doc(db, 'repairEnquiries', matchedEnquiry.id), {
          payableAmount: payableAmt,
          paymentStatus: nextStatus,
          paymentMethod: submission.method,
          paymentReference: submission.transactionRef,
          paidAt: decision === 'Verified Paid' ? nowLabel.slice(0, 60) : '',
          updatedAt: serverTimestamp(),
        });

        batch.set(doc(db, 'repairTracking', trackingId), {
          enquiryCode: matchedEnquiry.enquiryCode,
          macbookModel: matchedEnquiry.macbookModel,
          serviceName: matchedEnquiry.serviceName,
          status: matchedEnquiry.status,
          repairEstimate: matchedEnquiry.repairEstimate || '',
          followUpDate: matchedEnquiry.followUpDate || '',
          publicUpdateNote: (matchedEnquiry.technicianNotes || '').slice(0, 500),
          payableAmount: payableAmt,
          paymentStatus: nextStatus,
          paymentMethod: submission.method,
          paymentReference: submission.transactionRef,
          paidAt: decision === 'Verified Paid' ? nowLabel.slice(0, 60) : '',
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      await refreshAdminData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `paymentSubmissions/${paymentId}`);
    }
  };

  const deletePaymentSubmission = async (paymentId: string) => {
    try {
      await deleteDoc(doc(db, 'paymentSubmissions', paymentId));
      await refreshAdminData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `paymentSubmissions/${paymentId}`);
    }
  };

  const saveService = async (item: Omit<ServiceItem, 'updatedAt'>) => {
    const id = item.id || makeValidId('srv');
    const payload = {
      title: item.title.trim().slice(0, 140),
      slug: slugify(item.slug || item.title),
      category: item.category,
      shortDescription: item.shortDescription.trim().slice(0, 400),
      repairInfo: item.repairInfo.trim().slice(0, 1200),
      symptoms: item.symptoms.map((s) => s.trim().slice(0, 120)).filter(Boolean).slice(0, 10),
      imageUrl: item.imageUrl.slice(0, 300000),
      priceDisplay: (item.priceDisplay || 'Estimate after inspection').slice(0, 80),
      showPrice: Boolean(item.showPrice),
      isActive: Boolean(item.isActive),
      sortOrder: Number(item.sortOrder) || 1,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'services', id), payload);
      await Promise.all([refreshPublicData(), refreshAdminData()]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `services/${id}`);
    }
  };

  const deleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'services', id));
      await Promise.all([refreshPublicData(), refreshAdminData()]);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `services/${id}`);
    }
  };

  const saveMacBookModel = async (item: Omit<MacBookModelItem, 'updatedAt'>) => {
    const id = item.id || makeValidId('mdl');
    const payload = {
      category: item.category,
      name: item.name.trim().slice(0, 140),
      yearRange: item.yearRange.trim().slice(0, 60),
      processor: item.processor.trim().slice(0, 100),
      modelIdentifiers: (item.modelIdentifiers || '').trim().slice(0, 160),
      commonIssues: item.commonIssues.map((s) => s.trim().slice(0, 120)).filter(Boolean).slice(0, 10),
      availabilityNote: (item.availabilityNote || '').trim().slice(0, 300),
      isActive: Boolean(item.isActive),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'macbookModels', id), payload);
      await Promise.all([refreshPublicData(), refreshAdminData()]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `macbookModels/${id}`);
    }
  };

  const deleteMacBookModel = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'macbookModels', id));
      await Promise.all([refreshPublicData(), refreshAdminData()]);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `macbookModels/${id}`);
    }
  };

  const saveBlogPost = async (item: Omit<BlogPost, 'createdAt' | 'updatedAt'>, isNew: boolean) => {
    const id = item.id || makeValidId('blog');
    const existingPost = adminBlogPosts.find((p) => p.id === id);

    const basePayload = {
      title: item.title.trim().slice(0, 200),
      slug: slugify(item.slug || item.title),
      category: item.category.trim().slice(0, 80),
      excerpt: item.excerpt.trim().slice(0, 500),
      content: item.content.trim().slice(0, 30000),
      featuredImage: item.featuredImage.slice(0, 300000),
      authorName: item.authorName.trim().slice(0, 100),
      status: item.status,
      publishedAt: item.publishedAt.slice(0, 60),
      seoTitle: (item.seoTitle || item.title).trim().slice(0, 160),
      seoDescription: (item.seoDescription || item.excerpt).trim().slice(0, 320),
      tags: item.tags.map((t) => t.trim().slice(0, 60)).filter(Boolean).slice(0, 10),
      faqs: item.faqs.slice(0, 10),
      isFeatured: Boolean(item.isFeatured),
      views: Number(item.views) || 0,
      updatedAt: serverTimestamp(),
    };

    try {
      if (isNew || !existingPost?.createdAt) {
        await setDoc(doc(db, 'blogPosts', id), {
          ...basePayload,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'blogPosts', id), basePayload);
      }
      await Promise.all([refreshPublicData(), refreshAdminData()]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `blogPosts/${id}`);
    }
  };

  const deleteBlogPost = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'blogPosts', id));
      await Promise.all([refreshPublicData(), refreshAdminData()]);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `blogPosts/${id}`);
    }
  };

  const saveBlogCategory = async (item: Omit<BlogCategory, 'createdAt'>) => {
    const id = item.id || makeValidId('cat');
    const existingCat = blogCategories.find((c) => c.id === id);
    try {
      if (!existingCat?.createdAt) {
        await setDoc(doc(db, 'blogCategories', id), {
          name: item.name.trim().slice(0, 80),
          slug: slugify(item.slug || item.name),
          description: (item.description || '').trim().slice(0, 300),
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'blogCategories', id), {
          name: item.name.trim().slice(0, 80),
          slug: slugify(item.slug || item.name),
          description: (item.description || '').trim().slice(0, 300),
        });
      }
      await refreshPublicData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `blogCategories/${id}`);
    }
  };

  const deleteBlogCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'blogCategories', id));
      await refreshPublicData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `blogCategories/${id}`);
    }
  };

  const markMessageRead = async (id: string, isRead: boolean) => {
    try {
      await updateDoc(doc(db, 'contactMessages', id), {
        isRead,
      });
      await refreshAdminData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `contactMessages/${id}`);
    }
  };

  const replyToContactMessage = async (id: string, adminReply: string) => {
    const cleanReply = adminReply.trim().slice(0, 2000);
    try {
      await updateDoc(doc(db, 'contactMessages', id), {
        isRead: true,
        adminReply: cleanReply,
        repliedAt: cleanReply
          ? new Date().toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
      });
      await refreshAdminData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `contactMessages/${id}`);
    }
  };

  const deleteContactMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contactMessages', id));
      await refreshAdminData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `contactMessages/${id}`);
    }
  };

  const submitPublicReview = async (input: {
    name: string;
    device?: string;
    rating: number;
    quote: string;
  }) => {
    const id = makeValidId('rev');
    const cleanName = input.name.trim().slice(0, 60);
    const cleanDevice = (input.device || '').trim().slice(0, 35);
    const authorLabel = cleanDevice ? `${cleanName} · ${cleanDevice}` : cleanName;
    const dateLabel = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const payload = {
      authorLabel: authorLabel.slice(0, 100),
      rating: Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5))),
      quote: input.quote.trim().slice(0, 800),
      source: 'Website Customer Review',
      dateLabel: dateLabel.slice(0, 60),
      isVisible: true,
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'reviews', id), payload);
      await refreshPublicData();
      if (isAdmin) {
        await refreshAdminData();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `reviews/${id}`);
    }
  };

  const saveReview = async (item: Omit<ReviewItem, 'createdAt'>) => {
    const id = item.id || makeValidId('rev');
    const existingRev = adminReviews.find((r) => r.id === id);
    try {
      if (!existingRev?.createdAt) {
        await setDoc(doc(db, 'reviews', id), {
          authorLabel: item.authorLabel.trim().slice(0, 100),
          rating: Math.min(5, Math.max(1, Number(item.rating) || 5)),
          quote: item.quote.trim().slice(0, 800),
          source: item.source.trim().slice(0, 80),
          dateLabel: (item.dateLabel || '').trim().slice(0, 60),
          isVisible: Boolean(item.isVisible),
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'reviews', id), {
          authorLabel: item.authorLabel.trim().slice(0, 100),
          rating: Math.min(5, Math.max(1, Number(item.rating) || 5)),
          quote: item.quote.trim().slice(0, 800),
          source: item.source.trim().slice(0, 80),
          dateLabel: (item.dateLabel || '').trim().slice(0, 60),
          isVisible: Boolean(item.isVisible),
        });
      }
      await Promise.all([refreshPublicData(), refreshAdminData()]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `reviews/${id}`);
    }
  };

  const deleteReview = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', id));
      await Promise.all([refreshPublicData(), refreshAdminData()]);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reviews/${id}`);
    }
  };

  const saveGalleryImage = async (item: Omit<GalleryImageItem, 'createdAt'>) => {
    const id = item.id || makeValidId('gal');
    const existingImg = galleryImages.find((g) => g.id === id);
    try {
      if (!existingImg?.createdAt) {
        await setDoc(doc(db, 'galleryImages', id), {
          title: item.title.trim().slice(0, 120),
          caption: (item.caption || '').trim().slice(0, 300),
          imageUrl: item.imageUrl.slice(0, 300000),
          category: item.category.trim().slice(0, 60),
          sortOrder: Number(item.sortOrder) || 1,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'galleryImages', id), {
          title: item.title.trim().slice(0, 120),
          caption: (item.caption || '').trim().slice(0, 300),
          imageUrl: item.imageUrl.slice(0, 300000),
          category: item.category.trim().slice(0, 60),
          sortOrder: Number(item.sortOrder) || 1,
        });
      }
      await refreshPublicData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `galleryImages/${id}`);
    }
  };

  const deleteGalleryImage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'galleryImages', id));
      await refreshPublicData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `galleryImages/${id}`);
    }
  };

  const saveWebsiteSettings = async (next: WebsiteSettings) => {
    const def = DEFAULT_WEBSITE_SETTINGS;
    const merged = mergeWebsiteSettings(next);
    const sanitizePageObj = <T extends Record<string, string>>(obj: T): T => {
      const out = {} as Record<string, string>;
      for (const [k, v] of Object.entries(obj)) {
        out[k] = String(v ?? '').slice(0, k.toLowerCase().includes('imageurl') ? 300000 : 1200);
      }
      return out as T;
    };

    const clampStr = (val: string | undefined, min: number, max: number, fallback: string) => {
      const trimmed = (val || '').trim().slice(0, max);
      return trimmed.length >= min ? trimmed : fallback.slice(0, max);
    };

    const rawRating = Number(merged.googleRating);
    const safeRating = Number.isFinite(rawRating)
      ? Math.min(5, Math.max(0, rawRating))
      : def.googleRating;
    const rawCount = Number(merged.googleReviewCount);
    const safeCount = Number.isFinite(rawCount)
      ? Math.max(0, Math.round(rawCount))
      : def.googleReviewCount;

    const payload = {
      businessName: clampStr(merged.businessName, 1, 120, def.businessName),
      tagline: (merged.tagline || '').trim().slice(0, 200),
      phone: clampStr(merged.phone, 5, 30, def.phone),
      whatsapp: clampStr(merged.whatsapp, 5, 30, def.whatsapp),
      email: (merged.email || '').trim().slice(0, 160),
      websiteUrl: (merged.websiteUrl || '').trim().slice(0, 200),
      address: clampStr(merged.address, 5, 300, def.address),
      businessHours: clampStr(merged.businessHours, 2, 200, def.businessHours),
      googleRating: safeRating,
      googleReviewCount: safeCount,
      googlePlaceId: (merged.googlePlaceId || '').trim().slice(0, 160),
      googleReviewsUrl: (merged.googleReviewsUrl || '').trim().slice(0, 400),
      logoUrl: (merged.logoUrl || '').slice(0, 300000),
      heroHeadline: clampStr(merged.heroHeadline, 5, 180, def.heroHeadline),
      heroSubheadline: clampStr(merged.heroSubheadline, 10, 500, def.heroSubheadline),
      heroImageUrl: (merged.heroImageUrl || '').slice(0, 300000),
      heroSlides: (merged.heroSlides || [])
        .filter((s) => s && typeof s.imageUrl === 'string' && s.imageUrl.trim())
        .slice(0, 10)
        .map((s, idx) => ({
          id: (s.id || `slide-${idx + 1}`).slice(0, 60),
          title: (s.title || '').trim().slice(0, 140),
          subtitle: (s.subtitle || '').trim().slice(0, 280),
          imageUrl: s.imageUrl.slice(0, 300000),
        })),
      headerCtaText: (merged.headerCtaText || 'Book a Repair').trim().slice(0, 60),
      headerCtaUrl: (merged.headerCtaUrl || '/book').trim().slice(0, 160),
      navLinks: (merged.navLinks || [])
        .filter((l) => l && l.label?.trim() && l.to?.trim())
        .slice(0, 10)
        .map((l) => ({
          label: l.label.trim().slice(0, 40),
          to: l.to.trim().slice(0, 120),
          visible: l.visible !== false,
        })),
      footerDescription: (merged.footerDescription || '').trim().slice(0, 500),
      footerTagline: (merged.footerTagline || '').trim().slice(0, 200),
      footerLegalText: (merged.footerLegalText || '').trim().slice(0, 400),
      footerQuickLinks: (merged.footerQuickLinks || [])
        .filter((l) => l && l.label?.trim() && l.to?.trim())
        .slice(0, 12)
        .map((l) => ({
          label: l.label.trim().slice(0, 60),
          to: l.to.trim().slice(0, 160),
        })),
      footerServiceLinks: (merged.footerServiceLinks || [])
        .filter((l) => l && l.label?.trim() && l.to?.trim())
        .slice(0, 12)
        .map((l) => ({
          label: l.label.trim().slice(0, 60),
          to: l.to.trim().slice(0, 160),
        })),
      socialInstagram: (merged.socialInstagram || '').trim().slice(0, 300),
      socialFacebook: (merged.socialFacebook || '').trim().slice(0, 300),
      socialYoutube: (merged.socialYoutube || '').trim().slice(0, 300),
      socialLinkedin: (merged.socialLinkedin || '').trim().slice(0, 300),
      socialTwitter: (merged.socialTwitter || '').trim().slice(0, 300),
      razorpayEnabled: Boolean(merged.razorpayEnabled),
      razorpayKeyId: (merged.razorpayKeyId || '').trim().slice(0, 120),
      razorpayPaymentLinkUrl: (merged.razorpayPaymentLinkUrl || '').trim().slice(0, 400),
      manualPaymentEnabled: merged.manualPaymentEnabled !== false,
      manualUpiId: (merged.manualUpiId || '').trim().slice(0, 160),
      manualUpiQrUrl: (merged.manualUpiQrUrl || '').slice(0, 300000),
      manualBankDetails: (merged.manualBankDetails || '').trim().slice(0, 600),
      manualPaymentNote: (merged.manualPaymentNote || '').trim().slice(0, 500),
      seoTitle: (merged.seoTitle || '').trim().slice(0, 120),
      seoDescription: (merged.seoDescription || '').trim().slice(0, 300),
      seoKeywords: (merged.seoKeywords || '').trim().slice(0, 600),
      serviceAreasText: (merged.serviceAreasText || '').trim().slice(0, 400),
      homeFaqs: (merged.homeFaqs || [])
        .filter((f) => f && f.q?.trim() && f.a?.trim())
        .slice(0, 15)
        .map((f) => ({
          q: f.q.trim().slice(0, 220),
          a: f.a.trim().slice(0, 800),
        })),
      pageContent: {
        home: sanitizePageObj(merged.pageContent.home),
        services: sanitizePageObj(merged.pageContent.services),
        models: sanitizePageObj(merged.pageContent.models),
        book: sanitizePageObj(merged.pageContent.book),
        track: sanitizePageObj(merged.pageContent.track),
        about: sanitizePageObj(merged.pageContent.about),
        blog: sanitizePageObj(merged.pageContent.blog),
        contact: sanitizePageObj(merged.pageContent.contact),
      },
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'websiteSettings', 'main'), payload);
      await refreshPublicData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'websiteSettings/main');
    }
  };

  const saveAdminUser = async (adminUser: Omit<AdminUser, 'id' | 'createdAt'>) => {
    const uid = adminUser.uid.trim().slice(0, 128);
    const existingAdmin = adminUsers.find((a) => a.uid === uid);
    try {
      if (existingAdmin?.createdAt) {
        await updateDoc(doc(db, 'admins', uid), {
          email: adminUser.email.trim().slice(0, 200),
          displayName: adminUser.displayName.trim().slice(0, 120),
          role: adminUser.role,
        });
      } else {
        await setDoc(doc(db, 'admins', uid), {
          uid,
          email: adminUser.email.trim().slice(0, 200),
          displayName: adminUser.displayName.trim().slice(0, 120),
          role: adminUser.role,
          createdAt: serverTimestamp(),
        });
      }
      await refreshAdminData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `admins/${uid}`);
    }
  };

  const removeAdminUser = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'admins', uid));
      await refreshAdminData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `admins/${uid}`);
    }
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        services,
        models,
        blogPosts,
        blogCategories,
        reviews,
        galleryImages,
        publicLoading,
        user,
        authReady,
        isAdmin,
        adminLogin,
        adminLogout,
        customerLogin,
        customerLogout,
        customerEnquiries,
        customerMessages,
        customerPayments,
        customerLoading,
        refreshCustomerData,
        adminServices,
        adminModels,
        adminBlogPosts,
        adminReviews,
        enquiries,
        paymentSubmissions,
        contactMessages,
        adminUsers,
        adminLoading,
        hasFirestoreSeed,
        refreshPublicData,
        refreshAdminData,
        seedCatalogToFirestore,
        submitRepairEnquiry,
        trackRepairEnquiry,
        submitRepairPayment,
        submitContactMessage,
        submitPublicReview,
        updateEnquiry,
        deleteEnquiry,
        verifyPaymentSubmission,
        deletePaymentSubmission,
        saveService,
        deleteService,
        saveMacBookModel,
        deleteMacBookModel,
        saveBlogPost,
        deleteBlogPost,
        saveBlogCategory,
        deleteBlogCategory,
        markMessageRead,
        replyToContactMessage,
        deleteContactMessage,
        saveReview,
        deleteReview,
        saveGalleryImage,
        deleteGalleryImage,
        saveWebsiteSettings,
        saveAdminUser,
        removeAdminUser,
        googleLiveProfile,
        setGoogleLiveProfile,
        googleSyncNonce,
        triggerGoogleProfileSync,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
