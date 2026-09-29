import { Search, Download, Plus, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const mockOrders = [
  {
    id: "ORD-1518",
    date: "Sep 12, 2026",
    customer: "Turner Construction",
    contact: "Mike Vance (Super)",
    site: "Dallas Medical Tower",
    pump: "01 - 34M Putzmeister",
    operator: "Jake Miller",
    status: "Pumping",
    statusVariant: "pumping",
    volume: "280 yd³",
  },
  {
    id: "ORD-1519",
    date: "Sep 12, 2026",
    customer: "Accurate Concrete",
    contact: "Rob Black (Super)",
    site: "I-35 North Bridge Deck",
    pump: "02 - 28M Putzmeister",
    operator: "Carlos Rodriguez",
    status: "En Route",
    statusVariant: "transit",
    volume: "150 yd³",
  },
  {
    id: "ORD-1520",
    date: "Sep 12, 2026",
    customer: "Top Tier Builders",
    contact: "Sarah Jenkins (PM)",
    site: "Plano Distribution Hub",
    pump: "03 - 47M Schwing",
    operator: "Dave Smith",
    status: "Confirmed",
    statusVariant: "confirmed",
    volume: "420 yd³",
  },
  {
    id: "ORD-1517",
    date: "Sep 11, 2026",
    customer: "DFW Foundation Pros",
    contact: "Carlos M.",
    site: "Frisco Commercial Pad",
    pump: "01 - 34M Putzmeister",
    operator: "Jake Miller",
    status: "Turned In",
    statusVariant: "completed",
    volume: "185 yd³",
  },
];

export default function OrdersPage() {
  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Pour Orders</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage dispatch bookings, mix design specs, and digital work tickets.
          </p>
        </div>

        <Button size="sm" className="h-9 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>+ Book Pour Event</span>
        </Button>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="flex items-center justify-between gap-4 bg-card p-3 rounded-lg border border-border">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, customer, site address..."
              className="h-8 pl-9 text-xs bg-muted/30 border-border"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="h-8 text-xs font-medium gap-1.5 border-border">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Today (Sep 12)</span>
          </Button>

          <Button variant="outline" size="sm" className="h-8 text-xs font-medium gap-1.5 border-border">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span>All Statuses</span>
          </Button>
        </div>
      </div>

      {/* 3. ORDERS MASTER TABLE */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border">
              <TableHead className="w-28 text-xs font-bold text-muted-foreground">Order #</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Date & Time</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Customer & Main Contact</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Job Site & Access</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Rig & Operator</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Volume</TableHead>
              <TableHead className="w-28 text-right text-xs font-bold text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {mockOrders.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/20 transition-colors cursor-pointer border-border">
                <TableCell className="font-mono font-bold text-xs text-foreground">
                  {order.id}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {order.date}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-foreground">{order.customer}</span>
                    <span className="text-[11px] text-muted-foreground">{order.contact}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {order.site}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-xs text-foreground">{order.pump}</span>
                    <span className="text-[11px] text-muted-foreground">{order.operator}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-semibold text-foreground font-mono">
                  {order.volume}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                      order.statusVariant === "pumping"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                        : order.statusVariant === "transit"
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                        : order.statusVariant === "confirmed"
                        ? "bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    ● {order.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 4. FOOTER WITH CSV EXPORT */}
        <div className="p-3 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing 4 of 4 active pour orders</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground">
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
