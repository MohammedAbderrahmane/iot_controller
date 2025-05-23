import { createSignal } from "solid-js";
import { getAuthorities } from "../service/authorities_service";
import { createResource, Show } from "solid-js";

export default function AuthoritiesPage(params) {
  const [status, seStatus] = createSignal({ good: false, message: "" });
  const [auths] = createResource(async () => {
    return await getAuthorities();
  });

  return (
    <div class="page">
      <h2>list of auths</h2>
      <Show when={auths.loading}>
        <p>Loading authorities...</p>
      </Show>

      <Show when={auths.error}>
        <p style={{ color: "red" }}>Error: {auths.error.message}</p>
      </Show>

      <Show when={auths.state == "ready"}>
        {console.log(auths())}
        <p style={{ color: status().good ? "green" : "red" }}>
          {status().message}
        </p>
        {!auths() || !auths().length ? (
          <p>No authorties loaded</p>
        ) : (
          <div>
            {auths().map((auth) => {
              return (
                <table class="auth-table">
                  <tbody>
                    <tr>
                      <td>ID:</td>
                      <td>{auth.ID}</td>
                    </tr>
                    <tr>
                      <td>url:</td>
                      <td>{`http://${auth.host}:${auth.port}/`}</td>
                    </tr>
                    <tr>
                      <td rowSpan={auth.Pk.attributes.length + 1}>
                        Attributes:
                      </td>
                    </tr>
                    {auth.Pk.attributes.map((attr, index) => (
                      <tr>
                        <td>{attr}</td>
                      </tr>
                    ))}
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
