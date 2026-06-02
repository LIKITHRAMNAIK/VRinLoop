import axios from "axios";

const authAPI = axios.create({
  baseURL: "https://vrinloop.onrender.com/api/auth",
});

authAPI.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default authAPI;
