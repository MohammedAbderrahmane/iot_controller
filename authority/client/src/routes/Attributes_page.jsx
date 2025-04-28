import {
  addAttribute,
  createNewAuthority,
  deleteAttribute,
  getAuthority,
  importAuthority,
  importPublicParameters,
  renewAttribute,
} from "../service/service";
import { createResource, createSignal, For } from "solid-js";

export default function AttributesPage(params) {
  const [info] = createResource(async () => await getAuthority());
  const [status, seStatus] = createSignal({ good: false, message: "" });

  const handleRenew = async (attr) => {
    const result = await renewAttribute(attr);
    if (result.ok) {
      seStatus({
        good: true,
        message: "attribute renewed successfully",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  const handleDelete = async (attr) => {
    const result = await deleteAttribute(attr);
    if (result.ok) {
      seStatus({
        good: true,
        message: "attribute renewed successfully",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <section class="page attribute-div">
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
            <h1>OR</h1>
            <NewAuthority />
          </>
        ) : (
          <>
            <h2>List of Attributes</h2>
            <div class="row">
              <AddAttribute />
            </div>
            <p style={{ color: status().good ? "green" : "red" }}>
              {status().message}
            </p>

            {info().authority.Pk.attributes.length === 0 ? (
              <p>No attributes defined yet.</p>
            ) : (
              <ul>
                <For each={info().authority.Pk.attributes}>
                  {(attr) => (
                    <>
                      <li>
                        <strong>{attr}</strong>
                        <button
                          class="righted renew-btn"
                          onClick={() => handleRenew(attr)}
                        >
                          renew Attribute
                        </button>
                        <button
                          class="delete-btn"
                          onClick={() => handleDelete(attr)}
                        >
                          delete
                        </button>
                        <br />
                      </li>
                      <div>
                        <p>
                          <strong>Public Key</strong> :{" "}
                          {info().authority.Pk.EggToAlpha[attr]} ,{" "}
                          {info().authority.Pk.GToY[attr]}
                        </p>
                      </div>
                    </>
                  )}
                </For>
              </ul>
            )}
          </>
        )}
      </Show>
    </section>
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
    <fieldset class="create-attribute">
      <legend>Create New Attribute</legend>
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <label for="name">Attribute Name:</label>
      <input type="text" onChange={handleChange} />
      <button onClick={handleUpload}>Add Attribute</button>
    </fieldset>
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
    <div class="import_maabe">
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
    <div class="import-authority">
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
    <div class="create-auth">
      <p>create new authority</p>
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <input
        type="text"
        placeholder="enter the authority name"
        onChange={handleChange}
      />

      <button onClick={handleAddAttribute}>add attribute</button>
      <For each={attributes()}>
        {(attr, index) => (
          <div class="attribute-input">
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