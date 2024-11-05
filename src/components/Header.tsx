import { NavLink } from "react-router-dom";
import "./Header.css";
export const Header = () => {
  return (
    <nav
      className="navbar navbar-expand-lg navbar-light py-4"
      style={{ backgroundColor: "#e3f2fd" }}
    >
      <div className="container">
        <NavLink className="navbar-brand" to="">
          CertiCraft
        </NavLink>
        <div
          className="collapse navbar-collapse justify-content-end"
          id="navbarNav"
        >
          <ul className="navbar-nav d-flex gap-3">
            <li className="nav-item">
              <NavLink
                className="nav-link active"
                aria-current="page"
                to="courses"
              >
                Acceder
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className="btn btn-light link"
                aria-current="page"
                to="about"
              >
                Registrarse
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
