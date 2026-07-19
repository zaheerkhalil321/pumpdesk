import { ScheduleToolbar } from "@/features/schedule/components/ScheduleToolbar";
import { ScheduleGrid } from "@/features/schedule/components/ScheduleGrid";

export default function SchedulePage() {
  return (
    <div className="flex h-full flex-col">
      <ScheduleToolbar />

      <div className="flex-1 overflow-hidden">
        <ScheduleGrid />
      </div>
    </div>
  );
}