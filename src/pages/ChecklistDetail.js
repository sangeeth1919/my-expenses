import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ChecklistDetail({ playlists = [], updateChecklist }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newItemText, setNewItemText] = useState("");

  // Find the active checklist from state
  const checklist = playlists.find((item) => item.id === id);

  if (!checklist) {
    return (
      <div className="card">
        <h2>Checklist Not Found</h2>
        <button type="button" onClick={() => navigate("/checklists")}>
          Back to Checklists
        </button>
      </div>
    );
  }

  const items = checklist.items || [];

  // Toggle item completed status
  const handleToggleItem = async (itemId) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await updateChecklist(id, { items: updatedItems });
  };

  // Add new item to the checklist
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false,
    };

    const updatedItems = [...items, newItem];
    await updateChecklist(id, { items: updatedItems });
    setNewItemText("");
  };

  // --- REMOVE CHECKLIST ITEM ---
  const handleRemoveItem = async (itemId) => {
    const updatedItems = items.filter((item) => item.id !== itemId);
    await updateChecklist(id, { items: updatedItems });
  };

  return (
    <div className="page">
      <header className="top">
        <div>
          <button
            type="button"
            className="link"
            onClick={() => navigate("/checklists")}
            style={{ marginBottom: "8px", cursor: "pointer" }}
          >
            ← Back to Checklists
          </button>
          <h1>{checklist.name}</h1>
          <p className="period">Date: {checklist.date}</p>
        </div>
      </header>

      {/* Add New Item Form */}
      <section className="card" style={{ marginBottom: "16px" }}>
        <form onSubmit={handleAddItem} className="row">
          <input
            type="text"
            placeholder="Add new checklist item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
          />
          <button type="submit" style={{ width: "auto" }}>
            Add Item
          </button>
        </form>
      </section>

      {/* Checklist Items List */}
      <section className="card">
        <h3>Items ({items.filter((i) => i.completed).length}/{items.length})</h3>
        {items.length === 0 ? (
          <p className="empty">No items added yet.</p>
        ) : (
          <ul className="list">
            {items.map((item) => (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    flex: 1,
                    textDecoration: item.completed ? "line-through" : "none",
                    color: item.completed ? "var(--muted)" : "var(--ink)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleItem(item.id)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span>{item.text}</span>
                </label>

                {/* Remove Item Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="link"
                  style={{
                    color: "var(--over)",
                    cursor: "pointer",
                    padding: "4px 8px",
                    fontSize: "0.85rem",
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}