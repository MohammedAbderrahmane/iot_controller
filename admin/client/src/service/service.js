import axios from "axios";
const base_URL = "/api";

async function getAllObjects(params) {
  try {
    const response = await axios.get(`${base_URL}/objects`);
    return { ...response.data.iotObjects };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

async function getAllAttributes(params) {
  try {
    const response = await axios.get(`${base_URL}/objects`);
    return { ...response.data.attributes };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

async function addObject(name,description, accessPolicy) {
  try {
    const response = await axios.post(`${base_URL}/objects`, {
      name,
      description,
      accessPolicy,
    });
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

async function deleteObject(iotName) {
  try {
    const response = await axios.delete(`${base_URL}/objects/${iotName}`);
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

async function UpdateList() {
  try {
    const response = await axios.get(`${base_URL}/objects/update`);
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

async function loginAsAdmin(credentials) {
  try {
    const response = await axios.post(`${base_URL}/admin/login`, credentials);
    return { ok: true, authToken: response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

async function verifySession(localAdmin, setAdmin) {
  const options = { headers: { Authorization: localAdmin.authToken } };
  try {
    await axios.get(`${base_URL}/admin/verify`, options);

    console.log(localAdmin.authToken);
    setAdmin(localAdmin);
  } catch (error) {
    console.log(error);
    disconnect(setAdmin);
    return false;
  }
  return true;
}

const connect = (setAdmin, admin) => {
  window.localStorage.setItem("admin", JSON.stringify(admin));
  setAdmin(admin);
};

const disconnect = (setAdmin) => {
  window.localStorage.removeItem("admin");
  setAdmin(null);
};

export {
  loginAsAdmin,
  verifySession,
  connect,
  disconnect,
  addObject,
  UpdateList,
  getAllObjects,
  deleteObject,
  getAllAttributes  
};
