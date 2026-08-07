import { Timestamp } from 'firebase/firestore'
import { format, formatDistanceToNow, isBefore, startOfDay } from 'date-fns'

export type DateLike = Timestamp | Date | string | number

export function toDate(value: DateLike): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(value)
}

export function toTimestamp(value: DateLike): Timestamp {
  return value instanceof Timestamp ? value : Timestamp.fromDate(toDate(value))
}

export function formatDate(value: DateLike, pattern = 'yyyy-MM-dd'): string {
  return format(toDate(value), pattern)
}

export function formatDateLong(value: DateLike): string {
  return format(toDate(value), 'dd MMM yyyy')
}

export function formatRelative(value: DateLike): string {
  return formatDistanceToNow(toDate(value), { addSuffix: true })
}

export function isOverdue(dueDate: DateLike, referenceDate: Date = new Date()): boolean {
  return isBefore(toDate(dueDate), startOfDay(referenceDate))
}

export function todayInputValue(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
