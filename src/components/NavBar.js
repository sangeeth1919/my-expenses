import { useState } from "react";
import { NavLink } from "react-router-dom";
import { logoutUser } from "../firebase";

function NavBar({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    closeMenu();
    if (onLogout) {
      onLogout();
    } else {
      logoutUser();
    }
  };

  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-brand">
        <NavLink to="/" onClick={closeMenu} className="brand-logo">
          Expenses
        </NavLink>
        <button
          type="button"
          className="hamburger"
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
        >
          <span className={`bar ${isOpen ? "open" : ""}`} />
          <span className={`bar ${isOpen ? "open" : ""}`} />
          <span className={`bar ${isOpen ? "open" : ""}`} />
        </button>
      </div>

      <div className={`nav-links ${isOpen ? "is-open" : ""}`}>
        <NavLink to="/metrics" end onClick={closeMenu}>
          Dashboard
        </NavLink>
        <NavLink to="/add" onClick={closeMenu}>
          Add Expense
        </NavLink>
        <NavLink to="/checklists" onClick={closeMenu}>
          Checklists
        </NavLink>
        <NavLink to="/admin" onClick={closeMenu}>
          Admin
        </NavLink>
        <button
          type="button"
          className="link logout-btn"
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}

export default NavBar;