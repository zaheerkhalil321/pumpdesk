import { cn } from "@/lib/utils";

type PageProps = {
  children: React.ReactNode;
  className?: string;
};

export function Page({
  children,
  className,
}: PageProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-6 p-6",
        className
      )}
    >
      {children}
    </div>
  );
}