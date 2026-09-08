import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { formatMoney, toDateString } from "../lib/budget";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

function Metrics({ expenses, categories }) {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Filter States
  const [startDate, setStartDate] = useState(toDateString(firstDayOfMonth));
  const [endDate, setEndDate] = useState(toDateString(now));
  const [selectedType, setSelectedType] = useState("ALL");
  const [excludedType, setExcludedType] = useState("NONE");

  // 1. Filtered Expenses Calculation (Supports 'Not Equal To' filtering)
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const expType = exp.type || "Other";
      const matchDate = exp.date >= startDate && exp.date <= endDate;
      const matchType =
        selectedType === "ALL" ? true : expType === selectedType;
      const matchExcluded =
        excludedType === "NONE" ? true : expType !== excludedType;

      return matchDate && matchType && matchExcluded;
    });
  }, [expenses, startDate, endDate, selectedType, excludedType]);

  // 2. Metrics Summaries
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [filteredExpenses]);

  // 3. Category Breakdown Data (for Pie Chart)
  const categoryTotals = useMemo(() => {
    const totals = {};
    filteredExpenses.forEach((exp) => {
      const type = exp.type || "Other";
      totals[type] = (totals[type] || 0) + Number(exp.amount);
    });
    return totals;
  }, [filteredExpenses]);

  const pieChartData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        label: "Spending",
        data: Object.values(categoryTotals),
        backgroundColor: [
          "#1f6f4a",
          "#06b6d4",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
          "#64748b",
        ],
      },
    ],
  };

  // 4. Daily Spending Trend Data (for Bar Chart)
  const dailyTotals = useMemo(() => {
    const totals = {};
    filteredExpenses.forEach((exp) => {
      totals[exp.date] = (totals[exp.date] || 0) + Number(exp.amount);
    });
    const sortedDates = Object.keys(totals).sort();
    return {
      labels: sortedDates,
      data: sortedDates.map((d) => totals[d]),
    };
  }, [filteredExpenses]);

  const barChartData = {
    labels: dailyTotals.labels,
    datasets: [
      {
        label: "Daily Total",
        data: dailyTotals.data,
        backgroundColor: "#1f6f4a",
      },
    ],
  };

  return (
    <div className="metrics-page">
      <header className="top">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Expense Metrics</h1>
          <p className="period">
            Filter transactions by date range and expense category.
          </p>
        </div>
      </header>

      {/* --- Filter Controls --- */}
      <div className="card filters-card">
        <div className="filter-group">
          <label>
            From
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label>
            To
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <label>
            Category
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Exclude Category
            <select
              value={excludedType}
              onChange={(e) => setExcludedType(e.target.value)}
            >
              <option value="NONE">None (Show All)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  Not {cat.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* --- Summary KPI Cards --- */}
      <div className="kpi-grid">
        <div className="card kpi-card">
          <h3>Total Expense</h3>
          <p className="kpi-value">{formatMoney(totalAmount)}</p>
        </div>
        <div className="card kpi-card">
          <h3>Total Transactions</h3>
          <p className="kpi-value">{filteredExpenses.length}</p>
        </div>
      </div>

      {/* --- Visual Charts --- */}
      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Expenses by Category</h3>
          {Object.keys(categoryTotals).length > 0 ? (
            <div className="chart-container">
              <Pie data={pieChartData} />
            </div>
          ) : (
            <p className="no-data">No expense data for selected period.</p>
          )}
        </div>

        <div className="card chart-card">
          <h3>Daily Spending Trend</h3>
          {dailyTotals.labels.length > 0 ? (
            <div className="chart-container">
              <Bar data={barChartData} />
            </div>
          ) : (
            <p className="no-data">No expense data for selected period.</p>
          )}
        </div>
      </div>

      {/* --- Filtered Data Table --- */}
      <div className="card table-card">
        <h3>Transactions</h3>
        {filteredExpenses.length === 0 ? (
          <p className="empty">No records match the selected criteria.</p>
        ) : (
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Note</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <tr key={exp.id}>
                  <td>{exp.date}</td>
                  <td>
                    <span className="badge">{exp.type || "Other"}</span>
                  </td>
                  <td>{exp.note || "—"}</td>
                  <td>{formatMoney(exp.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Metrics;