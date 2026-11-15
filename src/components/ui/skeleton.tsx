import { cn } from "@/lib/utils"

/** A muted block with a soft left-to-right shimmer. Reduced-motion users get a still block. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("skeleton-shimmer rounded-xl", className)}
      {...props}
    />
  )
}

export { Skeleton }
