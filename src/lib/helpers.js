import { format, parseISO } from 'date-fns'

export const LEAVE_ICONS = {
  'Vacation': '🌴',
  'Sick Leave': '🤒',
  'Personal Day': '☀️',
  'Bereavement': '🕊️',
  'Unpaid Leave': '📋',
  'Cultural Leave': '🌿',
  'Day in Lieu': '⏱️',
  'Add OT to Bank': '💰',
}

export function statusBadge(status) {
  const map = {
    Pending:   'badge-pending',
    Approved:  'badge-approved',
    Denied:    'badge-denied',
    Amended:   'badge-amended',
    Cancelled: 'badge-cancelled',
  }
  return `badge ${map[status] || 'badge-pending'}`
}

export function fmtDate(d) {
  if (!d) return '—'
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'MMM d, yyyy') }
  catch { return d }
}

export function fmtDateRange(start, end) {
  if (!start) return '—'
  if (!end || start === end) return fmtDate(start)
  return `${fmtDate(start)} – ${fmtDate(end)}`
}

export function fmtHours(h) {
  const n = parseFloat(h)
  if (n === 8) return '8 hrs (full day)'
  if (n === 4) return '4 hrs (half day)'
  return `${n} hrs`
}

export function hasRole(user, role) {
  return user?.roles?.includes(role)
}
