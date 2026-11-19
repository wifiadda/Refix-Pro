import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function extractReadableError(error: unknown, fallback: string): string {
  if (!error) return fallback;
  const raw = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(raw) as Partial<FirestoreErrorInfo>;
    const inner = parsed.error || raw;
    const email = parsed.authInfo?.email;
    if (/permission|insufficient/i.test(inner)) {
      return `Permission denied${email ? ` for ${email}` : ''}. Ensure your account holds Admin / Super Admin role.`;
    }
    if (/exceeds|1048|too large|size limit/i.test(inner)) {
      return 'Document or embedded images exceed Firestore 1 MB limit. Compress images or use image URLs.';
    }
    if (/unsupported field value:\s*undefined/i.test(inner)) {
      return 'Invalid empty field detected while saving. Please review required fields and retry.';
    }
    if (/offline|unavailable/i.test(inner)) {
      return 'Network or Firestore service unavailable. Check connection and retry.';
    }
    if (inner && inner.length < 180) return inner;
  } catch {
    if (/permission|insufficient/i.test(raw)) {
      return 'Permission denied. Sign in with an authorized Admin / Super Admin account.';
    }
    if (raw && raw.length < 180) return raw;
  }
  return fallback;
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export const OWNER_ADMIN_EMAIL = 'refixpro.in@gmail.com';
export const ADMIN_BOOTSTRAP_EMAILS = [OWNER_ADMIN_EMAIL];

export function normalizeMobileKey(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

export async function computeTrackingId(enquiryCode: string, mobile: string): Promise<string> {
  const normalizedCode = enquiryCode.trim().toUpperCase();
  const normalizedMobile = normalizeMobileKey(mobile);
  const raw = `${normalizedCode}::${normalizedMobile}`;
  const encoded = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
