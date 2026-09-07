import { NavLink } from "react-router-dom";

function NavBar() {
  return (
    <nav className="nav" aria-label="Main">
      <NavLink to="/" end>
        Dashboard
      </NavLink>
      <NavLink to="/admin">Admin</NavLink>
    </nav>
  );
}

export default NavBar;
