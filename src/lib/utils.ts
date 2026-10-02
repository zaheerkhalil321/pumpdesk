import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a raw phone string into standard US format: (XXX) XXX-XXXX
 * Automatically strips non-digits and optional leading US country code (+1).
 */
export function formatUSPhone(value: string): string {
  if (!value) return ""
  let digits = value.replace(/\D/g, "")
  if (digits.length > 10 && digits.startsWith("1")) {
    digits = digits.slice(1)
  }
  digits = digits.slice(0, 10)

  if (digits.length === 0) return ""
  if (digits.length <= 3) {
    return `(${digits}`
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}
