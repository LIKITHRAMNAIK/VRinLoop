import axios from "axios";
import { BACKEND_URL } from "../config";

import {
  getToken,
  getSessionId,
  isCurrentSession,
  logout,
} from "../utils/session";

const API = axios.create({
  baseURL: `${BACKEND_URL}/api/transactions`,
});

// ================= REQUEST SECURITY =================

API.interceptors.request.use(
  (req) => {
    const token = getToken();
    const sessionId = getSessionId();

    if (
      !token ||
      !sessionId ||
      !isCurrentSession(token, sessionId)
    ) {
      throw new axios.CanceledError("No active session");
    }

    // Associate request with its original session
    req.sessionToken = token;
    req.sessionId = sessionId;

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

API.interceptors.response.use(
  (res) => {
    const requestToken = res.config.sessionToken;
    const requestSessionId = res.config.sessionId;

    // Reject responses belonging to outdated sessions
    if (
      !requestSessionId ||
      !isCurrentSession(requestToken, requestSessionId)
    ) {
      return Promise.reject(
        new axios.CanceledError("Session changed")
      );
    }

    return res;
  },

  (err) => {
    const requestToken = err.config?.sessionToken;
    const requestSessionId = err.config?.sessionId;

    // Reject errors belonging to outdated sessions
    if (
      requestToken &&
      (
        !requestSessionId ||
        !isCurrentSession(requestToken, requestSessionId)
      )
    ) {
      return Promise.reject(
        new axios.CanceledError("Session changed")
      );
    }

    // Only log out the session that received the 401
    if (
      err.response?.status === 401 &&
      requestSessionId &&
      isCurrentSession(requestToken, requestSessionId)
    ) {
      logout();
    }

    return Promise.reject(err);
  }
);

export default API;