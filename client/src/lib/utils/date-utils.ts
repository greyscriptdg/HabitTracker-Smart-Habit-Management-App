import { format, addDays, subDays, isToday, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";

/**
 * Format a date as YYYY-MM-DD for API requests
 */
export function formatDateForApi(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Format a date in a user-friendly format (e.g., "Monday, June 5, 2023")
 */
export function formatDateForDisplay(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy");
}

/**
 * Format a date in a short format (e.g., "Jun 5")
 */
export function formatShortDate(date: Date): string {
  return format(date, "MMM d");
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

/**
 * Generate an array of dates for a week starting from the given date
 */
export function getWeekDays(startDate: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const start = startOfWeek(startDate, { weekStartsOn });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Get the date range for displaying in the calendar (e.g., "May 30 - June 5")
 */
export function getDateRangeDisplay(startDate: Date, endDate: Date): string {
  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`;
}

/**
 * Parse an ISO date string and handle potential errors
 */
export function safeParse(dateString: string): Date | null {
  try {
    return parseISO(dateString);
  } catch (e) {
    console.error("Error parsing date:", e);
    return null;
  }
}

/**
 * Get start and end dates for different view modes (day, week, month)
 */
export function getDateRangeForViewMode(
  date: Date,
  viewMode: "day" | "week" | "month",
  weekStartsOn: 0 | 1 = 1
): { start: Date; end: Date } {
  switch (viewMode) {
    case "day":
      return { start: date, end: date };
    case "week":
      return {
        start: startOfWeek(date, { weekStartsOn }),
        end: endOfWeek(date, { weekStartsOn }),
      };
    case "month":
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
  }
}
