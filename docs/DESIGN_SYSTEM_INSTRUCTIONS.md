# PumpDesk — 2026 AI Design System & Screen Generation Engine
**Master Visual Benchmark:** FIG 1.0 — PumpDesk 1920x1080 Dispatch Control Tower Concept  
**Author:** Antigravity & Engineering Team  
**Approved by:** Jessie Black (Chief Dispatcher & Co-Founder)  
**Standard:** 2026 Layered Prompt Architecture & Reference-Anchored Consistency

---

## 1. The 2026 Industry Standard for AI UI Consistency

When generating multiple screens across an entire SaaS application using generative vision models (Gemini / Imagen 3), **style drift** is the #1 failure mode. 

To achieve **100% pixel-level visual consistency** across all tabs, we use the **"Fixed Shell vs. Variable Viewport" Layered Architecture**:

```
+=============================================================================================================+
| FIXED SHELL (PERSISTENT ON ALL TABS)                                                                        |
|  1. Top Branding: [P] PumpDesk • Dallas Metro | Real-time Operations HUD                                    |
|  2. Top Safety HUD: Wind Speed (74°F • 8mph Safe) | Daily Volume Placed (yd³) | Live Fleet Status Chips      |
|  3. Top-Level Sidebar (240px, Linear/Stripe Tier):                                                          |
|     - Workspace Switcher: [PD] PumpDesk HQ • Dallas Metro Operations                                       |
|     - DISPATCH & FLEET: Schedule (8 Active), Fleet & Telematics (15), Alerts (2), Pour Orders               |
|     - CRM & ACCOUNTS: Customers & Accounts (84), Contacts & Supers (96), Job Sites & Access (142)          |
|     - FINANCE & FIELD: Tickets & Billing, Settings                                                          |
|     - Live On-Duty Crew: 4 Live Operators (Jake Miller 38M, Carlos Rodriguez 32M, Dave Smith 47M, Tony P.) |
|     - Bottom User Card: Jessie Black, Chief Dispatcher                                                      |
+=============================================================================================================+
| VARIABLE VIEWPORT (CHANGES PER TAB)                                                                         |
|  - Active Tab State: Highlighted in crisp orange badge with soft tinted background                          |
|  - Calm, Uncluttered Header: Single primary CTA in Top HUD, zero duplicate buttons in content subheader     |
|  - Minimalist Table Rows: Subtle chevron (>) row hover actions; bulky "+ Book" buttons reserved for dossier  |
|  - Unified Dossier Layout: Left side profile & operational compliance; Right side dispatch notifications/AR|
+=============================================================================================================+
```

### The 4 Core Design Principles for Multi-Screen Consistency:
1. **Top-Level Sidebar Parity:** Every single screen uses the exact same 240px categorized sidebar architecture with identical live crew widgets and user profile dock.
2. **De-noised Single-Action Headers:** Never place two identical primary action buttons on the same screen. The Top HUD carries the global primary CTA; the subheader carries context-specific secondary actions (`Export CSV`, `Edit Customer`, `Schedule Pour`).
3. **Dossier Action Segregation:** Directory tables remain calm, readable, and clean with subtle row navigation (`>`). Heavy operational actions (`+ Schedule Pour`, `+ Assign to Pour Order`) live exclusively in the dedicated entity dossier.
4. **The Negative Constraint Invariant:** Zero emojis anywhere. Crisp vector SVGs only. 100% desktop 1920x1080 widescreen density without browser chrome frames.

---

## 2. Design Tokens & Visual DNA (Derived from FIG 1.0)

### Color Palette Tokens
| Token Name | Hex Code | Visual Application in FIG 1.0 |
| :--- | :--- | :--- |
| **`bg-canvas`** | `#F8FAFC` | Light cool gray / Slate-50 background for the whole desktop canvas |
| **`bg-surface`** | `#FFFFFF` | Crisp pure white for all cards, panels, sidebar, and modals |
| **`bg-muted`** | `#F1F5F9` | Slate-100 for secondary pill backgrounds and inactive headers |
| **`border-hairline`** | `#E2E8F0` | 1px razor-thin borders around cards, tables, and dividers |
| **`brand-accent`** | `#FF5500` / `#F97316` | Industrial safety orange: logo `M`, `+ Book Pour` CTA, active tab indicator |
| **`status-pumping`** | `#10B981` | Emerald green: `● 8 Pumping` chip, active GPS dot, `Continuous` badge |
| **`status-transit`** | `#0EA5E9` | Sky blue: `● 3 En Route` chip, `35m Transit` pill, `EN ROUTE` badge |
| **`status-washout`** | `#F59E0B` | Amber warm golden yellow: `Washout (25m)` pill with light yellow background `#FEF3C7` |
| **`status-delayed`** | `#EF4444` | Crimson red: `● 1 Delayed` chip, vertical `16:00 NOW` timeline ribbon |
| **`status-completed`**| `#0F172A` | Deep charcoal / black: `DONE` pill, `Ticket #4019 Complete` |

### Typography & Spacing
* **Font Family:** Figtree / Inter / Geist Sans (Clean, high-legibility geometric sans-serif).
* **Tabular Numbers:** Monospace/tabular figures for all times (`06:00`, `16:00`), yardage (`1,480 / 1,900 yd³`), and pressure/PSI metrics.
* **Border Radii:** `rounded-lg` (8px) for cards and modals; `rounded-full` (9999px) for status pills and avatar frames.
* **Iconography:** Monochrome minimalist SVG line icons (16px, 1.5px stroke weight). **Zero emojis.**

---

## 3. The 6 Core Tabs (Mapped Directly from Figma)

Here is how each tab maps the Figma designs into the FIG 1.0 visual layout:

| Tab Name | Sidebar Icon & Badge | Center Workspace View (52%) | Right Inspector Panel (30%) |
| :--- | :--- | :--- | :--- |
| **1. Schedule** *(FIG 1.0)* | Calendar (`8 Active` - Orange) | Horizontal Gantt timeline by boom pump & operator with time ribbons | Docked Mapbox radar + selected job inspector |
| **2. Fleet Live** | Truck (`15` - Gray) | Fleet asset grid (Putzmeister, Schwing, Alliance booms, line pumps) | Selected pump telematics, boom reach specs, maintenance log |
| **3. Pour Orders** | Clipboard (`42` - Gray) | Master jobs table with status filters (Pending, Dispatched, Done) | Order details drawer with pour specs, billing, and linked truck |
| **4. Tickets & Billing**| Receipt (`6` - Red) | Digital work tickets list & pending contractor sign-offs | Interactive certified digital ticket preview with customer signature |
| **5. CRM & Clients** | Building / Users | Commercial vs Residential contractors directory & site locations | Customer account profile, primary superintendents, credit terms |
| **6. Team & Shifts** | UserCheck (`12`) | Operator roster & weekly timesheet grid (travel, pump, overtime) | Operator profile card, CDL license, boom certifications, time-off |

---

## 4. Master Prompt Templates for Every Tab (Ready for Gemini)

> **Pro-Tip for Gemini:** Always upload **FIG 1.0** as the reference image, paste the master prompt for the desired tab, and ensure the prompt specifies: *"Keep the identical layout frame, sidebar, and top HUD from the reference image, only modifying the active tab state and workspace contents."*

---

### TAB 2: Fleet Live (Assets & Equipment Command)
```text
High-fidelity modern SaaS web application UI mockup, 1920x1080 widescreen desktop view.
Reference Style: Must strictly match the visual DNA of the attached reference image (FIG 1.0) — identical crisp off-white background (#F8FAFC), pure white cards (#FFFFFF) with 1px hairline borders (#E2E8F0), Figtree/Inter typography, and safety orange accents (#FF5500).

Layout Structure:
1. TOP SAFETY HUD: Identical to reference image — Wind speed safety gauge (74°F • 8 mph Safe to Pour), Daily volume placed (1,480 / 1,900 yd³), and live status chips (● 8 Pumping, ● 3 En Route, ● 1 Delayed), with top-right orange "+ Add New Pump" button.
2. LEFT SIDEBAR: Identical to reference image, but now "Fleet Live" is ACTIVE with an orange highlighted pill and badge "15". Other links (Schedule, Alerts, Pour Orders, Tickets & Billing, Telematics) are inactive. Bottom profile card: "Jessie Black, Chief Dispatcher".
3. MAIN WORKSPACE (52% width) — "Fleet & Equipment Command":
   - Filter bar: Search input ("Search truck unit or boom..."), tab pills ("All Equipment (15)", "Boom Pumps (11)", "Line Pumps (3)", "Support (1)").
   - 3-Column Grid of Sleek Fleet Asset Cards:
     * Card 1: "01 - 38M Putzmeister" (5-Section Roll-and-Fold), Status: Green pill "PUMPING (Turner Constr)", Chassis: Mack Granite, Pump Hours: 2,410 hrs, Assigned Driver: Jake Miller (avatar), Inspection: DOT Passed (Expires Nov 2026).
     * Card 2: "02 - 32M Schwing" (4-Section R-Fold), Status: Blue pill "EN ROUTE (Mortenson)", Chassis: Peterbilt, Pump Hours: 1,890 hrs, Assigned Driver: Carlos Rodriguez.
     * Card 3: "03 - 47M Alliance" (5-Section RZ Long Reach), Status: Gray pill "STANDBY / YARD", Chassis: Kenworth, Pump Hours: 3,120 hrs, Assigned Driver: Dave Smith.
     * Card 4: "04 - 28M Schwing" (Compact City Boom), Status: Purple pill "SCHEDULED 14:00", Chassis: Freightliner.
     * Card 5: "LP - 01 Line Pump" (Reed B50 Heavy Duty), Status: Green pill "AVAILABLE", Hours: 940 hrs.
4. RIGHT INSPECTOR (30% width) — "Equipment Inspector: 01 - 38M Putzmeister":
   - Technical Boom Reach Vector Diagram (showing 37.5m vertical reach, 33.1m horizontal reach, 4-stage outrigger spread).
   - Real-time Health Telematics: Hydraulic Pressure (210 bar), Oil Temp (145°F), Boom Wear Index (92% Good).
   - Maintenance Timeline: Last 250hr Service (12 days ago), Next Boom Ultrasonic Test Due (in 45 days).
   - Action Button: Full-width dark button "Schedule Maintenance & Inspection".

STRICT RULES: Absolutely NO emojis anywhere. High density, professional industrial concrete pumping SaaS aesthetic, identical color scheme and styling to reference image.
```

---

### TAB 3: Pour Orders (Master Jobs & Booking Directory)
```text
High-fidelity modern SaaS web application UI mockup, 1920x1080 widescreen desktop view.
Reference Style: Must strictly match the visual DNA of the attached reference image (FIG 1.0) — identical crisp off-white background (#F8FAFC), pure white cards (#FFFFFF) with 1px hairline borders (#E2E8F0), typography, and safety orange accents (#FF5500).

Layout Structure:
1. TOP SAFETY HUD: Identical to reference image — Wind speed safety gauge (74°F • 8 mph Safe to Pour), Daily volume placed (1,480 / 1,900 yd³), and live status chips (● 8 Pumping, ● 3 En Route, ● 1 Delayed), with top-right orange "+ Book Pour Event" button.
2. LEFT SIDEBAR: Identical to reference image, but now "Pour Orders" is ACTIVE with an orange highlighted pill and badge "42". Bottom profile card: "Jessie Black, Chief Dispatcher".
3. MAIN WORKSPACE (52% width) — "Master Pour Orders Directory":
   - Top Controls: Search bar ("Search contractor, PO #, address..."), Date Range picker ("Sep 12 – Sep 18, 2026"), Status filters ("All", "Pending Confirmation", "Dispatched", "In Progress", "Completed", "Invoiced").
   - High-Density Data Table (sleek white container with 1px border #E2E8F0):
     * Row 1: Order #1518 | Turner Constr. | Slab L4 (Commercial Tower) | 180 yd³ | 38M Putzmeister (Jake Miller) | 06:30 AM | Status: Emerald badge "PUMPING" | $1,815.00
     * Row 2: Order #1519 | Mortenson | Medical Deck | 340 yd³ | 32M Schwing (Carlos Rodriguez) | 08:00 AM | Status: Sky Blue badge "EN ROUTE" | $3,450.00
     * Row 3: Order #1520 | Beck Group | Pier Caps | 190 yd³ | 47M Alliance (Dave Smith) | 11:00 AM | Status: Indigo badge "CONFIRMED" | $2,100.00
     * Row 4: Order #1521 | DPR Constr. | Footings (Plant #4) | 120 yd³ | 38M Putzmeister | 14:30 PM | Status: Amber badge "NEEDS OPERATOR" | $1,320.00
     * Row 5: Order #1515 | Residential | Pool Shell (Shotcrete) | 45 yd³ | LP-01 Line Pump (Tony Perez) | 07:00 AM | Status: Dark slate badge "COMPLETED" | $850.00
4. RIGHT INSPECTOR (30% width) — "Order Summary: ORD 1518 (Turner Construction)":
   - Order Status Stepper: Dispatched -> En Route -> On Site -> Pumping (Active) -> Washout -> Completed.
   - Job Specifications Box: 4,000 PSI • 3/4" Rock Slump, ReadyMix Supplier Plant #4, 150 ft extra hose required.
   - Site Contact Details: Mike Vance (Superintendent) • (555) 019-2841 • Gate B access code #4490.
   - Live Yardage Placement Gauge: Radial progress showing "135 / 180 yd³ placed (75%)".
   - Primary Action Button: Dark slate button "Direct Call Superintendent (Mike Vance)".

STRICT RULES: Absolutely NO emojis anywhere. High data density, crisp borders, identical typography and spacing to reference image.
```

---

### TAB 4: Tickets & Billing (Digital Work Tickets & Sign-offs)
```text
High-fidelity modern SaaS web application UI mockup, 1920x1080 widescreen desktop view.
Reference Style: Must strictly match the visual DNA of the attached reference image (FIG 1.0) — identical crisp off-white background (#F8FAFC), pure white cards (#FFFFFF) with 1px hairline borders (#E2E8F0), typography, and safety orange accents (#FF5500).

Layout Structure:
1. TOP SAFETY HUD: Identical to reference image — Top wind speed meter, volume progress bar, status chips, with orange button "+ Create Custom Ticket".
2. LEFT SIDEBAR: Identical to reference image, but now "Tickets & Billing" is ACTIVE with an orange highlighted pill and red badge "6 Pending". Bottom profile: "Jessie Black, Chief Dispatcher".
3. MAIN WORKSPACE (52% width) — "Completed Work Tickets & Invoicing Queue":
   - Filter Tabs: "All Tickets", "Pending Sign-off (6)", "Ready to Invoice (14)", "Invoiced (85)", "Paid".
   - Ticket List Cards:
     * Card 1: Ticket #4019 • Residential Pool Shell (Tony Perez - LP-01), 45 yd³, Completed 11:30 AM, Status: Green badge "SIGNED BY CUSTOMER", Total: $850.00.
     * Card 2: Ticket #4018 • Turner Constr. Slab L4 (Jake Miller - 38M), 180 yd³, Status: Orange badge "PENDING SUPERINTENDENT SIGNATURE", Estimated: $1,815.00.
     * Card 3: Ticket #4017 • DPR Parking Garage (Sam Watson - 28M), 110 yd³, Status: Dark badge "READY FOR QUICKBOOKS EXPORT", Total: $1,420.00.
     * Card 4: Ticket #4016 • Austin Commercial Pier (Carlos Rodriguez), 95 yd³, Status: Green badge "PAID VIA ACH", Total: $1,180.00.
4. RIGHT INSPECTOR (30% width) — "Official Digital Pour Ticket Preview (#4019)":
   - Clean digital replica of an official concrete pumping field ticket.
   - Header: Midcoast / Concrete PumpDesk logo, Order #1515, Date: Sat Sep 12, 2026.
   - Time Table: Yard Out: 06:15 AM | Site In: 06:50 AM | Pour Start: 07:15 AM | Pour Done: 10:45 AM | Yard In: 11:30 AM | Total Billed: 5.25 hrs.
   - Line Items Table: Base Pumping Fee (4hr min: $600), Excess Hours (1.25 hrs @ $150: $187.50), Extra Hose (100ft: $62.50). Total: $850.00.
   - Verified Sign-off Box: Stylus signature on file ("Dave Reynolds, Site Super"), GPS verified at 32.7767° N, 96.7970° W.
   - Bottom Action: Safety orange button "Export Certified PDF & Sync to QuickBooks".

STRICT RULES: Absolutely NO emojis anywhere. Clean lines, realistic professional digital invoice/ticket document layout, identical colors to reference image.
```

---

### TAB 5: CRM & Clients (Customers & Job Sites Directory)
```text
High-fidelity modern SaaS web application UI mockup, 1920x1080 widescreen desktop view.
Reference Style: Must strictly match the visual DNA of the attached reference image (FIG 1.0) — identical crisp off-white background (#F8FAFC), pure white cards (#FFFFFF) with 1px hairline borders (#E2E8F0), typography, and safety orange accents (#FF5500).

Layout Structure:
1. TOP SAFETY HUD: Identical to reference image — Top wind safety, daily volume, status chips, with orange button "+ Add Customer Account".
2. LEFT SIDEBAR: Identical to reference image, but with a "Customers & Sites" active orange pill. Bottom profile: "Jessie Black, Chief Dispatcher".
3. MAIN WORKSPACE (52% width) — "Customer Directory & Accounts":
   - Search & Filter: Search bar ("Search contractor, company, contact..."), Account type pills ("All Accounts (84)", "Commercial General Contractors (48)", "Residential & Pools (36)").
   - Customer Account Cards:
     * Card 1: Turner Construction | Commercial GC | 14 Active Pours this month | Net 30 Terms ($142,000 YTD) | Status: Green dot "Credit Approved" | Primary: Mike Vance.
     * Card 2: Mortenson Construction | Commercial Infrastructure | 8 Active Pours | Net 30 Terms ($89,500 YTD) | Status: Green dot "Active".
     * Card 3: Beck Group | Commercial High-Rise | 5 Active Pours | Net 15 Terms ($64,000 YTD) | Status: Green dot "Active".
     * Card 4: DPR Construction | Industrial & Medical | 11 Active Pours | Net 30 Terms ($118,000 YTD) | Status: Green dot "Active".
4. RIGHT INSPECTOR (30% width) — "Customer Profile: Turner Construction":
   - Company Overview: Headquarters address, tax ID, assigned account tier ("Platinum Contractor - 10% Boom Discount").
   - Frequent Job Sites: "Downtown Tower 4 (4401 Elm St)", "Medical Plaza Phase 2", "Northway Overpass".
   - Key Site Superintendents: Mike Vance (555-019-2841), Sarah Jenkins (555-019-3320).
   - Recent Pour History list and Billing health rating.
   - Primary Action Button: "Book Pour for Turner Construction" in safety orange.

STRICT RULES: Absolutely NO emojis anywhere. High data density, clean typography, identical styling to reference image.
```

---

### TAB 6: Team & Timesheets (Operators, Certifications & Hours)
```text
High-fidelity modern SaaS web application UI mockup, 1920x1080 widescreen desktop view.
Reference Style: Must strictly match the visual DNA of the attached reference image (FIG 1.0) — identical crisp off-white background (#F8FAFC), pure white cards (#FFFFFF) with 1px hairline borders (#E2E8F0), typography, and safety orange accents (#FF5500).

Layout Structure:
1. TOP SAFETY HUD: Identical to reference image — Top safety weather HUD, volume progress bar, status chips, with orange button "+ Add Team Member".
2. LEFT SIDEBAR: Identical to reference image, but with "Team & Operators" active with orange badge "12". Bottom profile: "Jessie Black, Chief Dispatcher".
3. MAIN WORKSPACE (52% width) — "Operator Roster & Digital Timesheets":
   - Weekly Date Bar: "Week of Sep 7 – Sep 13, 2026", view toggles ("Roster", "Weekly Timesheet Grid", "Time Off Requests (2)").
   - Operator Timesheet Rows:
     * Row 1: Jake Miller (Lead Boom Operator) | Mon: 8.5h | Tue: 9.0h | Wed: 10.5h (2h OT) | Thu: 8.0h | Fri: 8.5h | Sat: 6.0h | Total: 50.5 hrs | Status: Green "Approved"
     * Row 2: Carlos Rodriguez (Boom Operator - 32M) | Mon: 8.0h | Tue: 8.0h | Wed: 8.0h | Thu: 9.5h | Fri: 8.0h | Sat: Off | Total: 41.5 hrs | Status: Green "Approved"
     * Row 3: Dave Smith (Heavy Boom Operator - 47M) | Mon: 10.0h | Tue: 10.0h | Wed: 8.0h | Thu: 8.0h | Fri: 8.0h | Sat: Off | Total: 44.0 hrs | Status: Orange "Pending Approval"
     * Row 4: Tony Perez (Line Pump Specialist) | Mon: 7.5h | Tue: 8.0h | Wed: 8.0h | Thu: 7.5h | Fri: 8.0h | Sat: 5.5h | Total: 44.5 hrs | Status: Green "Approved"
4. RIGHT INSPECTOR (30% width) — "Operator Profile: Jake Miller":
   - Circular photo avatar, "Jake Miller", badge "Lead Boom Operator • 8 Yrs Experience", phone, email.
   - Qualifications: ACPA Certified Boom Operator (Expires 2028), Class A CDL with Air Brakes (Valid), 10hr OSHA Safety Card.
   - Assigned Primary Rig: "01 - 38M Putzmeister" (Clean safety record, 0 incidents in 24 months).
   - This Week's Pay Hours Breakdown: Regular (40.0 hrs), Overtime 1.5x (10.5 hrs), Travel Time (6.2 hrs).
   - Action Button: Dark slate button "Approve Timesheet & Send to Payroll".

STRICT RULES: Absolutely NO emojis anywhere. High data density, clean typography, identical styling to reference image.
```

---

## 5. Workflow Execution Checklist for You

When you generate the next image in Gemini:
1. **Open Gemini** (or your image generation workspace).
2. **Attach FIG 1.0** as the reference image.
3. **Copy the prompt** for the tab you want to generate (e.g., Tab 2: Fleet Live).
4. **Inspect the output against this checklist:**
   - [ ] Is the canvas 1920x1080 light mode?
   - [ ] Is the left sidebar identical, with only the active tab highlighted in orange?
   - [ ] Is the top safety HUD (wind speed, daily volume) identical to FIG 1.0?
   - [ ] Is the Jessie Black profile card present at bottom left?
   - [ ] Are there **zero emojis**?
   - [ ] Do cards have the same soft corners and 1px borders?

By following this exact protocol, all 6 tabs will flow together as a single, unified, breathtaking SaaS product that will blow Jessie away!
