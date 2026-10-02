import * as React from "react";
import { cn } from "@/lib/utils";

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4;
  as?: "h1" | "h2" | "h3" | "h4" | "span" | "div";
}

export function Heading({
  level = 1,
  as,
  className,
  children,
  ...props
}: HeadingProps) {
  const Component = as || (`h${level}` as const);

  const levelClasses = {
    1: "text-2xl sm:text-3xl font-bold tracking-tight text-foreground",
    2: "text-xl sm:text-2xl font-bold tracking-tight text-foreground",
    3: "text-lg font-semibold tracking-tight text-foreground",
    4: "text-base font-semibold text-foreground",
  }[level];

  return (
    <Component className={cn(levelClasses, className)} {...props}>
      {children}
    </Component>
  );
}

export interface ParagraphProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: "muted" | "default" | "brand" | "dim";
  size?: "xs" | "sm" | "base" | "lg";
  as?: "p" | "span" | "div";
}

export function Paragraph({
  variant = "muted",
  size = "sm",
  as: Component = "p",
  className,
  children,
  ...props
}: ParagraphProps) {
  const variantClasses = {
    muted: "text-muted-foreground",
    default: "text-foreground",
    brand: "text-brand",
    dim: "text-muted-foreground/80",
  }[variant];

  const sizeClasses = {
    xs: "text-xs",
    sm: "text-xs sm:text-sm",
    base: "text-sm sm:text-base",
    lg: "text-base sm:text-lg",
  }[size];

  return (
    <Component
      className={cn(sizeClasses, variantClasses, className)}
      {...props}
    >
      {children}
    </Component>
  );
}
