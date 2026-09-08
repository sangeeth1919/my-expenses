import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toDateString } from "../lib/budget";

function AddExpense({ categories, addManualExpense, savingExpense }) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toDateString(new Date()));
  const [type, setType] = useState("Other");
  const [note, setNote] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;

    try {
      await addManualExpense({
        amount: value,
        date,
        type: type || "Other",
        note,
      });
      setSuccess(true);
      setAmount("");
      setNote("");
      setType("Other");
      
      // Optional: navigate back to dashboard after brief delay
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="card">
      <h2>Add Manual Expense</h2>

      {success && (
        <div className="success-banner">
          Expense saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label>
          Amount
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>

        <label>
          Expense Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Note / Description
          <input
            type="text"
            placeholder="What was this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <button type="submit" disabled={savingExpense || !amount}>
          {savingExpense ? "Saving..." : "Save Expense"}
        </button>
      </form>
    </div>
  );
}

export default AddExpense;