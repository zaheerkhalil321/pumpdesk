import { AssetColumn } from "./AssetColumn";
import { TimeHeader } from "./TimeHeader";
import { PumpLane } from "./PumpLane";

export function ScheduleGrid() {
  return (
    <div className="flex h-full overflow-auto">

      <AssetColumn />

      <div className="flex-1">

        <TimeHeader />

        <PumpLane title="01 - 34M Boom Pump" />

        <PumpLane title="02 - 28M Boom Pump" />

        <PumpLane title="03 - Line Pump" />

      </div>

    </div>
  );
}