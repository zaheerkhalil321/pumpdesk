import { Search, Download, Plus, Filter, Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const mockCustomers = [
  {
    id: "CUST-101",
    name: "Turner Construction",
    tier: "Commercial Tier 1",
    tierVariant: "commercial",
    leadSuper: "Mike Vance",
    activeSites: 4,
    recentOrders: 28,
    paymentTerms: "Net 30 ($100k Limit)",
    status: "Active",
  },
  {
    id: "CUST-102",
    name: "Accurate Concrete Pumping",
    tier: "VIP Partner",
    tierVariant: "vip",
    leadSuper: "Rob Black",
    activeSites: 2,
    recentOrders: 19,
    paymentTerms: "Net 30 ($50k Limit)",
    status: "Active",
  },
  {
    id: "CUST-103",
    name: "Top Tier Commercial Builders",
    tier: "Commercial Tier 1",
    tierVariant: "commercial",
    leadSuper: "Sarah Jenkins",
    activeSites: 3,
    recentOrders: 15,
    paymentTerms: "Net 15 ($75k Limit)",
    status: "Active",
  },
  {
    id: "CUST-104",
    name: "Lone Star Paving & Civil",
    tier: "Municipal",
    tierVariant: "municipal",
    leadSuper: "Dave Miller",
    activeSites: 1,
    recentOrders: 8,
    paymentTerms: "Net 45 (City of Dallas)",
    status: "Active",
  },
  {
    id: "CUST-105",
    name: "DFW Foundation Pros",
    tier: "Residential",
    tierVariant: "residential",
    leadSuper: "Carlos Mendez",
    activeSites: 1,
    recentOrders: 6,
    paymentTerms: "Collect on Delivery (COD)",
    status: "Active",
  },
];

export default function CustomersPage() {
  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Customers & Accounts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage contractor accounts, authorized job sites, and payment credit limits.
          </p>
        </div>

        <Button size="sm" className="h-9 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>+ Add New Customer</span>
        </Button>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="flex items-center justify-between gap-4 bg-card p-3 rounded-lg border border-border">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by company name, superintendent, or account ID..."
              className="h-8 pl-9 text-xs bg-muted/30 border-border"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="h-8 text-xs font-medium gap-1.5 border-border">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Active Customers (5/5)</span>
          </Button>
        </div>
      </div>

      {/* 3. CUSTOMERS MASTER TABLE */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border">
              <TableHead className="text-xs font-bold text-muted-foreground">Company Name</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Account Classification</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Lead Superintendent</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Active Sites</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Total Pours</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Payment Terms</TableHead>
              <TableHead className="w-16 text-right text-xs font-bold text-muted-foreground"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {mockCustomers.map((cust) => (
              <TableRow key={cust.id} className="hover:bg-muted/20 transition-colors cursor-pointer border-border group">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-foreground font-semibold text-xs border border-border">
                      <Building2 className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-foreground group-hover:text-orange-600 transition-colors">
                        {cust.name}
                      </span>
                      <span className="text-[10.5px] font-mono text-muted-foreground">{cust.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                      cust.tierVariant === "vip"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                        : cust.tierVariant === "commercial"
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {cust.tier}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-foreground font-medium">
                  {cust.leadSuper}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-medium">
                  {cust.activeSites} Sites
                </TableCell>
                <TableCell className="text-xs font-semibold text-foreground font-mono">
                  {cust.recentOrders}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {cust.paymentTerms}
                </TableCell>
                <TableCell className="text-right">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 4. FOOTER WITH CSV EXPORT */}
        <div className="p-3 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing 5 of 5 registered customers</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground">
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>
    </div>
  );
}