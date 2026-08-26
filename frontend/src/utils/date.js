/**
 * Utility to format dates strictly as "Month Year" (e.g. "February 2026")
 * and format date ranges cleanly as "February 2026 – Present" or "September 2025 – August 2026".
 */

export function formatMonthYear(dateString) {
  if (!dateString) return ''
  // If already in YYYY-MM or YYYY-MM-DD format
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return String(dateString)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function formatMonthYearShort(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return String(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function formatDateRange(startDate, endDate) {
  if (!startDate) return ''
  const start = formatMonthYear(startDate)
  const end = endDate ? formatMonthYear(endDate) : 'Present'
  return `${start} – ${end}`
}

export function formatMemberSince(dateString) {
  if (!dateString) return 'Member'
  const formatted = formatMonthYearShort(dateString)
  return `Member since ${formatted}`
}
