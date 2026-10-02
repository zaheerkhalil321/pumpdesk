import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-xs sm:text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none focus:border-brand focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive shadow-2xs",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
