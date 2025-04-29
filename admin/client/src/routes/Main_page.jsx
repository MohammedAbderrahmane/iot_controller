import "./main.css";

function MainPage() {
  return (
    <div class="page main-page">
      <h1>Welcome admin</h1>

      <div class="card-container">
        <div class="card">
          <a href="/fognodes">
            <img src="cloud.png" />
            <div class="card-content">
              <h3>List of fog nodes</h3>
              <p>Manage the fog nodes and the objects assosiated with them</p>
            </div>
          </a>
        </div>

        <div class="card">
          <a href="/authorities">
            <img src="auction.png" />
            <div class="card-content">
              <h3>List of authities</h3>
              <p>Lookup the MA-ABE authorities in the system</p>
            </div>
          </a>
        </div>

        <div class="card">
          <a href="/objects">
            <img src="iot.png" />
            <div class="card-content">
              <h3>List of IoT objects</h3>
              <p>Lookup and manage IoT objects in the system</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
