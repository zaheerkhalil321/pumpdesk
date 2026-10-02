import { Truck, Plus, Wrench, ShieldCheck, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const mockPumps = [
  {
    id: "PUMP-01",
    asset: "01 - 34M Putzmeister Boom",
    make: "Putzmeister 34Z",
    year: "2023",
    boomLength: "111 ft (34M)",
    assignedOperator: "Jake Miller",
    hourlyRate: "$195 / hr",
    minHours: "4.0 hrs",
    status: "Active (Pumping)",
    statusVariant: "active",
  },
  {
    id: "PUMP-02",
    asset: "02 - 28M Putzmeister Boom",
    make: "Putzmeister 28Z",
    year: "2021",
    boomLength: "91 ft (28M)",
    assignedOperator: "Carlos Rodriguez",
    hourlyRate: "$175 / hr",
    minHours: "4.0 hrs",
    status: "Active (En Route)",
    statusVariant: "active",
  },
  {
    id: "PUMP-03",
    asset: "03 - 47M Schwing Boom",
    make: "Schwing S 47 SX",
    year: "2024",
    boomLength: "154 ft (47M)",
    assignedOperator: "Dave Smith",
    hourlyRate: "$245 / hr",
    minHours: "4.0 hrs",
    status: "Active (Pumping)",
    statusVariant: "active",
  },
  {
    id: "PUMP-04",
    asset: "04 - Trailer Line Pump",
    make: "Reed B50",
    year: "2022",
    boomLength: "Ground Line (500ft)",
    assignedOperator: "Tony P.",
    hourlyRate: "$145 / hr",
    minHours: "4.0 hrs",
    status: "Standby (In Yard)",
    statusVariant: "standby",
  },
  {
    id: "PUMP-05",
    asset: "05 - 38M Putzmeister Boom",
    make: "Putzmeister 38Z-5",
    year: "2020",
    boomLength: "123 ft (38M)",
    assignedOperator: "Unassigned",
    hourlyRate: "$210 / hr",
    minHours: "4.0 hrs",
    status: "Maintenance (Hydraulics)",
    statusVariant: "maintenance",
  },
];

export default function PumpsPage() {
  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* 1. HEADER */}
      <PageHeader
        title="Fleet & Equipment"
        description="Manage boom pump trucks, trailer line pumps, and equipment maintenance status."
        actions={
          <Button variant="brand" size="sm" className="font-semibold gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add New Rig</span>
          </Button>
        }
      />

      {/* 2. FILTER & SEARCH */}
      <div className="flex items-center justify-between gap-4 bg-card p-3 rounded-md border border-border">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by asset number, boom reach, model..."
              className="h-8 pl-9 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>4 / 5 Rigs DOT Compliant</span>
          </span>
        </div>
      </div>

      {/* 3. PUMPS TABLE */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border">
              <TableHead className="text-xs font-bold text-muted-foreground">Rig Asset & Model</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Boom Reach</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Assigned Operator</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Base Hourly Rate</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">Minimum Charge</TableHead>
              <TableHead className="w-36 text-right text-xs font-bold text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {mockPumps.map((pump) => (
              <TableRow key={pump.id} className="hover:bg-muted/20 transition-colors cursor-pointer border-border group">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-foreground font-semibold text-xs border border-border">
                      <Truck className="h-4 w-4 text-brand" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-foreground group-hover:text-brand transition-colors">
                        {pump.asset}
                      </span>
                      <span className="text-[10.5px] text-muted-foreground">{pump.make} ({pump.year})</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono font-medium text-foreground">
                  {pump.boomLength}
                </TableCell>
                <TableCell className="text-xs text-foreground font-medium">
                  {pump.assignedOperator}
                </TableCell>
                <TableCell className="text-xs font-mono font-semibold text-foreground">
                  {pump.hourlyRate}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {pump.minHours}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                      pump.statusVariant === "active"
                        ? "bg-brand-light text-brand border border-brand/25"
                        : pump.statusVariant === "maintenance"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {pump.statusVariant === "maintenance" && <Wrench className="h-3 w-3 mr-1 inline" />}
                    ● {pump.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 4. FOOTER */}
        <div className="p-3 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
          <span>Total 5 Fleet Assets registered</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground">
            <Download className="h-3.5 w-3.5" />
            <span>Export Fleet Specs</span>
          </Button>
        </div>
      </div>
    </div>
  );
}