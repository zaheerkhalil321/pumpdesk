import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <main className="flex-1 overflow-auto bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}