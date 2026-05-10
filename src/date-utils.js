function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatYearMonth(date) {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getLastDayOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function* iterMonths(startDate, endDate) {
  let currentMonth = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));

  while (currentMonth <= endDate) {
    const monthStart =
      currentMonth < startDate
        ? new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()))
        : currentMonth;
    const naturalMonthEnd = getLastDayOfMonth(currentMonth);
    const monthEnd = naturalMonthEnd > endDate ? endDate : naturalMonthEnd;

    yield { monthStart, monthEnd };

    currentMonth = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + 1, 1));
  }
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

module.exports = {
  formatDate,
  formatYearMonth,
  iterMonths,
  slugify
};
