import axios from "axios";
import { BACKEND_URL } from "../config";

import {
  getToken,
  getSessionId,
  getSessionSnapshot,
  isSameSnapshot,
  isCurrentSession,
  logout,
} from "../utils/session";

const authAPI = axios.create({
  baseURL: `${BACKEND_URL}/api/auth`,
});

// ================= PUBLIC AUTH ENDPOINTS =================

const publicEndpoints = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
]);

// ================= REQUEST SECURITY =================

authAPI.interceptors.request.use(
  (req) => {
    const token = getToken();
    const sessionId = getSessionId();

    const endpoint = (req.url || "").split("?")[0];

    const isPublic = publicEndpoints.has(endpoint);

    req.sessionToken = token;
    req.sessionId = sessionId;
    req.isPublicAuth = isPublic;
    req.sessionSnapshot = getSessionSnapshot();

if (!req.sessionSnapshot) {
  throw new axios.CanceledError("Session changed");
}

    // Public authentication does not require a token
    if (isPublic) {
      req.headers.delete("Authorization");

      return req;
    }

    // Protected authentication requires a valid session
    if (
      !token ||
      !sessionId ||
      !isCurrentSession(token, sessionId)
    ) {
      throw new axios.CanceledError("No active session");
    }

    // Reject explicitly supplied outdated credentials
    const suppliedAuthorization =
      req.headers.get("Authorization");

    if (
      suppliedAuthorization &&
      suppliedAuthorization !== `Bearer ${token}`
    ) {
      throw new axios.CanceledError("Session changed");
    }

    req.headers.Authorization = `Bearer ${token}`;

    return req;
  },

  (err) => {
    throw err;
  },

  {
    synchronous: true,
  }
);

// ================= RESPONSE SECURITY =================

authAPI.interceptors.response.use(
  (res) => {
    const config = res.config;

    // Public authentication session validation
    if (config.isPublicAuth) {
      if (!isSameSnapshot(config.sessionSnapshot)) {
        return Promise.reject(
          new axios.CanceledError("Session changed")
        );
      }

      return res;
    }

    // Protected authentication session validation
    if (
      !config.sessionId ||
      !isCurrentSession(
        config.sessionToken,
        config.sessionId
      )
    ) {
      return Promise.reject(
        new axios.CanceledError("Session changed")
      );
    }

    return res;
  },

 async (err) => {
  const config = err.config;

    if (!config) {
      return Promise.reject(err);
    }

    // Public endpoint errors must not trigger logout
    if (config.isPublicAuth) {
      if (!isSameSnapshot(config.sessionSnapshot)) {
        return Promise.reject(
          new axios.CanceledError("Session changed")
        );
      }

      return Promise.reject(err);
    }

    // Reject errors belonging to outdated sessions
    if (
      !config.sessionId ||
      !isCurrentSession(
        config.sessionToken,
        config.sessionId
      )
    ) {
      return Promise.reject(
        new axios.CanceledError("Session changed")
      );
    }

    // Only log out the affected protected session
    if (err.response?.status === 401) {
  await logout();
}

    return Promise.reject(err);
  }
);

export default authAPI;