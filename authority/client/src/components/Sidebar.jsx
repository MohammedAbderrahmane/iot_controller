import { createSignal } from "solid-js";
import "./Sidebar.css";
import { sendAuthority } from "../service/service.js";

function Sidebar(params) {
  const [isCollapsed, setIsCollapsed] = createSignal(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed());
  };

  return (
    <div className={`sidebar ${isCollapsed() ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!isCollapsed() && <h2>Admin dashboard</h2>}
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isCollapsed() ? ">" : "<"}
        </button>
      </div>

      <ul className="sidebar-nav">
        <li className={`nav-item active`}>
          <a href="/attributes">
            {!isCollapsed() && <span className="nav-text">Attributes</span>}
            {isCollapsed() && <span className="nav-text">F</span>}
          </a>
        </li>
        <li className={`nav-item`}>
          <a href="/users">
            {!isCollapsed() && <span className="nav-text">Users</span>}
            {isCollapsed() && <span className="nav-text">U</span>}
          </a>
        </li>
      </ul>
      {!isCollapsed() && <SendAuth />}
    </div>
  );
}

function SendAuth(params) {
  const [status, seStatus] = createSignal({ good: false, message: "" });

  const handleUpload = async () => {
    const result = await sendAuthority();
    if (result.ok) {
      seStatus({
        good: true,
        message: "authority sent",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <section class="send_auth">
      <h2>Send authority public keys</h2>
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <p>to <a>http://192.168.1.12:2210/auths</a></p>
      <button onClick={handleUpload}>send</button>
    </section>
  );
}

export default Sidebar;
