"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Plus } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { Button } from "@/components/ui/button"

import { navigation } from "@/lib/navigation"

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="block">
          <h2 className="text-xl font-bold">PumpDesk</h2>
          <p className="text-xs text-muted-foreground">
            Concrete Pumping OS
          </p>
        </Link>

        <Link href="/jobs/new" className="mt-4 block">
          <Button className="w-full">
            <Plus className="size-4" />
            New Job
          </Button>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div>
          <p className="text-sm font-medium">Jessie Black</p>
          <p className="text-xs text-muted-foreground">
            Administrator
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
