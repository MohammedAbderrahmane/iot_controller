import { createSignal } from "solid-js";
import { getAll } from "../service/fognodes_service";
import { createResource } from "solid-js";
import { useNavigate } from "@solidjs/router";

export default function FogNodesPage(params) {
  const [status, seStatus] = createSignal({ good: false, message: "" });
  const [nodes] = createResource(async () => await getAll());
  const navigate = useNavigate();

  return (
    <div className="page">
      <h2>List of fog nodes in the system:</h2>
      <Show when={nodes.loading}>
        <div class="fetch-loading">
          <p>Loading nodes...</p>
        </div>
      </Show>

      <Show when={nodes.error}>
        <div class="fetch-error">
          <p>Error: {nodes.error.message}</p>
        </div>
      </Show>

      <Show when={nodes.state == "ready"}>
        <p class={status().good ? "status-success" : "status-error"}>
          {status().message}
        </p>
        {!nodes() || !nodes().length ? (
          <div class="fetch-loading">
            <p>There are no fog nodes</p>
          </div>
        ) : (
          <div class="list-nodes">
            {nodes().map((node) => {
              return <FogNodeCard node={node} navigate={navigate} />;
            })}
          </div>
        )}
      </Show>
    </div>
  );
}

function FogNodeCard({ node, navigate }) {
  return (
    <div class="node-card">
      <h3>{node.name}</h3>
      <div
        class={!!node.online ? "node-online-status" : "node-offline-status"}
      />
      <div class="node-info">
        <span>id : </span>
        <span>{node.id}</span>
        <span>url : </span>
        <span>{node.url}</span>
        <span>description : </span>
        <span>{node.description}</span>
        <span>date de entry : </span>
        <span>{new Date(node.date_entering).toLocaleString()}</span>
      </div>
      <button
        class="btn-config"
        onClick={() => navigate(`/fognodes/${node.id}`)}
        disabled={!node.online}
      >
        configure objects
      </button>
    </div>
  );
}
