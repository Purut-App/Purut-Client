/** Sunday-first calendar, using local dates to avoid timezone day shifts. */
export function calendarMonthDays(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const index = month.getMonth();
  const offset = new Date(year, index, 1).getDay();
  const count = new Date(year, index + 1, 0).getDate();
  const cells = Math.ceil((offset + count) / 7) * 7;
  return Array.from({ length: cells }, (_, cell) =>
    cell < offset || cell >= offset + count ? null : new Date(year, index, cell - offset + 1),
  );
}
