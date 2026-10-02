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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';

import { useOrders } from '@/lib/orders-store';

type QuickTab = 'all' | 'needs_assignment' | 'ready_to_invoice';

const PAGE_SIZE = 8;

export default function OrdersPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Persistent Orders State from Store (reactive with SSR safe hydration)
  const orders = useOrders();

  // Filter & Search State
  const [activeTab, setActiveTab] = useState<QuickTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);

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
  const handleTabChange = (tab: QuickTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleSortToggle = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
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
  const needsAssignmentCount = useMemo(
    () => orders.filter((o) => o.isUnassigned).length,
    [orders]
  );
  const readyToInvoiceCount = useMemo(
    () => orders.filter((o) => o.invoiceStatus === 'Create invoice').length,
    [orders]
  );



  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* ── 1. Top Header: Title + Subtitle + Action Buttons ── */}
      <PageHeader
        title="Orders"
        description="Find a job, check its status, and open the details."
        actions={
          <Link href="/orders/new">
            <Button variant="brand" size="sm" className="font-semibold gap-1.5">
              <Plus className="h-4 w-4" />
              <span>New order</span>
            </Button>
          </Link>
        }
      />

      {/* ── 2. Quick View Filter Pills ── */}
      <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          type="button"
          onClick={() => handleTabChange('all')}
          className={cn(
            'h-8 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-98',
            activeTab === 'all'
              ? 'bg-brand text-white shadow-xs'
              : 'bg-white border border-slate-200/90 text-slate-600 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <span>All orders</span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums',
              activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            )}
          >
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('needs_assignment')}
          className={cn(
            'h-8 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-98',
            activeTab === 'needs_assignment'
              ? 'bg-brand text-white shadow-xs'
              : 'bg-white border border-slate-200/90 text-slate-600 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <span>Needs assignment</span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums',
              activeTab === 'needs_assignment'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-amber-100 text-amber-800'
            )}
          >
            {needsAssignmentCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('ready_to_invoice')}
          className={cn(
            'h-8 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-98',
            activeTab === 'ready_to_invoice'
              ? 'bg-brand text-white shadow-xs'
              : 'bg-white border border-slate-200/90 text-slate-600 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          <span>Ready to invoice</span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums',
              activeTab === 'ready_to_invoice'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-600'
            )}
          >
            {readyToInvoiceCount}
          </span>
        </button>
      </div>

      {/* ── 3. Search Bar ── */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative group">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-brand transition-colors" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search order #, customer, address, pump, or operator"
            className="pl-9.5 pr-14 h-10 text-xs sm:text-sm bg-slate-50/60 border-slate-200 focus-visible:bg-white focus-visible:border-brand outline-none rounded-lg shadow-none transition-all placeholder:text-slate-400"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <kbd className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-200/80 px-1.5 py-0.5 rounded shadow-2xs font-mono">
                ⌘K
              </kbd>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Stats & Sorting Bar ── */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-0.5">
        <span className="font-semibold text-slate-700 tabular-nums">
          {totalOrders} {totalOrders === 1 ? 'order' : 'orders'}
        </span>

        <button
          type="button"
          onClick={handleSortToggle}
          className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer transition-colors active:scale-98 select-none"
        >
          <span>Sort: Service date {sortOrder === 'desc' ? '↓' : '↑'}</span>
        </button>
      </div>

      {/* ── 5. Master Orders Table Card ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/60 text-xs font-semibold text-slate-600 select-none">
                <th className="py-3.5 pl-5 pr-3">Order</th>
                <th className="py-3.5 px-3">Service date / Pour time</th>
                <th className="py-3.5 px-3">Customer / Job site</th>
                <th className="py-3.5 px-3">Pump / Operator</th>
                <th className="py-3.5 px-3">Job status</th>
                <th className="py-3.5 px-3">Invoice</th>
                <th className="py-3.5 pr-5 pl-2 text-right"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {currentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
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
                  </td>
                </tr>
              ) : (
                currentOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Order ID */}
                    <td className="py-3.5 pl-5 pr-3 font-semibold text-brand group-hover:underline">
                      <Link
                        href={`/orders/${order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-xs inline-flex items-center gap-1 text-brand hover:underline"
                      >
                        {order.id}
                      </Link>
                    </td>

                    {/* Service Date & Pour Time */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 leading-tight">
                        {order.serviceDate}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5 tabular-nums">
                        {order.pourTime}
                      </div>
                    </td>

                    {/* Customer & Job Site */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 leading-tight">
                        {order.customer}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium truncate max-w-[240px] mt-0.5">
                        {order.jobSite}
                      </div>
                    </td>

                    {/* Pump & Operator */}
                    <td className="py-3.5 px-3">
                      <div
                        className={cn(
                          'font-semibold leading-tight',
                          order.isUnassigned ? 'text-slate-700' : 'text-slate-900'
                        )}
                      >
                        {order.pump}
                      </div>
                      <div
                        className={cn(
                          'text-[11px] mt-0.5 font-medium flex items-center gap-1',
                          order.isUnassigned
                            ? 'text-amber-600 font-semibold'
                            : 'text-slate-500'
                        )}
                      >
                        {order.isUnassigned && (
                          <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                        )}
                        <span>{order.operator}</span>
                      </div>
                    </td>

                    {/* Job Status Badge with Colored Dot */}
                    <td className="py-3.5 px-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border',
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
                    <td className="py-3.5 px-3">
                      {order.invoiceStatus === 'Paid' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-light text-brand border border-brand/25">
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
                    <td className="py-3.5 pr-5 pl-2 text-right">
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all inline-block" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── 6. Bottom Helper & Pagination Bar ── */}
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
    </div>
  );
}
