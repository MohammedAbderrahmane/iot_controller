import AttributeManager from "./routes/Main_page";
import LoginPage from "./routes/Login_page";
import AdminContext from "./context/credentilas.jsx";
import { createEffect, useContext } from "solid-js";
import { Router, Route } from "@solidjs/router";
import { verifySession } from "./service/service.js";

function App() {
  const [admin, setAdmin] = useContext(AdminContext);

  createEffect(async () => {
    const localAdmin = JSON.parse(window.localStorage.getItem("admin"));
    console.log(localAdmin);
    if (!localAdmin) return;
    const a = await verifySession(localAdmin, setAdmin);
    if (a) console.log("verified");
    else console.log("unvirified");
    // window.location.href = "/auth";
  });

  return (
    <div>
      <Router>
        {admin && admin.authToken  ? (
          <>
            <Route path="/" component={AttributeManager} />
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
