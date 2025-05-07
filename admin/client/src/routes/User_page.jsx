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
    <div class="page list-users">
      <fieldset class="new-user">
        <legend>Create a new user</legend>
        <NewUser refetch={refetch} />
      </fieldset>

      <h2>list of users</h2>
      <Show when={users.loading}>
        <p>Loading users...</p>
      </Show>

      <Show when={users.error}>
        <p style={{ color: "red" }}>Error: {users.error.message}</p>
      </Show>

      <Show when={users.state == "ready"}>
        {!users() || users().length == 0 ? (
          <p>No users</p>
        ) : (
          <div class="users">
            {users().map((user, index) => {
              const [status, seStatus] = createSignal({
                good: false,
                message: "",
              });
              return (
                <div class="user">
                  <p>{user.username}</p>
                  <p style={{ color: status().good ? "green" : "red" }}>
                    {status().message}
                  </p>
                  <div>
                    <button
                      class="delete-btn"
                      onClick={() => handleRemoveUser(user.username, seStatus)}
                    >
                      remove user
                    </button>
                  </div>
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
    <>
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
                type="text"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <button onClick={handleUpload}>add username</button>
    </>
  );
}
