import {
  CalendarDays,
  ClipboardList,
  Building2,
  Truck,
  Users,
  Receipt,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NavigationItem = {
  title: string
  href: string
  icon: LucideIcon
}

export const navigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Schedule",
    href: "/schedule",
    icon: CalendarDays,
  },
  {
    title: "Jobs",
    href: "/jobs",
    icon: ClipboardList,
  },
  {
    title: "Pumps",
    href: "/pumps",
    icon: Truck,
  },
  {
    title: "Operators",
    href: "/operators",
    icon: Users,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: Receipt,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]