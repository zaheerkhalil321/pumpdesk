import { Building2, Save, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Company Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage Midcoast Concrete Pumping operational profile, rate defaults, and dispatch rules.
          </p>
        </div>

        <Button size="sm" className="h-9 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold gap-1.5 shadow-sm">
          <Save className="h-3.5 w-3.5" />
          <span>Save Changes</span>
        </Button>
      </div>

      {/* 2. COMPANY PROFILE CARD */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <Building2 className="h-4 w-4 text-orange-600" />
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Company Identity & Yard</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Legal Company Name</label>
            <Input defaultValue="Midcoast Concrete Pumping, LLC" className="h-8 text-xs bg-muted/20 border-border" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Primary Operating Yard Address</label>
            <Input defaultValue="4819 Industrial Blvd, Dallas, TX 75207" className="h-8 text-xs bg-muted/20 border-border" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Dispatch Phone Hotline</label>
            <Input defaultValue="(214) 555-PUMP (7867)" className="h-8 text-xs bg-muted/20 border-border" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Accounts & Invoicing Email</label>
            <Input defaultValue="billing@midcoastpumping.com" className="h-8 text-xs bg-muted/20 border-border" />
          </div>
        </div>
      </div>

      {/* 3. DISPATCH & PRICING DEFAULTS */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <DollarSign className="h-4 w-4 text-orange-600" />
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Default Rate Presets</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Standard Minimum Hours</label>
            <Input defaultValue="4.0 Hours" className="h-8 text-xs bg-muted/20 border-border font-mono" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Port-to-Port Travel Rate</label>
            <Input defaultValue="$110 / Hour" className="h-8 text-xs bg-muted/20 border-border font-mono" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Volume Surcharge (Over Minimum)</label>
            <Input defaultValue="$0.75 / yd³" className="h-8 text-xs bg-muted/20 border-border font-mono" />
          </div>
        </div>
      </div>
    </div>
  );
}