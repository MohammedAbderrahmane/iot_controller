import { createSignal } from "solid-js";
import { getAll } from "../service/fognodes_service";
import { createResource } from "solid-js";
import { useNavigate } from "@solidjs/router";

export default function FogNodesPage(params) {
  const [status, seStatus] = createSignal({ good: false, message: "" });
  const [nodes] = createResource(async () => await getAll());
  const navigate = useNavigate();

  return (
    <div className="page list-nodes">
      <h2>list of nodes</h2>
      <Show when={nodes.loading}>
        <p>Loading nodes...</p>
      </Show>

      <Show when={nodes.error}>
        <p style={{ color: "red" }}>Error: {nodes.error.message}</p>
      </Show>

      <Show when={nodes.state == "ready"}>
        <p style={{ color: status().good ? "green" : "red" }}>
          {status().message}
        </p>
        {!nodes() || !nodes().length ? (
          <p>There are no nodes online</p>
        ) : (
          <div>
            {nodes().map((node) => {
              return (
                <table>
                  <tbody>
                    <tr>
                      <td>Name:</td>
                      <td>{node.name}</td>
                    </tr>
                    <tr>
                      <td>Description:</td>
                      <td>{node.description}</td>
                    </tr>
                    <tr>
                      <td>ID:</td>
                      <td>{node.id}</td>
                    </tr>
                    {node.ipAddress && (
                      <tr>
                        <td>Object URL:</td>
                        <td>
                          {/* Anchor tag for the URL */}
                          <a href={`coap://${node.ipAddress}:${node.port}/`}>
                            coap://{node.ipAddress}:{node.port}/
                          </a>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan="2">
                        <button
                          className="btn-config"
                          onClick={() => navigate(`/fognodes/${node.id}`)}
                        >
                          configure
                        </button>
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
