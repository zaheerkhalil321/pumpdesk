'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  ChevronRight,
  Info,
  X,
  AlertCircle,
  LayoutGrid,
  Table as TableIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { AppSelect } from '@/components/ui/app-select';
import { cn } from '@/lib/utils';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { OrderTileCard } from '@/components/orders/order-tile-card';
import { OrdersFilterSheet, OrderTab } from '@/components/orders/orders-filter-sheet';

import { useOrders } from '@/lib/orders-store';

type ViewLayout = 'table' | 'tiles';

const PAGE_SIZE = 8;

export default function OrdersPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Persistent Orders State from Store (reactive with SSR safe hydration)
  const orders = useOrders();

  // Filter & Search State
  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [userLayout, setUserLayout] = useState<ViewLayout | null>(null);
  const currentLayout: ViewLayout = userLayout ?? (isMobile || isTablet ? 'tiles' : 'table');

  // Keyboard shortcut listener: Cmd/Ctrl + K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered Orders calculation
  const filteredOrders = useMemo(() => {
    const list = orders.filter((order) => {
      // 1. Tab filter
      if (activeTab === 'confirmed' && order.status !== 'Confirmed') {
        return false;
      }
      if (activeTab === 'pending' && order.status !== 'Pending') {
        return false;
      }
      if (activeTab === 'needs_assignment' && !order.isUnassigned) {
        return false;
      }
      if (activeTab === 'ready_to_invoice' && order.invoiceStatus !== 'Create invoice') {
        return false;
      }

      // 2. Search query filter (Order #, Customer, Job Site, Pump, or Operator)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchId = order.id.toLowerCase().includes(query);
        const matchCustomer = order.customer.toLowerCase().includes(query);
        const matchSite = order.jobSite.toLowerCase().includes(query);
        const matchOperator = order.operator.toLowerCase().includes(query);
        const matchPump = order.pump.toLowerCase().includes(query);
        if (!matchId && !matchCustomer && !matchSite && !matchOperator && !matchPump) {
          return false;
        }
      }

      return true;
    });

    // Sort by date
    list.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.dateTimestamp - a.dateTimestamp;
      }
      return a.dateTimestamp - b.dateTimestamp;
    });

    return list;
  }, [orders, activeTab, searchQuery, sortOrder]);

  // Handle filter changes and reset page to 1
  const handleTabChange = (tab: OrderTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalOrders = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalOrders);
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Tab count badges
  const confirmedCount = useMemo(
    () => orders.filter((o) => o.status === 'Confirmed').length,
    [orders]
  );
  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === 'Pending').length,
    [orders]
  );
  const needsAssignmentCount = useMemo(
    () => orders.filter((o) => o.isUnassigned).length,
    [orders]
  );
  const readyToInvoiceCount = useMemo(
    () => orders.filter((o) => o.invoiceStatus === 'Create invoice').length,
    [orders]
  );



  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      {/* ── 1. Top Header: Title + Subtitle + Action Buttons ── */}
      <PageHeader
        title="Orders"
        description="Find a job, check its status, and open the details."
        actions={
          <Button
            variant="brand"
            onClick={() => router.push('/orders/new')}
            className="font-semibold gap-1.5 text-sm h-9 px-3.5"
          >
            <Plus className="h-4 w-4" />
            <span>New order</span>
          </Button>
        }
      />

      {/* ── 2. Filters & Search Control Bar (Responsive) ── */}
      <div>
        {/* MOBILE CONTROLS (< sm screens): Full-width search + bottom filter trigger */}
        <div className="sm:hidden space-y-2.5">
          {/* Full-width Search Bar */}
          <div className="bg-white p-2 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="relative w-full group">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-brand transition-colors" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search order #, customer, address..."
                className="w-full pl-9 pr-9 h-10 text-xs bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:border-brand outline-none rounded-lg shadow-none transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Row: Filter Trigger Button + View Switcher + Sort */}
          <div className="flex items-center justify-between gap-2">
            {/* Filter Trigger Button (Opens Schedule-like Bottom Sheet Modal) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(true)}
                className={cn(
                  "h-9 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs",
                  activeTab !== 'all'
                    ? "bg-brand text-white border-brand shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filter</span>
                {activeTab !== 'all' ? (
                  <span className="h-4 px-1.5 rounded-full bg-white text-brand text-[10px] font-bold flex items-center">
                    {activeTab === 'confirmed'
                      ? 'Confirmed'
                      : activeTab === 'pending'
                      ? 'Pending'
                      : activeTab === 'needs_assignment'
                      ? 'Needs Rig'
                      : 'Invoice'}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({filteredOrders.length})
                  </span>
                )}
              </button>

              {activeTab !== 'all' && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-8 px-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  title="Clear filters"
                >
                  <X className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Switcher: Tiles vs Table */}
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setUserLayout('tiles')}
                  className={cn(
                    "p-1.5 text-xs font-semibold rounded-lg flex items-center transition-all cursor-pointer",
                    currentLayout === 'tiles'
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                  title="Tiles view"
                  aria-label="Tiles view"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setUserLayout('table')}
                  className={cn(
                    "p-1.5 text-xs font-semibold rounded-lg flex items-center transition-all cursor-pointer",
                    currentLayout === 'table'
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                  title="Table view"
                  aria-label="Table view"
                >
                  <TableIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Compact Sort Selector */}
              <div className="w-28">
                <AppSelect
                  size="sm"
                  value={sortOrder}
                  onChange={(val) => setSortOrder(val as 'desc' | 'asc')}
                  options={[
                    { value: "desc", label: "Newest" },
                    { value: "asc", label: "Oldest" },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP & TABLET CONTROLS (>= sm screens) */}
        <div className="hidden sm:block space-y-3">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/60 w-fit overflow-x-auto">
              <button
                type="button"
                onClick={() => handleTabChange('all')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <span>All orders</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 text-[10.5px] font-bold text-slate-700">
                  {orders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('confirmed')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                  activeTab === 'confirmed'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                <span>Confirmed</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 text-[10.5px] font-bold text-slate-700">
                  {confirmedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('pending')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                  activeTab === 'pending'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>Pending</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 text-[10.5px] font-bold text-slate-700">
                  {pendingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('needs_assignment')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                  activeTab === 'needs_assignment'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span>Needs assignment</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 text-[10.5px] font-bold text-slate-700">
                  {needsAssignmentCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('ready_to_invoice')}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                  activeTab === 'ready_to_invoice'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>Ready to invoice</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 text-[10.5px] font-bold text-slate-700">
                  {readyToInvoiceCount}
                </span>
              </button>
            </div>

            {/* Quick Counter */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Showing {filteredOrders.length} of {orders.length} orders</span>
            </div>
          </div>

          {/* Search Bar Row with Sort Selector */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
            <div className="relative flex-1 min-w-[200px] group">
              <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-brand transition-colors" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search order #, customer, address, pump, or operator"
                className="pl-9.5 pr-14 h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:border-brand outline-none rounded-lg shadow-none transition-all placeholder:text-slate-400"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400">
                  <span className="text-xs">⌘</span>K
                </kbd>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* View Mode Switcher: Tiles vs Table */}
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => setUserLayout('tiles')}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer",
                    currentLayout === 'tiles'
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                  title="Tiles view"
                  aria-label="Tiles view"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tiles</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserLayout('table')}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer",
                    currentLayout === 'table'
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                  title="Table view"
                  aria-label="Table view"
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>

              {/* Sort Selector */}
              <div className="w-36 sm:w-44 shrink-0">
                <AppSelect
                  size="sm"
                  value={sortOrder}
                  onChange={(val) => setSortOrder(val as 'desc' | 'asc')}
                  options={[
                    { value: "desc", label: "Date (Newest first)" },
                    { value: "asc", label: "Date (Oldest first)" },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Orders Content: Tiles View OR Master Table ── */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs p-12 text-center text-slate-400">
          <div className="max-w-xs mx-auto space-y-2">
            <p className="font-semibold text-slate-700 text-sm">No orders matching criteria</p>
            <p className="text-xs text-slate-500">
              Try modifying search query or resetting filters.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 text-xs font-semibold mt-2 cursor-pointer"
            >
              Reset search
            </Button>
          </div>
        </div>
      ) : currentLayout === 'tiles' ? (
        <div className="space-y-4">
          {/* Responsive Tiles Grid: 1 col on mobile, 2 cols on tablet, 3-5 cols on wide screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
            {currentOrders.map((order) => (
              <OrderTileCard
                key={order.id}
                order={order}
                onClick={() => router.push(`/orders/${order.id}`)}
              />
            ))}
          </div>

          {/* Bottom Pagination Bar for Tiles */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-brand shrink-0" />
              <span>Select an order card to view full dossier, work ticket, and billing.</span>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="tabular-nums font-medium text-slate-600">
                {totalOrders === 0 ? '0 of 0' : `${startIndex + 1}-${endIndex} of ${totalOrders}`} orders
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Master Orders Table Card */
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold select-none">
                  <th className="py-3 px-4 sm:px-6">Order</th>
                  <th className="py-3 px-4">Service date / Pour</th>
                  <th className="py-3 px-4">Customer / Job site</th>
                  <th className="py-3 px-4">Pump / Operator</th>
                  <th className="py-3 px-4">Job status</th>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4 text-right sm:pr-6"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {currentOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Order ID */}
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-brand group-hover:underline">
                      <Link
                        href={`/orders/${order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-sm inline-flex items-center gap-1 text-brand hover:underline"
                      >
                        {order.id}
                      </Link>
                    </td>

                    {/* Service Date & Pour Time */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 leading-tight text-sm">
                        {order.serviceDate}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                        {order.pourTime}
                      </div>
                    </td>

                    {/* Customer & Job Site */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 leading-tight text-sm truncate">
                        {order.customer}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[240px] mt-0.5">
                        {order.jobSite}
                      </div>
                    </td>

                    {/* Pump & Operator */}
                    <td className="py-3.5 px-4">
                      <div
                        className={cn(
                          'font-semibold leading-tight text-sm',
                          order.isUnassigned ? 'text-slate-700' : 'text-slate-900'
                        )}
                      >
                        {order.pump}
                      </div>
                      <div
                        className={cn(
                          'text-[11px] mt-0.5 flex items-center gap-1',
                          order.isUnassigned
                            ? 'text-amber-600 font-semibold'
                            : 'text-slate-400'
                        )}
                      >
                        {order.isUnassigned && (
                          <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                        )}
                        <span>{order.operator}</span>
                      </div>
                    </td>

                    {/* Job Status Badge with Colored Dot */}
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                          order.status === 'Confirmed' &&
                            'bg-brand-light text-brand border-brand/25',
                          order.status === 'Pending' &&
                            'bg-amber-50 text-amber-800 border-amber-200/80',
                          order.status === 'Completed' &&
                            'bg-slate-100 text-slate-700 border-slate-200/80',
                          order.status === 'Cancelled' &&
                            'bg-slate-50 text-slate-500 border-slate-200'
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full shrink-0',
                            order.status === 'Confirmed' && 'bg-brand',
                            order.status === 'Pending' && 'bg-amber-600',
                            order.status === 'Completed' && 'bg-slate-500',
                            order.status === 'Cancelled' && 'bg-slate-400'
                          )}
                        />
                        <span>{order.status}</span>
                      </span>
                    </td>

                    {/* Invoice Status */}
                    <td className="py-3.5 px-4">
                      {order.invoiceStatus === 'Paid' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-light text-brand border border-brand/25">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                          <span>Paid</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-normal">
                          Not created
                        </span>
                      )}
                    </td>

                    {/* Row Chevron Arrow */}
                    <td className="py-3.5 px-4 text-right sm:pr-6">
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── 6. Bottom Helper & Pagination Bar for Table ── */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-brand shrink-0" />
              <span>Select an order to view details, work ticket, and billing.</span>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="tabular-nums font-medium text-slate-600">
                {totalOrders === 0 ? '0 of 0' : `${startIndex + 1}-${endIndex} of ${totalOrders}`} orders
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Mobile Filter Bottom Sheet Modal ── */}
      <OrdersFilterSheet
        isOpen={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        sortOrder={sortOrder}
        onSortChange={(val) => setSortOrder(val)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        totalCount={orders.length}
        confirmedCount={confirmedCount}
        pendingCount={pendingCount}
        needsAssignmentCount={needsAssignmentCount}
        readyToInvoiceCount={readyToInvoiceCount}
        filteredCount={filteredOrders.length}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}
