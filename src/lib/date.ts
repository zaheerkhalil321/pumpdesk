export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}