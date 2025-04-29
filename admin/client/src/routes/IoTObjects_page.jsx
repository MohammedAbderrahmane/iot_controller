import { createSignal } from "solid-js";
import { createResource } from "solid-js";
import { deleteIoTObject, getIoTObjects, updateIoTObject } from "../service/objects_service";

export default function IoTObjectPage(params) {
  const [iotObjects, { mutate, refetch }] = createResource(() =>
    getIoTObjects()
  );
  const [isUpdating, setIsUpdating] = createSignal(-1);
  const [filterText, setFilterText] = createSignal("");

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

  const handleFilterChange = (event) => {
    setFilterText(event.target.value);
  };

  // Filter the data based on the filterText
  // We convert both the data string and filter text to lower case for case-insensitive filtering
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
          item.nodeId.toLowerCase().includes(filterText().toLowerCase())
      )
    );
  };

  return (
    <div class="page list-objects">
      <h2>list of objects</h2>
      <div class="filter">
        <input
          type="text"
          placeholder="Filter data..."
          value={filterText()}
          onChange={handleFilterChange}
        />
        <button
          onClick={() => {
            filteredData();
          }}
        >
          search
        </button>
        <button
          onClick={() => {
            refetch();
          }}
        >
          clear
        </button>
      </div>
      <Show when={iotObjects.loading}>
        <p>Loading objects...</p>
      </Show>

      <Show when={iotObjects.error}>
        <p style={{ color: "red" }}>Error: {iotObjects.error.message}</p>
      </Show>

      <Show when={iotObjects.state == "ready"}>
        {iotObjects().length == 0 ? (
          <p>Ther are no objects for this node</p>
        ) : (
          <div>
            {iotObjects()?.map((iot, index) => {
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
      </Show>
    </div>
  );
}
