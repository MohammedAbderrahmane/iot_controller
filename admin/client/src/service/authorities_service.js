import axios from "axios";
const base_URL = "/api";

export async function addAuthority(ipAddress, port) {
  try {
    const response = await axios.post(`${base_URL}/auths`, { ipAddress, port });
    return response.data;
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}
export async function getAuthorities(params) {
  try {
    const response = await axios.get(`${base_URL}/auths`);
    return response.data;
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

export async function getAuthsAttributes() {
  try {
    const response = await axios.get(`${base_URL}/auths/attributes`);
    return response.data;
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}
