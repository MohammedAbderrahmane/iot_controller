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
        {!isCollapsed() && <h2>Admin dashboard</h2>}
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isCollapsed() ? ">" : "<"}
        </button>
      </div>

      <ul className="sidebar-nav">
        <li className={`nav-item active`}>
          <a href="/fognodes">
            {!isCollapsed() && <span className="nav-text">Fog nodes</span>}
            {isCollapsed() && <span className="nav-text">F</span>}
          </a>
        </li>
        <li className={`nav-item`}>
          <a href="/auths">
            {!isCollapsed() && <span className="nav-text">Authorities</span>}
            {isCollapsed() && <span className="nav-text">A</span>}
          </a>
        </li>
        <li className={`nav-item`}>
          <a href="/objects">
            {!isCollapsed() && <span className="nav-text">IoT objects</span>}
            {isCollapsed() && <span className="nav-text">O</span>}
          </a>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
