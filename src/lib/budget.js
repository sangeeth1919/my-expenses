function pad(n) {
  return String(n).padStart(2, "0");
}

export function toDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateString(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function clampDay(year, monthIndex, day) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, lastDay);
}

function shiftMonth(year, monthIndex, delta) {
  const date = new Date(year, monthIndex + delta, 1);
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

/**
 * Resolves the current billing cycle from repeating start/end days of month.
 * Same-month example: 1–31. Cross-month example: 25–24.
 */
export function getPeriodBounds(startDay, endDay, today = new Date()) {
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  const day = today.getDate();

  if (startDay <= endDay) {
    let periodYear = year;
    let periodMonth = monthIndex;
    if (day < startDay) {
      ({ year: periodYear, monthIndex: periodMonth } = shiftMonth(year, monthIndex, -1));
    } else if (day > endDay) {
      ({ year: periodYear, monthIndex: periodMonth } = shiftMonth(year, monthIndex, 1));
    }
    return {
      start: new Date(
        periodYear,
        periodMonth,
        clampDay(periodYear, periodMonth, startDay)
      ),
      end: new Date(
        periodYear,
        periodMonth,
        clampDay(periodYear, periodMonth, endDay)
      ),
    };
  }

  let startYear = year;
  let startMonth = monthIndex;
  if (day < startDay) {
    ({ year: startYear, monthIndex: startMonth } = shiftMonth(year, monthIndex, -1));
  }
  const start = new Date(
    startYear,
    startMonth,
    clampDay(startYear, startMonth, startDay)
  );
  const endShift = shiftMonth(startYear, startMonth, 1);
  const end = new Date(
    endShift.year,
    endShift.monthIndex,
    clampDay(endShift.year, endShift.monthIndex, endDay)
  );
  return { start, end };
}

export function daysInclusive(start, end) {
  const startMs = parseDateString(toDateString(start)).getTime();
  const endMs = parseDateString(toDateString(end)).getTime();
  return Math.round((endMs - startMs) / 86400000) + 1;
}

export function dayNumberInPeriod(start, today) {
  const startMs = parseDateString(toDateString(start)).getTime();
  const todayMs = parseDateString(toDateString(today)).getTime();
  return Math.round((todayMs - startMs) / 86400000) + 1;
}

export function computeBudget({
  monthlyAmount,
  startDay,
  endDay,
  expenses,
  today = new Date(),
}) {
  const amount = Number(monthlyAmount) || 0;
  const period = getPeriodBounds(Number(startDay), Number(endDay), today);
  const daysInPeriod = daysInclusive(period.start, period.end);
  const dailyBase = daysInPeriod > 0 ? amount / daysInPeriod : 0;
  const todayStr = toDateString(today);
  const startStr = toDateString(period.start);
  const endStr = toDateString(period.end);

  const inPeriod = (expenses || []).filter(
    (expense) => expense.date >= startStr && expense.date <= endStr
  );
  const spentBeforeToday = inPeriod
    .filter((expense) => expense.date < todayStr)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  const spentToday = inPeriod
    .filter((expense) => expense.date === todayStr)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  const dayNumber = dayNumberInPeriod(period.start, today);
  const todayBalance = dailyBase * dayNumber - spentBeforeToday;
  const remainingToday = todayBalance - spentToday;
  const carryOver = todayBalance - dailyBase;

  return {
    period,
    periodStart: startStr,
    periodEnd: endStr,
    daysInPeriod,
    daysLeft: Math.max(0, daysInPeriod - dayNumber + 1),
    dailyBase,
    dayNumber,
    spentToday,
    spentBeforeToday,
    spentThisPeriod: spentBeforeToday + spentToday,
    todayBalance,
    remainingToday,
    carryOver,
    remainingPeriod: amount - spentBeforeToday - spentToday,
  };
}

export function formatMoney(value) {
  const amount = Number(value) || 0;
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
