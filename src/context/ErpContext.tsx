import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { OperationType, auth, db, handleFirestoreError, normalizeMobileKey } from '../lib/firebase';
import { useApp } from './AppContext';
import type {
  ActivityLogRecord,
  AppointmentRecord,
  CustomerRecord,
  ExpenseRecord,
  InventoryItem,
  InvoiceRecord,
  JobPartUsage,
  JobWorkflowStatus,
  NotificationItem,
  PurchaseOrderRecord,
  RepairEnquiry,
  RepairJobCard,
  StockMovement,
  SupplierRecord,
  TechnicianProfile,
} from '../types';

function makeErpId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 7);
  const ts = Date.now().toString(36);
  return `${prefix}-${ts}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

function getMillis(val: unknown): number {
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

interface ErpContextValue {
  repairJobs: RepairJobCard[];
  customers: CustomerRecord[];
  technicians: TechnicianProfile[];
  appointments: AppointmentRecord[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  suppliers: SupplierRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  invoices: InvoiceRecord[];
  expenses: ExpenseRecord[];
  notifications: NotificationItem[];
  activityLogs: ActivityLogRecord[];
  erpLoading: boolean;

  // Customer-scoped views
  customerJobs: RepairJobCard[];
  customerInvoices: InvoiceRecord[];

  refreshErpData: () => Promise<void>;

  // Audit & Notifications
  logActivity: (input: {
    action: string;
    targetCollection: string;
    targetId: string;
    summary: string;
    metadata?: string;
  }) => Promise<void>;
  pushNotification: (input: Omit<NotificationItem, 'id' | 'isRead' | 'createdAt'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;

  // Job Cards
  saveRepairJob: (job: Omit<RepairJobCard, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<RepairJobCard>;
  createJobFromEnquiry: (enquiry: RepairEnquiry) => Promise<RepairJobCard>;
  updateJobAsTechnician: (
    jobId: string,
    patch: Pick<
      RepairJobCard,
      'inspectionDetails' | 'diagnosis' | 'status' | 'qualityChecklist' | 'beforeImages' | 'afterImages' | 'internalNotes' | 'customerUpdates'
    >
  ) => Promise<void>;
  customerRespondEstimate: (jobId: string, decision: 'Approved' | 'Rejected') => Promise<void>;
  consumePartInJob: (job: RepairJobCard, part: InventoryItem, quantityUsed: number) => Promise<void>;
  bulkUpdateRepairJobStatus: (
    jobIds: string[],
    status: JobWorkflowStatus,
    technician?: { name: string; uid?: string }
  ) => Promise<number>;
  deleteRepairJob: (jobId: string) => Promise<void>;

  // CRM Customers
  saveCustomer: (customer: Omit<CustomerRecord, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<CustomerRecord>;
  upsertCustomerFromRecord: (input: {
    uid?: string;
    name: string;
    mobile: string;
    whatsapp?: string;
    email?: string;
    address?: string;
    deviceModel?: string;
    valueDelta?: number;
  }) => Promise<CustomerRecord>;
  deleteCustomer: (id: string) => Promise<void>;

  // Technicians & Appointments
  saveTechnician: (tech: Omit<TechnicianProfile, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;
  saveAppointment: (appt: Omit<AppointmentRecord, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

  // Inventory, Suppliers & POs
  saveInventoryItem: (item: Omit<InventoryItem, 'updatedAt'>, initialNote?: string) => Promise<void>;
  adjustInventoryStock: (
    part: InventoryItem,
    quantityDelta: number,
    type: StockMovement['type'],
    note: string,
    jobCardCode?: string
  ) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  saveSupplier: (supplier: Omit<SupplierRecord, 'createdAt'>, isNew: boolean) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  savePurchaseOrder: (po: Omit<PurchaseOrderRecord, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;

  // Billing, Invoices & Expenses
  saveInvoice: (inv: Omit<InvoiceRecord, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<InvoiceRecord>;
  generateInvoiceFromJob: (job: RepairJobCard, taxRate?: number, discount?: number) => Promise<InvoiceRecord>;
  deleteInvoice: (id: string) => Promise<void>;
  saveExpense: (exp: Omit<ExpenseRecord, 'createdAt'>, isNew: boolean) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const ErpContext = createContext<ErpContextValue | null>(null);

export function ErpProvider({ children }: { children: React.ReactNode }) {
  const { user, authReady, isAdmin, isFrontDeskStaff, isTechnician, userRole, settings, refreshCustomerData } = useApp();

  const [repairJobs, setRepairJobs] = useState<RepairJobCard[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianProfile[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogRecord[]>([]);
  const [customerJobs, setCustomerJobs] = useState<RepairJobCard[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<InvoiceRecord[]>([]);
  const [erpLoading, setErpLoading] = useState(false);

  const logActivity = useCallback(
    async (input: {
      action: string;
      targetCollection: string;
      targetId: string;
      summary: string;
      metadata?: string;
    }) => {
      const current = auth.currentUser;
      if (!current || !current.emailVerified) return;
      const logId = makeErpId('log');
      try {
        await setDoc(doc(db, 'activityLogs', logId), {
          actorUid: current.uid,
          actorEmail: (current.email || 'user@refixpro.in').slice(0, 200),
          actorRole: userRole,
          action: input.action.slice(0, 120),
          targetCollection: input.targetCollection.slice(0, 80),
          targetId: input.targetId.slice(0, 128),
          summary: input.summary.slice(0, 400),
          ...(input.metadata ? { metadata: input.metadata.slice(0, 1000) } : {}),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Activity log write skipped:', err);
      }
    },
    [userRole]
  );

  const pushNotification = useCallback(
    async (input: Omit<NotificationItem, 'id' | 'isRead' | 'createdAt'>) => {
      const id = makeErpId('notif');
      try {
        await setDoc(doc(db, 'notifications', id), {
          ...(input.recipientUid ? { recipientUid: input.recipientUid.slice(0, 128) } : {}),
          ...(input.recipientEmail ? { recipientEmail: input.recipientEmail.slice(0, 160) } : {}),
          audience: input.audience,
          title: input.title.trim().slice(0, 160),
          message: input.message.trim().slice(0, 600),
          category: input.category,
          ...(input.relatedCode ? { relatedCode: input.relatedCode.slice(0, 60) } : {}),
          isRead: false,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Notification write skipped:', err);
      }
    },
    []
  );

  const refreshErpData = useCallback(async () => {
    if (!authReady || !user) {
      setRepairJobs([]);
      setCustomers([]);
      setTechnicians([]);
      setAppointments([]);
      setInventory([]);
      setStockMovements([]);
      setSuppliers([]);
      setPurchaseOrders([]);
      setInvoices([]);
      setExpenses([]);
      setNotifications([]);
      setActivityLogs([]);
      setCustomerJobs([]);
      setCustomerInvoices([]);
      return;
    }

    setErpLoading(true);
    try {
      if (isAdmin || isFrontDeskStaff) {
        const [
          jobsSnap,
          custSnap,
          techSnap,
          apptSnap,
          invSnap,
          movSnap,
          supSnap,
          poSnap,
          invoiceSnap,
          expSnap,
          notifSnap,
          logSnap,
        ] = await Promise.all([
          getDocs(collection(db, 'repairJobs')).catch(() => null),
          getDocs(collection(db, 'customers')).catch(() => null),
          getDocs(collection(db, 'technicians')).catch(() => null),
          getDocs(collection(db, 'appointments')).catch(() => null),
          getDocs(collection(db, 'inventory')).catch(() => null),
          getDocs(collection(db, 'stockMovements')).catch(() => null),
          isAdmin ? getDocs(collection(db, 'suppliers')).catch(() => null) : Promise.resolve(null),
          isAdmin ? getDocs(collection(db, 'purchaseOrders')).catch(() => null) : Promise.resolve(null),
          getDocs(collection(db, 'invoices')).catch(() => null),
          isAdmin ? getDocs(collection(db, 'expenses')).catch(() => null) : Promise.resolve(null),
          getDocs(collection(db, 'notifications')).catch(() => null),
          isAdmin ? getDocs(collection(db, 'activityLogs')).catch(() => null) : Promise.resolve(null),
        ]);

        const sortDesc = <T extends { createdAt?: unknown; updatedAt?: unknown }>(list: T[]) =>
          list.sort(
            (a, b) =>
              getMillis(b.updatedAt || b.createdAt) - getMillis(a.updatedAt || a.createdAt)
          );

        if (jobsSnap) {
          setRepairJobs(
            sortDesc(jobsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RepairJobCard, 'id'>) })))
          );
        }
        if (custSnap) {
          setCustomers(
            sortDesc(custSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CustomerRecord, 'id'>) })))
          );
        }
        if (techSnap) {
          setTechnicians(
            techSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TechnicianProfile, 'id'>) }))
          );
        }
        if (apptSnap) {
          setAppointments(
            sortDesc(apptSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AppointmentRecord, 'id'>) })))
          );
        }
        if (invSnap) {
          setInventory(
            invSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InventoryItem, 'id'>) }))
          );
        }
        if (movSnap) {
          setStockMovements(
            sortDesc(movSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StockMovement, 'id'>) })))
          );
        }
        if (supSnap) {
          setSuppliers(
            supSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SupplierRecord, 'id'>) }))
          );
        }
        if (poSnap) {
          setPurchaseOrders(
            sortDesc(poSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PurchaseOrderRecord, 'id'>) })))
          );
        }
        if (invoiceSnap) {
          setInvoices(
            sortDesc(invoiceSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InvoiceRecord, 'id'>) })))
          );
        }
        if (expSnap) {
          setExpenses(
            sortDesc(expSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ExpenseRecord, 'id'>) })))
          );
        }
        if (notifSnap) {
          setNotifications(
            sortDesc(notifSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NotificationItem, 'id'>) })))
          );
        }
        if (logSnap) {
          setActivityLogs(
            sortDesc(logSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityLogRecord, 'id'>) })))
          );
        }
      } else if (isTechnician) {
        const [jobsSnap, invSnap, techSnap, apptSnap] = await Promise.all([
          getDocs(query(collection(db, 'repairJobs'), where('technicianUid', '==', user.uid))).catch(() => null),
          getDocs(collection(db, 'inventory')).catch(() => null),
          getDocs(collection(db, 'technicians')).catch(() => null),
          getDocs(query(collection(db, 'appointments'), where('technicianUid', '==', user.uid))).catch(() => null),
        ]);
        if (jobsSnap) {
          const list = jobsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RepairJobCard, 'id'>) }));
          list.sort((a, b) => getMillis(b.updatedAt || b.createdAt) - getMillis(a.updatedAt || a.createdAt));
          setRepairJobs(list);
        }
        if (invSnap) {
          setInventory(invSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InventoryItem, 'id'>) })));
        }
        if (techSnap) {
          setTechnicians(techSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TechnicianProfile, 'id'>) })));
        }
        if (apptSnap) {
          setAppointments(apptSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AppointmentRecord, 'id'>) })));
        }
      }

      // Customer-scoped own data (always fetched safely for logged-in user)
      const jobQueries = [
        getDocs(query(collection(db, 'repairJobs'), where('customerUid', '==', user.uid))),
      ];
      const invQueries = [
        getDocs(query(collection(db, 'invoices'), where('customerUid', '==', user.uid))),
      ];
      const notifQueries = [
        getDocs(query(collection(db, 'notifications'), where('recipientUid', '==', user.uid))),
      ];
      if (user.emailVerified && user.email) {
        jobQueries.push(getDocs(query(collection(db, 'repairJobs'), where('customerEmail', '==', user.email))));
        invQueries.push(getDocs(query(collection(db, 'invoices'), where('customerEmail', '==', user.email))));
        notifQueries.push(getDocs(query(collection(db, 'notifications'), where('recipientEmail', '==', user.email))));
      }

      const [cJobResults, cInvResults, cNotifResults] = await Promise.all([
        Promise.allSettled(jobQueries),
        Promise.allSettled(invQueries),
        Promise.allSettled(notifQueries),
      ]);

      const jobMap = new Map<string, RepairJobCard>();
      for (const r of cJobResults) {
        if (r.status === 'fulfilled') {
          r.value.docs.forEach((d) => jobMap.set(d.id, { id: d.id, ...(d.data() as Omit<RepairJobCard, 'id'>) }));
        }
      }
      const cJobs = Array.from(jobMap.values()).sort(
        (a, b) => getMillis(b.updatedAt || b.createdAt) - getMillis(a.updatedAt || a.createdAt)
      );
      setCustomerJobs(cJobs);

      const invMap = new Map<string, InvoiceRecord>();
      for (const r of cInvResults) {
        if (r.status === 'fulfilled') {
          r.value.docs.forEach((d) => invMap.set(d.id, { id: d.id, ...(d.data() as Omit<InvoiceRecord, 'id'>) }));
        }
      }
      const cInvs = Array.from(invMap.values()).sort(
        (a, b) => getMillis(b.updatedAt || b.createdAt) - getMillis(a.updatedAt || a.createdAt)
      );
      setCustomerInvoices(cInvs);

      if (!isAdmin) {
        const notifMap = new Map<string, NotificationItem>();
        for (const r of cNotifResults) {
          if (r.status === 'fulfilled') {
            r.value.docs.forEach((d) =>
              notifMap.set(d.id, { id: d.id, ...(d.data() as Omit<NotificationItem, 'id'>) })
            );
          }
        }
        const cNotifs = Array.from(notifMap.values()).sort(
          (a, b) => getMillis(b.createdAt) - getMillis(a.createdAt)
        );
        setNotifications(cNotifs);
      }
    } finally {
      setErpLoading(false);
    }
  }, [authReady, user, isAdmin, isFrontDeskStaff, isTechnician]);

  useEffect(() => {
    if (authReady) {
      void refreshErpData();
    }
  }, [authReady, user?.uid, isAdmin, isFrontDeskStaff, isTechnician, refreshErpData]);

  const markNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const upsertCustomerFromRecord = useCallback(
    async (input: {
      uid?: string;
      name: string;
      mobile: string;
      whatsapp?: string;
      email?: string;
      address?: string;
      deviceModel?: string;
      valueDelta?: number;
    }): Promise<CustomerRecord> => {
      const mobileKey = normalizeMobileKey(input.mobile);
      const emailKey = (input.email || '').trim().toLowerCase();

      const existing = customers.find(
        (c) =>
          (mobileKey && normalizeMobileKey(c.mobile) === mobileKey) ||
          (emailKey && c.email.trim().toLowerCase() === emailKey)
      );

      if (existing) {
        const nextHistory = Array.from(
          new Set([...(existing.deviceHistory || []), ...(input.deviceModel ? [input.deviceModel] : [])])
        ).slice(0, 30);

        const nextDoc = {
          ...existing,
          uid: existing.uid || input.uid || '',
          name: input.name.trim().slice(0, 120) || existing.name,
          whatsapp: (input.whatsapp || existing.whatsapp || existing.mobile).slice(0, 25),
          email: (input.email || existing.email || '').slice(0, 160),
          address: (input.address || existing.address || '').slice(0, 300),
          deviceHistory: nextHistory,
          repairCount: existing.repairCount + (input.deviceModel ? 1 : 0),
          totalBusinessValue: existing.totalBusinessValue + (input.valueDelta || 0),
        };
        await updateDoc(doc(db, 'customers', existing.id), {
          uid: nextDoc.uid,
          name: nextDoc.name,
          whatsapp: nextDoc.whatsapp,
          email: nextDoc.email,
          address: nextDoc.address,
          deviceHistory: nextDoc.deviceHistory,
          repairCount: nextDoc.repairCount,
          totalBusinessValue: nextDoc.totalBusinessValue,
          updatedAt: serverTimestamp(),
        });
        return nextDoc;
      }

      const id = makeErpId('cust');
      const code = `CUST-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const newRec: Omit<CustomerRecord, 'createdAt' | 'updatedAt'> = {
        id,
        customerCode: code,
        uid: input.uid || '',
        name: input.name.trim().slice(0, 120),
        mobile: input.mobile.trim().slice(0, 25),
        whatsapp: (input.whatsapp || input.mobile).trim().slice(0, 25),
        email: (input.email || '').trim().slice(0, 160),
        address: (input.address || '').trim().slice(0, 300),
        deviceHistory: input.deviceModel ? [input.deviceModel] : [],
        notes: '',
        followUpDate: '',
        totalBusinessValue: Math.max(0, input.valueDelta || 0),
        repairCount: input.deviceModel ? 1 : 0,
      };
      const { id: _ignoreId, ...firestoreBody } = newRec;
      await setDoc(doc(db, 'customers', id), {
        ...firestoreBody,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newRec;
    },
    [customers]
  );

  const saveRepairJob = async (
    job: Omit<RepairJobCard, 'createdAt' | 'updatedAt'>,
    isNew: boolean
  ): Promise<RepairJobCard> => {
    const id = job.id || makeErpId('job');
    const prefix = settings.erpConfig?.jobCardPrefix || 'JC-RP';
    const jobCardCode =
      job.jobCardCode ||
      `${prefix}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    const existing = repairJobs.find((j) => j.id === id);

    const cleanBody = {
      jobCardCode: jobCardCode.slice(0, 40),
      enquiryId: (job.enquiryId || '').slice(0, 128),
      enquiryCode: (job.enquiryCode || '').slice(0, 40),
      customerId: (job.customerId || '').slice(0, 128),
      customerUid: (job.customerUid || '').slice(0, 128),
      customerName: job.customerName.trim().slice(0, 120),
      customerMobile: job.customerMobile.trim().slice(0, 25),
      customerEmail: (job.customerEmail || '').trim().slice(0, 160),
      deviceType: job.deviceType,
      macbookModel: job.macbookModel.trim().slice(0, 140),
      modelNumber: (job.modelNumber || '').trim().slice(0, 60),
      serialNumber: (job.serialNumber || '').trim().slice(0, 80),
      deviceCondition: (job.deviceCondition || '').trim().slice(0, 400),
      accessoriesReceived: (job.accessoriesReceived || '').trim().slice(0, 300),
      reportedProblem: (job.reportedProblem || '').trim().slice(0, 2000),
      inspectionDetails: (job.inspectionDetails || '').trim().slice(0, 2000),
      diagnosis: (job.diagnosis || '').trim().slice(0, 2000),
      estimatedCost: Math.max(0, Math.round(Number(job.estimatedCost) || 0)),
      finalCost: Math.max(0, Math.round(Number(job.finalCost ?? job.estimatedCost) || 0)),
      technicianUid: (job.technicianUid || '').slice(0, 128),
      technicianName: (job.technicianName || '').slice(0, 120),
      partsUsed: (job.partsUsed || []).slice(0, 25),
      approvalStatus: job.approvalStatus,
      status: job.status,
      deliveryDate: (job.deliveryDate || '').slice(0, 40),
      warrantyPeriod: (job.warrantyPeriod || '90 Days Service Warranty').slice(0, 120),
      warrantyExpiry: (job.warrantyExpiry || '').slice(0, 40),
      ...(job.qualityChecklist ? { qualityChecklist: job.qualityChecklist } : {}),
      beforeImages: (job.beforeImages || []).slice(0, 6),
      afterImages: (job.afterImages || []).slice(0, 6),
      internalNotes: (job.internalNotes || '').trim().slice(0, 2000),
      customerUpdates: (job.customerUpdates || '').trim().slice(0, 2000),
      paymentStatus: job.paymentStatus,
    };

    try {
      if (isNew || !existing?.createdAt) {
        await setDoc(doc(db, 'repairJobs', id), {
          ...cleanBody,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'repairJobs', id), {
          ...cleanBody,
          updatedAt: serverTimestamp(),
        });
      }

      if (cleanBody.customerUid || cleanBody.customerEmail) {
        if (!existing || existing.status !== cleanBody.status || existing.approvalStatus !== cleanBody.approvalStatus) {
          await pushNotification({
            recipientUid: cleanBody.customerUid || undefined,
            recipientEmail: cleanBody.customerEmail || undefined,
            audience: 'customer',
            title: `Job ${cleanBody.jobCardCode}: ${cleanBody.status}`,
            message:
              cleanBody.customerUpdates ||
              `Your ${cleanBody.macbookModel} repair status is now "${cleanBody.status}". Estimate: ₹${cleanBody.estimatedCost.toLocaleString('en-IN')}.`,
            category: cleanBody.approvalStatus === 'Pending' ? 'estimate' : 'repair',
            relatedCode: cleanBody.jobCardCode,
          });
        }
      }

      await logActivity({
        action: isNew ? 'JOB_CARD_CREATED' : 'JOB_CARD_UPDATED',
        targetCollection: 'repairJobs',
        targetId: id,
        summary: `${isNew ? 'Created' : 'Updated'} job card ${cleanBody.jobCardCode} (${cleanBody.status})`,
      });
      await refreshErpData();
      return { id, ...cleanBody };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `repairJobs/${id}`);
    }
  };

  const createJobFromEnquiry = async (enq: RepairEnquiry): Promise<RepairJobCard> => {
    const cust = await upsertCustomerFromRecord({
      uid: enq.userId,
      name: enq.customerName,
      mobile: enq.mobile,
      whatsapp: enq.whatsapp,
      email: enq.email,
      deviceModel: enq.macbookModel,
    });

    const parsedEstimate = Number(String(enq.repairEstimate || '').replace(/[^\d]/g, '')) || 0;
    const deviceType: RepairJobCard['deviceType'] = /ipad/i.test(enq.macbookModel)
      ? 'iPad'
      : /iphone/i.test(enq.macbookModel)
        ? 'iPhone'
        : 'MacBook';

    const statusMap: Record<string, JobWorkflowStatus> = {
      New: 'New Booking',
      Contacted: 'Received',
      Inspection: 'Inspection',
      'Estimate Sent': 'Estimate Sent',
      Approved: 'Approved',
      'In Repair': 'In Repair',
      'Ready for Delivery': 'Ready for Delivery',
      Completed: 'Completed',
      Cancelled: 'Cancelled Repair',
    };

    return saveRepairJob(
      {
        id: '',
        jobCardCode: `${settings.erpConfig?.jobCardPrefix || 'JC-RP'}-${enq.enquiryCode.replace(/^RP-/, '')}`,
        enquiryId: enq.id,
        enquiryCode: enq.enquiryCode,
        customerId: cust.id,
        customerUid: enq.userId || '',
        customerName: enq.customerName,
        customerMobile: enq.mobile,
        customerEmail: enq.email || '',
        deviceType,
        macbookModel: enq.macbookModel,
        modelNumber: enq.macbookYear || '',
        serialNumber: '',
        deviceCondition: 'Inspected at intake counter',
        accessoriesReceived: 'Laptop / Device only',
        reportedProblem: enq.problemDescription || enq.serviceName,
        inspectionDetails: enq.technicianNotes || '',
        diagnosis: '',
        estimatedCost: enq.payableAmount || parsedEstimate || 0,
        finalCost: enq.payableAmount || parsedEstimate || 0,
        technicianUid: '',
        technicianName: '',
        partsUsed: [],
        approvalStatus: enq.status === 'Approved' ? 'Approved' : enq.status === 'Estimate Sent' ? 'Pending' : 'Not Sent',
        status: statusMap[enq.status] || 'Received',
        deliveryDate: enq.followUpDate || '',
        warrantyPeriod: '90 Days Service Warranty',
        beforeImages: enq.imageUrls || [],
        afterImages: [],
        internalNotes: '',
        customerUpdates: enq.technicianNotes || '',
        paymentStatus: enq.paymentStatus || 'Unpaid',
      },
      true
    );
  };

  const bulkUpdateRepairJobStatus = async (
    jobIds: string[],
    status: JobWorkflowStatus,
    technician?: { name: string; uid?: string }
  ): Promise<number> => {
    const uniqueIds = Array.from(new Set(jobIds.filter(Boolean)));
    if (uniqueIds.length === 0) return 0;

    try {
      const chunkSize = 400;
      for (let i = 0; i < uniqueIds.length; i += chunkSize) {
        const chunk = uniqueIds.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach((jobId) => {
          batch.update(doc(db, 'repairJobs', jobId), {
            status,
            ...(technician
              ? {
                  technicianName: technician.name.slice(0, 120),
                  technicianUid: (technician.uid || '').slice(0, 128),
                }
              : {}),
            updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }

      await logActivity({
        action: 'JOB_BULK_STATUS_UPDATE',
        targetCollection: 'repairJobs',
        targetId: uniqueIds.slice(0, 5).join(','),
        summary: `Bulk updated ${uniqueIds.length} repair job card(s) to "${status}"${
          technician?.name ? ` (Assigned: ${technician.name})` : ''
        }`,
      });
      await refreshErpData();
      return uniqueIds.length;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'repairJobs/bulk');
    }
  };

  const updateJobAsTechnician = async (
    jobId: string,
    patch: Pick<
      RepairJobCard,
      'inspectionDetails' | 'diagnosis' | 'status' | 'qualityChecklist' | 'beforeImages' | 'afterImages' | 'internalNotes' | 'customerUpdates'
    >
  ) => {
    try {
      await updateDoc(doc(db, 'repairJobs', jobId), {
        inspectionDetails: patch.inspectionDetails.slice(0, 2000),
        diagnosis: patch.diagnosis.slice(0, 2000),
        status: patch.status,
        ...(patch.qualityChecklist ? { qualityChecklist: patch.qualityChecklist } : {}),
        beforeImages: patch.beforeImages.slice(0, 6),
        afterImages: patch.afterImages.slice(0, 6),
        internalNotes: patch.internalNotes.slice(0, 2000),
        customerUpdates: patch.customerUpdates.slice(0, 2000),
        updatedAt: serverTimestamp(),
      });
      await logActivity({
        action: 'TECHNICIAN_JOB_UPDATE',
        targetCollection: 'repairJobs',
        targetId: jobId,
        summary: `Technician updated job status to ${patch.status}`,
      });
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `repairJobs/${jobId}`);
    }
  };

  const customerRespondEstimate = async (jobId: string, decision: 'Approved' | 'Rejected') => {
    const nextStatus: JobWorkflowStatus = decision === 'Approved' ? 'Approved' : 'Rejected Estimate';
    try {
      await updateDoc(doc(db, 'repairJobs', jobId), {
        approvalStatus: decision,
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      await pushNotification({
        audience: 'all_admins',
        title: `Estimate ${decision} by Customer`,
        message: `Customer marked job ${jobId} estimate as ${decision}.`,
        category: 'estimate',
        relatedCode: jobId,
      });
      await logActivity({
        action: `ESTIMATE_${decision.toUpperCase()}`,
        targetCollection: 'repairJobs',
        targetId: jobId,
        summary: `Customer ${decision.toLowerCase()} repair estimate`,
      });
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `repairJobs/${jobId}`);
    }
  };

  const consumePartInJob = async (job: RepairJobCard, part: InventoryItem, quantityUsed: number) => {
    const qty = Math.max(1, Math.round(quantityUsed));
    if (part.quantity < qty) {
      throw new Error(`Insufficient stock for ${part.name}. Available: ${part.quantity}`);
    }
    const actor = auth.currentUser;
    if (!actor) throw new Error('Not authenticated');

    const prevQty = part.quantity;
    const nextQty = prevQty - qty;
    const nextParts: JobPartUsage[] = [
      ...(job.partsUsed || []),
      {
        partId: part.id,
        sku: part.sku,
        partName: part.name,
        quantity: qty,
        unitPrice: part.sellingPrice,
      },
    ];

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'inventory', part.id), {
        quantity: nextQty,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'stockMovements', makeErpId('mov')), {
        partId: part.id,
        partName: part.name,
        sku: part.sku,
        type: 'REPAIR_USE',
        quantityDelta: -qty,
        previousQty: prevQty,
        nextQty,
        jobCardCode: job.jobCardCode,
        actorUid: actor.uid,
        actorName: actor.displayName || actor.email || 'Staff',
        note: `Consumed in job ${job.jobCardCode}`,
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, 'repairJobs', job.id), {
        partsUsed: nextParts.slice(0, 25),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      await logActivity({
        action: 'INVENTORY_PART_CONSUMED',
        targetCollection: 'repairJobs',
        targetId: job.id,
        summary: `Used ${qty}x ${part.name} (${part.sku}) on ${job.jobCardCode}`,
      });
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `repairJobs/${job.id}`);
    }
  };

  const deleteRepairJob = async (jobId: string) => {
    try {
      await deleteDoc(doc(db, 'repairJobs', jobId));
      await logActivity({
        action: 'JOB_CARD_DELETED',
        targetCollection: 'repairJobs',
        targetId: jobId,
        summary: `Deleted job card ${jobId}`,
      });
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `repairJobs/${jobId}`);
    }
  };

  const saveCustomer = async (
    customer: Omit<CustomerRecord, 'createdAt' | 'updatedAt'>,
    isNew: boolean
  ): Promise<CustomerRecord> => {
    const id = customer.id || makeErpId('cust');
    const existing = customers.find((c) => c.id === id);
    const body = {
      customerCode: (customer.customerCode || `CUST-${Date.now().toString(36).slice(-4).toUpperCase()}`).slice(0, 40),
      uid: (customer.uid || '').slice(0, 128),
      name: customer.name.trim().slice(0, 120),
      mobile: customer.mobile.trim().slice(0, 25),
      whatsapp: (customer.whatsapp || customer.mobile).trim().slice(0, 25),
      email: (customer.email || '').trim().slice(0, 160),
      address: (customer.address || '').trim().slice(0, 300),
      deviceHistory: (customer.deviceHistory || []).slice(0, 30),
      notes: (customer.notes || '').trim().slice(0, 2000),
      followUpDate: (customer.followUpDate || '').slice(0, 40),
      totalBusinessValue: Math.max(0, Number(customer.totalBusinessValue) || 0),
      repairCount: Math.max(0, Number(customer.repairCount) || 0),
    };
    try {
      if (isNew || !existing?.createdAt) {
        await setDoc(doc(db, 'customers', id), {
          ...body,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'customers', id), {
          ...body,
          updatedAt: serverTimestamp(),
        });
      }
      await logActivity({
        action: isNew ? 'CUSTOMER_CREATED' : 'CUSTOMER_UPDATED',
        targetCollection: 'customers',
        targetId: id,
        summary: `${isNew ? 'Added' : 'Updated'} customer ${body.name} (${body.customerCode})`,
      });
      await refreshErpData();
      return { id, ...body };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `customers/${id}`);
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'customers', id));
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
    }
  };

  const saveTechnician = async (
    tech: Omit<TechnicianProfile, 'createdAt' | 'updatedAt'>,
    isNew: boolean
  ) => {
    const id = tech.id || makeErpId('tech');
    const existing = technicians.find((t) => t.id === id);
    const body = {
      uid: (tech.uid || '').slice(0, 128),
      name: tech.name.trim().slice(0, 120),
      email: tech.email.trim().slice(0, 160),
      phone: (tech.phone || '').trim().slice(0, 30),
      specialization: (tech.specialization || 'Apple Logic Board & Hardware').trim().slice(0, 200),
      availability: tech.availability,
      notes: (tech.notes || '').trim().slice(0, 1000),
      isActive: Boolean(tech.isActive),
    };
    try {
      if (isNew || !existing?.createdAt) {
        await setDoc(doc(db, 'technicians', id), {
          ...body,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'technicians', id), {
          ...body,
          updatedAt: serverTimestamp(),
        });
      }
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `technicians/${id}`);
    }
  };

  const deleteTechnician = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'technicians', id));
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `technicians/${id}`);
    }
  };

  const saveAppointment = async (
    appt: Omit<AppointmentRecord, 'createdAt' | 'updatedAt'>,
    isNew: boolean
  ) => {
    const id = appt.id || makeErpId('appt');
    const existing = appointments.find((a) => a.id === id);
    const body = {
      appointmentCode: (appt.appointmentCode || `APT-${Date.now().toString(36).slice(-4).toUpperCase()}`).slice(0, 40),
      customerName: appt.customerName.trim().slice(0, 120),
      customerPhone: appt.customerPhone.trim().slice(0, 25),
      customerEmail: (appt.customerEmail || '').trim().slice(0, 160),
      customerUid: (appt.customerUid || '').slice(0, 128),
      macbookModel: appt.macbookModel.trim().slice(0, 140),
      serviceType: appt.serviceType.trim().slice(0, 160),
      scheduledDate: appt.scheduledDate.trim().slice(0, 40),
      scheduledSlot: (appt.scheduledSlot || '11:00 AM').trim().slice(0, 60),
      technicianUid: (appt.technicianUid || '').slice(0, 128),
      technicianName: (appt.technicianName || '').slice(0, 120),
      status: appt.status,
      notes: (appt.notes || '').trim().slice(0, 1000),
      reminderSent: Boolean(appt.reminderSent),
    };
    try {
      if (isNew || !existing?.createdAt) {
        await setDoc(doc(db, 'appointments', id), {
          ...body,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'appointments', id), {
          ...body,
          updatedAt: serverTimestamp(),
        });
      }
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `appointments/${id}`);
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'appointments', id));
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `appointments/${id}`);
    }
  };

  const saveInventoryItem = async (
    item: Omit<InventoryItem, 'updatedAt'>,
    initialNote?: string
  ) => {
    const id = item.id || makeErpId('part');
    const existing = inventory.find((p) => p.id === id);
    const body = {
      partCode: (item.partCode || `PRT-${Date.now().toString(36).slice(-4).toUpperCase()}`).slice(0, 40),
      name: item.name.trim().slice(0, 160),
      compatibleModels: (item.compatibleModels || '').trim().slice(0, 300),
      sku: item.sku.trim().slice(0, 60),
      supplierName: (item.supplierName || '').trim().slice(0, 140),
      purchasePrice: Math.max(0, Number(item.purchasePrice) || 0),
      sellingPrice: Math.max(0, Number(item.sellingPrice) || 0),
      quantity: Math.max(0, Math.round(Number(item.quantity) || 0)),
      minStock: Math.max(0, Math.round(Number(item.minStock) || 1)),
      location: (item.location || 'Main Shelf').trim().slice(0, 100),
      purchaseDate: (item.purchaseDate || new Date().toISOString().slice(0, 10)).slice(0, 40),
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'inventory', id), {
        ...body,
        updatedAt: serverTimestamp(),
      });
      if (!existing && body.quantity > 0 && auth.currentUser) {
        batch.set(doc(db, 'stockMovements', makeErpId('mov')), {
          partId: id,
          partName: body.name,
          sku: body.sku,
          type: 'IN',
          quantityDelta: body.quantity,
          previousQty: 0,
          nextQty: body.quantity,
          actorUid: auth.currentUser.uid,
          actorName: auth.currentUser.displayName || auth.currentUser.email || 'Admin',
          note: initialNote || 'Initial stock entry',
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `inventory/${id}`);
    }
  };

  const adjustInventoryStock = async (
    part: InventoryItem,
    quantityDelta: number,
    type: StockMovement['type'],
    note: string,
    jobCardCode?: string
  ) => {
    const nextQty = Math.max(0, part.quantity + quantityDelta);
    const actor = auth.currentUser;
    if (!actor) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'inventory', part.id), {
        quantity: nextQty,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'stockMovements', makeErpId('mov')), {
        partId: part.id,
        partName: part.name,
        sku: part.sku,
        type,
        quantityDelta,
        previousQty: part.quantity,
        nextQty,
        ...(jobCardCode ? { jobCardCode } : {}),
        actorUid: actor.uid,
        actorName: actor.displayName || actor.email || 'Staff',
        note: note.trim().slice(0, 400),
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      await logActivity({
        action: 'STOCK_ADJUSTMENT',
        targetCollection: 'inventory',
        targetId: part.id,
        summary: `Adjusted ${part.name} (${part.sku}) by ${quantityDelta} -> ${nextQty}`,
      });
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inventory/${part.id}`);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'inventory', id));
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `inventory/${id}`);
    }
  };

  const saveSupplier = async (supplier: Omit<SupplierRecord, 'createdAt'>, isNew: boolean) => {
    const id = supplier.id || makeErpId('sup');
    const existing = suppliers.find((s) => s.id === id);
    const body = {
      name: supplier.name.trim().slice(0, 140),
      contactPerson: (supplier.contactPerson || '').trim().slice(0, 120),
      phone: (supplier.phone || '').trim().slice(0, 30),
      email: (supplier.email || '').trim().slice(0, 160),
      address: (supplier.address || '').trim().slice(0, 300),
      gstNumber: (supplier.gstNumber || '').trim().slice(0, 40),
      notes: (supplier.notes || '').trim().slice(0, 500),
    };
    try {
      if (isNew || !existing?.createdAt) {
        await setDoc(doc(db, 'suppliers', id), { ...body, createdAt: serverTimestamp() });
      } else {
        await updateDoc(doc(db, 'suppliers', id), body);
      }
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `suppliers/${id}`);
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'suppliers', id));
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `suppliers/${id}`);
    }
  };

  const savePurchaseOrder = async (
    po: Omit<PurchaseOrderRecord, 'createdAt' | 'updatedAt'>,
    isNew: boolean
  ) => {
    const id = po.id || makeErpId('po');
    const existing = purchaseOrders.find((p) => p.id === id);
    const body = {
      poNumber: (po.poNumber || `PO-${Date.now().toString(36).slice(-4).toUpperCase()}`).slice(0, 40),
      supplierName: po.supplierName.trim().slice(0, 140),
      itemsSummary: po.itemsSummary.trim().slice(0, 1000),
      totalAmount: Math.max(0, Number(po.totalAmount) || 0),
      status: po.status,
      expectedDate: (po.expectedDate || '').slice(0, 40),
      notes: (po.notes || '').trim().slice(0, 500),
    };
    try {
      if (isNew || !existing?.createdAt) {
        await setDoc(doc(db, 'purchaseOrders', id), {
          ...body,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'purchaseOrders', id), {
          ...body,
          updatedAt: serverTimestamp(),
        });
      }
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `purchaseOrders/${id}`);
    }
  };

  const deletePurchaseOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'purchaseOrders', id));
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `purchaseOrders/${id}`);
    }
  };

  const saveInvoice = async (
    inv: Omit<InvoiceRecord, 'createdAt' | 'updatedAt'>,
    isNew: boolean
  ): Promise<InvoiceRecord> => {
    const id = inv.id || makeErpId('inv');
    const existing = invoices.find((i) => i.id === id);
    const prefix = settings.erpConfig?.invoicePrefix || 'INV-RP';
    const invNum =
      inv.invoiceNumber ||
      `${prefix}-${new Date().getFullYear()}-${String(invoices.length + 101)}`;
    const subtotal = Math.max(0, (Number(inv.serviceCharges) || 0) + (Number(inv.partsCharges) || 0));
    const taxRate = Math.max(0, Number(inv.taxRate) || 0);
    const taxAmount = Math.round((subtotal * taxRate) / 100);
    const discount = Math.max(0, Number(inv.discount) || 0);
    const totalAmount = Math.max(0, subtotal + taxAmount - discount);
    const amountPaid = Math.max(0, Number(inv.amountPaid) || 0);
    const outstandingAmount = Math.max(0, totalAmount - amountPaid);
    const status: InvoiceRecord['status'] =
      inv.status === 'Refunded'
        ? 'Refunded'
        : outstandingAmount === 0 && totalAmount > 0
          ? 'Paid'
          : amountPaid > 0
            ? 'Partial'
            : 'Unpaid';

    const body = {
      invoiceNumber: invNum.slice(0, 40),
      jobCardCode: (inv.jobCardCode || '').slice(0, 40),
      enquiryCode: (inv.enquiryCode || '').slice(0, 40),
      customerId: (inv.customerId || '').slice(0, 128),
      customerUid: (inv.customerUid || '').slice(0, 128),
      customerName: inv.customerName.trim().slice(0, 120),
      customerMobile: inv.customerMobile.trim().slice(0, 25),
      customerEmail: (inv.customerEmail || '').trim().slice(0, 160),
      customerAddress: (inv.customerAddress || '').trim().slice(0, 300),
      deviceSummary: inv.deviceSummary.trim().slice(0, 200),
      repairSummary: (inv.repairSummary || '').trim().slice(0, 500),
      serviceCharges: Math.max(0, Number(inv.serviceCharges) || 0),
      partsCharges: Math.max(0, Number(inv.partsCharges) || 0),
      taxRate,
      taxAmount,
      discount,
      totalAmount,
      amountPaid,
      outstandingAmount,
      status,
      warrantyNote: (inv.warrantyNote || '90 Days Service Warranty').slice(0, 400),
      issuedDate: (inv.issuedDate || new Date().toISOString().slice(0, 10)).slice(0, 40),
    };

    try {
      if (isNew || !existing?.createdAt) {
        await setDoc(doc(db, 'invoices', id), {
          ...body,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'invoices', id), {
          ...body,
          updatedAt: serverTimestamp(),
        });
      }

      if (body.customerUid || body.customerEmail) {
        await pushNotification({
          recipientUid: body.customerUid || undefined,
          recipientEmail: body.customerEmail || undefined,
          audience: 'customer',
          title: `Invoice ${body.invoiceNumber} Generated`,
          message: `Invoice for ${body.deviceSummary}: Total ₹${body.totalAmount.toLocaleString('en-IN')} (${body.status}).`,
          category: 'payment',
          relatedCode: body.invoiceNumber,
        });
      }

      await logActivity({
        action: isNew ? 'INVOICE_GENERATED' : 'INVOICE_UPDATED',
        targetCollection: 'invoices',
        targetId: id,
        summary: `Invoice ${body.invoiceNumber} for ${body.customerName}: ₹${body.totalAmount}`,
      });
      await Promise.all([refreshErpData(), refreshCustomerData()]);
      return { id, ...body };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `invoices/${id}`);
    }
  };

  const generateInvoiceFromJob = async (
    job: RepairJobCard,
    taxRate = settings.erpConfig?.defaultTaxRate ?? 18,
    discount = 0
  ): Promise<InvoiceRecord> => {
    const partsTotal = (job.partsUsed || []).reduce(
      (sum, p) => sum + (Number(p.unitPrice) || 0) * (Number(p.quantity) || 1),
      0
    );
    const baseTotal = Number(job.finalCost ?? job.estimatedCost ?? 0);
    const serviceCharges = Math.max(0, baseTotal - partsTotal);

    return saveInvoice(
      {
        id: '',
        invoiceNumber: '',
        jobCardCode: job.jobCardCode,
        enquiryCode: job.enquiryCode || '',
        customerId: job.customerId || '',
        customerUid: job.customerUid || '',
        customerName: job.customerName,
        customerMobile: job.customerMobile,
        customerEmail: job.customerEmail || '',
        customerAddress: '',
        deviceSummary: `${job.deviceType} · ${job.macbookModel}`,
        repairSummary: job.diagnosis || job.reportedProblem || 'Diagnostic & Hardware Repair',
        serviceCharges,
        partsCharges: partsTotal,
        taxRate,
        taxAmount: 0,
        discount,
        totalAmount: 0,
        amountPaid: job.paymentStatus === 'Paid' ? baseTotal : 0,
        outstandingAmount: 0,
        status: job.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid',
        warrantyNote: job.warrantyPeriod || '90 Days Service Warranty',
        issuedDate: new Date().toISOString().slice(0, 10),
      },
      true
    );
  };

  const deleteInvoice = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'invoices', id));
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `invoices/${id}`);
    }
  };

  const saveExpense = async (exp: Omit<ExpenseRecord, 'createdAt'>, isNew: boolean) => {
    const id = exp.id || makeErpId('exp');
    const existing = expenses.find((e) => e.id === id);
    const body = {
      category: exp.category,
      description: exp.description.trim().slice(0, 300),
      amount: Math.max(1, Number(exp.amount) || 1),
      expenseDate: (exp.expenseDate || new Date().toISOString().slice(0, 10)).slice(0, 40),
      paymentMethod: exp.paymentMethod,
      referenceNumber: (exp.referenceNumber || '').trim().slice(0, 120),
      documentNote: (exp.documentNote || '').trim().slice(0, 300),
    };
    try {
      if (isNew || !existing?.createdAt) {
        await setDoc(doc(db, 'expenses', id), { ...body, createdAt: serverTimestamp() });
      } else {
        await updateDoc(doc(db, 'expenses', id), body);
      }
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `expenses/${id}`);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
      await refreshErpData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`);
    }
  };

  return (
    <ErpContext.Provider
      value={{
        repairJobs,
        customers,
        technicians,
        appointments,
        inventory,
        stockMovements,
        suppliers,
        purchaseOrders,
        invoices,
        expenses,
        notifications,
        activityLogs,
        erpLoading,
        customerJobs,
        customerInvoices,
        refreshErpData,
        logActivity,
        pushNotification,
        markNotificationRead,
        saveRepairJob,
        createJobFromEnquiry,
        updateJobAsTechnician,
        customerRespondEstimate,
        consumePartInJob,
        bulkUpdateRepairJobStatus,
        deleteRepairJob,
        saveCustomer,
        upsertCustomerFromRecord,
        deleteCustomer,
        saveTechnician,
        deleteTechnician,
        saveAppointment,
        deleteAppointment,
        saveInventoryItem,
        adjustInventoryStock,
        deleteInventoryItem,
        saveSupplier,
        deleteSupplier,
        savePurchaseOrder,
        deletePurchaseOrder,
        saveInvoice,
        generateInvoiceFromJob,
        deleteInvoice,
        saveExpense,
        deleteExpense,
      }}
    >
      {children}
    </ErpContext.Provider>
  );
}

export function useErp() {
  const ctx = useContext(ErpContext);
  if (!ctx) throw new Error('useErp must be used inside ErpProvider');
  return ctx;
}
