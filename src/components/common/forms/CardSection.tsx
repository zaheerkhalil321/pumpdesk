import { cn } from "@/lib/utils";

type Props = {
    title: string;
    children: React.ReactNode;
    className?: string;
};

export function CardSection({
    title,
    children,
    className,
}: Props) {
    return (
        <div
            className={cn(
                "rounded-lg border bg-card p-6",
                className
            )}
        >
            <h2 className="mb-6 text-lg font-semibold">
                {title}
            </h2>

            {children}
        </div>
    );
}