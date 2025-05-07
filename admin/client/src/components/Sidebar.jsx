import { createSignal } from "solid-js";
import "./Sidebar.css";

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
          <a href="/fognodes">
            <img src="cloud.png" />
            {!isCollapsed() && <span className="nav-text">Fog nodes</span>}
          </a>
        </li>
        <li className={`nav-item`}>
          <a href="/auths">
            <img src="auction.png" />
            {!isCollapsed() && <span className="nav-text">Authorities</span>}
          </a>
        </li>
        <li className={`nav-item`}>
          <a href="/objects">
            <img src="iot.png" />

            {!isCollapsed() && <span className="nav-text">IoT objects</span>}
          </a>
        </li>
        <li className={`nav-item`}>
          <a href="/users">
            <img src="team.png" />
            {!isCollapsed() && <span className="nav-text">Users</span>}
          </a>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
