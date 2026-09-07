import { Link } from "react-router-dom";
import { formatMoney } from "../lib/budget";

function Dashboard({
  budget,
  prefsReady,
  amount,
  setAmount,
  note,
  setNote,
  savingExpense,
  addExpense,
  todaysList,
  removeExpense,
}) {
  return (
    <>
      <header className="top">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Add an expense</h1>
          <p className="period">
            {prefsReady
              ? `${budget.periodStart} → ${budget.periodEnd}`
              : "Set your monthly budget in Admin to start."}
          </p>
        </div>
      </header>

      <section className="hero hero-compact">
        <div>
          <p className="label">Left to spend today</p>
          <p className={`hero-amount ${budget.remainingToday < 0 ? "over" : ""}`}>
            {prefsReady ? formatMoney(budget.remainingToday) : "—"}
          </p>
        </div>
        <p className="hero-spent">
          Spent today {formatMoney(budget.spentToday)}
        </p>
      </section>

      <section className="card">
        <h2>Quick add</h2>
        {!prefsReady ? (
          <p className="hint">
            Preferences live in Admin.{" "}
            <Link to="/admin">Open Admin</Link> and save your cycle dates and
            monthly amount.
          </p>
        ) : null}
        <form onSubmit={addExpense} className="form">
          <div className="row">
            <label>
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="1000"
                required
              />
            </label>
            <label>
              Note
              <input
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Lunch"
              />
            </label>
          </div>
          <button type="submit" disabled={savingExpense || !prefsReady}>
            {savingExpense ? "Saving…" : "Add expense"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Today</h2>
        {todaysList.length === 0 ? (
          <p className="empty">No expenses recorded today.</p>
        ) : (
          <ul className="list">
            {todaysList.map((expense) => (
              <li key={expense.id}>
                <div>
                  <strong>{formatMoney(expense.amount)}</strong>
                  <span>{expense.note || "Expense"}</span>
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

export default Dashboard;
