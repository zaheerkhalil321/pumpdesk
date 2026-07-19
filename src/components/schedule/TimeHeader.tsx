const hours = Array.from({ length: 18 }, (_, i) => i + 6);

export function TimeHeader() {
  return (
    <div className="sticky top-0 z-10 flex h-14 border-b bg-background">

      {hours.map((hour) => (
        <div
          key={hour}
          className="flex w-36 items-center justify-center border-r text-sm font-medium"
        >
          {hour}:00
        </div>
      ))}

    </div>
  );
}