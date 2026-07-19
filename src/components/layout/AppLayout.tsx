import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppHeader } from "./AppHeader"
import { AppSidebar } from "./AppSidebar"

type Props = {
  children: React.ReactNode
}

export function AppLayout({ children }: Props) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="flex h-screen flex-col overflow-hidden">

        <AppHeader />

        <main className="flex-1 overflow-auto">
          {children}
        </main>

      </SidebarInset>
    </SidebarProvider>
  )
}