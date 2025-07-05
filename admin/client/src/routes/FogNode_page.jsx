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
    <div class="page">
      <Show when={node.loading}>
        <div class="fetch-loading">
          <p>Loading node...</p>
        </div>
      </Show>

      <Show when={node.error}>
        <div class="fetch-error">
          <p>Error: {node.error.message}</p>
        </div>
      </Show>

      <Show when={node.state == "ready"}>
        {Object.keys(node()).length == 0 ? (
          <div class="fetch-error">
            <p>Wrong id : fog node doesnt exist</p>
          </div>
        ) : (
          <FogNodeDiv node={node()} refetch={refetch} />
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
    <fieldset class="new-object">
      <legend>set new object</legend>
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <table>
        <tbody>
           <tr>
            <td>
              <label htmlFor="name"> Id:</label>
            </td>
            <td>
              <input
                type="text"
                id="id" // Added id to match label's htmlFor
                onChange={(e) => console.log("id")}
              />
            </td>
          </tr>
          <tr>
            <td>
              <label htmlFor="name"> Name:</label>
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
              <label htmlFor="description"> description:</label>
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
          <tr>
            <td>
              <label for="name"> access policy:</label>
            </td>
            <td>
              <textarea
                type="text"
                onChange={(e) => {
                  setAccessPolicy(e.target.value);
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div class="operations-div">
        <button
          class="search-btn"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(" OR ");
            } catch (err) {
              console.error("Failed to copy text: ", err);
            }
          }}
        >
          OR
        </button>
        <button
          class="search-btn"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(" AND ");
            } catch (err) {
              console.error("Failed to copy text: ", err);
            }
          }}
        >
          AND
        </button>
        <button
          class="search-btn"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(" ( @ ) ");
            } catch (err) {
              console.error("Failed to copy text: ", err);
            }
          }}
        >
          ( @ )
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
          <div class="list-attributes">
            {Object.entries(attributes()).map(([key, value], index) => {
              return (
                <>
                  <p>{key} : </p>
                  {value.map((attr, index) => (
                    <button
                      class="search-btn"
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
                </>
              );
            })}
          </div>
        )}
      </Show>
      <button onClick={handleUpload}>Add object</button>
    </fieldset>
  );
}

function ObjectCard({ index, iot, isUpdating, setIsUpdating, nodeId }) {
  const [description, setDescription] = createSignal(iot.description);
  const [accessPolicy, setAccessPolicy] = createSignal(iot.accessPolicy);
  const [status, seStatus] = createSignal({
    good: false,
    message: "",
  });

  const handleDelete = async (name) => {
    const result = await deleteIoTObject(name,nodeId);

    if (result.ok) {
      seStatus({
        good: true,
        message: "object deleted successfully",
      });

      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  const handleUpdate = async (name, description, accessPolicy) => {
    const result = await updateIoTObject(
      name,
      description,
      accessPolicy,
      nodeId
    );
    if (result.ok) {
      seStatus({
        good: true,
        message: "object updated successfully",
      });
      return;
    }
    seStatus({ good: false, message: result.message || "unknown error" });
  };

  return (
    <div
      class={
        "object-card " +
        (!!iot.ipAddress ? "iot-connected" : "iot-not-connected")
      }
    >
      <h3>{iot.name}</h3>

      <div class="object-info">
        <span>id : </span>
        <span>{iot.id}</span>
        <span>description : </span>
        <div>
          <textarea
            value={iot.description}
            disabled={isUpdating() !== index}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <span>access policy : </span>
        <div>
          <textarea
            value={iot.accessPolicy}
            disabled={isUpdating() !== index}
            onChange={(e) => setAccessPolicy(e.target.value)}
          />
        </div>
        <span>created : </span>
        <span>{new Date(iot.date_creation).toLocaleString()}</span>
        {iot.ipAddress && (
          <>
            <span>ip address : </span>
            <span>{iot.ipAddress}</span>
            <span>port : </span>
            <span>{iot.port}</span>
            <span>date de entry : </span>
            <span>{new Date(iot.date_enters).toLocaleString()}</span>
          </>
        )}
      </div>

      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>

      <div class="object-actions">
        <button className="delete-btn" onClick={() => handleDelete(iot.name)}>
          delete
        </button>

        <button
          class="search-btn"
          onClick={() => setIsUpdating(isUpdating() === index ? -1 : index)}
        >
          {isUpdating() !== index ? "update" : "stop updating"}
        </button>
        {isUpdating() === index && (
          <button
            className="accept-btn"
            onClick={() =>
              handleUpdate(iot.name, description(), accessPolicy())
            }
          >
            confirm update
          </button>
        )}
      </div>
    </div>
  );
}

function FogNodeDiv({ node, refetch }) {
  const [isUpdating, setIsUpdating] = createSignal(-1);

  return (
    <>
      <h2>{node.name}</h2>

      <div class="node-info">
        <span>id : </span>
        <span>{node.id}</span>
        <span>desciption : </span>
        <span>{node.description || "none"}</span>
        <span>url : </span>
        <span>{node.url}/</span>
        <span>created : </span>
        <span>{new Date(node.date_creation).toLocaleString()}</span>
        <span>entred : </span>
        <span>{new Date(node.date_entering).toLocaleString()}</span>
      </div>

      <h3>List of objects</h3>

      <div class="list-objects">
        {node.iotObjects.length == 0 ? (
          <div class="fetch-loading">
            <p class="show-empty-p">There are no objects for this node</p>
          </div>
        ) : (
          <>
            {node.iotObjects?.map((iot, index) => (
              <ObjectCard
                nodeId={node.id}
                iot={iot}
                index={index}
                isUpdating={isUpdating}
                setIsUpdating={setIsUpdating}
              />
            ))}
          </>
        )}
      </div>
      <NewObject id={node.id} refetch={refetch} />
    </>
  );
}
