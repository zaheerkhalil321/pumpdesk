import { cn } from "@/lib/utils";

type PageHeaderProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageHeader({
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        className
      )}
    >
      {children}
    </div>
  );
}