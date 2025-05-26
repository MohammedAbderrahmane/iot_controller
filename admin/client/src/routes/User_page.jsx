import { createResource, createSignal } from "solid-js";
import { addUser, getUsers, deleteUser } from "../service/user_service.js";
import { Show } from "solid-js";

export default function UsersPage(params) {
  const [users, { refetch }] = createResource(async () => getUsers());
  const handleRemoveUser = async (username, seStatus) => {
    const result = await deleteUser(username);
    if (result.ok) {
      seStatus({
        good: true,
        message: "user deleted successfully",
      });
      setTimeout(() => refetch(), 1500);
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <div class="page">
      
        <NewUser refetch={refetch} />


      <h2 class="page-title">list of users</h2>
      <Show when={users.loading}>
        <div class="fetch-loading">
        <p>Loading users...</p>

        </div>
      </Show>

      <Show when={users.error}>
        <div class="fetch-error">

        <p>Error: {users.error.message}</p>
        </div>
      </Show>

      <Show when={users.state == "ready"}>
        {!users() || users().length == 0 ? (
          <div class="fetch-loading">
          <p>No users found</p>
        </div>
        ) : (
          <div class="list-users">
            {users().map((user, index) => {
              const [status, seStatus] = createSignal({
                good: false,
                message: "",
              });
              return (
                <div class="user-card">
                  <h3>{user.username}</h3>
                  <div class="user-info">
                    <span>created: </span>
                    <span>{new Date(user.date_creation).toLocaleString()}</span>
                  </div>
                    <span style={{ color: status().good ? "green" : "red" }}>
                      {status().message}
                    </span>
                  <button
                    class="delete-btn"
                    onClick={() => handleRemoveUser(user.username, seStatus)}
                  >
                    remove user
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Show>
    </div>
  );
}

function NewUser(params) {
  const { refetch } = params;
  const [username, setUsername] = createSignal(null);
  const [password, setPassword] = createSignal(null);
  const [status, seStatus] = createSignal({ good: false, message: "" });

  const handleUpload = async () => {
    const result = await addUser(username(), password());
    if (result.ok) {
      seStatus({
        good: true,
        message: "user added successfully",
      });
      setTimeout(() => refetch(), 1500);
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <fieldset class="new-user">

        <legend>Create a new user</legend>
       
    
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <table>
        <tbody>
          <tr>
            <td>
              <label for="name">username:</label>
            </td>
            <td>
              <input
                onChange={(e) => {
                  setUsername(e.target.value);
                }}
                type="text"
              />
            </td>
          </tr>

          <tr>
            <td>
              <label for="name">password:</label>
            </td>
            <td>
              <input
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                type="password"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <button onClick={handleUpload}>add username</button>
      </fieldset>
  );
}
