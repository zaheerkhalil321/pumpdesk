import { Calendar, Filter, ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockPumps = [
  { id: "P-01", name: "01 - 34M Putzmeister Boom", operator: "Jake Miller", status: "active" },
  { id: "P-02", name: "02 - 28M Putzmeister Boom", operator: "Carlos Rodriguez", status: "active" },
  { id: "P-03", name: "03 - 47M Schwing Boom", operator: "Dave Smith", status: "active" },
  { id: "P-04", name: "04 - Trailer Line Pump", operator: "Tony P.", status: "standby" },
];

const mockTimelineHours = [
  "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM"
];

const mockOrders = [
  {
    id: "ORD-1518",
    pumpId: "P-01",
    customer: "Turner Construction",
    site: "Dallas Medical Tower",
    startHour: 6.5,
    durationHours: 4.5,
    status: "pumping",
    yards: "280 yd³",
  },
  {
    id: "ORD-1519",
    pumpId: "P-02",
    customer: "Accurate Concrete",
    site: "I-35 Bridge Deck",
    startHour: 7.0,
    durationHours: 3.0,
    status: "en_route",
    yards: "150 yd³",
  },
  {
    id: "ORD-1520",
    pumpId: "P-03",
    customer: "Top Tier Builders",
    site: "Plano Distribution Hub",
    startHour: 5.5,
    durationHours: 5.0,
    status: "pumping",
    yards: "420 yd³",
  },
];

export default function SchedulePage() {
  return (
    <div className="flex flex-col h-full bg-background select-none">
      {/* 1. SCHEDULE CONTROL BAR */}
      <div className="h-13 px-6 border-b border-border bg-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-md border border-border">
            <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-semibold text-foreground">
              Today &bull; Saturday, Sep 12, 2026
            </span>
          </div>

          <div className="flex items-center border border-border rounded-md bg-muted/40">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none rounded-l-md">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs font-medium px-2 rounded-none">
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none rounded-r-md">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="h-8 text-xs font-medium gap-1.5 border-border">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Filter Rigs (4/4)</span>
          </Button>

          <Button size="sm" className="h-8 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold gap-1.5 shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            <span>Quick Book (15s)</span>
          </Button>
        </div>
      </div>

      {/* 2. GANTT TIMELINE GRID */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* TIME HEADER ROW */}
        <div className="flex border-b border-border bg-muted/30 sticky top-0 z-20">
          <div className="w-64 shrink-0 px-4 py-2 border-r border-border font-semibold text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-orange-600" />
            <span>Asset & Operator</span>
          </div>
          <div className="flex-1 grid grid-cols-12 min-w-[960px]">
            {mockTimelineHours.map((hour) => (
              <div
                key={hour}
                className="px-2 py-2 text-center text-[10.5px] font-semibold text-muted-foreground border-r border-border/60"
              >
                {hour}
              </div>
            ))}
          </div>
        </div>

        {/* PUMP LANES */}
        <div className="divide-y divide-border flex-1">
          {mockPumps.map((pump) => {
            const pumpOrders = mockOrders.filter((o) => o.pumpId === pump.id);

            return (
              <div key={pump.id} className="flex min-h-[90px] relative group hover:bg-muted/10 transition-colors">
                {/* RIG HEADER COLUMN */}
                <div className="w-64 shrink-0 p-3.5 border-r border-border bg-card flex flex-col justify-center sticky left-0 z-10">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground tracking-tight">
                      {pump.name}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Operator: <strong className="text-foreground font-medium">{pump.operator}</strong>
                  </span>
                </div>

                {/* TIMELINE GRID CELLS */}
                <div className="flex-1 grid grid-cols-12 min-w-[960px] relative">
                  {mockTimelineHours.map((h, i) => (
                    <div
                      key={i}
                      className="border-r border-border/40 h-full"
                    />
                  ))}

                  {/* RENDERED ORDERS */}
                  {pumpOrders.map((order) => {
                    // Start relative to 5:00 AM (0 hours)
                    const leftPercent = ((order.startHour - 5) / 12) * 100;
                    const widthPercent = (order.durationHours / 12) * 100;

                    return (
                      <div
                        key={order.id}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                        className="absolute top-2.5 bottom-2.5 rounded-lg border border-orange-500/30 bg-orange-500/10 dark:bg-orange-950/40 p-2.5 shadow-xs flex flex-col justify-between cursor-pointer hover:border-orange-500 transition-all z-10"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-foreground truncate">
                            {order.customer}
                          </span>
                          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-mono">
                            {order.id}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="truncate">{order.site}</span>
                          <span className="font-semibold text-foreground">{order.yards}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}