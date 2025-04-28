import { useParams } from "@solidjs/router";
import { createResource, createSignal } from "solid-js";
import { getOne } from "../service/fognodes_service";
import { Show } from "solid-js";
import {
  addIoTObject,
  deleteIoTObject,
  updateIoTObject,
} from "../service/objects_service";
import { getAuthsAttributes } from "../service/authorities_service";

export default function FogNodePage(params) {
  const { id } = useParams();
  console.log(id);
  const [node] = createResource(async () => await getOne(id));

  return (
    <div class="page fog-node">
      <Show when={node.loading}>
        <p>Loading node...</p>
      </Show>

      <Show when={node.error}>
        <p style={{ color: "red" }}>Error: {node.error.message}</p>
      </Show>

      <Show when={node.state == "ready"}>
        {Object.keys(node()).length == 0 ? (
          <p>Wrong id : fog node doesnt exist</p>
        ) : (
          <>
            <h1>{node().name}</h1>
            <h4>id</h4>
            <p>{node().id}</p>
            <h4>desciption</h4>
            <p>{node().description || "none"}</p>
            <h4>fognode url</h4>
            <p>
              <a>
                coap://{node().ipAddress}:{node().port}/
              </a>
            </p>
            <h4>list of objects</h4>
            <ListObjects iotObjects={node().iotObjects} />
            <NewObject id={id} />
          </>
        )}
      </Show>
    </div>
  );
}

function NewObject(params) {
  const { id } = params;
  const [name, setName] = createSignal(null);
  const [description, setDescription] = createSignal(null);
  const [accessPolicy, setAccessPolicy] = createSignal(null);

  const [status, seStatus] = createSignal({ good: false, message: "" });

  const [attributes] = createResource(() => getAuthsAttributes());

  const handleUpload = async () => {
    const result = await addIoTObject(
      id,
      name(),
      description(),
      accessPolicy()
    );
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
    <section class="new-object">
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

      <label for="name">object description:</label>
      <input
        type="text"
        onChange={(e) => {
          setDescription(e.target.value);
        }}
      />

      <div>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(" OR ");
              setTimeout(() => setCopiedIndex(null), 2000);
            } catch (err) {
              console.error("Failed to copy text: ", err);
            }
          }}
        >
          OR
        </button>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(" AND ");
              setTimeout(() => setCopiedIndex(null), 2000);
            } catch (err) {
              console.error("Failed to copy text: ", err);
            }
          }}
        >
          AND
        </button>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(" ( @ ) ");
              setTimeout(() => setCopiedIndex(null), 2000);
            } catch (err) {
              console.error("Failed to copy text: ", err);
            }
          }}
        >
          ()
        </button>
      </div>
      <Show when={attributes.loading}>
        <p>Loading attributes...</p>
      </Show>

      <Show when={attributes.error}>
        <p style={{ color: "red" }}>Error: {attributes.error.message}</p>
      </Show>

      <Show when={attributes.state == "ready"}>
        {Object.keys(attributes()).length == 0 ? (
          <p>No attributes found</p>
        ) : (
          <div>
            {Object.entries(attributes()).map(([key, value], index) => {
              return (
                <div>
                  <p>{key}</p>
                  {value.map((attr, index) => (
                    <button
                      key={index}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(attr);
                        } catch (err) {
                          console.error("Failed to copy text: ", err);
                        }
                      }}
                    >
                      {attr}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </Show>
      <label for="name">object access policy:</label>
      <textarea
        type="text"
        onChange={(e) => {
          setAccessPolicy(e.target.value);
        }}
      />
      <button onClick={handleUpload}>Add object</button>
    </section>
  );
}
function ListObjects(params) {
  const { iotObjects } = params;
  const [isUpdating, setIsUpdating] = createSignal(-1);

  const handleDelete = async (name, seStatus) => {
    const result = await deleteIoTObject(name);
    if (result.ok) {
      seStatus({
        good: true,
        message: "object deleted successfully",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  const handleUpdate = async (name, description, accessPolicy, seStatus) => {
    const result = await updateIoTObject(name, description, accessPolicy);
    if (result.ok) {
      seStatus({
        good: true,
        message: "object deleted successfully",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <div class="list-objects">
      {iotObjects.length == 0 ? (
        <p>Ther are no objects for this node</p>
      ) : (
        <div>
          {iotObjects?.map((iot, index) => {
            const [description, setDescription] = createSignal(iot.description);
            const [accessPolicy, setAccessPolicy] = createSignal(
              iot.accessPolicy
            );
            const [status, seStatus] = createSignal({
              good: false,
              message: "",
            });

            return (
              <div
                class={
                  !!iot.ipAddress ? "iot-connected" : "iot-not-connected"
                }
              >
                <p>{iot.name}</p>
                <p style={{ color: status().good ? "green" : "red" }}>
                  {status().message}
                </p>
                <span>object desciption :</span>
                <input
                  value={iot.description}
                  disabled={isUpdating() != index}
                  onChange={(e) => {
                    setDescription(e.target.value);
                  }}
                />  
                <span>object access policy :</span>
                <textarea
                  value={iot.accessPolicy}
                  disabled={isUpdating() != index}
                  onChange={(e) => {
                    setAccessPolicy(e.target.value);
                  }}
                />
                {iot.ipAddress && (
                  <>
                    <p>
                      object url :
                      <a>
                        coap://{iot.ipAddress}:{iot.port}/
                      </a>
                    </p>
                  </>
                )}
                <div>
                  <button
                    class="btn-delete"
                    onClick={() => handleDelete(iot.name, seStatus)}
                  >
                    delete
                  </button>
                  <button
                    onClick={() =>
                      setIsUpdating(isUpdating() == index ? -1 : index)
                    }
                  >
                    {isUpdating() != index ? "update" : "stop updating"}
                  </button>
                  {isUpdating() == index && (
                    <button
                      class="btn-config"
                      onClick={() =>
                        handleUpdate(
                          iot.name,
                          description(),
                          accessPolicy(),
                          seStatus
                        )
                      }
                    >
                      confirm update
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
