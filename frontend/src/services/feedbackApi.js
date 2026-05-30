import axios from "axios";

const feedbackAPI = axios.create({
  baseURL: "http://localhost:5000/api/feedback",
});

feedbackAPI.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default feedbackAPI;
