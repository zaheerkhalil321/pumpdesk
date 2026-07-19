import { ScheduleToolbar } from "@/components/schedule/ScheduleToolbar";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";

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