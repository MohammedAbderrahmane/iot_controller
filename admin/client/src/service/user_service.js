import axios from "axios";
const base_URL = "/api";

export async function deleteUser(username) {
  try {
    const response = await axios.delete(`${base_URL}/users/${username}`);
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}


export async function getUsers() {
    try {
      const response = await axios.get(`${base_URL}/users/`);
      return response.data;
    } catch (error) {
      return { message: "failed : " + error.response?.data.message || error };
    }
  }
  

export async function addUser(username, password, attributes) {
    try {
      const response = await axios.post(`${base_URL}/users/new`, {
        username,
        password,
        attributes,
      });
      return { ok: true, ...response.data };
    } catch (error) {
      return { message: "failed : " + error.response?.data.message || error };
    }
  }

export async function deleteUserAttribute(username, attribute) {
  try {
    const response = await axios.delete(
      `${base_URL}/users/${username}/${attribute}`
    );
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

export async function addUserAttribute(username, attribute) {
  try {
    const response = await axios.put(`${base_URL}/users/${username}`, {
      attribute,
    });
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}
