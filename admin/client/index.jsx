import { render } from "solid-js/web";
import App from "./src/App.jsx";
import { AdminProvider } from "./src/context/credentilas.jsx";
import "./index.scss"

const root = document.getElementById("root");

render(
  () => (
    <AdminProvider>
      <App />
    </AdminProvider>
  ),
  root
);
