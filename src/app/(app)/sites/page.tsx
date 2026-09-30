import { Metadata } from "next";
import { MapPin, Plus, Search, Building2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Job Sites & Access Directory | PumpDesk",
  description: "Concrete delivery access points, gate codes, and washout coordinates",
};

interface JobSite {
  id: string;
  name: string;
  customerName: string;
  address: string;
  city: string;
  gateCode: string;
  washoutLocation: string;
  pourCount: number;
  status: "Active" | "Completed" | "Pending";
}

const mockJobSites: JobSite[] = [
  {
    id: "SITE-01",
    name: "Rockland Harbor Pier - Berth 4",
    customerName: "Accurate Concrete Inc",
    address: "42 Water Street",
    city: "Rockland, ME",
    gateCode: "#4920",
    washoutLocation: "North corner retention basin behind pump #2",
    pourCount: 14,
    status: "Active",
  },
  {
    id: "SITE-02",
    name: "Camden Hills High Performing Arts Wing",
    customerName: "Turner Construction TX",
    address: "25 Keelson Drive",
    city: "Camden, ME",
    gateCode: "Gate B (Badge Access)",
    washoutLocation: "Designated plastic-lined washout pit at South Gate",
    pourCount: 8,
    status: "Active",
  },
  {
    id: "SITE-03",
    name: "Midcoast Logistics Distribution Center",
    customerName: "Mortenson Pumping",
    address: "100 Industrial Parkway",
    city: "Warren, ME",
    gateCode: "#8812 (Call Jessie on arrival)",
    washoutLocation: "Portable washout container on East lot",
    pourCount: 22,
    status: "Active",
  },
  {
    id: "SITE-04",
    name: "Belfast Bay Medical Facility Foundation",
    customerName: "DPR Industrial Corp",
    address: "18 Northport Avenue",
    city: "Belfast, ME",
    gateCode: "#1140",
    washoutLocation: "Behind contractor trailer #3",
    pourCount: 5,
    status: "Pending",
  },
];

export default function JobSitesPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <MapPin className="h-6 w-6 text-[#0D7A7F]" />
            Job Sites & Pour Locations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Site access instructions, gate codes, and washout coordinates for Midcoast Concrete Pumping.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button className="bg-[#0D7A7F] hover:bg-[#0A6266] text-white shadow-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Job Site
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search job site, customer, gate code..."
            className="pl-9 bg-background/50 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-center">
          <span className="font-semibold text-foreground">{mockJobSites.length}</span> active job sites tracked
        </div>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockJobSites.map((site) => (
          <div
            key={site.id}
            className="bg-card rounded-xl border border-border p-5 hover:border-[#0D7A7F]/40 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-[11px] font-mono font-medium text-[#0D7A7F] bg-[#E6F7F5] px-2 py-0.5 rounded-md">
                    {site.id}
                  </span>
                  <h3 className="font-semibold text-foreground text-base mt-1.5">
                    {site.name}
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {site.status}
                </span>
              </div>

              <div className="space-y-2 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                  <span className="font-medium text-foreground">{site.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                  <span>{site.address}, {site.city}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/40 p-2.5 rounded-lg">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Gate Code</p>
                  <p className="font-mono font-semibold text-foreground mt-0.5">{site.gateCode}</p>
                </div>
                <div className="bg-muted/40 p-2.5 rounded-lg">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pours Completed</p>
                  <p className="font-semibold text-foreground mt-0.5">{site.pourCount} Pours</p>
                </div>
              </div>

              <div className="mt-3 bg-amber-50/60 border border-amber-200/60 p-2.5 rounded-lg text-[11px] text-amber-900">
                <span className="font-semibold">Washout Pit:</span> {site.washoutLocation}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
