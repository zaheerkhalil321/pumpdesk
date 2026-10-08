"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  label?: string;
  "aria-label"?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      disabled = false,
      className,
      id,
      name,
      label,
      "aria-label": ariaLabel,
    },
    ref
  ) => {
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked);
    const isControlled = controlledChecked !== undefined;
    const isChecked = isControlled ? controlledChecked : uncontrolledChecked;

    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      const next = !isChecked;
      if (!isControlled) {
        setUncontrolledChecked(next);
      }
      onCheckedChange?.(next);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        const next = !isChecked;
        if (!isControlled) {
          setUncontrolledChecked(next);
        }
        onCheckedChange?.(next);
      }
    };

    return (
      <div className="inline-flex items-center gap-2">
        <button
          ref={ref}
          type="button"
          role="switch"
          id={id}
          name={name}
          aria-checked={isChecked}
          aria-label={ariaLabel || label}
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={cn(
            "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isChecked ? "bg-brand" : "bg-slate-300 hover:bg-slate-400/80",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
              isChecked ? "translate-x-5.5" : "translate-x-0.5"
            )}
          />
        </button>
        {label && (
          <span className="text-xs font-medium text-slate-700 select-none">
            {label}
          </span>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";
