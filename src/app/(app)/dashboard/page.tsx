import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList, Building2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* 1. WELCOME HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          Welcome to PumpDesk Dispatch
        </h1>
        <p className="text-xs text-muted-foreground">
          Real-time operations control tower for Midcoast Concrete Pumping.
        </p>
      </div>

      {/* 2. QUICK LAUNCH TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/schedule"
          className="p-4 rounded-lg border border-border bg-card hover:border-orange-500/50 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <div className="h-8 w-8 rounded-md bg-orange-600/10 text-orange-600 flex items-center justify-center font-bold">
              <CalendarDays className="h-4 w-4" />
            </div>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 group-hover:text-orange-600 transition-all" />
          </div>
          <div className="font-semibold text-sm text-foreground">Schedule Board</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Gantt timeline & real-time asset lanes.
          </p>
        </Link>

        <Link
          href="/orders"
          className="p-4 rounded-lg border border-border bg-card hover:border-orange-500/50 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <div className="h-8 w-8 rounded-md bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <ClipboardList className="h-4 w-4" />
            </div>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
          </div>
          <div className="font-semibold text-sm text-foreground">Pour Orders</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Master bookings, tickets & pour volume.
          </p>
        </Link>

        <Link
          href="/customers"
          className="p-4 rounded-lg border border-border bg-card hover:border-orange-500/50 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <div className="h-8 w-8 rounded-md bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
              <Building2 className="h-4 w-4" />
            </div>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
          </div>
          <div className="font-semibold text-sm text-foreground">Customers & Sites</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Builder accounts, gate codes & credit terms.
          </p>
        </Link>

        <Link
          href="/pumps"
          className="p-4 rounded-lg border border-border bg-card hover:border-orange-500/50 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <div className="h-8 w-8 rounded-md bg-amber-600/10 text-amber-600 flex items-center justify-center font-bold">
              <Truck className="h-4 w-4" />
            </div>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 group-hover:text-amber-600 transition-all" />
          </div>
          <div className="font-semibold text-sm text-foreground">Fleet & Equipment</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Boom reaches, DOT compliance & rigs.
          </p>
        </Link>
      </div>

      {/* 3. PRIMARY ACTION BANNER */}
      <div className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-foreground">
            Ready to dispatch today&apos;s concrete pours?
          </div>
          <div className="text-[11px] text-muted-foreground">
            8 pours scheduled today across Dallas Metro.
          </div>
        </div>
        <Link href="/schedule">
          <Button size="sm" className="h-8 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold">
            Open Schedule Timeline
          </Button>
        </Link>
      </div>
    </div>
  );
}
