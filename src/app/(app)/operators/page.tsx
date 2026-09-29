import { Users2, Plus, Phone, Award, Download, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const mockOperators = [
  {
    id: "OP-01",
    name: "Jake Miller",
    assignedRig: "01 - 34M Putzmeister",
    phone: "(214) 555-0144",
    experience: "8 Years",
    certifications: "ACPA Certified • Class A CDL",
    status: "On Site (Pumping)",
    statusVariant: "active",
  },
  {
    id: "OP-02",
    name: "Carlos Rodriguez",
    assignedRig: "02 - 28M Putzmeister",
    phone: "(972) 555-0189",
    experience: "5 Years",
    certifications: "ACPA Certified • OSHA 30",
    status: "En Route (I-35)",
    statusVariant: "active",
  },
  {
    id: "OP-03",
    name: "Dave Smith",
    assignedRig: "03 - 47M Schwing",
    phone: "(469) 555-0112",
    experience: "12 Years",
    certifications: "Master Operator • Heavy Boom Cert",
    status: "On Site (Pumping)",
    statusVariant: "active",
  },
  {
    id: "OP-04",
    name: "Tony P.",
    assignedRig: "04 - Trailer Line Pump",
    phone: "(817) 555-0199",
    experience: "4 Years",
    certifications: "Line Pump Specialist",
    status: "Standby (Yard)",
    statusVariant: "standby",
  },
];

export default function OperatorsPage() {
  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Operators & Rig Crew</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage pump truck drivers, safety certifications, and daily shift assignments.
          </p>
        </div>

        <Button size="sm" className="h-9 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>+ Add New Operator</span>
        </Button>
      </div>

      {/* 2. FILTER & SEARCH */}
      <div className="flex items-center justify-between gap-4 bg-card p-3 rounded-lg border border-border">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by operator name, assigned rig, phone..."
              className="h-8 pl-9 text-xs bg-muted/30 border-border"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>All Operators 100% ACPA Compliant</span>
          </span>
        </div>
      </div>

      {/* 3. OPERATORS TABLE */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border">
              <TableHead className="text-xs font-bold text-muted-foreground">Operator Name</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Primary Assigned Rig</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Direct Contact</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Experience</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Safety Credentials</TableHead>
              <TableHead className="w-36 text-right text-xs font-bold text-muted-foreground">Shift Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {mockOperators.map((op) => (
              <TableRow key={op.id} className="hover:bg-muted/20 transition-colors cursor-pointer border-border group">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-orange-600/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs">
                      <Users2 className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-foreground group-hover:text-orange-600 transition-colors">
                        {op.name}
                      </span>
                      <span className="text-[10.5px] font-mono text-muted-foreground">{op.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-semibold text-foreground">
                  {op.assignedRig}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {op.phone}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-medium">
                  {op.experience}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-amber-500" />
                    {op.certifications}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                      op.statusVariant === "active"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    ● {op.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 4. FOOTER */}
        <div className="p-3 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing 4 active operators on duty</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground">
            <Download className="h-3.5 w-3.5" />
            <span>Export Roster</span>
          </Button>
        </div>
      </div>
    </div>
  );
}