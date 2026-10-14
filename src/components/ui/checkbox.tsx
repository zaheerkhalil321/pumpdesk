"use client"

import * as React from "react"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps {
  checked?: boolean
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
  "aria-label"?: string
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      checked = false,
      indeterminate = false,
      onCheckedChange,
      disabled = false,
      className,
      id,
      "aria-label": ariaLabel,
    },
    ref
  ) => {
    const isSelected = checked || indeterminate

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (disabled) return
      onCheckedChange?.(!checked)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault()
        e.stopPropagation()
        if (disabled) return
        onCheckedChange?.(!checked)
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        id={id}
        aria-label={ariaLabel}
        aria-checked={indeterminate ? "mixed" : checked}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "peer relative flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-all duration-150 outline-none cursor-pointer select-none",
          "focus-visible:border-brand focus-visible:outline-none",
          isSelected
            ? "bg-brand border-brand text-white shadow-2xs"
            : "bg-white border-slate-300 hover:border-brand/60 hover:bg-brand-light/20 shadow-2xs",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {checked && !indeterminate && (
          <Check className="h-3 w-3 stroke-[3] text-white" />
        )}
        {indeterminate && (
          <Minus className="h-3 w-3 stroke-[3] text-white" />
        )}
      </button>
    )
  }
)

Checkbox.displayName = "Checkbox"
