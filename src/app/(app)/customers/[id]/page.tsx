import Link from "next/link";
import { ArrowLeft, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* 1. BACK LINK & HEADER */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Customers</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Turner Construction</h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-xs font-bold">
              Commercial Tier 1
            </span>
          </div>
        </div>

        <Button size="sm" className="h-9 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>+ Book Pour for Customer</span>
        </Button>
      </div>

      {/* 2. DISPATCH OPERATIONAL NOTES BANNER */}
      <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[11px] bg-amber-500/20 px-2 py-0.5 rounded">
            DISPATCH NOTICE
          </span>
          <span>Mike Vance is lead on Dallas Tower. Always send 4&quot; slickline snap clamps. Check gate code #4821 before 6:00 AM dispatch.</span>
        </div>
      </div>

      {/* 3. TWO-COLUMN DOSSIER LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Profile & Key Supers */}
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Account Overview</h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Account ID:</span>
                <span className="font-mono font-medium text-foreground">{id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Terms:</span>
                <span className="font-medium text-foreground">Net 30 ($100k Limit)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Credit Status:</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Good Standing
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Key Superintendents</h2>
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded border border-border bg-muted/20">
                <div className="font-semibold text-foreground">Mike Vance</div>
                <div className="text-muted-foreground text-[11px]">Lead Field Super &bull; (972) 555-8834</div>
              </div>
              <div className="p-2.5 rounded border border-border bg-muted/20">
                <div className="font-semibold text-foreground">Dave Miller</div>
                <div className="text-muted-foreground text-[11px]">Assistant Super &bull; (214) 555-4411</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Job Sites & Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Authorized Job Sites (4)</h2>
              <Button variant="ghost" size="sm" className="h-6 text-[11px] text-orange-600 font-semibold">
                + Add Site
              </Button>
            </div>
            <div className="divide-y divide-border text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">Dallas Medical Tower</div>
                  <div className="text-muted-foreground text-[11px]">1400 Stemmons Fwy, Dallas &bull; Gate Code: #4821</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Active
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">Irving Logistics Plaza</div>
                  <div className="text-muted-foreground text-[11px]">8801 Valley View Ln, Irving &bull; Washout: South Pit</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent Pour Orders</h2>
            <div className="divide-y divide-border text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-foreground">ORD-1518</span>
                  <span className="text-muted-foreground ml-2">Dallas Medical Tower (280 yd³)</span>
                </div>
                <span className="text-[10.5px] font-bold text-emerald-600">● Pumping Now</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-foreground">ORD-1492</span>
                  <span className="text-muted-foreground ml-2">Dallas Medical Tower (190 yd³)</span>
                </div>
                <span className="text-[10.5px] font-bold text-muted-foreground">● Complete ($1,420)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}