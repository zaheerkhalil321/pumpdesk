"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleAlert, CircleCheck, Info, Loader2, TriangleAlert } from "lucide-react"

/**
 * App-wide toasts: a clean white card whose icon badge is tinted by type,
 * so a failed save never looks like a success.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group [--width:400px]!"
      closeButton
      duration={5000}
      gap={10}
      icons={{
        success: <CircleCheck className="size-4" strokeWidth={2.25} />,
        info: <Info className="size-4" strokeWidth={2.25} />,
        warning: <TriangleAlert className="size-4" strokeWidth={2.25} />,
        error: <CircleAlert className="size-4" strokeWidth={2.25} />,
        loading: <Loader2 className="size-4 animate-spin" strokeWidth={2.25} />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "items-center! gap-3! rounded-xl! border! border-border! bg-card! text-foreground! shadow-xl! py-3! pl-3.5! pr-10!",
          icon: "m-0! size-8! shrink-0! rounded-full! flex! items-center! justify-center! bg-muted! text-muted-foreground!",
          content: "gap-0.5!",
          title: "text-[13px]! font-semibold! leading-tight! text-foreground!",
          description: "text-xs! leading-snug! text-muted-foreground!",
          success: "[&_[data-icon]]:bg-emerald-50! [&_[data-icon]]:text-emerald-600!",
          error: "[&_[data-icon]]:bg-rose-50! [&_[data-icon]]:text-rose-600!",
          warning: "[&_[data-icon]]:bg-amber-50! [&_[data-icon]]:text-amber-600!",
          info: "[&_[data-icon]]:bg-brand-light! [&_[data-icon]]:text-brand!",
          actionButton:
            "ml-auto! h-7! shrink-0! rounded-lg! border! border-border! bg-card! px-3! text-xs! font-semibold! text-foreground! shadow-2xs! hover:bg-muted!",
          closeButton:
            "left-auto! right-2.5! top-1/2! -translate-y-1/2! translate-x-0! size-6! rounded-full! border! border-muted-foreground/40! bg-card! text-muted-foreground! hover:bg-muted! hover:text-foreground! hover:border-foreground!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
