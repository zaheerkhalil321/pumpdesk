type Props = {
  title: string;
};

const hours = Array.from({ length: 18 }, (_, i) => i + 6);

export function PumpLane({ title }: Props) {
  return (
    <div className="relative flex h-40 border-b">

      {hours.map((hour) => (
        <div
          key={hour}
          className="w-36 border-r"
        />
      ))}

      <div className="absolute left-4 top-4 rounded-lg border bg-white p-4 shadow">

        <div className="font-semibold">
          Sample Job
        </div>

        <div className="text-sm text-muted-foreground">
          11:00 AM
        </div>

      </div>

    </div>
  );
}