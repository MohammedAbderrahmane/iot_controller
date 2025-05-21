import { createResource, createSignal } from "solid-js";
import { addUser, getAuthority, getUsers } from "../service/service";
import {
  addUserAttribute,
  deleteUser,
  addAllUsers,
  updateUserAttribute,
  deleteUserAttribute,
} from "../service/user_service";
import { Show } from "solid-js";

export default function UsersPage(params) {
  const [users, { refetch }] = createResource(async () => getUsers());
  const [info] = createResource(async () => await getAuthority());

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

  const handleDeleteAttribute = async (username, attribute, seStatus) => {
    const result = await deleteUserAttribute(username, attribute);
    if (result.ok) {
      seStatus({
        good: true,
        message: "attribute deleted from user successfully",
      });
      setTimeout(() => refetch(), 1500);
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  const handleAddAttribute = async (username, attribute, seStatus) => {
    const result = await addUserAttribute(username, attribute);
    if (result.ok) {
      seStatus({
        good: true,
        message: "attribute add to user successfully",
      });
      setTimeout(() => refetch(), 1500);
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <div class="page list-users">
      <fieldset class="new-user">
        <legend>Get users from admin</legend>
        <GetUsers refetch={refetch} />
      </fieldset>

      <h2>list of users</h2>
      <Show when={users.loading}>
        <p>Loading users...</p>
      </Show>

      <Show when={users.error}>
        <p style={{ color: "red" }}>Error: {users.error.message}</p>
      </Show>

      <Show when={users.state == "ready"}>
        {!users() ? (
          <p>No users</p>
        ) : (
          <div class="users">
            {users().map((user, index) => {
              const [attrs, setAttrs] = createSignal([]);

              if (user.attributes.length) {
                setAttrs(user.attributes.split("/"));
              }

              const [status, seStatus] = createSignal({
                good: false,
                message: "",
              });
              const [toggleAttributes, setToggleAttributes] = createSignal({});

              const [attribute, setAttribute] = createSignal(null);
              const [action, setAction] = createSignal([-1, -1]);

              const handleUpload = async () => {
                const toggled = toggleAttributes();

                const validAttributes = Object.entries(toggled)
                  .filter(([key, value]) => value)
                  .map((tgl) => tgl[0]);
                console.log(validAttributes);

                const result = await updateUserAttribute(
                  user.username,
                  validAttributes
                );
                if (result.ok) {
                  seStatus({
                    good: true,
                    message: "attribute added successfully",
                  });
                  setTimeout(() => refetch(), 1500);
                  return;
                }
                seStatus({
                  good: false,
                  message: result.message || "unknown error",
                });
              };

              const toggle = (attr) => {
                setToggleAttributes((prev) => {
                  return { ...prev, [attr]: !prev[attr] };
                });
              };

              return (
                <div class="user">
                  <p>{user.username}</p>
                  {attrs().length ? (
                    attrs().map((attr) => <span>{attr}</span>)
                  ) : (
                    <p>User have no attributes</p>
                  )}
                  <p style={{ color: status().good ? "green" : "red" }}>
                    {status().message}
                  </p>
                  {attrs().length ? (
                    <div>
                      <button
                        class="renew-btn"
                        onClick={() => {
                          setAction([index, 0]);
                        }}
                      >
                        add attribute
                      </button>
                      {attrs().length > 1 && (
                        <button
                          class="delete-btn"
                          onClick={() => {
                            setAction([index, 1]);
                          }}
                        >
                          remove attribute
                        </button>
                      )}
                      <button
                        class="delete-btn"
                        onClick={() =>
                          handleRemoveUser(user.username, seStatus)
                        }
                      >
                        remove user
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Show when={info.loading}>
                        <p>Loading attributes...</p>
                      </Show>

                      <Show when={info.error}>
                        <p style={{ color: "red" }}>
                          Error: {users.error.message}
                        </p>
                      </Show>

                      <Show when={info.state == "ready"}>
                        {info().authority.Pk.attributes.map((attr) => (
                          <button
                            onClick={(e) => {
                              toggle(attr);
                            }}
                            style={{
                              background: toggleAttributes()[attr]
                                ? "green"
                                : "grey",
                            }}
                          >
                            {attr}
                          </button>
                        ))}
                        <button onClick={handleUpload}>add attributes</button>
                      </Show>
                    </div>
                  )}

                  {action()[0] == index &&
                    (action()[1] == 0 ? (
                      <div class="select-div">
                        <select onChange={(e) => setAttribute(e.target.value)}>
                          <option value="">Select an attribute</option>
                          {info()
                            .authority.Pk.attributes.filter(
                              (attr) => !attrs().includes(attr)
                            )
                            .map((attr) => (
                              <option value={attr}>{attr}</option>
                            ))}
                        </select>
                        <button
                          onClick={() =>
                            handleAddAttribute(
                              user.username,
                              attribute(),
                              seStatus
                            )
                          }
                        >
                          confim add
                        </button>
                      </div>
                    ) : (
                      <div class="select-div">
                        <select onChange={(e) => setAttribute(e.target.value)}>
                          <option value="">Select an attribute</option>
                          {attrs().map((attr) => (
                            <option value={attr}>{attr}</option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            handleDeleteAttribute(
                              user.username,
                              attribute(),
                              seStatus
                            )
                          }
                        >
                          confim delete
                        </button>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        )}
      </Show>
    </div>
  );
}

function GetUsers(params) {
  const { refetch } = params;
  const [status, seStatus] = createSignal({ good: false, message: "" });

  const handleUpload = async () => {
    const result = await addAllUsers();
    if (result.ok) {
      seStatus({
        good: true,
        message: "attribute added successfully",
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
      <button onClick={handleUpload}>get users from admin</button>
    </>
  );
}
