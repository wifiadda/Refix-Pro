import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Database,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Plus,
  Search,
  Settings,
  Shield,
  Trash2,
  Upload,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OWNER_ADMIN_EMAIL, extractReadableError } from '../../lib/firebase';
import { compressImageToDataUrl } from '../../utils/whatsapp';
import { ConfirmDialog } from '../ConfirmDialog';
import { AdminAuditBackupTab } from './AdminAuditBackupTab';
import {
  ALL_ADMIN_MODULES,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_STAFF_PERMISSIONS,
  type AdminModuleKey,
  type AdminPermissions,
  type AppUserProfile,
  type PermissionAction,
  type UserRole,
  type WebsiteSettings,
} from '../../types';

const ALL_PERMISSION_ACTIONS: { id: PermissionAction; label: string }[] = [
  { id: 'view', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
  { id: 'approve', label: 'Approve' },
  { id: 'export', label: 'Export' },
  { id: 'manage_settings', label: 'Manage Settings' },
];

export function AdminSettingsAndUsersTab({
  mode,
  onNotify,
}: {
  mode: 'settings' | 'users';
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const {
    settings,
    saveWebsiteSettings,
    galleryImages,
    saveGalleryImage,
    deleteGalleryImage,
    adminUsers,
    registeredUsers,
    setUserRole,
    toggleUserActive,
    saveAdminUser,
    removeAdminUser,
    user,
    isSuperAdmin,
    hasPermission,
    googleLiveProfile,
  } = useApp();

  const [form, setForm] = useState<WebsiteSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'website' | 'erp'>('website');

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const [newGalleryTitle, setNewGalleryTitle] = useState('');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  const [newGalleryCategory, setNewGalleryCategory] = useState('Logic Board Lab');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [deleteGalleryTarget, setDeleteGalleryTarget] = useState<{ id: string; title: string } | null>(null);

  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'technician' | 'staff' | 'admin' | 'super_admin'>('staff');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [updatingRoleUid, setUpdatingRoleUid] = useState<string | null>(null);

  const [permModalUser, setPermModalUser] = useState<AppUserProfile | null>(null);
  const [modalPerms, setModalPerms] = useState<AdminPermissions>(DEFAULT_ADMIN_PERMISSIONS);
  const [savingPerms, setSavingPerms] = useState(false);
  const [revokeAdminTarget, setRevokeAdminTarget] = useState<{ uid: string; email: string } | null>(null);

  if (mode === 'users') {
    const canManageUsers = isSuperAdmin || hasPermission('users', 'edit');

    const handleAddAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newAdminUid.trim() || !newAdminEmail.trim() || !newAdminName.trim()) {
        onNotify('error', 'UID, Email, and Display Name are required.');
        return;
      }
      if (newAdminRole === 'super_admin' && !isSuperAdmin) {
        onNotify('error', 'Only Super Admin can assign Super Admin privileges.');
        return;
      }
      try {
        await saveAdminUser({
          uid: newAdminUid.trim(),
          email: newAdminEmail.trim(),
          displayName: newAdminName.trim(),
          role: newAdminRole,
          isActive: true,
          permissions:
            newAdminRole === 'admin'
              ? DEFAULT_ADMIN_PERMISSIONS
              : newAdminRole === 'staff'
                ? DEFAULT_STAFF_PERMISSIONS
                : undefined,
        });
        setNewAdminUid('');
        setNewAdminEmail('');
        setNewAdminName('');
        onNotify('success', `Staff role (${newAdminRole}) assigned successfully.`);
      } catch (err) {
        console.error(err);
        onNotify('error', extractReadableError(err, 'Unable to assign staff role.'));
      }
    };

    const q = userSearch.trim().toLowerCase();
    const adminMap = new Map(adminUsers.map((a) => [a.uid, a]));

    const resolveEffectiveRole = (u: AppUserProfile): UserRole => {
      if (u.email.toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase()) return 'super_admin';
      const adm = adminMap.get(u.uid);
      if (adm?.role === 'super_admin' || u.role === 'super_admin') return 'super_admin';
      if (adm?.role === 'admin' || u.role === 'admin') return 'admin';
      if (adm?.role === 'staff' || u.role === 'staff') return 'staff';
      if (adm?.role === 'technician' || u.role === 'technician') return 'technician';
      return 'user';
    };

    const filteredUsers = registeredUsers.filter((u) => {
      const effRole = resolveEffectiveRole(u);
      if (roleFilter !== 'all' && effRole !== roleFilter) return false;
      return (
        !q ||
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q)
      );
    });

    const handleRoleChange = async (
      target: AppUserProfile,
      nextRole: UserRole
    ) => {
      setUpdatingRoleUid(target.uid);
      try {
        await setUserRole(target.uid, nextRole, {
          email: target.email,
          displayName: target.displayName,
          permissions:
            nextRole === 'admin'
              ? adminMap.get(target.uid)?.permissions || target.permissions || DEFAULT_ADMIN_PERMISSIONS
              : nextRole === 'staff'
                ? adminMap.get(target.uid)?.permissions || target.permissions || DEFAULT_STAFF_PERMISSIONS
                : undefined,
          isActive: target.isActive !== false,
        });
        onNotify('success', `${target.displayName} updated to ${nextRole.replace('_', ' ')} role.`);
      } catch (err) {
        console.error(err);
        onNotify(
          'error',
          err instanceof Error ? err.message : 'Unable to update user role right now.'
        );
      } finally {
        setUpdatingRoleUid(null);
      }
    };

    const handleToggleActive = async (target: AppUserProfile) => {
      const nextActive = target.isActive === false;
      setUpdatingRoleUid(target.uid);
      try {
        await toggleUserActive(target.uid, nextActive);
        onNotify(
          'success',
          `${target.displayName} account ${nextActive ? 'reactivated' : 'deactivated'}.`
        );
      } catch (err) {
        console.error(err);
        onNotify(
          'error',
          err instanceof Error ? err.message : 'Unable to update account active state.'
        );
      } finally {
        setUpdatingRoleUid(null);
      }
    };

    const openPermissionsModal = (target: AppUserProfile) => {
      const existingPerms =
        adminMap.get(target.uid)?.permissions || target.permissions || DEFAULT_ADMIN_PERMISSIONS;
      setModalPerms({
        modules: [...(existingPerms.modules || DEFAULT_ADMIN_PERMISSIONS.modules)],
        actions: [...(existingPerms.actions || DEFAULT_ADMIN_PERMISSIONS.actions)],
      });
      setPermModalUser(target);
    };

    const toggleModulePerm = (mod: AdminModuleKey) => {
      setModalPerms((prev) => ({
        ...prev,
        modules: prev.modules.includes(mod)
          ? prev.modules.filter((m) => m !== mod)
          : [...prev.modules, mod],
      }));
    };

    const toggleActionPerm = (act: PermissionAction) => {
      setModalPerms((prev) => ({
        ...prev,
        actions: prev.actions.includes(act)
          ? prev.actions.filter((a) => a !== act)
          : [...prev.actions, act],
      }));
    };

    const handleSavePermissions = async () => {
      if (!permModalUser) return;
      setSavingPerms(true);
      try {
        const effRole = resolveEffectiveRole(permModalUser);
        await setUserRole(permModalUser.uid, effRole === 'user' ? 'admin' : effRole, {
          email: permModalUser.email,
          displayName: permModalUser.displayName,
          permissions: modalPerms,
          isActive: permModalUser.isActive !== false,
        });
        onNotify('success', `Module & action permissions saved for ${permModalUser.displayName}.`);
        setPermModalUser(null);
      } catch (err) {
        console.error(err);
        onNotify('error', err instanceof Error ? err.message : 'Failed to save permissions.');
      } finally {
        setSavingPerms(false);
      }
    };

    return (
      <div className="space-y-8">
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1D1D1F]">
                5-Role Security &amp; Access Control
              </h2>
              <p className="text-xs text-[#6E6E73] mt-1">
                Signed in as <span className="font-mono font-semibold text-[#1D1D1F]">{user?.email}</span> · Role:{' '}
                <span className="font-semibold text-[#0066CC]">
                  {isSuperAdmin ? 'Super Admin (Full Ownership)' : 'Administrator'}
                </span>
              </p>
            </div>
            <a
              href="https://myaccount.google.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D2D2D7] hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]"
            >
              <Shield className="w-4 h-4 text-[#0066CC]" />
              Manage Password / 2FA on Google
            </a>
          </div>
        </div>

        {/* Registered Users & 5-Role RBAC Matrix */}
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F]">
                Registered Users, Staff &amp; Permissions ({registeredUsers.length})
              </h3>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Assign <strong>Customer</strong>, <strong>Technician</strong>, <strong>Front-Desk Staff</strong>, <strong>Admin</strong>, or{' '}
                <strong>Super Admin</strong> roles. Super Admin accounts are strictly protected from modification by ordinary admins.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
                className="px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs bg-white font-semibold"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="staff">Front-Desk Staff</option>
                <option value="technician">Technician</option>
                <option value="user">Customer</option>
              </select>
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search email, name or UID..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#D2D2D7] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                />
              </div>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6E6E73] border border-dashed border-[#D2D2D7] rounded-xl">
              {registeredUsers.length === 0
                ? 'No signed-in customer accounts recorded yet. Once users sign in, they appear here for role management.'
                : 'No users match your filter.'}
            </div>
          ) : (
            <div className="divide-y divide-[#E5E5EA] border-y border-[#E5E5EA]">
              {filteredUsers.map((u) => {
                const effRole = resolveEffectiveRole(u);
                const admRecord = adminMap.get(u.uid);
                const isActive = u.isActive !== false && admRecord?.isActive !== false;
                const isPrimaryOwner = u.email.toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase();
                const isLockedFromEditor =
                  isPrimaryOwner ||
                  u.uid === user?.uid ||
                  (effRole === 'super_admin' && !isSuperAdmin);

                return (
                  <div
                    key={u.id}
                    className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          alt={u.displayName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-[#E5E5EA] shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center shrink-0">
                          <UserCheck className="w-4 h-4 text-[#0066CC]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#1D1D1F] truncate">{u.displayName}</span>
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wide ${
                              effRole === 'super_admin'
                                ? 'text-purple-700'
                                : effRole === 'admin'
                                  ? 'text-[#0066CC]'
                                  : effRole === 'technician'
                                    ? 'text-teal-700'
                                    : 'text-[#6E6E73]'
                            }`}
                          >
                            {effRole.replace('_', ' ')}
                          </span>
                          {!isActive && (
                            <span className="text-[11px] font-bold text-red-600">· Deactivated</span>
                          )}
                        </div>
                        <p className="text-xs text-[#6E6E73] font-mono truncate">
                          {u.email} · {u.uid}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {isLockedFromEditor ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6E6E73] px-3 py-1.5 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA]">
                          <Lock className="w-3 h-3" />
                          {isPrimaryOwner
                            ? 'Primary Super Admin (Locked)'
                            : u.uid === user?.uid
                              ? 'Active Session'
                              : 'Super Admin Protected'}
                        </span>
                      ) : (
                        <>
                          <select
                            disabled={!canManageUsers || updatingRoleUid === u.uid}
                            value={effRole}
                            onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                            className="px-3 py-1.5 rounded-lg border border-[#D2D2D7] bg-white text-xs font-semibold text-[#1D1D1F]"
                          >
                            <option value="user">Customer (User Mode)</option>
                            <option value="technician">Technician</option>
                            <option value="staff">Front-Desk Staff</option>
                            <option value="admin">Admin</option>
                            {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                          </select>

                          {(effRole === 'admin' || effRole === 'staff') && isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => openPermissionsModal(u)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D2D2D7] bg-[#F5F5F7] hover:bg-[#E5E5EA] text-xs font-semibold text-[#1D1D1F]"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-[#0066CC]" />
                              Permissions
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={!canManageUsers || updatingRoleUid === u.uid}
                            onClick={() => handleToggleActive(u)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                              isActive
                                ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <UserX className="w-3.5 h-3.5" /> Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" /> Activate
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Authorized Staff Registry + Direct Assignment */}
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-5">
          <h3 className="text-base font-bold text-[#1D1D1F]">
            Authorized Staff &amp; Administrators ({adminUsers.length})
          </h3>
          <div className="divide-y divide-[#E5E5EA] border-y border-[#E5E5EA]">
            {adminUsers.map((adm) => {
              const cannotTouch =
                adm.uid === user?.uid ||
                adm.email.toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase() ||
                (adm.role === 'super_admin' && !isSuperAdmin);
              return (
                <div key={adm.id} className="py-3 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
                  <div>
                    <p className="font-semibold text-[#1D1D1F]">
                      {adm.displayName} · <span className="text-[#0066CC] uppercase">{adm.role.replace('_', ' ')}</span>
                      {adm.isActive === false && <span className="text-red-600 ml-2">(Deactivated)</span>}
                    </p>
                    <p className="text-xs text-[#6E6E73] font-mono">
                      {adm.email} · {adm.uid}
                    </p>
                  </div>
                  {!cannotTouch && canManageUsers && (
                    <button
                      type="button"
                      onClick={() => setRevokeAdminTarget({ uid: adm.uid, email: adm.email })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50"
                      aria-label={`Remove ${adm.email}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Revoke Staff Access
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {canManageUsers && (
            <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 items-end">
              <div>
                <label className="block text-xs font-semibold mb-1">Firebase UID *</label>
                <input
                  type="text"
                  required
                  value={newAdminUid}
                  onChange={(e) => setNewAdminUid(e.target.value)}
                  placeholder="User UID"
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Google Email *</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="staff@refixpro.in"
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Staff Name"
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Staff Role</label>
                <select
                  value={newAdminRole}
                  onChange={(e) =>
                    setNewAdminRole(e.target.value as 'technician' | 'staff' | 'admin' | 'super_admin')
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs bg-white"
                >
                  <option value="staff">Front-Desk Staff</option>
                  <option value="technician">Technician</option>
                  <option value="admin">Admin</option>
                  {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
              >
                Assign Role
              </button>
            </form>
          )}
        </div>

        {/* Permissions Configuration Modal (Super Admin) */}
        {permModalUser && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E5EA] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-[#E5E5EA] px-6 py-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#0066CC]">Super Admin Permission Matrix</p>
                  <h3 className="text-base font-bold text-[#1D1D1F]">
                    Configure Access for {permModalUser.displayName}
                  </h3>
                  <p className="text-xs text-[#6E6E73] font-mono">{permModalUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPermModalUser(null)}
                  className="p-2 rounded-lg border border-[#D2D2D7] text-[#424245] hover:bg-[#F5F5F7]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wide">
                      Allowed ERP &amp; Website Modules
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setModalPerms((p) => ({ ...p, modules: ALL_ADMIN_MODULES.map((m) => m.id) }))
                        }
                        className="text-[11px] font-semibold text-[#0066CC] hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalPerms(DEFAULT_ADMIN_PERMISSIONS)}
                        className="text-[11px] font-semibold text-[#6E6E73] hover:underline"
                      >
                        Reset Default
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_ADMIN_MODULES.map((mod) => (
                      <label
                        key={mod.id}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E5E5EA] bg-[#F5F5F7]/60 text-xs font-medium cursor-pointer hover:bg-[#F5F5F7]"
                      >
                        <input
                          type="checkbox"
                          checked={modalPerms.modules.includes(mod.id)}
                          onChange={() => toggleModulePerm(mod.id)}
                        />
                        <span>{mod.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-[#E5E5EA]">
                  <p className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wide">
                    Allowed Operation Actions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_PERMISSION_ACTIONS.map((act) => (
                      <label
                        key={act.id}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E5EA] bg-white text-xs font-semibold cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={modalPerms.actions.includes(act.id)}
                          onChange={() => toggleActionPerm(act.id)}
                        />
                        <span>{act.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                  <button
                    type="button"
                    onClick={() => setPermModalUser(null)}
                    className="px-4 py-2 rounded-lg border border-[#D2D2D7] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingPerms}
                    onClick={handleSavePermissions}
                    className="px-5 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-60 text-white text-xs font-semibold"
                  >
                    {savingPerms ? 'Saving...' : 'Save Module Permissions'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={Boolean(revokeAdminTarget)}
          title="Revoke Staff Access?"
          description={`Revoking staff access for ${revokeAdminTarget?.email || ''} will immediately switch their account back to standard Customer Mode.`}
          confirmLabel="Revoke Access"
          destructive
          onCancel={() => setRevokeAdminTarget(null)}
          onConfirm={async () => {
            if (!revokeAdminTarget) return;
            try {
              await removeAdminUser(revokeAdminTarget.uid);
              onNotify('success', 'Staff access revoked; account switched to User Mode.');
            } catch (err) {
              console.error(err);
              onNotify('error', err instanceof Error ? err.message : 'Unable to revoke staff access.');
            } finally {
              setRevokeAdminTarget(null);
            }
          }}
        />
      </div>
    );
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveWebsiteSettings(form);
      onNotify('success', 'Website settings updated across all pages.');
    } catch (err) {
      console.error(err);
      onNotify('error', extractReadableError(err, 'Failed to save website settings.'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryTitle.trim() || !newGalleryUrl.trim()) {
      onNotify('error', 'Title and image are required for gallery items.');
      return;
    }
    try {
      await saveGalleryImage({
        id: `gal-${Date.now().toString(36)}`,
        title: newGalleryTitle.trim(),
        caption: newGalleryCaption.trim(),
        imageUrl: newGalleryUrl.trim(),
        category: newGalleryCategory,
        sortOrder: galleryImages.length + 1,
      });
      setNewGalleryTitle('');
      setNewGalleryCaption('');
      setNewGalleryUrl('');
      onNotify('success', 'Gallery image added.');
    } catch (err) {
      console.error(err);
      onNotify('error', 'Failed to add gallery image.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSettingsSubTab('website')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            settingsSubTab === 'website'
              ? 'bg-[#1D1D1F] text-white'
              : 'bg-white border border-[#E5E5EA] text-[#424245] hover:text-[#1D1D1F]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Website, Hero &amp; Gallery
        </button>
        <button
          type="button"
          onClick={() => setSettingsSubTab('erp')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            settingsSubTab === 'erp'
              ? 'bg-[#1D1D1F] text-white'
              : 'bg-white border border-[#E5E5EA] text-[#424245] hover:text-[#1D1D1F]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          ERP System Config, Health &amp; Backup
        </button>
      </div>

      {settingsSubTab === 'erp' ? (
        <AdminAuditBackupTab mode="system" onNotify={onNotify} />
      ) : (
        <div className="space-y-8">
      <form onSubmit={handleSaveSettings} className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-5">
        <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
          <h2 className="text-lg font-bold text-[#1D1D1F]">Business & Website Settings</h2>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Business Name</label>
            <input
              type="text"
              required
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Phone Number</label>
            <input
              type="text"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">WhatsApp Number</label>
            <input
              type="text"
              required
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Business Hours</label>
            <input
              type="text"
              required
              value={form.businessHours}
              onChange={(e) => setForm({ ...form, businessHours: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Google Rating (0–5)</label>
            <input
              type="number"
              step="0.1"
              min={0}
              max={5}
              value={form.googleRating}
              onChange={(e) => setForm({ ...form, googleRating: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Google Review Count</label>
            <input
              type="number"
              min={0}
              value={form.googleReviewCount}
              onChange={(e) => setForm({ ...form, googleReviewCount: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Business Address</label>
          <input
            type="text"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Logo Upload (PNG/SVG/JPG)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="Optional custom logo URL or upload"
                className="flex-1 px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
              />
              <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#D2D2D7] bg-[#F5F5F7] text-xs font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await compressImageToDataUrl(file, 400, 0.8);
                    setForm({ ...form, logoUrl: url });
                  }}
                />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Google Reviews Profile URL</label>
            <input
              type="text"
              value={form.googleReviewsUrl}
              onChange={(e) => setForm({ ...form, googleReviewsUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="block text-xs font-semibold">
                Google Business Place ID (Optional · Auto-Detected via Places API)
              </label>
              {googleLiveProfile.placeId && form.googlePlaceId !== googleLiveProfile.placeId && (
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, googlePlaceId: googleLiveProfile.placeId || '' })
                  }
                  className="text-[11px] font-semibold text-[#0066CC] hover:underline"
                >
                  Use Detected ID ({googleLiveProfile.placeId.slice(0, 14)}...)
                </button>
              )}
            </div>
            <input
              type="text"
              value={form.googlePlaceId || ''}
              onChange={(e) => setForm({ ...form, googlePlaceId: e.target.value })}
              placeholder={
                googleLiveProfile.placeId
                  ? `Auto-detected: ${googleLiveProfile.placeId}`
                  : 'Leave blank to auto-connect Refix Pro (SCF-92,SECTOR-14 MAIN MARKET, Gurugram)'
              }
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F5F5F7]">
          <div>
            <label className="block text-xs font-semibold mb-1">Homepage Hero Headline</label>
            <input
              type="text"
              required
              value={form.heroHeadline}
              onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Fallback Hero Image URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.heroImageUrl}
                onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
              />
              <label className="px-3 py-2 rounded-lg border border-[#D2D2D7] bg-[#F5F5F7] text-xs font-semibold cursor-pointer">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await compressImageToDataUrl(file, 1000, 0.75);
                    setForm({ ...form, heroImageUrl: url });
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Homepage Hero Subheadline</label>
          <textarea
            rows={2}
            required
            value={form.heroSubheadline}
            onChange={(e) => setForm({ ...form, heroSubheadline: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
          />
        </div>

        {/* Hero Section Image Slider Manager */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#F5F5F7]/70 border border-[#E5E5EA] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#0066CC]" />
                Home Hero Image Slider ({(form.heroSlides || []).length} Slides)
              </h3>
              <p className="text-xs text-[#6E6E73]">
                Upload, edit, reorder, or remove images shown in the Home Page hero slider. Click &ldquo;Save Settings&rdquo; above to publish changes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextSlides = [...(form.heroSlides || [])];
                nextSlides.push({
                  id: `slide-${Date.now().toString(36)}`,
                  title: 'New Refix Pro Studio Slide',
                  subtitle: 'SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007',
                  imageUrl: form.heroImageUrl || '',
                });
                setForm({ ...form, heroSlides: nextSlides });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Hero Slide
            </button>
          </div>

          <div className="space-y-3">
            {(form.heroSlides || []).map((slide, idx) => (
              <div
                key={slide.id || idx}
                className="p-4 rounded-xl bg-white border border-[#E5E5EA] grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
              >
                <div className="md:col-span-3 aspect-[16/10] rounded-lg overflow-hidden bg-[#F5F5F7] border border-[#E5E5EA]">
                  {slide.imageUrl ? (
                    <img
                      src={slide.imageUrl}
                      alt={slide.title || `Hero slide ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[11px] text-[#6E6E73]">
                      No Image
                    </div>
                  )}
                </div>

                <div className="md:col-span-7 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">
                        Slide {idx + 1} Title
                      </label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => {
                          const next = [...(form.heroSlides || [])];
                          next[idx] = { ...slide, title: e.target.value };
                          setForm({ ...form, heroSlides: next });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#D2D2D7] text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6E73] mb-1">
                        Slide Subtitle
                      </label>
                      <input
                        type="text"
                        value={slide.subtitle}
                        onChange={(e) => {
                          const next = [...(form.heroSlides || [])];
                          next[idx] = { ...slide, subtitle: e.target.value };
                          setForm({ ...form, heroSlides: next });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#D2D2D7] text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slide.imageUrl}
                      onChange={(e) => {
                        const next = [...(form.heroSlides || [])];
                        next[idx] = { ...slide, imageUrl: e.target.value };
                        setForm({ ...form, heroSlides: next });
                      }}
                      placeholder="Paste image URL or upload file..."
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#D2D2D7] text-xs font-mono"
                    />
                    <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D2D2D7] bg-[#F5F5F7] hover:bg-[#E5E5EA]/70 text-xs font-semibold cursor-pointer whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = await compressImageToDataUrl(file, 1200, 0.75);
                          const next = [...(form.heroSlides || [])];
                          next[idx] = { ...slide, imageUrl: url };
                          setForm({ ...form, heroSlides: next });
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2 flex md:flex-col items-center justify-end gap-1.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => {
                      const next = [...(form.heroSlides || [])];
                      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                      setForm({ ...form, heroSlides: next });
                    }}
                    aria-label="Move slide up"
                    className="p-1.5 rounded-lg border border-[#D2D2D7] hover:bg-[#F5F5F7] disabled:opacity-40"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === (form.heroSlides || []).length - 1}
                    onClick={() => {
                      const next = [...(form.heroSlides || [])];
                      [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                      setForm({ ...form, heroSlides: next });
                    }}
                    aria-label="Move slide down"
                    className="p-1.5 rounded-lg border border-[#D2D2D7] hover:bg-[#F5F5F7] disabled:opacity-40"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = (form.heroSlides || []).filter((_, i) => i !== idx);
                      setForm({ ...form, heroSlides: next });
                    }}
                    aria-label="Remove slide"
                    className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Default SEO Title</label>
            <input
              type="text"
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Default SEO Meta Description</label>
            <input
              type="text"
              value={form.seoDescription}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Business & Google Profile Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Gurugram SEO Keywords</label>
            <input
              type="text"
              value={form.seoKeywords}
              onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Footer Business Description</label>
          <textarea
            rows={2}
            value={form.footerDescription}
            onChange={(e) => setForm({ ...form, footerDescription: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
          />
        </div>

        {/* Social Media Channels (Editable by Admin) */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#F5F5F7]/70 border border-[#E5E5EA] space-y-3">
          <div>
            <h3 className="text-sm font-bold text-[#1D1D1F]">
              Social Media Links (Footer, Contact & Home)
            </h3>
            <p className="text-xs text-[#6E6E73]">
              Paste your official profile URLs below, or leave any field blank to hide that social icon.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Instagram URL</label>
              <input
                type="url"
                value={form.socialInstagram || ''}
                onChange={(e) => setForm({ ...form, socialInstagram: e.target.value })}
                placeholder="https://instagram.com/refixpro.in"
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Facebook URL</label>
              <input
                type="url"
                value={form.socialFacebook || ''}
                onChange={(e) => setForm({ ...form, socialFacebook: e.target.value })}
                placeholder="https://facebook.com/refixpro.in"
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">YouTube URL</label>
              <input
                type="url"
                value={form.socialYoutube || ''}
                onChange={(e) => setForm({ ...form, socialYoutube: e.target.value })}
                placeholder="https://youtube.com/@refixpro"
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">X / Twitter URL</label>
              <input
                type="url"
                value={form.socialTwitter || ''}
                onChange={(e) => setForm({ ...form, socialTwitter: e.target.value })}
                placeholder="https://x.com/refixpro_in"
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={form.socialLinkedin || ''}
                onChange={(e) => setForm({ ...form, socialLinkedin: e.target.value })}
                placeholder="https://linkedin.com/company/refixpro"
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Gallery Management */}
      <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-5">
        <h3 className="text-base font-bold text-[#1D1D1F]">Workstation Gallery Management ({galleryImages.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryImages.map((g) => (
            <div key={g.id} className="rounded-xl border border-[#E5E5EA] overflow-hidden">
              <img src={g.imageUrl} alt={g.title} className="w-full h-36 object-cover" />
              <div className="p-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#1D1D1F]">{g.title}</p>
                  <p className="text-[11px] text-[#6E6E73]">{g.category}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteGalleryTarget({ id: g.id, title: g.title })}
                  className="text-red-600 p-1 hover:bg-red-50 rounded-lg"
                  aria-label={`Delete ${g.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddGallery} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E5E5EA] items-end">
          <div>
            <label className="block text-xs font-semibold mb-1">Photo Title *</label>
            <input
              type="text"
              required
              value={newGalleryTitle}
              onChange={(e) => setNewGalleryTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Category</label>
            <input
              type="text"
              value={newGalleryCategory}
              onChange={(e) => setNewGalleryCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Caption</label>
            <input
              type="text"
              value={newGalleryCaption}
              onChange={(e) => setNewGalleryCaption(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
            />
          </div>
          <div className="flex gap-2">
            <label className="px-3 py-2 rounded-lg border border-[#D2D2D7] bg-[#F5F5F7] text-xs font-semibold cursor-pointer whitespace-nowrap">
              {newGalleryUrl ? 'Image Ready' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await compressImageToDataUrl(file, 900, 0.72);
                  setNewGalleryUrl(url);
                }}
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={Boolean(deleteGalleryTarget)}
        title="Delete Gallery Image?"
        description={`Remove "${deleteGalleryTarget?.title || ''}" from the About & Workstation gallery?`}
        confirmLabel="Delete Image"
        destructive
        onCancel={() => setDeleteGalleryTarget(null)}
        onConfirm={async () => {
          if (!deleteGalleryTarget) return;
          try {
            await deleteGalleryImage(deleteGalleryTarget.id);
            onNotify('success', 'Gallery image deleted.');
          } catch (err) {
            console.error(err);
            onNotify('error', 'Failed to delete gallery image.');
          } finally {
            setDeleteGalleryTarget(null);
          }
        }}
      />
        </div>
      )}
    </div>
  );
}
