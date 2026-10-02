import {
  CalendarDays,
  ClipboardList,
  Building2,
  Truck,
  Users,
  Receipt,
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
    title: "Customers",
    href: "/customers",
    icon: Building2,
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