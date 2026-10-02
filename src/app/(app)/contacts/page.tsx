import { Search, Download, Plus, Filter, Phone, Mail, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const mockContacts = [
  {
    id: "CONT-201",
    name: "Rob Black",
    role: "Superintendent & Partner",
    company: "Midcoast Concrete Pumping",
    mobile: "(214) 555-0192",
    email: "rob@midcoastpumping.com",
    activePours: 18,
    status: "Active",
    statusVariant: "active",
  },
  {
    id: "CONT-202",
    name: "Mike Vance",
    role: "Lead Field Superintendent",
    company: "Turner Construction",
    mobile: "(972) 555-8834",
    email: "mvance@turnerconstruction.com",
    activePours: 14,
    status: "Active",
    statusVariant: "active",
  },
  {
    id: "CONT-203",
    name: "Sarah Jenkins",
    role: "Senior Project Manager",
    company: "Top Tier Commercial",
    mobile: "(469) 555-4311",
    email: "sjenkins@toptierbuilders.com",
    activePours: 9,
    status: "Active",
    statusVariant: "active",
  },
  {
    id: "CONT-204",
    name: "Carlos Mendez",
    role: "Foundation Lead",
    company: "DFW Foundation Pros",
    mobile: "(817) 555-9012",
    email: "carlos@dfwfoundation.com",
    activePours: 6,
    status: "Active",
    statusVariant: "active",
  },
  {
    id: "CONT-205",
    name: "Dave Wilson",
    role: "Former Lead Superintendent",
    company: "Lone Star Civil",
    mobile: "(214) 555-7788",
    email: "dwilson@lonestarcivil.com",
    activePours: 0,
    status: "Inactive",
    statusVariant: "inactive",
  },
];

export default function ContactsPage() {
  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* 1. HEADER */}
      <PageHeader
        title="Contacts & Superintendents"
        description="Directory of field superintendents, project managers, and dispatch alert recipients."
        actions={
          <Button variant="brand" size="sm" className="font-semibold gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add New Contact</span>
          </Button>
        }
      />

      {/* 2. FILTER & SEARCH BAR */}
      <div className="flex items-center justify-between gap-4 bg-card p-3 rounded-md border border-border">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by contact name, phone, or company..."
              className="h-8 pl-9 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="h-8 text-xs font-medium gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Active Field Contacts (4/5)</span>
          </Button>
        </div>
      </div>

      {/* 3. CONTACTS MASTER TABLE */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border">
              <TableHead className="text-xs font-bold text-muted-foreground">Contact Name</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Role & Company</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Direct Mobile</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Work Email</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Pours Logged</TableHead>
              <TableHead className="w-24 text-right text-xs font-bold text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {mockContacts.map((contact) => {
              const isInactive = contact.statusVariant === "inactive";

              return (
                <TableRow
                  key={contact.id}
                  className={`hover:bg-muted/20 transition-colors cursor-pointer border-border group ${
                    isInactive ? "opacity-60 bg-muted/10 text-muted-foreground" : ""
                  }`}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-xs">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-foreground group-hover:text-brand transition-colors">
                          {contact.name}
                        </span>
                        <span className="text-[10.5px] font-mono text-muted-foreground">{contact.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">{contact.company}</span>
                      <span className="text-[11px] text-muted-foreground">{contact.role}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-brand" />
                      {contact.mobile}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-brand" />
                      {contact.email}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-foreground font-mono">
                    {contact.activePours}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                        contact.statusVariant === "active"
                          ? "bg-brand-light text-brand border border-brand/25"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      ● {contact.status}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* 4. FOOTER WITH CSV EXPORT */}
        <div className="p-3 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing 5 field superintendents</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground">
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
