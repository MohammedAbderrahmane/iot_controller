import { createResource, createSignal, For, Show } from "solid-js";
import {
  addObject,
  getAllObjects,
  UpdateList,
  deleteObject,
  getAllAttributes,
} from "../service/service.js";

function MainPage() {
  return (
    <div>
      <UpdateSection />
      <AllObjects />
      <NewObject />
    </div>
  );
}

function UpdateSection(params) {
  const [status, seStatus] = createSignal({ good: false, message: "" });

  const handleUpload = async () => {
    const result = await UpdateList();
    if (result.ok) {
      seStatus({
        good: true,
        message: "list updated successfully",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <section>
      <h2>update list of objects</h2>
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <button onClick={handleUpload}>update</button>
    </section>
  );
}

function NewObject(params) {
  const [name, setName] = createSignal(null);
  const [accessPolicy, setAccessPolicy] = createSignal(null);
  const [status, seStatus] = createSignal({ good: false, message: "" });
  const [attributes] = createResource(async () => {
    const attributes = Object.entries(await getAllAttributes()).map(
      (iot) => iot[1]
    );
    return attributes;
  });

  const handleUpload = async () => {
    const result = await addObject(name(), accessPolicy());
    if (result.ok) {
      seStatus({
        good: true,
        message: "object created successfully",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <section>
      <h2>set new object</h2>
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <label for="name">object Name:</label>
      <input
        type="text"
        onChange={(e) => {
          setName(e.target.value);
        }}
      />

      <label for="name">object access policy:</label>
      <Show when={attributes.loading}>
        <p>Loading attributes...</p>
      </Show>

      <Show when={attributes.error}>
        <p style={{ color: "red" }}>Error: {attributes.error.message}</p>
      </Show>

      <Show when={attributes.state == "ready"}>
        {!attributes() || !attributes().length ? (
          <p>No attributes found</p>
        ) : (
          <div>
            {attributes().map((attr, index) => (
              <button
                key={index}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(attr);
                    setTimeout(() => setCopiedIndex(null), 2000);
                  } catch (err) {
                    console.error("Failed to copy text: ", err);
                  }
                }}
              >
                {attr}
              </button>
            ))}
          </div>
        )}
      </Show>
      <textarea
        type="text"
        onChange={(e) => {
          setAccessPolicy(e.target.value);
        }}
      />
      <button onClick={handleUpload}>Add Attribute</button>
    </section>
  );
}

function AllObjects(params) {
  const [status, seStatus] = createSignal({ good: false, message: "" });
  const [objects] = createResource(async () => {
    const users = Object.entries(await getAllObjects()).map((iot) => iot[1]);
    return users;
  });

  const handleUpload = async (objectName) => {
    const result = await deleteObject(objectName);
    if (result.ok) {
      seStatus({
        good: true,
        message: objectName + " deleted successfully",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <div>
      <h2>list of objects</h2>
      <Show when={objects.loading}>
        <p>Loading objects...</p>
      </Show>

      <Show when={objects.error}>
        <p style={{ color: "red" }}>Error: {objects.error.message}</p>
      </Show>

      <Show when={objects.state == "ready"}>
        <p style={{ color: status().good ? "green" : "red" }}>
          {status().message}
        </p>
        {!objects() || !objects().length ? (
          <p>No objects</p>
        ) : (
          <div>
            {objects().map((iot) => {
              return (
                <div style="border : solid 1px">
                  <p>object name : {iot.name}</p>
                  <p>object access policy : {iot.access_policy}</p>
                  {!iot.ip_address ? (
                    <>
                      <p>object not connected yet</p>
                    </>
                  ) : (
                    <>
                      <p>
                        object url : coap://{iot.ip_address}:{iot.port}/
                      </p>
                    </>
                  )}
                  <button onClick={() => handleUpload(iot.name)}>delete</button>
                </div>
              );
            })}
          </div>
        )}
      </Show>
    </div>
  );
}

export default MainPage;
