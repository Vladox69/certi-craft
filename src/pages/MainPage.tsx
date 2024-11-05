import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card } from "../interface";
import "./MainPage.css";
import { faFilePdf, faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import { NavLink } from "react-router-dom";
export const MainPage = () => {
  const cards: Card[] = [
    {
      description: "Crea plantillas de certificados con un diseño personalizado",
      icon: <FontAwesomeIcon style={{ fontSize: 40 }} icon={faPenToSquare} />,
      title: "Crear plantilla de certificado",
      to:"template"
    },
    {
      description: "Genera certificados a partir de un archivo",
      icon: <FontAwesomeIcon style={{ fontSize: 40 }} icon={faFilePdf} />,
      title: "A partir de un archivo",
      to:"pdf"
    },
  ];
  return (
    <div className="container">
      <h2 className="text-center mt-4">
        Herramienta para gestionar certificados
      </h2>
      <p className="text-center mt-4 fs-5 text-muted">
        Herramienta online para crear y editar certificados de manera fácil y
        rápida. No se necesita de una instalación.
      </p>
      <div className="container-fluid mt-4">
        <div className="row">
          {cards.map((card, index) => (
            <div className="col-12 col-md-4 col-lg-3 my-2" key={index}>
              <NavLink
                to={card.to}
                className="border rounded d-flex flex-column align-items-start p-4 grid-item nav-link active"
              >
                {card.icon}
                <span className="fs-6  mt-2 fw-bold">{card.title}</span>
                <span className="text-muted">{card.description}</span>
              </NavLink>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
