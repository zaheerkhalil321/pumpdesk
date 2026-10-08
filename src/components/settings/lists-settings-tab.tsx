'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Info,
  Star,
  MoreHorizontal,
  X,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppSelect } from '@/components/ui/app-select';
import {
  useSettingsStore,
  togglePourTypeFavorite,
  addSupplier,
  updateSupplier,
  addPourType,
  updatePourType,
  addTag,
  updateTag,
  ConcreteSupplier,
  PourTypeSetting,
  TagSetting,
} from '@/lib/settings-store';
import { toast } from 'sonner';

export function ListsSettingsTab() {
  const { suppliers, pourTypes, tags } = useSettingsStore();

  const [activeSubTab, setActiveSubTab] = useState<'suppliers' | 'pourTypes' | 'tags' | 'inventory'>('suppliers');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [sortOrder, setSortOrder] = useState<'favorites' | 'alphabetical'>('favorites');

  // Supplier Modals
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ConcreteSupplier | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');

  // Pour Type Modals
  const [isAddPourOpen, setIsAddPourOpen] = useState(false);
  const [editingPour, setEditingPour] = useState<PourTypeSetting | null>(null);
  const [pourTypeName, setPourTypeName] = useState('');

  // Tag Modals
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagSetting | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagUsedOn, setTagUsedOn] = useState('Orders');
  const [tagColor, setTagColor] = useState<'amber' | 'fuchsia' | 'blue' | 'teal' | 'slate'>('teal');

  // Filters
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ? true : s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedPourTypes = [...pourTypes]
    .filter((pt) => {
      const matchesSearch = pt.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'All' ? true : pt.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === 'favorites') {
        if (a.favorite === b.favorite) return a.name.localeCompare(b.name);
        return a.favorite ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

  const filteredTags = tags.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.usedOn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ? true : t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getTagColorClass = (color: TagSetting['color']) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'fuchsia':
        return 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300';
      case 'blue':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'teal':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'slate':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Sub-tabs Header & Action Button ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <nav className="flex space-x-6">
          {[
            { id: 'suppliers' as const, label: 'Concrete suppliers' },
            { id: 'pourTypes' as const, label: 'Pour types' },
            { id: 'tags' as const, label: 'Tags' },
            { id: 'inventory' as const, label: 'Inventory' },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSubTab(tab.id);
                  setSearchQuery('');
                }}
                className={cn(
                  'pb-3 text-sm font-semibold transition-colors relative cursor-pointer -mb-3',
                  isActive
                    ? 'text-brand'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {activeSubTab === 'suppliers' && (
          <button
            type="button"
            onClick={() => setIsAddSupplierOpen(true)}
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-xs font-semibold text-white shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add supplier
          </button>
        )}

        {activeSubTab === 'pourTypes' && (
          <button
            type="button"
            onClick={() => setIsAddPourOpen(true)}
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-xs font-semibold text-white shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add pour type
          </button>
        )}

        {activeSubTab === 'tags' && (
          <button
            type="button"
            onClick={() => setIsAddTagOpen(true)}
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-xs font-semibold text-white shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add tag
          </button>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUBTAB 1: CONCRETE SUPPLIERS (matches settings-lists 1.png)*/}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suppliers"
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand shadow-2xs"
              />
            </div>

            <AppSelect
              value={`Status: ${statusFilter}`}
              onChange={(val) =>
                setStatusFilter(val.replace('Status: ', '') as 'All' | 'Active' | 'Inactive')
              }
              options={[
                { value: 'Status: All', label: 'Status: All' },
                { value: 'Status: Active', label: 'Status: Active' },
                { value: 'Status: Inactive', label: 'Status: Inactive' },
              ]}
              className="w-36 h-10 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <p className="text-xs text-slate-500 font-medium">
            {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''}
          </p>

          <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-semibold">
                    <th className="py-3 px-4 sm:px-6">Supplier</th>
                    <th className="py-3 px-4 sm:px-6">Dispatch phone</th>
                    <th className="py-3 px-4 sm:px-6">Email</th>
                    <th className="py-3 px-4 sm:px-6">Status</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      onClick={() => setEditingSupplier(supplier)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900 group-hover:text-brand transition-colors">
                        {supplier.name}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                        {supplier.phone}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                        {supplier.email}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            supplier.status === 'Active'
                              ? 'bg-brand text-white shadow-2xs'
                              : 'bg-slate-200 text-slate-700'
                          )}
                        >
                          {supplier.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSupplier(supplier);
                            }}
                            className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer active:scale-95"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info(`Options for ${supplier.name}`);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Info className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Suppliers are available when creating or editing an order.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Show:</span>
                <AppSelect
                  defaultValue="All suppliers"
                  options={[
                    { value: 'All suppliers', label: 'All suppliers' },
                    { value: 'Active suppliers', label: 'Active suppliers' },
                  ]}
                  className="w-36 h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUBTAB 2: POUR TYPES (matches Group 1.png)                 */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'pourTypes' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pour types"
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand shadow-2xs"
              />
            </div>

            <AppSelect
              value={`Status: ${statusFilter}`}
              onChange={(val) =>
                setStatusFilter(val.replace('Status: ', '') as 'All' | 'Active' | 'Inactive')
              }
              options={[
                { value: 'Status: All', label: 'Status: All' },
                { value: 'Status: Active', label: 'Status: Active' },
                { value: 'Status: Inactive', label: 'Status: Inactive' },
              ]}
              className="w-36 h-10 rounded-xl text-xs sm:text-sm"
            />

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
                Sort:
              </span>
              <AppSelect
                value={
                  sortOrder === 'favorites' ? 'Favorites first' : 'Alphabetical'
                }
                onChange={(val) =>
                  setSortOrder(
                    val === 'Favorites first' ? 'favorites' : 'alphabetical'
                  )
                }
                options={[
                  { value: 'Favorites first', label: 'Favorites first' },
                  { value: 'Alphabetical', label: 'Alphabetical' },
                ]}
                className="w-40 h-10 rounded-xl text-xs sm:text-sm"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            {sortedPourTypes.length} active pour type{sortedPourTypes.length !== 1 ? 's' : ''}
          </p>

          <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-semibold">
                    <th className="py-3 px-4 sm:px-6 w-20 text-center">Favorite</th>
                    <th className="py-3 px-4 sm:px-6">Pour type</th>
                    <th className="py-3 px-4 sm:px-6">Status</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedPourTypes.map((pt) => (
                    <tr
                      key={pt.id}
                      onClick={() => setEditingPour(pt)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td
                        className="py-3.5 px-4 sm:px-6 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePourTypeFavorite(pt.id);
                          toast.success(
                            pt.favorite
                              ? `Removed ${pt.name} from favorites`
                              : `Added ${pt.name} to favorites`
                          );
                        }}
                      >
                        <button
                          type="button"
                          className="p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title={pt.favorite ? 'Unfavorite' : 'Favorite'}
                        >
                          <Star
                            className={cn(
                              'h-4.5 w-4.5 transition-transform duration-150',
                              pt.favorite
                                ? 'fill-brand text-brand scale-110'
                                : 'text-slate-300 hover:text-slate-500'
                            )}
                          />
                        </button>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900 group-hover:text-brand transition-colors">
                        {pt.name}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            pt.status === 'Active'
                              ? 'bg-brand text-white shadow-2xs'
                              : 'bg-slate-200 text-slate-700'
                          )}
                        >
                          {pt.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPour(pt);
                            }}
                            className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer active:scale-95"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info(`Options for ${pt.name}`);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Inactive types stay on past jobs but are hidden from new bookings.
          </p>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUBTAB 3: TAGS (matches tags 1.png)                        */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'tags' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tags"
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand shadow-2xs"
              />
            </div>

            <AppSelect
              value={`Status: ${statusFilter}`}
              onChange={(val) =>
                setStatusFilter(val.replace('Status: ', '') as 'All' | 'Active' | 'Inactive')
              }
              options={[
                { value: 'Status: All', label: 'Status: All' },
                { value: 'Status: Active', label: 'Status: Active' },
                { value: 'Status: Inactive', label: 'Status: Inactive' },
              ]}
              className="w-36 h-10 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <p className="text-xs text-slate-500 font-medium">
            {filteredTags.length} tag{filteredTags.length !== 1 ? 's' : ''}
          </p>

          <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-semibold">
                    <th className="py-3 px-4 sm:px-6">Tag</th>
                    <th className="py-3 px-4 sm:px-6">Used on</th>
                    <th className="py-3 px-4 sm:px-6">Status</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTags.map((tag) => (
                    <tr
                      key={tag.id}
                      onClick={() => setEditingTag(tag)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <span
                          className={cn(
                            'inline-block px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs',
                            getTagColorClass(tag.color)
                          )}
                        >
                          {tag.name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-700">
                        {tag.usedOn}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            tag.status === 'Active'
                              ? 'bg-brand text-white shadow-2xs'
                              : 'bg-slate-200 text-slate-700'
                          )}
                        >
                          {tag.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTag(tag);
                            }}
                            className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer active:scale-95"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info(`Options for ${tag.name}`);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Info className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Tags help organize and filter your records.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Show:</span>
                <AppSelect
                  defaultValue="All tags"
                  options={[
                    { value: 'All tags', label: 'All tags' },
                    { value: 'Active tags', label: 'Active tags' },
                  ]}
                  className="w-32 h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Inactive tags stay on existing records.
          </p>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUBTAB 4: INVENTORY                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'inventory' && (
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-brand" />
            <h3 className="font-bold text-base text-slate-900">
              Pump Accessories & Line Inventory
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Hose lengths, reducers, clamps, and washout balls tracked across the fleet.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {[
              { item: '4" Heavy Duty Slickline (150 ft)', yard: 'Warren HQ', qty: '8 sets', status: 'In service' },
              { item: '5" to 4" Heavy Reducers', yard: 'Portland Terminal', qty: '6 units', status: 'Ready' },
              { item: 'Hydraulic Clamp Kits', yard: 'Bangor Staging', qty: '14 units', status: 'Good' },
            ].map((inv) => (
              <div
                key={inv.item}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
              >
                <h4 className="font-bold text-xs text-slate-800">{inv.item}</h4>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{inv.yard}</span>
                  <span className="font-semibold text-brand">{inv.qty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS: Supplier, Pour Type, Tag ── */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add Concrete Supplier</h3>
              <button
                type="button"
                onClick={() => setIsAddSupplierOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rockland Ready Mix"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatch Phone</label>
                <input
                  type="tel"
                  placeholder="(207) 555-0199"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="dispatch@example.com"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddSupplierOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!supplierName.trim()) return;
                  addSupplier({
                    name: supplierName.trim(),
                    phone: supplierPhone.trim() || '(207) 555-0100',
                    email: supplierEmail.trim() || 'dispatch@example.com',
                    status: 'Active',
                  });
                  toast.success(`Supplier added: ${supplierName}`);
                  setIsAddSupplierOpen(false);
                  setSupplierName('');
                  setSupplierPhone('');
                  setSupplierEmail('');
                }}
                className="px-4 py-1.5 rounded-lg bg-brand text-xs font-semibold text-white hover:bg-brand-hover cursor-pointer"
              >
                Create Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Edit Supplier</h3>
              <button
                type="button"
                onClick={() => setEditingSupplier(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Name</label>
                <input
                  type="text"
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatch Phone</label>
                <input
                  type="tel"
                  value={editingSupplier.phone}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingSupplier.email}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSupplier(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateSupplier(editingSupplier.id, editingSupplier);
                  toast.success(`Updated ${editingSupplier.name}`);
                  setEditingSupplier(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-brand text-xs font-semibold text-white hover:bg-brand-hover cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Pour Type */}
      {isAddPourOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add Pour Type</h3>
              <button
                type="button"
                onClick={() => setIsAddPourOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pour Type Name</label>
              <input
                type="text"
                placeholder="e.g. Grade Beam Pour"
                value={pourTypeName}
                onChange={(e) => setPourTypeName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddPourOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!pourTypeName.trim()) return;
                  addPourType({
                    name: pourTypeName.trim(),
                    favorite: false,
                    status: 'Active',
                  });
                  toast.success(`Pour type added: ${pourTypeName}`);
                  setIsAddPourOpen(false);
                  setPourTypeName('');
                }}
                className="px-4 py-1.5 rounded-lg bg-brand text-xs font-semibold text-white cursor-pointer"
              >
                Create Pour Type
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pour Type */}
      {editingPour && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Edit Pour Type</h3>
              <button
                type="button"
                onClick={() => setEditingPour(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pour Type Name</label>
              <input
                type="text"
                value={editingPour.name}
                onChange={(e) => setEditingPour({ ...editingPour, name: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPour(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updatePourType(editingPour.id, editingPour);
                  toast.success(`Updated ${editingPour.name}`);
                  setEditingPour(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-brand text-xs font-semibold text-white cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tag */}
      {isAddTagOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add Record Tag</h3>
              <button
                type="button"
                onClick={() => setIsAddTagOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tag Name</label>
                <input
                  type="text"
                  placeholder="e.g. Saturday Pour"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Used On</label>
                <input
                  type="text"
                  placeholder="e.g. Orders, customers"
                  value={tagUsedOn}
                  onChange={(e) => setTagUsedOn(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Color Palette</label>
                <div className="flex gap-2">
                  {(['amber', 'fuchsia', 'blue', 'teal', 'slate'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTagColor(c)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-semibold capitalize border cursor-pointer',
                        getTagColorClass(c),
                        tagColor === c && 'ring-2 ring-brand ring-offset-1'
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddTagOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!tagName.trim()) return;
                  addTag({
                    name: tagName.trim(),
                    usedOn: tagUsedOn.trim() || 'Orders',
                    color: tagColor,
                    status: 'Active',
                  });
                  toast.success(`Tag added: ${tagName}`);
                  setIsAddTagOpen(false);
                  setTagName('');
                }}
                className="px-4 py-1.5 rounded-lg bg-brand text-xs font-semibold text-white cursor-pointer"
              >
                Create Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tag */}
      {editingTag && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Edit Record Tag</h3>
              <button
                type="button"
                onClick={() => setEditingTag(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tag Name</label>
                <input
                  type="text"
                  value={editingTag.name}
                  onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Used On</label>
                <input
                  type="text"
                  value={editingTag.usedOn}
                  onChange={(e) => setEditingTag({ ...editingTag, usedOn: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Color Palette</label>
                <div className="flex gap-2">
                  {(['amber', 'fuchsia', 'blue', 'teal', 'slate'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingTag({ ...editingTag, color: c })}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-semibold capitalize border cursor-pointer',
                        getTagColorClass(c),
                        editingTag.color === c && 'ring-2 ring-brand ring-offset-1'
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTag(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateTag(editingTag.id, editingTag);
                  toast.success(`Updated tag ${editingTag.name}`);
                  setEditingTag(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-brand text-xs font-semibold text-white cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
