"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export type SelectOptionItem = string | SelectOption;

export interface AppSelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: readonly SelectOptionItem[] | SelectOptionItem[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean | string;
  size?: "sm" | "default" | "lg";
  className?: string;
  contentClassName?: string;
  id?: string;
  name?: string;
  icon?: React.ComponentType<{ className?: string }>;
  align?: "start" | "end" | "center";
  showCheck?: boolean;
}

export function AppSelect({
  value: controlledValue,
  defaultValue = "",
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  error = false,
  size = "default",
  className,
  contentClassName,
  id,
  name,
  icon: LeftIcon,
  align = "start",
  showCheck = true,
}: AppSelectProps) {
  const [internalValue, setInternalValue] = React.useState<string>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  // Normalize options to SelectOption objects
  const normalizedOptions: SelectOption[] = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const selectedOption = normalizedOptions.find((opt) => opt.value === currentValue);

  const handleSelect = (val: string) => {
    if (!isControlled) {
      setInternalValue(val);
    }
    onChange?.(val);
  };

  const sizeClasses = {
    sm: "h-8 px-2.5 text-xs rounded-md gap-1.5",
    default: "h-9 px-3 text-xs rounded-md gap-2",
    lg: "h-10 px-3.5 text-sm rounded-md gap-2.5",
  }[size];

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    default: "h-4 w-4",
    lg: "h-4.5 w-4.5",
  }[size];

  return (
    <div className="relative inline-block w-full">
      {/* Hidden input for HTML form compatibility */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue}
          id={id ? `${id}-hidden` : undefined}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          id={id}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between border bg-card text-foreground transition-all cursor-pointer outline-none select-none text-left",
            sizeClasses,
            error
              ? "border-destructive bg-destructive/5 text-destructive focus-visible:ring-2 focus-visible:ring-destructive/20"
              : "border-border hover:bg-accent/40 hover:border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none bg-muted/30",
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
            {LeftIcon && (
              <LeftIcon className={cn("text-muted-foreground shrink-0", iconSizes)} />
            )}
            {selectedOption?.icon && (
              <selectedOption.icon className={cn("text-muted-foreground shrink-0", iconSizes)} />
            )}
            <span
              className={cn(
                "truncate font-medium",
                !selectedOption && "text-muted-foreground font-normal"
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>

          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1.5 transition-transform duration-200" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={align}
          sideOffset={4}
          className={cn(
            "w-(--anchor-width) min-w-[200px] max-h-64 overflow-y-auto p-1.5 rounded-2xl bg-popover text-popover-foreground shadow-xl border border-border",
            contentClassName
          )}
        >
          {normalizedOptions.map((option) => {
            const isSelected = option.value === currentValue;
            const OptIcon = option.icon;

            return (
              <DropdownMenuItem
                key={option.value}
                disabled={option.disabled}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors outline-none",
                  isSelected
                    ? "bg-primary/10 text-primary font-semibold dark:bg-primary/20"
                    : "text-foreground hover:bg-muted font-normal",
                  option.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {OptIcon && (
                    <OptIcon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{option.label}</span>
                    {option.description && (
                      <span className="text-[11px] text-muted-foreground truncate font-normal">
                        {option.description}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && showCheck && (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
                )}

                {option.badge && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground shrink-0">
                    {option.badge}
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
