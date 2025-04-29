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
  const [node, { mutate, refetch }] = createResource(
    async () => await getOne(id)
  );

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
            <table>
              <tbody>
                <tr>
                  <td>id</td>
                  <td>{node().id}</td>
                </tr>
                <tr>
                  <td>desciption</td>
                  <td>{node().description || "none"}</td>
                </tr>
                <tr>
                  <td>fognode url</td>
                  <td>
                    <a>
                      coap://{node().ipAddress}:{node().port}/
                    </a>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>list of objects</td>
                </tr>
                <tr>
                  <td colSpan={2} class="list-objects">
                    <ListObjects
                      iotObjects={node().iotObjects}
                      refetch={refetch}
                    />
                  </td>
                </tr>
                <tr>
                  <td colSpan="2">
                    <NewObject id={id} refetch={refetch} />
                  </td>
                </tr>
              </tbody>
            </table>{" "}
          </>
        )}
      </Show>
    </div>
  );
}

function NewObject(params) {
  const { id, refetch } = params;
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
      setTimeout(() => refetch(), 2000);
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
    setTimeout(() => seStatus({ message: "" }), 2000);
  };

  return (
    <section class="new-object">
      <h2>set new object</h2>
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <table>
        <tbody>
          <tr>
            <td>
              <label htmlFor="name">object Name:</label>
            </td>
            <td>
              <input
                type="text"
                id="name" // Added id to match label's htmlFor
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
            </td>
          </tr>
          <tr>
            <td>
              <label htmlFor="description">object description:</label>
            </td>
            <td>
              <input
                type="text"
                id="description" // Added id to match label's htmlFor
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>

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
          <div class="auth-list">
            {Object.entries(attributes()).map(([key, value], index) => {
              return (
                <div>
                  <p>{key} : </p>
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
  const { iotObjects, refetch } = params;
  const [isUpdating, setIsUpdating] = createSignal(-1);

  const handleDelete = async (name, seStatus) => {
    const result = await deleteIoTObject(name);
    if (result.ok) {
      seStatus({
        good: true,
        message: "object deleted successfully",
      });
      setTimeout(() => refetch(), 2500);
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
      setTimeout(() => refetch(), 2500);
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <>
      {iotObjects.length == 0 ? (
        <p class="show-empty-p">There are no objects for this node</p>
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
              <table
              class={
                "object-table " +
                (!!iot.ipAddress ? "iot-connected" : "iot-not-connected")
              }
            >
              <tbody>
                <tr>
                  <td colSpan={2}>{iot.name}</td>
                </tr>
                <tr> {/* FIXME */}
                  <td colSpan={2} style={{ color: status().good ? "green" : "red" }}>
                    {status().message}
                  </td>
                </tr>

                <tr>
                  <td>fog node:</td>
                  <td>{iot.nodeId}</td>
                </tr>

                <tr>
                  <td>object desciption:</td>
                  <td>
                    <input
                      type="text"
                      value={iot.description}
                      disabled={isUpdating() !== index}
                      onChange={(e) => {
                        setDescription(e.target.value);
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td>object access policy:</td>
                  <td>
                    <textarea
                      value={iot.accessPolicy}
                      disabled={isUpdating() !== index}
                      onChange={(e) => {
                        setAccessPolicy(e.target.value);
                      }}
                    />
                  </td>
                </tr>
                {iot.ipAddress && (
                  <tr>
                    <td>object url:</td>
                    <td>
                      <a>
                        coap://{iot.ipAddress}:{iot.port}/
                      </a>
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan="2">
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(iot.name, seStatus)}
                    >
                      delete
                    </button>

                    <button
                      onClick={() =>
                        setIsUpdating(isUpdating() === index ? -1 : index)
                      }
                    >
                      {isUpdating() !== index ? "update" : "stop updating"}
                    </button>
                    {isUpdating() === index && (
                      <button
                        className="btn-config"
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
                  </td>
                </tr>
              </tbody>
            </table>
            );
          })}
        </div>
      )}
    </>
  );
}
