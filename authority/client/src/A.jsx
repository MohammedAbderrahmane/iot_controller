import { createResource, createSignal, For, Show } from "solid-js";
import {
  getAuthority,
  importPublicParameters,
  importAuthority,
  createNewAuthority,
  addAttribute,
  renewAttribute,
  addUser,
  getUsers,
} from "./service/service.js";

function AttributeManager() {
  const [info] = createResource(async () => await getAuthority());

  return (
    <div>
      <Show when={info.loading}>
        <p>Loading info...</p>
      </Show>

      <Show when={info.error}>
        <p style={{ color: "red" }}>Error: {users.error.message}</p>
      </Show>

      <Show when={info.state == "ready"}>
        {!info().maabePublicParameter ? (
          <ImportPablicParameters />
        ) : !info().authority ? (
          <>
            <ImportAuthority />
            <p>OR</p>
            <NewAuthority />
          </>
        ) : (
          <>
            <h1>Authority : {info().authority.ID}</h1>
            <section>
              <h2>Existing Attributes</h2>
              {info().authority.Pk.attributes.length === 0 ? (
                <p>No attributes defined yet.</p>
              ) : (
                <ul>
                  <For each={info().authority.Pk.attributes}>
                    {(attr) => (
                      <li>
                        <strong>{attr}</strong>
                      </li>
                    )}
                  </For>
                </ul>
              )}
            </section>
            <AddAttribute />
            <RenewAttribute attributes={info().authority.Pk.attributes} />
            <NewUser attributes={info().authority.Pk.attributes} />
            <AllUsers />
          </>
        )}
      </Show>
    </div>
  );
}

function ImportPablicParameters(params) {
  const [file, setFile] = createSignal(null);
  const [status, seStatus] = createSignal({ good: false, message: "" });

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const result = await importPublicParameters(file());
    if (result.ok) {
      seStatus({
        good: true,
        message: "MAABE public parameters imported successfully",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <div>
      <p>Import the maabe public parameters :</p>
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <input type="file" onChange={handleChange} />
      <button onClick={handleUpload} disabled={!file()}>
        import maabe public parameter
      </button>
    </div>
  );
}

function ImportAuthority(params) {
  const [file, setFile] = createSignal(null);
  const [status, seStatus] = createSignal({ good: false, message: "" });

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const result = await importAuthority(file());
    if (result.ok) {
      seStatus({
        good: true,
        message: "authority imported successfully",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <div>
      <p>Import authority</p>
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <input type="file" onChange={handleChange} />
      <button onClick={handleUpload} disabled={!file()}>
        import authority
      </button>
    </div>
  );
}

function NewAuthority(params) {
  const [authorityName, setAuthorityName] = createSignal(null);
  const [status, seStatus] = createSignal({ good: false, message: "" });
  const [attributes, setAttribues] = createSignal([""]);

  const handleAddAttribute = () => {
    setAttribues((prev) => [...prev, ""]);
  };

  const handleRemoveAttribute = (index) => {
    setAttribues((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    setAuthorityName(e.target.value);
  };

  const handleUpload = async () => {
    const result = await createNewAuthority(authorityName(), attributes());
    if (result.ok) {
      seStatus({
        good: true,
        message: "authority created successfully",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <div>
      <p>create new authority</p>
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <input
        type="text"
        placeholder="enter the authority name"
        onChange={handleChange}
      />

      <button onClick={handleAddAttribute}>add Attribute</button>
      <For each={attributes()}>
        {(attr, index) => (
          <div>
            <input
              type="text"
              value={attr}
              onChange={(e) =>
                setAttribues((prev) =>
                  prev.map((val, i) => (i === index() ? e.target.value : val))
                )
              }
            />
            <button
              variant="destructive"
              onClick={() => handleRemoveAttribute(index())}
              className="shrink-0"
            >
              x
            </button>
          </div>
        )}
      </For>

      <button onClick={handleUpload} disabled={!authorityName()}>
        create authority
      </button>
    </div>
  );
}

function AddAttribute(params) {
  const [attribute, setAttribute] = createSignal(null);
  const [status, seStatus] = createSignal({ good: false, message: "" });

  const handleChange = (e) => {
    setAttribute(e.target.value);
  };

  const handleUpload = async () => {
    const result = await addAttribute(attribute());
    if (result.ok) {
      seStatus({
        good: true,
        message: "attribute added successfully",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <section>
      <h2>Create New Attribute</h2>
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <label for="name">Attribute Name:</label>
      <input type="text" onChange={handleChange} />
      <button onClick={handleUpload}>Add Attribute</button>
    </section>
  );
}

function RenewAttribute(params) {
  const { attributes } = params;
  const [attribute, setAttribute] = createSignal(null);
  const [status, seStatus] = createSignal({ good: false, message: "" });

  const handleChange = (e) => {
    setAttribute(e.target.value);
  };

  const handleUpload = async () => {
    const result = await renewAttribute(attribute());
    if (result.ok) {
      seStatus({
        good: true,
        message: "attribute added successfully",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <section>
      <h2>Renenw attribute</h2>
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <label for="name">Attribute Name:</label>
      <select onChange={handleChange}>
        <option value="">Select an attribute</option>
        {attributes.map((attr) => (
          <option value={attr}>{attr}</option>
        ))}
      </select>
      <button onClick={handleUpload}>renew Attribute</button>
    </section>
  );
}

function NewUser(params) {
  const [attributes, setAttributes] = createSignal(params.attributes);
  const [toggleAttributes, setToggleAttributes] = createSignal({});
  const [username, setUsername] = createSignal(null);
  const [password, setPassword] = createSignal(null);
  const [status, seStatus] = createSignal({ good: false, message: "" });

  const handleUpload = async () => {
    const toggled = toggleAttributes();

    const validAttributes = Object.entries(toggled)
      .filter(([key, value]) => value)
      .map((tgl) => tgl[0]);

    const result = await addUser(username(), password(), validAttributes);
    if (result.ok) {
      seStatus({
        good: true,
        message: "attribute added successfully",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  const toggle = (attr) => {
    setToggleAttributes((prev) => {
      return { ...prev, [attr]: !prev[attr] };
    });
  };

  return (
    <section>
      <h2>new user</h2>
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <label for="name">username:</label>
      <input
        onChange={(e) => {
          setUsername(e.target.value);
        }}
        type="text"
      />
      <label for="name">password:</label>
      <input
        onChange={(e) => {
          setPassword(e.target.value);
        }}
        type="text"
      />
      {attributes().map((attr) => (
        <button
          onClick={(e) => {
            toggle(attr);
          }}
          style={{ background: toggleAttributes()[attr] ? "green" : "grey" }}
        >
          {attr}
        </button>
      ))}
      <button onClick={handleUpload}>add username</button>
    </section>
  );
}

function AllUsers(params) {
  const [users] = createResource(async () => {
    const users = Object.entries(await getUsers()).map((user) => user[1]);
    return users;
  });
  return (
    <div>
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
          <div style={{display:"flex" , flexDirection:"row"}}>
            {users().map((user) => {
              console.log(user.attributes);
              const attrs = user.attributes.split("/");
              return (
                <div style="border : solid 1px">
                  <p style={{textAlign:"center"}}>{user.username}</p>
                  {attrs.map((attr) => (
                    <span style="margin : 20px">{attr}</span>
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

export default AttributeManager;
