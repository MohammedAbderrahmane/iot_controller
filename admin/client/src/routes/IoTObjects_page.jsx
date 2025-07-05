import { createSignal } from "solid-js";
import { createResource } from "solid-js";
import { deleteIoTObject, getIoTObjects, updateIoTObject } from "../service/objects_service";

export default function IoTObjectPage(params) {
  const [iotObjects, { mutate, refetch }] = createResource(() =>
    getIoTObjects()
  );
  const [isUpdating, setIsUpdating] = createSignal(-1);
  const [filterText, setFilterText] = createSignal("");



  const handleFilterChange = (event) => {
    setFilterText(event.target.value);
  };

  const filteredData = () => {
    mutate((prev) =>
      prev.filter(
        (item) =>
          item.name.toLowerCase().includes(filterText().toLowerCase()) ||
          item.description.toLowerCase().includes(filterText().toLowerCase()) ||
          item.ipAddress?.toLowerCase().includes(filterText().toLowerCase()) ||
          item.accessPolicy
            .toLowerCase()
            .includes(filterText().toLowerCase()) ||
          item.fog_node.toLowerCase().includes(filterText().toLowerCase())
      )
    );
  };

  return (
    <div class="page">
      <h2>list of objects</h2>
      <div class="filter-objects-div">
        <input
          type="text"
          placeholder="Filter data..."
          value={filterText()}
          onChange={handleFilterChange}
        />
        <button
          class="search-btn"
          onClick={() => {
            filteredData();
          }}
        >
          search
        </button>
        <button
          class="delete-btn"
          onClick={() => {
            refetch();
          }}
        >
          clear
        </button>
      </div>
      <div class="list-objects">

        <Show when={iotObjects.loading}>
          <div class="fetch-loading">
            <p>Loading objects...</p>
          </div>
        </Show>

        <Show when={iotObjects.error}>
          <div class="fetch-error">
            <p style={{ color: "red" }}>Error: {iotObjects.error.message}</p>
          </div>
        </Show>

        <Show when={iotObjects.state == "ready"}>
          {iotObjects().length == 0 ? (
            <div class="fetch-loading">
              <p>Ther are no objects in any fog node that is connected</p>
            </div>
          ) : (
            <>
              {iotObjects()?.map((iot, index) => {
                return <ObjectCard index={index} iot={iot} isUpdating={isUpdating} setIsUpdating={setIsUpdating} />;
              })}
         
            </>
          )}
        </Show>
      </div>
    </div>
  );
}

function ObjectCard({ index, iot, isUpdating, setIsUpdating }) {
  const [description, setDescription] = createSignal(
    iot.description
  );
  const [accessPolicy, setAccessPolicy] = createSignal(
    iot.accessPolicy
  );
  const [status, seStatus] = createSignal({
    good: false,
    message: "",
  });

  const handleDelete = async (name) => {
    const result = await deleteIoTObject(name,iot.nodeId);
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
    const result = await updateIoTObject(name, description, accessPolicy,iot.nodeId);
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
    <div
      class={
        "object-card " +
        (!!iot.date_entering ? "iot-connected" : "iot-not-connected")
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
        {iot.date_entering &&
          <>
            <span>url : </span>
            <span>{iot.url}</span>
            <span>date de entry : </span>
            <span>{new Date(iot.date_entering).toLocaleString()}</span>
          </>
        }
      </div>

      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>

      <div class="object-actions">
        <button
          className="delete-btn"
          onClick={() => handleDelete(iot.name)}
        >
          delete
        </button>

        <button
          class="search-btn"
          onClick={() =>
            setIsUpdating(isUpdating() === index ? -1 : index)
          }
        >
          {isUpdating() !== index ? "update" : "stop updating"}
        </button>
        {isUpdating() === index && (
          <button
            className="accept-btn"
            onClick={() =>
              handleUpdate(
                iot.name,
                description(),
                accessPolicy(),
              )
            }
          >
            confirm update
          </button>
        )}
      </div>

    </div>);
}
