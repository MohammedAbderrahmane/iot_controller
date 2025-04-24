import axios from "axios";
const base_URL = "/api";

async function getAuthority(params) {
  try {
    const response = await axios.get(`${base_URL}/authority/`);
    return { ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

async function sendAuthority(params) {
  try {
    await axios.get(`${base_URL}/authority/send`);
    return {  ok: true };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

async function importPublicParameters(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(
      `${base_URL}/public_parameter/import/`,
      formData
    );
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

async function importAuthority(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(
      `${base_URL}/authority/import/`,
      formData
    );
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

async function createNewAuthority(authorityName, attributes) {
  try {
    const response = await axios.post(`${base_URL}/authority/new/`, {
      authorityName,
      attributes,
    });
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

async function addAttribute(attribute) {
  try {
    const response = await axios.post(`${base_URL}/authority/new_attribute/`, {
      attribute,
    });
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

async function renewAttribute(attribute) {
  try {
    const response = await axios.put(`${base_URL}/authority/renew_attribute/`, {
      attribute,
    });
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

async function addUser(username, password, attributes) {
  try {
    const response = await axios.post(`${base_URL}/user/new/`, {
      username,
      password,
      attributes,
    });
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

async function getUsers() {
  try {
    const response = await axios.get(`${base_URL}/users/all/`);
    return response.data;
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
  getAuthority,
  importPublicParameters,
  importAuthority,
  createNewAuthority,
  addAttribute,
  renewAttribute,
  addUser,
  getUsers,
  loginAsAdmin,
  verifySession,
  connect,
  disconnect,sendAuthority
};
