import {
  readSession,
  writeSession,
} from "./sessionStorage";

// ================= SESSION VALIDATION =================

const isValidSession = (token, user) => {
  if (
    typeof token !== "string" ||
    !token ||
    token === "undefined" ||
    token === "null" ||
    typeof user?._id !== "string" ||
    !user._id
  ) {
    return false;
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return false;
    }

    const payload = JSON.parse(
      atob(
        parts[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    return (
      payload.id === user._id &&
      typeof payload.exp === "number" &&
      Number.isFinite(payload.exp) &&
      payload.exp * 1000 > Date.now()
    );
  } catch {
    return false;
  }
};

// ================= SAFE STORAGE READ =================

const safeReadSession = () => {
  try {
    return readSession();
  } catch {
    return null;
  }
};

// ================= DOCUMENT SESSION IDENTITY =================

const initialRecord = safeReadSession();

let activeRevision = initialRecord?.revision ?? null;

let activeSessionId =
  initialRecord?.session?.sessionId ?? null;

let activeToken =
  initialRecord?.session?.token ?? null;

let invalidated = initialRecord === null;

// ================= LEGACY STORAGE CLEANUP =================

const clearLegacyStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("vrinloopSessionId");
  localStorage.removeItem("profileData");

  sessionStorage.removeItem("alertShownTime");
};

// ================= GET ACTIVE SESSION =================

const getActiveSession = () => {
  if (invalidated) {
    return null;
  }

  const record = safeReadSession();

  if (
  !record ||
  record.revision !== activeRevision ||
  (record.session?.sessionId ?? null) !== activeSessionId ||
  (record.session?.token ?? null) !== activeToken
) {
  invalidated = true;
  return null;
}

  const session = record.session;

  if (
    !session?.sessionId ||
    !isValidSession(session.token, session.user)
  ) {
    return null;
  }

  return session;
};

// ================= SESSION SNAPSHOT =================

export const getSessionSnapshot = () => {
  const record = safeReadSession();

  if (
    invalidated ||
    !record ||
    record.revision !== activeRevision
  ) {
    return null;
  }

  return {
    revision: record.revision,
  };
};

export const isSameSnapshot = (snapshot) => {
  const current = getSessionSnapshot();

  return Boolean(
    snapshot &&
    current &&
    snapshot.revision === current.revision
  );
};

// ================= SAVE SESSION =================

export const saveSession = async (
  token,
  user,
  snapshot
) => {
  if (!isValidSession(token, user)) {
    throw new Error("Invalid session data");
  }

  if (!isSameSnapshot(snapshot)) {
    throw new Error(
      "Session changed. Please try logging in again."
    );
  }

  const session = {
    sessionId: window.crypto.randomUUID(),
    token,
    user,
  };

  await writeSession(snapshot.revision, session);

  invalidated = true;

  clearLegacyStorage();
};

// ================= GET SESSION USER =================

export const getSessionUser = () => {
  return getActiveSession()?.user ?? null;
};

// ================= GET TOKEN =================

export const getToken = () => {
  return getActiveSession()?.token ?? null;
};

// ================= GET SESSION ID =================

export const getSessionId = () => {
  return getActiveSession()?.sessionId ?? null;
};

// ================= CHECK CURRENT SESSION =================

export const isCurrentSession = (
  token,
  sessionId
) => {
  const session = getActiveSession();

  return Boolean(
    session &&
    token &&
    sessionId &&
    session.token === token &&
    session.sessionId === sessionId
  );
};

// ================= UPDATE SESSION USER =================

export const updateSessionUser = async (
  user,
  token,
  sessionId
) => {
  if (!isCurrentSession(token, sessionId)) {
    throw new Error("Session changed");
  }

  const session = getActiveSession();

  if (
    user?._id !== session.user._id ||
    !isValidSession(token, user)
  ) {
    throw new Error("Invalid profile response");
  }

  await writeSession(activeRevision, {
    ...session,
    user,
  });

  invalidated = true;
};

// ================= CLEAR SESSION =================

export const clearSession = async () => {
  const expectedRevision = activeRevision;

  const record = safeReadSession();

  invalidated = true;

  activeSessionId = null;
  activeToken = null;

  sessionStorage.removeItem("alertShownTime");

  if (
    !record ||
    record.revision !== expectedRevision
  ) {
    return false;
  }

  await writeSession(expectedRevision, null);

  clearLegacyStorage();

  return true;
};

// ================= LOGOUT =================

export const logout = async () => {
  try {
    await clearSession();
  } catch (error) {
    console.error("Unable to clear session securely");

    window.alert(
      "Unable to complete secure logout. Close all VRinLoop tabs and clear the site's stored data before reopening."
    );

    return;
  }

  window.location.replace("/login");
};