import { formatMoney } from "../lib/budget";

function Admin({
  budget,
  preferences,
  prefsReady,
  draft,
  setDraft,
  savingPrefs,
  savePreferences,
  expenses,
  removeExpense,
}) {
  const cycleExpenses = expenses.filter(
    (expense) =>
      expense.date >= budget.periodStart && expense.date <= budget.periodEnd
  );

  return (
    <>
      <header className="top">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Preferences</h1>
          <p className="period">
            Configure the spend cycle and monthly amount.
          </p>
        </div>
      </header>

      <section className="card">
        <h2>Monthly cycle</h2>
        <form onSubmit={savePreferences} className="form">
          <div className="row">
            <label>
              Month start day
              <input
                type="number"
                min="1"
                max="31"
                value={draft.startDay}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    startDay: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              Month end day
              <input
                type="number"
                min="1"
                max="31"
                value={draft.endDay}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    endDay: event.target.value,
                  }))
                }
                required
              />
            </label>
          </div>
          <label>
            Amount to spend this month
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.monthlyAmount}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  monthlyAmount: event.target.value,
                }))
              }
              placeholder="150000"
              required
            />
          </label>
          <button type="submit" disabled={savingPrefs}>
            {savingPrefs ? "Saving…" : "Save preferences"}
          </button>
        </form>
        {prefsReady ? (
          <p className="hint">
            {formatMoney(preferences.monthlyAmount)} ÷ {budget.daysInPeriod} days
            = {formatMoney(budget.dailyBase)} per day. Unused money from one day
            moves to the next.
          </p>
        ) : (
          <p className="hint">Save a monthly amount to start tracking.</p>
        )}
      </section>

      <section className="hero">
        <div>
          <p className="label">Left this cycle</p>
          <p className={`hero-amount ${budget.remainingPeriod < 0 ? "over" : ""}`}>
            {prefsReady ? formatMoney(budget.remainingPeriod) : "—"}
          </p>
        </div>
        <dl className="stats">
          <div>
            <dt>Daily share</dt>
            <dd>{prefsReady ? formatMoney(budget.dailyBase) : "—"}</dd>
          </div>
          <div>
            <dt>Today&apos;s starting balance</dt>
            <dd>{prefsReady ? formatMoney(budget.todayBalance) : "—"}</dd>
          </div>
          <div>
            <dt>Carried from unused days</dt>
            <dd>{prefsReady ? formatMoney(budget.carryOver) : "—"}</dd>
          </div>
          <div>
            <dt>Days left</dt>
            <dd>{prefsReady ? budget.daysLeft : "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2>This cycle</h2>
        <p className="hint">
          {budget.periodStart} → {budget.periodEnd} · spent{" "}
          {formatMoney(budget.spentThisPeriod)}
        </p>
        {cycleExpenses.length === 0 ? (
          <p className="empty">Nothing logged in this period yet.</p>
        ) : (
          <ul className="list">
            {cycleExpenses.map((expense) => (
              <li key={expense.id}>
                <div>
                  <strong>{formatMoney(expense.amount)}</strong>
                  <span>
                    {expense.date}
                    {expense.note ? ` · ${expense.note}` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  className="link"
                  onClick={() => removeExpense(expense.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default Admin;
