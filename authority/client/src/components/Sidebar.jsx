import { createSignal } from "solid-js";
import "./Sidebar.css";
import {sendAuthority} from "../service/service.js"

function Sidebar(params) {
  const [isCollapsed, setIsCollapsed] = createSignal(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed());
  };

  return (
    <div className={`sidebar ${isCollapsed() ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!isCollapsed() && (
          <a href="/">
            <h2>Admin dashboard</h2>
          </a>
        )}
        <button className="toggle-btn" onClick={toggleSidebar}>
          <img
            class={"icon-on-dark" + (isCollapsed() ? " img-inversed" : "")}
            src="left-arrows.png"
            width="30"
          />
        </button>
      </div>

      <ul className="sidebar-nav">
        <li className={`nav-item active`}>
          <a href="/attributes">
            <img src="tag.png" />
            {!isCollapsed() && <span className="nav-text">Attributes</span>}
          </a>
        </li>
        <li className={`nav-item`}>
          <a href="/users">
            <img src="team.png" />
            {!isCollapsed() && <span className="nav-text">Users</span>}
          </a>
        </li>
      </ul>
      <div class="logout">
        <button onClick={()=>{
           window.localStorage.removeItem("admin");
           window.location = "/"
        }}>logout</button>
      </div>
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
