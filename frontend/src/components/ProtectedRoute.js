import { Navigate } from "react-router-dom";

import {
  getToken,
  getSessionUser,
} from "../utils/session";

export default function ProtectedRoute({ children }) {
  const token = getToken();
  const user = getSessionUser();

  // Reject missing or invalid session information
  if (
    !token ||
    token === "undefined" ||
    token === "null" ||
    !user?._id
  ) {
    return <Navigate to="/login" replace />;
  }

  try {
    const parts = token.split(".");

    // Validate JWT structure
    if (parts.length !== 3) {
      return <Navigate to="/login" replace />;
    }

    const payload = JSON.parse(
      atob(
        parts[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    // Reject expired or invalid tokens
    if (
      typeof payload.exp !== "number" ||
      !Number.isFinite(payload.exp) ||
      payload.exp * 1000 <= Date.now()
    ) {
      return <Navigate to="/login" replace />;
    }

    // Ensure token and stored user belong to the same account
    if (payload.id !== user._id) {
      return <Navigate to="/login" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return children;
}