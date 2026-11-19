import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import {
  ADMIN_BOOTSTRAP_EMAILS,
  OperationType,
  auth,
  db,
  handleFirestoreError,
  testFirestoreConnection,
} from '../lib/firebase';
import {
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_STAFF_PERMISSIONS,
  type AdminModuleKey,
  type AdminPermissions,
  type AdminUser,
  type AppUserProfile,
  type PermissionAction,
  type UserRole,
} from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  staff: 'Front-Desk Staff',
  technician: 'Technician',
  user: 'Customer',
};

export interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  userRole: UserRole;
  roleLabel: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isFrontDeskStaff: boolean;
  isTechnician: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  accountDeactivated: boolean;
  userProfile: AppUserProfile | null;
  currentPermissions: AdminPermissions | null;
  hasPermission: (module: AdminModuleKey, action?: PermissionAction) => boolean;
  refreshUserRole: () => Promise<void>;
  updateOwnProfile: (patch: {
    displayName: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
  }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFrontDeskStaff, setIsFrontDeskStaff] = useState(false);
  const [isTechnician, setIsTechnician] = useState(false);
  const [accountDeactivated, setAccountDeactivated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [currentPermissions, setCurrentPermissions] = useState<AdminPermissions | null>(null);

  const isStaff = isAdmin || isFrontDeskStaff || isTechnician;
  const isCustomer = Boolean(user) && userRole === 'user';

  const hasPermission = useCallback(
    (module: AdminModuleKey, action: PermissionAction = 'view') => {
      if (accountDeactivated) return false;
      if (isSuperAdmin) return true;
      if (isTechnician) {
        return (
          (module === 'jobs' || module === 'inventory' || module === 'appointments') &&
          (action === 'view' || action === 'edit')
        );
      }
      if (isFrontDeskStaff) {
        if (module === 'users' || module === 'settings' || module === 'logs' || action === 'delete' || action === 'manage_settings') {
          return false;
        }
        const perms = currentPermissions || DEFAULT_STAFF_PERMISSIONS;
        const moduleAllowed =
          !perms.modules || perms.modules.length === 0 || perms.modules.includes(module);
        const actionAllowed =
          !perms.actions || perms.actions.length === 0 || perms.actions.includes(action);
        return moduleAllowed && actionAllowed;
      }
      if (!isAdmin) return false;
      const perms = currentPermissions || DEFAULT_ADMIN_PERMISSIONS;
      const moduleAllowed =
        !perms.modules || perms.modules.length === 0 || perms.modules.includes(module);
      const actionAllowed =
        !perms.actions || perms.actions.length === 0 || perms.actions.includes(action);
      return moduleAllowed && actionAllowed;
    },
    [accountDeactivated, isSuperAdmin, isTechnician, isFrontDeskStaff, isAdmin, currentPermissions]
  );

  const evaluateAndSyncAuthUser = useCallback(async (currentUser: User | null) => {
    setUser(currentUser);
    if (currentUser && currentUser.emailVerified) {
      const normalizedEmail = (currentUser.email || '').toLowerCase();
      const isBootstrapOwner = ADMIN_BOOTSTRAP_EMAILS.includes(normalizedEmail);
      const userRef = doc(db, 'users', currentUser.uid);
      const adminRef = doc(db, 'admins', currentUser.uid);
      const safeDisplayName = (
        currentUser.displayName ||
        currentUser.email?.split('@')[0] ||
        'Refix Pro User'
      )
        .trim()
        .slice(0, 120);
      const safeEmail = (currentUser.email || '').trim().slice(0, 200);
      const safePhoto = (currentUser.photoURL || '').trim().slice(0, 1000);

      if (isBootstrapOwner) {
        setAccountDeactivated(false);
        setIsSuperAdmin(true);
        setIsAdmin(true);
        setIsFrontDeskStaff(false);
        setIsTechnician(false);
        setUserRole('super_admin');
        setCurrentPermissions(null);
        try {
          const [admSnap, userSnap] = await Promise.all([getDoc(adminRef), getDoc(userRef)]);
          if (!admSnap.exists()) {
            await setDoc(adminRef, {
              uid: currentUser.uid,
              email: safeEmail,
              displayName: safeDisplayName || 'Refix Pro Owner',
              role: 'super_admin',
              isActive: true,
              createdAt: serverTimestamp(),
            });
          } else if (admSnap.data()?.role !== 'super_admin' || admSnap.data()?.isActive === false) {
            await updateDoc(adminRef, { role: 'super_admin', isActive: true });
          }

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: safeEmail,
              displayName: safeDisplayName,
              photoURL: safePhoto,
              role: 'super_admin',
              isActive: true,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            });
          } else {
            await updateDoc(userRef, {
              email: safeEmail,
              displayName: safeDisplayName,
              photoURL: safePhoto,
              role: 'super_admin',
              isActive: true,
              lastLoginAt: serverTimestamp(),
            });
          }
          const latestUserSnap = await getDoc(userRef).catch(() => null);
          if (latestUserSnap?.exists()) {
            setUserProfile({
              id: latestUserSnap.id,
              ...(latestUserSnap.data() as Omit<AppUserProfile, 'id'>),
            });
          }
        } catch (err) {
          console.error('Owner bootstrap sync:', err);
        }
      } else {
        try {
          const [admSnap, userSnap] = await Promise.all([
            getDoc(adminRef).catch(() => null),
            getDoc(userRef).catch(() => null),
          ]);
          const admData =
            admSnap && admSnap.exists() ? (admSnap.data() as Omit<AdminUser, 'id'>) : null;
          const userData =
            userSnap && userSnap.exists() ? (userSnap.data() as Omit<AppUserProfile, 'id'>) : null;

          const deactivated = admData?.isActive === false || userData?.isActive === false;
          setAccountDeactivated(deactivated);

          let resolvedRole: UserRole = 'user';
          if (!deactivated && admData) {
            if (admData.role === 'super_admin') resolvedRole = 'super_admin';
            else if (admData.role === 'admin') resolvedRole = 'admin';
            else if (admData.role === 'staff') resolvedRole = 'staff';
            else if (admData.role === 'technician') resolvedRole = 'technician';
          }

          setIsSuperAdmin(resolvedRole === 'super_admin');
          setIsAdmin(resolvedRole === 'super_admin' || resolvedRole === 'admin');
          setIsFrontDeskStaff(resolvedRole === 'staff');
          setIsTechnician(resolvedRole === 'technician');
          setUserRole(resolvedRole);
          setCurrentPermissions(
            admData?.permissions ||
              userData?.permissions ||
              (resolvedRole === 'staff' ? DEFAULT_STAFF_PERMISSIONS : DEFAULT_ADMIN_PERMISSIONS)
          );

          if (userSnap && !userSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: safeEmail,
              displayName: safeDisplayName,
              photoURL: safePhoto,
              role: resolvedRole,
              isActive: true,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            });
          } else if (userSnap && userSnap.exists() && !deactivated) {
            await updateDoc(userRef, {
              email: safeEmail,
              displayName: userData?.displayName || safeDisplayName,
              photoURL: safePhoto,
              lastLoginAt: serverTimestamp(),
            });
          }
          const refreshedProfileSnap = await getDoc(userRef).catch(() => null);
          if (refreshedProfileSnap?.exists()) {
            setUserProfile({
              id: refreshedProfileSnap.id,
              ...(refreshedProfileSnap.data() as Omit<AppUserProfile, 'id'>),
            });
          }
        } catch (err) {
          console.error('User profile / role check:', err);
          setAccountDeactivated(false);
          setIsSuperAdmin(false);
          setIsAdmin(false);
          setIsFrontDeskStaff(false);
          setIsTechnician(false);
          setUserRole('user');
          setCurrentPermissions(null);
          setUserProfile(null);
        }
      }
    } else {
      setAccountDeactivated(false);
      setIsSuperAdmin(false);
      setIsAdmin(false);
      setIsFrontDeskStaff(false);
      setIsTechnician(false);
      setUserRole('user');
      setCurrentPermissions(null);
      setUserProfile(null);
    }
    setAuthReady(true);
  }, []);

  useEffect(() => {
    void testFirestoreConnection();
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      void evaluateAndSyncAuthUser(currentUser);
    });
    return () => unsub();
  }, [evaluateAndSyncAuthUser]);

  const refreshUserRole = useCallback(async () => {
    await evaluateAndSyncAuthUser(auth.currentUser);
  }, [evaluateAndSyncAuthUser]);

  const updateOwnProfile = useCallback(
    async (patch: {
      displayName: string;
      phone?: string;
      whatsapp?: string;
      address?: string;
    }) => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      try {
        await updateDoc(doc(db, 'users', uid), {
          displayName: patch.displayName.trim().slice(0, 120) || 'Refix Pro User',
          phone: (patch.phone || '').trim().slice(0, 30),
          whatsapp: (patch.whatsapp || '').trim().slice(0, 30),
          address: (patch.address || '').trim().slice(0, 300),
          lastLoginAt: serverTimestamp(),
        });
        await refreshUserRole();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      }
    },
    [refreshUserRole]
  );

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setAccountDeactivated(false);
    setIsSuperAdmin(false);
    setIsAdmin(false);
    setIsFrontDeskStaff(false);
    setIsTechnician(false);
    setUserRole('user');
    setUserProfile(null);
    setCurrentPermissions(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        userRole,
        roleLabel: ROLE_LABELS[userRole],
        isSuperAdmin,
        isAdmin,
        isFrontDeskStaff,
        isTechnician,
        isStaff,
        isCustomer,
        accountDeactivated,
        userProfile,
        currentPermissions,
        hasPermission,
        refreshUserRole,
        updateOwnProfile,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  portalTitle = 'Refix Pro Staff & ERP Portal',
  portalDescription = 'Sign in with Google using your authorized Refix Pro account (refixpro.in@gmail.com or an assigned Admin / Technician email) to open this workspace.',
  onAuthError,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  portalTitle?: string;
  portalDescription?: string;
  onAuthError?: (message: string) => void;
}) {
  const {
    user,
    authReady,
    userRole,
    accountDeactivated,
    signInWithGoogle,
    refreshUserRole,
    logout,
  } = useAuth();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
        <div className="text-center space-y-2.5">
          <div className="w-7 h-7 border-2 border-[#0066CC] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#424245]">Verifying account permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E5EA] p-8 text-center space-y-6 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6 text-[#0066CC]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#1D1D1F]">{portalTitle}</h1>
            <p className="text-sm text-[#424245]">{portalDescription}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (err) {
                console.error(err);
                onAuthError?.('Google sign-in was cancelled or blocked.');
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

  if (accountDeactivated) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center space-y-5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Account Disabled</p>
            <h1 className="text-xl font-bold text-[#1D1D1F]">Access Deactivated</h1>
            <p className="text-sm text-[#424245]">
              Your account (<span className="font-mono font-semibold">{user.email}</span>) has been deactivated by the Super Admin. Contact Refix Pro management to restore access.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 justify-center">
            <Link
              to="/"
              className="px-4 py-2.5 rounded-xl border border-[#D2D2D7] hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]"
            >
              Public Website
            </Link>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E5EA] p-8 text-center space-y-5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 text-[#0066CC]" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#0066CC]">
              {ROLE_LABELS[userRole]} Mode Active
            </p>
            <h1 className="text-xl font-bold text-[#1D1D1F]">Staff Access Required</h1>
            <p className="text-sm text-[#424245]">
              Your account (<span className="font-mono font-semibold">{user.email}</span>) is currently in{' '}
              <strong>{ROLE_LABELS[userRole]} Mode</strong>. Only authorized Super Admin, Admin, or Technician accounts can access the Refix Pro ERP console.
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
              onClick={() => void refreshUserRole()}
              className="px-4 py-2.5 rounded-xl border border-[#D2D2D7] hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] whitespace-nowrap"
            >
              Re-check Role
            </button>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold whitespace-nowrap"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
