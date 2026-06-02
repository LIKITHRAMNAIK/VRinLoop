import axios from "axios";
import { BACKEND_URL } from "../config";

const feedbackAPI = axios.create({
  baseURL: `${BACKEND_URL}/api/feedback`,
});

feedbackAPI.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default feedbackAPI;