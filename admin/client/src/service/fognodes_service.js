import axios from "axios";
const base_URL = "/api";

export async function getAll(params) {
  try {
    const response = await axios.get(`${base_URL}/fognodes`);
    return response.data;
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}

export async function getOne(id) {
  try {
    const response = await axios.get(`${base_URL}/fognodes/${id}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    return { message: "failed : " + error.response?.data.message || error };
  }
}
