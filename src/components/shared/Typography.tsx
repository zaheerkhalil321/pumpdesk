import { cn } from "@/lib/utils"
import type {
  HTMLAttributes,
  PropsWithChildren,
} from "react"

type TypographyProps = PropsWithChildren<
  HTMLAttributes<HTMLElement>
>

function H1({
  className,
  children,
  ...props
}: TypographyProps) {
  return (
    <h1
      className={cn(
        "text-3xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  )
}

function H2({
  className,
  children,
  ...props
}: TypographyProps) {
  return (
    <h2
      className={cn(
        "text-2xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  )
}

function H3({
  className,
  children,
  ...props
}: TypographyProps) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

function Body({
  className,
  children,
  ...props
}: TypographyProps) {
  return (
    <p
      className={cn(
        "text-sm leading-6",
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

function Muted({
  className,
  children,
  ...props
}: TypographyProps) {
  return (
    <p
      className={cn(
        "text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

function Small({
  className,
  children,
  ...props
}: TypographyProps) {
  return (
    <small
      className={cn(
        "text-xs text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </small>
  )
}

export const Typography = {
  H1,
  H2,
  H3,
  Body,
  Muted,
  Small,
}