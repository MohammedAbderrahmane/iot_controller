import axios from "axios";
const base_URL = "http://192.168.1.12:2000/api";

async function getAuthority(params) {
  try {
    const response = await axios.get(`${base_URL}/authority/`);
    return { ...response.data };
  } catch (error) {
    throw Error("failed : " + error.response?.data.message || error);
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
    throw Error("failed : " + error.response?.data.message || error);
  }
}

export {
  getAuthority,
  importPublicParameters,
  importAuthority,
  createNewAuthority,
  addAttribute,
  renewAttribute,
  addUser,
  getUsers,
};
