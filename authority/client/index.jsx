import { render } from "solid-js/web";
import App from "./src/App";
import { AdminProvider } from "./src/context/credentilas";
import "./index.css"

const root = document.getElementById("root");
render(
  () => (
    <AdminProvider>
      <App />
    </AdminProvider>
  ),
  root
);
