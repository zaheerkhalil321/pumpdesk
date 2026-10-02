import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 py-1.5 text-xs sm:text-sm text-foreground transition-colors placeholder:text-muted-foreground outline-none focus:outline-none focus-visible:outline-none focus:border-brand focus-visible:border-brand disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive shadow-2xs",
        className
      )}
      {...props}
    />
  )
}

export { Input }
