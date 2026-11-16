import { useState } from 'react';
import { Edit3, Plus, Trash2, X } from 'lucide-react';
import { slugify, useApp } from '../../context/AppContext';
import {
  MACBOOK_CATEGORIES,
  MacBookCategory,
  MacBookModelItem,
  SERVICE_CATEGORIES,
  ServiceCategory,
  ServiceItem,
} from '../../types';
import { compressImageToDataUrl } from '../../utils/whatsapp';
import { IMG_HERO_PRO } from '../../data/seedServicesAndModels';

export function AdminServicesAndModelsTab({
  mode,
  onNotify,
}: {
  mode: 'services' | 'models';
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const {
    adminServices,
    services,
    adminModels,
    models,
    saveService,
    deleteService,
    saveMacBookModel,
    deleteMacBookModel,
  } = useApp();

  const activeServiceList = adminServices.length > 0 ? adminServices : services;
  const activeModelList = adminModels.length > 0 ? adminModels : models;

  const [editingService, setEditingService] = useState<Omit<ServiceItem, 'updatedAt'> | null>(null);
  const [symptomsInput, setSymptomsInput] = useState('');
  const [editingModel, setEditingModel] = useState<Omit<MacBookModelItem, 'updatedAt'> | null>(null);
  const [issuesInput, setIssuesInput] = useState('');
  const [saving, setSaving] = useState(false);

  const openNewService = () => {
    setEditingService({
      id: `srv-${Date.now().toString(36)}`,
      title: '',
      slug: '',
      category: SERVICE_CATEGORIES[0],
      shortDescription: '',
      repairInfo: '',
      symptoms: [],
      imageUrl: IMG_HERO_PRO,
      priceDisplay: 'Estimate after inspection',
      showPrice: false,
      isActive: true,
      sortOrder: activeServiceList.length + 1,
    });
    setSymptomsInput('');
  };

  const openEditService = (s: ServiceItem) => {
    setEditingService({ ...s });
    setSymptomsInput(s.symptoms.join(', '));
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setSaving(true);
    try {
      await saveService({
        ...editingService,
        slug: slugify(editingService.slug || editingService.title),
        symptoms: symptomsInput.split(',').map((x) => x.trim()).filter(Boolean),
      });
      onNotify('success', `Saved service "${editingService.title}".`);
      setEditingService(null);
    } catch (err) {
      console.error(err);
      onNotify('error', 'Failed to save service.');
    } finally {
      setSaving(false);
    }
  };

  const openNewModel = () => {
    setEditingModel({
      id: `mdl-${Date.now().toString(36)}`,
      category: MACBOOK_CATEGORIES[0],
      name: '',
      yearRange: '',
      processor: '',
      modelIdentifiers: '',
      commonIssues: [],
      availabilityNote: 'Compatibility confirmed by technician upon inspection.',
      isActive: true,
    });
    setIssuesInput('');
  };

  const openEditModel = (m: MacBookModelItem) => {
    setEditingModel({ ...m });
    setIssuesInput(m.commonIssues.join(', '));
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModel) return;
    setSaving(true);
    try {
      await saveMacBookModel({
        ...editingModel,
        commonIssues: issuesInput.split(',').map((x) => x.trim()).filter(Boolean),
      });
      onNotify('success', `Saved model "${editingModel.name}".`);
      setEditingModel(null);
    } catch (err) {
      console.error(err);
      onNotify('error', 'Failed to save MacBook model.');
    } finally {
      setSaving(false);
    }
  };

  if (mode === 'models') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1D1D1F]">Supported MacBook Models ({activeModelList.length})</h2>
          <button
            type="button"
            onClick={openNewModel}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Model
          </button>
        </div>

        <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7] text-xs font-semibold text-[#424245]">
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Processor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA] text-xs sm:text-sm">
              {activeModelList.map((m) => (
                <tr key={m.id} className="hover:bg-[#F5F5F7]/60">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-[#1D1D1F]">{m.name}</p>
                    <p className="text-xs text-[#6E6E73] font-mono">{m.yearRange}</p>
                  </td>
                  <td className="py-3 px-4 text-[#424245]">{m.category}</td>
                  <td className="py-3 px-4 font-mono text-xs text-[#424245]">{m.processor}</td>
                  <td className="py-3 px-4">{m.isActive ? 'Active' : 'Hidden'}</td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEditModel(m)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D2D2D7] text-xs font-semibold hover:bg-[#F5F5F7]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteMacBookModel(m.id);
                        onNotify('success', 'Model deleted.');
                      }}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                      aria-label={`Delete ${m.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingModel && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveModel}
              className="bg-white rounded-2xl border border-[#E5E5EA] max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Edit MacBook Model</h3>
                <button type="button" onClick={() => setEditingModel(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Category</label>
                  <select
                    value={editingModel.category}
                    onChange={(e) => setEditingModel({ ...editingModel, category: e.target.value as MacBookCategory })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm bg-white"
                  >
                    {MACBOOK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Year Range</label>
                  <input
                    type="text"
                    required
                    value={editingModel.yearRange}
                    onChange={(e) => setEditingModel({ ...editingModel, yearRange: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Model Name</label>
                <input
                  type="text"
                  required
                  value={editingModel.name}
                  onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Processor</label>
                  <input
                    type="text"
                    required
                    value={editingModel.processor}
                    onChange={(e) => setEditingModel({ ...editingModel, processor: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Model Identifiers</label>
                  <input
                    type="text"
                    value={editingModel.modelIdentifiers}
                    onChange={(e) => setEditingModel({ ...editingModel, modelIdentifiers: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Common Issues (comma-separated)</label>
                <input
                  type="text"
                  value={issuesInput}
                  onChange={(e) => setIssuesInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Availability Note</label>
                <textarea
                  rows={2}
                  value={editingModel.availabilityNote}
                  onChange={(e) => setEditingModel({ ...editingModel, availabilityNote: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={editingModel.isActive}
                  onChange={(e) => setEditingModel({ ...editingModel, isActive: e.target.checked })}
                />
                Visible on MacBook Models Page
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingModel(null)} className="px-4 py-2 rounded-lg border border-[#D2D2D7] text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold">
                  {saving ? 'Saving...' : 'Save Model'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1D1D1F]">MacBook Repair Services ({activeServiceList.length})</h2>
        <button
          type="button"
          onClick={openNewService}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7] text-xs font-semibold text-[#424245]">
              <th className="py-3 px-4">Service Title</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Price Display</th>
              <th className="py-3 px-4">Visibility</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5EA] text-xs sm:text-sm">
            {activeServiceList.map((srv) => (
              <tr key={srv.id} className="hover:bg-[#F5F5F7]/60">
                <td className="py-3 px-4 font-semibold text-[#1D1D1F]">{srv.title}</td>
                <td className="py-3 px-4 text-[#424245]">{srv.category}</td>
                <td className="py-3 px-4 text-xs text-[#6E6E73]">
                  {srv.showPrice ? srv.priceDisplay : 'Hidden (After Inspection)'}
                </td>
                <td className="py-3 px-4">{srv.isActive ? 'Enabled' : 'Disabled'}</td>
                <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => openEditService(srv)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D2D2D7] text-xs font-semibold hover:bg-[#F5F5F7]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteService(srv.id);
                      onNotify('success', 'Service deleted.');
                    }}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${srv.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveService}
            className="bg-white rounded-2xl border border-[#E5E5EA] max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Manage Service</h3>
              <button type="button" onClick={() => setEditingService(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={editingService.title}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Category *</label>
                <select
                  value={editingService.category}
                  onChange={(e) =>
                    setEditingService({ ...editingService, category: e.target.value as ServiceCategory })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm bg-white"
                >
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Short Description *</label>
              <textarea
                rows={2}
                required
                value={editingService.shortDescription}
                onChange={(e) => setEditingService({ ...editingService, shortDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Repair Information *</label>
              <textarea
                rows={3}
                required
                value={editingService.repairInfo}
                onChange={(e) => setEditingService({ ...editingService, repairInfo: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Common Symptoms (comma-separated)</label>
              <input
                type="text"
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Price Display Label</label>
                <input
                  type="text"
                  value={editingService.priceDisplay}
                  onChange={(e) => setEditingService({ ...editingService, priceDisplay: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Sort Order</label>
                <input
                  type="number"
                  value={editingService.sortOrder}
                  onChange={(e) => setEditingService({ ...editingService, sortOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Service Image URL or Upload</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingService.imageUrl}
                  onChange={(e) => setEditingService({ ...editingService, imageUrl: e.target.value })}
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
                      const url = await compressImageToDataUrl(file, 800, 0.72);
                      setEditingService({ ...editingService, imageUrl: url });
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-5 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={editingService.showPrice}
                  onChange={(e) => setEditingService({ ...editingService, showPrice: e.target.checked })}
                />
                Show Price on Website
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={editingService.isActive}
                  onChange={(e) => setEditingService({ ...editingService, isActive: e.target.checked })}
                />
                Service Enabled
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingService(null)} className="px-4 py-2 rounded-lg border border-[#D2D2D7] text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold">
                {saving ? 'Saving...' : 'Save Service'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
