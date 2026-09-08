import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ChecklistDetail({ playlists = [], updateChecklist }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentList = playlists.find((item) => item.id === id);

  const [name, setName] = useState("");
  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    if (currentList) {
      setName(currentList.name);
    }
  }, [currentList]);

  if (!currentList) {
    return (
      <div className="card">
        <p>Checklist not found.</p>
        <button type="button" onClick={() => navigate("/checklists")}>Back to Lists</button>
      </div>
    );
  }

  const handleNameBlur = () => {
    if (name.trim() && name !== currentList.name) {
      updateChecklist(id, { ...currentList, name: name.trim() });
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const updatedItems = [
      ...(currentList.items || []),
      { id: Date.now().toString(), text: newItemText.trim(), completed: false },
    ];

    updateChecklist(id, { ...currentList, items: updatedItems });
    setNewItemText("");
  };

  const toggleItem = (itemId) => {
    const updatedItems = currentList.items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateChecklist(id, { ...currentList, items: updatedItems });
  };

  const isCompleted =
    currentList.items?.length > 0 && currentList.items.every((i) => i.completed);

  return (
    <div className="card-container">
      <button
        type="button"
        className="link"
        onClick={() => navigate("/checklists")}
        style={{ marginBottom: "16px" }}
      >
        ← Back to Checklists
      </button>

      <section className="card">
        <div style={{ marginBottom: "16px" }}>
          <label className="hint">Editable Checklist Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            style={{ fontSize: "1.4rem", fontWeight: "bold" }}
          />
        </div>

        {isCompleted && (
          <div className="success-banner">
            🎉 All items in this checklist are bought!
          </div>
        )}

        <form onSubmit={handleAddItem} className="row" style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Add item to buy..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
          />
          <button type="submit">Add Item</button>
        </form>

        <ul className="list">
          {currentList.items?.map((item) => (
            <li key={item.id} style={{ opacity: item.completed ? 0.6 : 1 }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleItem(item.id)}
                  style={{ width: "20px", height: "20px" }}
                />
                <span style={{ textDecoration: item.completed ? "line-through" : "none" }}>
                  {item.text}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}