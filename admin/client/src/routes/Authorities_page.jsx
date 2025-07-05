import { createSignal } from "solid-js";
import { getAuthorities,addAuthority } from "../service/authorities_service";
import { createResource, Show } from "solid-js";

export default function AuthoritiesPage(params) {
  const [status, seStatus] = createSignal({ good: false, message: "" });
  const [auths, {refetch}] = createResource(async () => {
    return await getAuthorities();
  });

  return (
    <div class="page">
      <AddAuthority refetch={refetch}/>
      <h2>list of authorities</h2>
      <Show when={auths.loading}>
        <div class="fetch-loading">
          <p>Loading authorities...</p>
        </div>
      </Show>

      <Show when={auths.error}>
        <div class="fetch-error">
          <p>Error: {auths.error.message}</p>
        </div>
      </Show>

      <Show when={auths.state == "ready"}>
        {!auths() || !auths().length ? (
          <div class="fetch-loading">
            <p>No authorties loaded</p>
          </div>
        ) : (
          <div>
            {auths().map((auth) => {
              return <AuthorityCard auth={auth} />;
            })}
          </div>
        )}
      </Show>
    </div>
  );
}

function AuthorityCard({ auth }) {
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
          <td>Attributes:</td>
          <td>
            <ul class="attributes-list">
              {auth.Pk.attributes.map((attr, index) => (
                <li key={index}>{attr}</li>
              ))}
            </ul>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function AddAuthority(params) {
    const { refetch } = params;
    const [ipAddress, setIpAddress] = createSignal(null);
    const [port, setPort] = createSignal(null);
    const [status, seStatus] = createSignal({ good: false, message: "" });
  
    const handleUpload = async () => {
      const result = await addAuthority(ipAddress(), port());
      if (result.ok) {
        seStatus({
          good: true,
          message: "authority added",
        });
        setTimeout(() => refetch(), 1500);
        return;
      }
      seStatus({ good: false, message: result.message || "unknown error" });
    };
  return (
    <fieldset class="new-user">
      <legend>Adding authority</legend>
      <p style={{ color: status().good ? "green" : "red" }}>
        {status().message}
      </p>
      <table>
        <tbody>
          <tr>
            <td>
              <label for="name">ip address:</label>
            </td>
            <td>
              <input
                onChange={(e) => {
                  setIpAddress(e.target.value);
                }}
                type="text"
              />
            </td>
          </tr>

          <tr>
            <td>
              <label for="name">port:</label>
            </td>
            <td>
              <input
                onChange={(e) => {
                  setPort(e.target.value);
                }}
                type="text"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <button onClick={handleUpload}>add authority</button>
    </fieldset>
  );
}
