import { timeDay, timeFormat, timeHour, timeMinute, timeMonth, timeSecond, timeYear } from 'd3'

const formatMillisecond = timeFormat('.%L')
const formatSecond = timeFormat(':%S')
const formatMinute = timeFormat('%I:%M')
const formatWeek = timeFormat('%b %d')
const formatMonth = timeFormat('%B')
const formatYear = timeFormat('%Y')

export function formatDate(date: Date) {
  if (timeSecond(date) < date) {
    return formatMillisecond(date)
  }
  if (timeMinute(date) < date) {
    return formatSecond(date)
  }
  if (timeHour(date) < date) {
    return formatMinute(date)
  }
  if (timeDay(date) < date) {
    return formatMinute(date)
  }
  if (timeMonth(date) < date) {
    return formatWeek(date)
  }
  if (timeYear(date) < date) {
    return formatMonth(date)
  }

  return formatYear(date)
}
