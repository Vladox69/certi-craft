import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { MainLayout } from "./layouts";
import { Outlet } from "react-router-dom";

function App() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

export default App;
