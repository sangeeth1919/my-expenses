import {
  computeBudget,
  daysInclusive,
  getPeriodBounds,
  toDateString,
} from "./budget";

test("daily balance carries unused money to the next day", () => {
  const today = new Date(2026, 8, 1);
  const nextDay = new Date(2026, 8, 2);
  const expenses = [
    { amount: 1000, date: "2026-09-01" },
    { amount: 2000, date: "2026-09-01" },
  ];

  const day1 = computeBudget({
    monthlyAmount: 150000,
    startDay: 1,
    endDay: 30,
    expenses,
    today,
  });
  const day2 = computeBudget({
    monthlyAmount: 150000,
    startDay: 1,
    endDay: 30,
    expenses,
    today: nextDay,
  });

  expect(day1.dailyBase).toBe(5000);
  expect(day1.todayBalance).toBe(5000);
  expect(day1.spentToday).toBe(3000);
  expect(day1.remainingToday).toBe(2000);
  expect(day2.todayBalance).toBe(7000);
  expect(day2.carryOver).toBe(2000);
});

test("unused earlier days in the cycle add to today's starting balance", () => {
  const day7 = computeBudget({
    monthlyAmount: 150000,
    startDay: 1,
    endDay: 30,
    expenses: [],
    today: new Date(2026, 8, 7),
  });
  expect(day7.todayBalance).toBe(35000);
});

test("cross-month cycle uses start day through end day of next month", () => {
  const today = new Date(2026, 8, 26);
  const { start, end } = getPeriodBounds(25, 24, today);
  expect(toDateString(start)).toBe("2026-09-25");
  expect(toDateString(end)).toBe("2026-10-24");
  expect(daysInclusive(start, end)).toBe(30);
});
