import axios from "axios";

const API = axios.create({
  baseURL: "https://vrinloop.onrender.com/api/transactions",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

API.interceptors.response.use(
  (res) => res,

  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");

      localStorage.removeItem("user");

      window.location.href = "/login";
    }

    return Promise.reject(err);
  },
);

export default API;
