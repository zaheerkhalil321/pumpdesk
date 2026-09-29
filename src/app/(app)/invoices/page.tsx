import { Receipt, Download, DollarSign, FileCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const mockInvoices = [
  {
    id: "INV-2026-8819",
    ticketId: "TKT-4019",
    orderId: "ORD-1518",
    customer: "Turner Construction",
    site: "Dallas Medical Tower",
    date: "Sep 12, 2026",
    amount: "$1,815.00",
    status: "Ready to Bill",
    statusVariant: "ready",
  },
  {
    id: "INV-2026-8818",
    ticketId: "TKT-4018",
    orderId: "ORD-1517",
    customer: "DFW Foundation Pros",
    site: "Frisco Commercial Pad",
    date: "Sep 11, 2026",
    amount: "$1,240.00",
    status: "Sent to QuickBooks",
    statusVariant: "synced",
  },
  {
    id: "INV-2026-8817",
    ticketId: "TKT-4016",
    orderId: "ORD-1512",
    customer: "Accurate Concrete",
    site: "Plano Distribution Hub",
    date: "Sep 10, 2026",
    amount: "$2,650.00",
    status: "Paid (ACH)",
    statusVariant: "paid",
  },
];

export default function InvoicesPage() {
  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Tickets & Billing</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit signed digital field work tickets and synchronize invoices to accounting.
          </p>
        </div>

        <Button size="sm" className="h-9 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold gap-1.5 shadow-sm">
          <DollarSign className="h-4 w-4" />
          <span>Sync All to QuickBooks</span>
        </Button>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <span className="text-xs text-muted-foreground font-medium">Pending Review & Sign-Off</span>
          <div className="text-2xl font-bold text-foreground mt-1">1 Ticket</div>
          <span className="text-[11px] text-orange-600 font-semibold mt-0.5 block">$1,815.00 awaiting approval</span>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <span className="text-xs text-muted-foreground font-medium">Synced This Week</span>
          <div className="text-2xl font-bold text-foreground mt-1">$3,890.00</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">2 Invoices verified</span>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <span className="text-xs text-muted-foreground font-medium">Avg Turnaround Time</span>
          <div className="text-2xl font-bold text-foreground mt-1">42 Minutes</div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Pour completion to signed invoice</span>
        </div>
      </div>

      {/* 3. INVOICES TABLE */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border">
              <TableHead className="text-xs font-bold text-muted-foreground">Invoice #</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Ticket & Order</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Customer</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Date</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Total Amount</TableHead>
              <TableHead className="w-40 text-right text-xs font-bold text-muted-foreground">Billing Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {mockInvoices.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-muted/20 transition-colors cursor-pointer border-border group">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-foreground font-semibold text-xs border border-border">
                      <Receipt className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="font-semibold text-xs text-foreground group-hover:text-orange-600 transition-colors">
                      {inv.id}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {inv.ticketId} &bull; {inv.orderId}
                </TableCell>
                <TableCell className="text-xs font-medium text-foreground">
                  {inv.customer}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {inv.date}
                </TableCell>
                <TableCell className="text-xs font-bold font-mono text-foreground">
                  {inv.amount}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                      inv.statusVariant === "paid"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                        : inv.statusVariant === "synced"
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                        : "bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20"
                    }`}
                  >
                    {inv.statusVariant === "paid" && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                    {inv.statusVariant === "synced" && <FileCheck className="h-3 w-3 mr-1 inline" />}
                    ● {inv.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="p-3 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing recent billing records</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground">
            <Download className="h-3.5 w-3.5" />
            <span>Export Invoices CSV</span>
          </Button>
        </div>
      </div>
    </div>
  );
}