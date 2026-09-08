import { useState } from "react";
import { Link } from "react-router-dom";
import { toDateString } from "../lib/budget";

export default function Checklists({ playlists = [], createChecklist, removeChecklist }) {
  const [loading, setLoading] = useState(false);

  const handleCreateNew = async () => {
    setLoading(true);
    const today = toDateString(new Date());

    // Filter checklists created today to auto-generate letter suffixes (A, B, C...)
    const todayLists = playlists.filter((item) => item.date === today);
    const letterCode = String.fromCharCode(65 + todayLists.length); // 65 = 'A'
    const name = `${today} ${letterCode}`;

    await createChecklist({ name, date: today, items: [] });
    setLoading(false);
  };

  return (
    <div className="card-container">
      <header className="top">
        <div>
          <p className="eyebrow">Shopping</p>
          <h1>Buy Checklists</h1>
        </div>
        <button type="button" onClick={handleCreateNew} disabled={loading}>
          {loading ? "Creating..." : "+ New Checklist"}
        </button>
      </header>

      {playlists.length === 0 ? (
        <section className="card">
          <p className="hint">No checklists created yet. Click above to add one!</p>
        </section>
      ) : (
        <div className="grid">
          {playlists.map((list) => {
            const isCompleted =
              list.items?.length > 0 && list.items.every((item) => item.completed);

            return (
              <div
                key={list.id}
                className="card"
                style={{
                  position: "relative",
                  borderColor: isCompleted ? "var(--accent)" : "var(--line)",
                  background: isCompleted ? "#e7f0e4" : "var(--card)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3>{list.name}</h3>
                  {isCompleted && <span className="badge">Completed</span>}
                </div>

                <p className="hint" style={{ marginTop: "8px" }}>
                  {list.items?.filter((i) => i.completed).length || 0} / {list.items?.length || 0} items bought
                </p>

                <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                  <Link to={`/checklists/${list.id}`}>
                    <button type="button">Open List</button>
                  </Link>
                  <button
                    type="button"
                    className="link"
                    onClick={() => removeChecklist(list.id)}
                    style={{ color: "var(--over)" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}