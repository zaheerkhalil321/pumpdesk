import { SettingsSidebar } from "@/components/settings/SettingsSidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[240px_1fr] gap-8">

      <SettingsSidebar />

      <div>
        {children}
      </div>

    </div>
  );
}