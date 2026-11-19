import { useEffect, useMemo, useState } from 'react';
import { Calendar, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useErp } from '../../context/ErpContext';
import { extractReadableError } from '../../lib/firebase';
import { ConfirmDialog } from '../ConfirmDialog';
import { EmptyState, PaginationBar, StatusBadge } from '../ui/DesignSystem';
import type { AppointmentRecord, TechnicianProfile } from '../../types';

const PAGE_SIZE = 12;

const EMPTY_APPT: Omit<AppointmentRecord, 'createdAt' | 'updatedAt'> = {
  id: '',
  appointmentCode: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerUid: '',
  macbookModel: '',
  serviceType: '',
  scheduledDate: new Date().toISOString().slice(0, 10),
  scheduledSlot: '11:00 AM',
  technicianUid: '',
  technicianName: '',
  status: 'Scheduled',
  notes: '',
  reminderSent: false,
};

const EMPTY_TECH: Omit<TechnicianProfile, 'createdAt' | 'updatedAt'> = {
  id: '',
  uid: '',
  name: '',
  email: '',
  phone: '',
  specialization: 'Apple Logic Board & Hardware',
  availability: 'Available',
  notes: '',
  isActive: true,
};

export function AdminStaffAppointmentsTab({
  mode,
  onNotify,
}: {
  mode: 'appointments' | 'technicians';
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const { hasPermission, isAdmin, isFrontDeskStaff } = useApp();
  const {
    appointments,
    technicians,
    repairJobs,
    saveAppointment,
    deleteAppointment,
    saveTechnician,
    deleteTechnician,
  } = useErp();

  const [viewWindow, setViewWindow] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [apptSearch, setApptSearch] = useState('');
  const [apptPage, setApptPage] = useState(1);
  const [editingAppt, setEditingAppt] = useState<Omit<AppointmentRecord, 'createdAt' | 'updatedAt'> | null>(null);
  const [isNewAppt, setIsNewAppt] = useState(false);
  const [deleteAppt, setDeleteAppt] = useState<AppointmentRecord | null>(null);

  const [editingTech, setEditingTech] = useState<Omit<TechnicianProfile, 'createdAt' | 'updatedAt'> | null>(null);
  const [isNewTech, setIsNewTech] = useState(false);
  const [deleteTech, setDeleteTech] = useState<TechnicianProfile | null>(null);
  const [saving, setSaving] = useState(false);

  const canManageAppointments = isAdmin || isFrontDeskStaff;
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthPrefix = todayStr.slice(0, 7);

  const filteredAppointments = useMemo(() => {
    const q = apptSearch.trim().toLowerCase();
    const base =
      viewWindow === 'today'
        ? appointments.filter((a) => a.scheduledDate === todayStr)
        : viewWindow === 'week'
          ? (() => {
              const now = Date.now();
              const plus7 = now + 7 * 86400000;
              return appointments.filter((a) => {
                const ms = Date.parse(a.scheduledDate);
                return !Number.isNaN(ms) && ms >= now - 86400000 && ms <= plus7;
              });
            })()
          : viewWindow === 'month'
            ? appointments.filter((a) => (a.scheduledDate || '').startsWith(monthPrefix))
            : appointments;

    if (!q) return base;
    return base.filter(
      (a) =>
        a.appointmentCode.toLowerCase().includes(q) ||
        a.customerName.toLowerCase().includes(q) ||
        a.customerPhone.toLowerCase().includes(q) ||
        a.macbookModel.toLowerCase().includes(q) ||
        (a.technicianName || '').toLowerCase().includes(q)
    );
  }, [appointments, viewWindow, apptSearch, todayStr, monthPrefix]);

  useEffect(() => {
    setApptPage(1);
  }, [viewWindow, apptSearch]);

  const apptTotalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  const paginatedAppointments = useMemo(
    () => filteredAppointments.slice((apptPage - 1) * PAGE_SIZE, apptPage * PAGE_SIZE),
    [filteredAppointments, apptPage]
  );

  if (mode === 'technicians') {
    const handleSaveTech = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTech || !editingTech.name.trim() || !editingTech.email.trim()) {
        onNotify('error', 'Technician name and email are required.');
        return;
      }
      setSaving(true);
      try {
        await saveTechnician(editingTech, isNewTech);
        setEditingTech(null);
        onNotify('success', 'Technician profile saved.');
      } catch (err) {
        onNotify('error', extractReadableError(err, 'Failed to save technician profile.'));
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#1D1D1F] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0066CC]" />
              Workshop Technicians ({technicians.length})
            </h2>
            <p className="text-xs text-[#6E6E73]">
              Link Firebase UIDs for Staff Technician role logins to route assigned Repair Job Cards and measure turnaround.
            </p>
          </div>
          {hasPermission('technicians', 'create') && (
            <button
              type="button"
              onClick={() => {
                setIsNewTech(true);
                setEditingTech({ ...EMPTY_TECH });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add Technician
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {technicians.map((tech) => {
            const jobs = repairJobs.filter((j) => j.technicianName === tech.name || (tech.uid && j.technicianUid === tech.uid));
            const active = jobs.filter((j) => !['Completed', 'Delivered', 'Cancelled Repair', 'Rejected Estimate'].includes(j.status));
            const done = jobs.filter((j) => ['Completed', 'Delivered', 'Ready for Delivery'].includes(j.status));
            return (
              <div key={tech.id} className="p-5 rounded-2xl bg-white border border-[#E5E5EA] space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#1D1D1F]">{tech.name}</h3>
                    <p className="text-xs text-[#0066CC] font-semibold">{tech.specialization}</p>
                    <p className="text-xs font-mono text-[#6E6E73] mt-0.5">{tech.email}</p>
                  </div>
                  <StatusBadge
                    label={tech.availability}
                    tone={
                      tech.availability === 'Available'
                        ? 'success'
                        : tech.availability === 'Busy'
                          ? 'warning'
                          : 'neutral'
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#F5F5F7] text-center text-xs">
                  <div>
                    <p className="text-[#6E6E73]">Active</p>
                    <p className="font-mono font-bold text-[#0066CC] text-base">{active.length}</p>
                  </div>
                  <div>
                    <p className="text-[#6E6E73]">Completed</p>
                    <p className="font-mono font-bold text-emerald-700 text-base">{done.length}</p>
                  </div>
                  <div>
                    <p className="text-[#6E6E73]">Total</p>
                    <p className="font-mono font-bold text-[#1D1D1F] text-base">{jobs.length}</p>
                  </div>
                </div>

                {tech.notes && <p className="text-xs text-[#424245]">{tech.notes}</p>}

                <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA]">
                  <span className="text-[11px] font-mono text-[#6E6E73]">
                    {tech.uid ? `UID: ${tech.uid.slice(0, 10)}...` : 'No UID linked'}
                  </span>
                  <div className="flex gap-2">
                    {hasPermission('technicians', 'edit') && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewTech(false);
                          setEditingTech({ ...tech });
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#D2D2D7] text-xs font-semibold hover:bg-[#F5F5F7]"
                      >
                        Edit
                      </button>
                    )}
                    {hasPermission('technicians', 'delete') && (
                      <button
                        type="button"
                        onClick={() => setDeleteTech(tech)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                        aria-label={`Delete ${tech.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {technicians.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3">
              <EmptyState
                title="No workshop technicians added yet"
                description="Add bench technicians and link their Firebase UIDs to route Repair Job Cards."
                icon={<Users className="w-5 h-5" />}
              />
            </div>
          )}
        </div>

        {editingTech && (
          <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveTech}
              className="bg-white rounded-2xl border border-[#E5E5EA] max-w-lg w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
                <h3 className="text-lg font-bold text-[#1D1D1F]">
                  {isNewTech ? 'Add Workshop Technician' : `Edit ${editingTech.name}`}
                </h3>
                <button type="button" onClick={() => setEditingTech(null)} className="p-1 rounded-lg hover:bg-[#F5F5F7]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingTech.name}
                    onChange={(e) => setEditingTech({ ...editingTech, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={editingTech.email}
                    onChange={(e) => setEditingTech({ ...editingTech, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingTech.phone}
                    onChange={(e) => setEditingTech({ ...editingTech, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Availability</label>
                  <select
                    value={editingTech.availability}
                    onChange={(e) =>
                      setEditingTech({ ...editingTech, availability: e.target.value as TechnicianProfile['availability'] })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white"
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Specialization</label>
                  <input
                    type="text"
                    value={editingTech.specialization}
                    onChange={(e) => setEditingTech({ ...editingTech, specialization: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Firebase User UID (for Technician Portal login)</label>
                  <input
                    type="text"
                    value={editingTech.uid || ''}
                    onChange={(e) => setEditingTech({ ...editingTech, uid: e.target.value })}
                    placeholder="Copy UID from Users & Permissions tab"
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Internal Bench Notes</label>
                  <textarea
                    rows={2}
                    value={editingTech.notes}
                    onChange={(e) => setEditingTech({ ...editingTech, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
                <button type="button" onClick={() => setEditingTech(null)} className="px-4 py-2 rounded-lg border border-[#D2D2D7] text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold">
                  {saving ? 'Saving...' : 'Save Technician'}
                </button>
              </div>
            </form>
          </div>
        )}

        <ConfirmDialog
          open={Boolean(deleteTech)}
          title={`Remove Technician ${deleteTech?.name}?`}
          description="Removes this technician from the active roster."
          confirmLabel="Remove"
          onCancel={() => setDeleteTech(null)}
          onConfirm={async () => {
            if (!deleteTech) return;
            try {
              await deleteTechnician(deleteTech.id);
              setDeleteTech(null);
              onNotify('success', 'Technician removed.');
            } catch (err) {
              onNotify('error', extractReadableError(err, 'Failed to remove technician.'));
            }
          }}
        />
      </div>
    );
  }

  // APPOINTMENTS SCHEDULE VIEW
  const handleSaveAppt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppt || !editingAppt.customerName.trim() || !editingAppt.scheduledDate) {
      onNotify('error', 'Customer name and scheduled date are required.');
      return;
    }
    setSaving(true);
    try {
      await saveAppointment(editingAppt, isNewAppt);
      setEditingAppt(null);
      onNotify('success', 'Appointment saved.');
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to save appointment.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-[#D2D2D7] bg-white p-1">
            {([
              { id: 'all', label: 'All Bookings' },
              { id: 'today', label: 'Daily (Today)' },
              { id: 'week', label: 'Weekly (7 Days)' },
              { id: 'month', label: 'Monthly' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewWindow(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewWindow === tab.id ? 'bg-[#0F172A] text-white' : 'text-[#424245]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={apptSearch}
              onChange={(e) => setApptSearch(e.target.value)}
              placeholder="Search code, customer, phone..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm"
            />
          </div>
        </div>

        {canManageAppointments && hasPermission('appointments', 'create') && (
          <button
            type="button"
            onClick={() => {
              setIsNewAppt(true);
              setEditingAppt({ ...EMPTY_APPT });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold shrink-0"
          >
            <Plus className="w-4 h-4" />
            Schedule Appointment
          </button>
        )}
      </div>

      {filteredAppointments.length === 0 ? (
        <EmptyState
          title="No appointments in this view"
          description="Try another date window, clear the search query, or schedule a new walk-in slot."
          icon={<Calendar className="w-5 h-5" />}
        />
      ) : (
        <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7] text-xs font-semibold text-[#424245]">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Date &amp; Slot</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Device &amp; Service</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA] text-xs sm:text-sm">
                {paginatedAppointments.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F5F5F7]/60">
                    <td className="py-3 px-4 font-mono font-bold text-[#0066CC] whitespace-nowrap">
                      {a.appointmentCode}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-mono font-semibold text-[#1D1D1F]">{a.scheduledDate}</p>
                      <p className="text-xs text-[#6E6E73]">{a.scheduledSlot}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#1D1D1F]">{a.customerName}</p>
                      <p className="text-xs font-mono text-[#6E6E73]">{a.customerPhone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#1D1D1F]">{a.macbookModel}</p>
                      <p className="text-xs text-[#6E6E73]">{a.serviceType}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#424245]">{a.technicianName || 'Desk Counter'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge label={a.status} />
                      {a.reminderSent && <p className="text-[11px] text-emerald-700 mt-1">Reminder sent</p>}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      {canManageAppointments && (
                        <>
                          {hasPermission('appointments', 'edit') && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsNewAppt(false);
                                setEditingAppt({ ...a });
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
                            >
                              Manage
                            </button>
                          )}
                          {hasPermission('appointments', 'delete') && (
                            <button
                              type="button"
                              onClick={() => setDeleteAppt(a)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 align-middle"
                              aria-label={`Delete appointment ${a.appointmentCode}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={apptPage}
            totalPages={apptTotalPages}
            totalItems={filteredAppointments.length}
            pageSize={PAGE_SIZE}
            onPageChange={setApptPage}
          />
        </div>
      )}

      {editingAppt && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveAppt}
            className="bg-white rounded-2xl border border-[#E5E5EA] max-w-xl w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="text-lg font-bold text-[#1D1D1F] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0066CC]" />
                {isNewAppt ? 'Schedule Studio Appointment' : editingAppt.appointmentCode}
              </h3>
              <button type="button" onClick={() => setEditingAppt(null)} className="p-1 rounded-lg hover:bg-[#F5F5F7]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={editingAppt.customerName}
                  onChange={(e) => setEditingAppt({ ...editingAppt, customerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Phone *</label>
                <input
                  type="text"
                  required
                  value={editingAppt.customerPhone}
                  onChange={(e) => setEditingAppt({ ...editingAppt, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">MacBook / Apple Model *</label>
                <input
                  type="text"
                  required
                  value={editingAppt.macbookModel}
                  onChange={(e) => setEditingAppt({ ...editingAppt, macbookModel: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Service Type *</label>
                <input
                  type="text"
                  required
                  value={editingAppt.serviceType}
                  onChange={(e) => setEditingAppt({ ...editingAppt, serviceType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Scheduled Date *</label>
                <input
                  type="date"
                  required
                  value={editingAppt.scheduledDate}
                  onChange={(e) => setEditingAppt({ ...editingAppt, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Time Slot</label>
                <select
                  value={editingAppt.scheduledSlot}
                  onChange={(e) => setEditingAppt({ ...editingAppt, scheduledSlot: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white"
                >
                  {['11:00 AM', '12:30 PM', '02:00 PM', '03:30 PM', '05:00 PM', '06:30 PM'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Assign Technician</label>
                <select
                  value={editingAppt.technicianName || ''}
                  onChange={(e) => {
                    const tech = technicians.find((t) => t.name === e.target.value);
                    setEditingAppt({
                      ...editingAppt,
                      technicianName: tech ? tech.name : e.target.value,
                      technicianUid: tech?.uid || '',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white"
                >
                  <option value="">Desk Counter</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select
                  value={editingAppt.status}
                  onChange={(e) =>
                    setEditingAppt({ ...editingAppt, status: e.target.value as AppointmentRecord['status'] })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAppt.reminderSent}
                    onChange={(e) => setEditingAppt({ ...editingAppt, reminderSent: e.target.checked })}
                  />
                  Mark Customer WhatsApp/SMS Reminder Sent
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editingAppt.notes}
                  onChange={(e) => setEditingAppt({ ...editingAppt, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
              <button type="button" onClick={() => setEditingAppt(null)} className="px-4 py-2 rounded-lg border border-[#D2D2D7] text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold">
                {saving ? 'Saving...' : 'Save Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteAppt)}
        title={`Cancel & Delete ${deleteAppt?.appointmentCode}?`}
        description="Permanently removes this appointment slot from the calendar."
        confirmLabel="Delete"
        onCancel={() => setDeleteAppt(null)}
        onConfirm={async () => {
          if (!deleteAppt) return;
          try {
            await deleteAppointment(deleteAppt.id);
            setDeleteAppt(null);
            onNotify('success', 'Appointment deleted.');
          } catch (err) {
            onNotify('error', extractReadableError(err, 'Failed to delete appointment.'));
          }
        }}
      />
    </div>
  );
}
