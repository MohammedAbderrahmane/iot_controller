import AttributeManager from "./routes/Main_page";
import LoginPage from "./routes/Login_page";
import AdminContext from "./context/credentilas.jsx";
import { createEffect, useContext } from "solid-js";
import { Router, Route } from "@solidjs/router";
import { verifySession } from "./service/service.js";
import Sidebar from "./components/Sidebar";
import AttributesPage from "./routes/Attributes_page";
import UsersPage from "./routes/User_page";

function App() {
  const [admin, setAdmin] = useContext(AdminContext);

  createEffect(async () => {
    const localAdmin = JSON.parse(window.localStorage.getItem("admin"));
    if (!localAdmin) return;
    await verifySession(localAdmin, setAdmin);
    // window.location.href = "/auth";
  });

  return (
    <div>
      {admin && admin.authToken && <Sidebar />}
      <Router>
        {admin && admin.authToken ? (
          <>
            <Route path="/" component={AttributeManager} />
            <Route path="/attributes" component={AttributesPage} />
            <Route path="/users" component={UsersPage} />
          </>
        ) : (
          <>
            <Route path="/*" component={LoginPage} />
          </>
        )}
      </Router>
    </div>
  );
}

export default App;
