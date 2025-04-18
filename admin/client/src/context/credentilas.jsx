import { createStore } from "solid-js/store";
import { createContext } from "solid-js";

const AdminContext = createContext();

const AdminProvider = (params) => {
  const [admin, setAdmin] = createStore(null);
  return (
    <AdminContext.Provider value={[admin, setAdmin]}>
      {params.children}
    </AdminContext.Provider>
  );
};



export { AdminProvider };
export default AdminContext;