"use client"

import { Bell, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/shared/ThemeToggle"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 px-6">
      <div className="flex h-16 items-center gap-4 px-6">

        <SidebarTrigger />

        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Search jobs, companies, addresses..."
            className="pl-9"
          />
        </div>

        <Button>
          <Plus className="mr-2 size-4" />
          New Job
        </Button>

        <Button variant="ghost" size="icon">
          <Bell className="size-5" />
        </Button>

        <div className="ml-auto flex items-center gap-2">

          <ThemeToggle />

        </div>

      </div>
    </header>
  )
}