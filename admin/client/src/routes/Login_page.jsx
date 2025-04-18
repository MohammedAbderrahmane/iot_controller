import { useNavigate } from "@solidjs/router";
import { useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { connect, loginAsAdmin } from "../service/service.js";

import AdminContext from "../context/credentilas.jsx";
import { createSignal } from "solid-js";

function LoginPage(params) {
  const navigate = useNavigate();
  const [admin_not_used, setAdmin] = useContext(AdminContext);
  const [credentials, setCredentials] = createStore({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [status, seStatus] = createSignal({ good: false, message: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();

    const result = await loginAsAdmin(credentials);

    if (result.ok) {
      connect(setAdmin, {
        username: credentials.username,
        authToken: result.authToken,
      });
      seStatus({
        good: true,
        message: "connected succussfullty",
      });
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } else
      seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <div class="login-page">
      <h2>Please Enter your credential:</h2>
      <form>
        <label for="username-input">Username:</label>
        <input
          type="text"
          id="username-input"
          required
          onInput={(event) =>
            setCredentials("username", event.currentTarget.value)
          }
        />

        <label for="password-input">Password:</label>
        <input
          type="password"
          id="password-input"
          required
          onInput={(event) =>
            setCredentials("password", event.currentTarget.value)
          }
        />

        <div class="remember-me-div">
          <input
            type="checkbox"
            id="remember-me-input"
            onInput={(event) =>
              setCredentials("rememberMe", event.currentTarget.checked)
            }
          />
          <label for="remember-me-input">Remember Me</label>
        </div>
        <p style={{ color: status().good ? "green" : "red" }}>
          {status().message}
        </p>
        <button class="btn btn-wide" onClick={handleSubmit}>
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
