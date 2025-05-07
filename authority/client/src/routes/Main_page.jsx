import "./main.css";

function MainPage() {
  return (
    <div class="page main-page">
      <h1>Welcome admin</h1>

      <div class="card-container">
        <div class="card">
          <a href="/attributes">
            <img src="tag.png" />
            <div class="card-content">
              <h3>Attributes</h3>
              <p>Manage the attributes of the authority</p>
            </div>
          </a>
        </div>

        <div class="card">
          <a href="/users ">
            <img src="team.png" />
            <div class="card-content">
              <h3>Users</h3>
              <p>Manage the users of the authority</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
