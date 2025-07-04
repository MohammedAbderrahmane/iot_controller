import axios from "axios";
const base_URL = "/api";

export async function getIoTObjects() {
  try {
    const response = await axios.get(`${base_URL}/objects`);
    return response.data;
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

export async function addIoTObject(nodeId, name, description, accessPolicy) {
  try {
    const response = await axios.post(`${base_URL}/objects`, {
      nodeId,
      name,
      description,
      accessPolicy,
    });
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

export async function deleteIoTObject(name, nodeId) {
  try {
    const response = await axios.delete(`${base_URL}/objects/${name}`, {
      data: { nodeId }, // Request body
      headers: { "Content-Type": "application/json" },
    });
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

export async function updateIoTObject(name, description, accessPolicy, nodeId) {
  try {
    const response = await axios.put(`${base_URL}/objects/${name}`, {
      description,
      accessPolicy,
      nodeId,
    });
    return { ok: true, ...response.data };
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}
