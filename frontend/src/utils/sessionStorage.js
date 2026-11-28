// ================= STORAGE CONFIGURATION =================

export const SESSION_KEY = "vrinloopSession";

const SESSION_LOCK = "vrinloop-session-write";

// ================= READ SESSION =================

export const readSession = () => {
  const raw = localStorage.getItem(SESSION_KEY);

  if (raw === null) {
    return {
      revision: null,
      session: null,
    };
  }

  const record = JSON.parse(raw);

  if (
    !record ||
    typeof record.revision !== "string" ||
    !record.revision ||
    !Object.prototype.hasOwnProperty.call(record, "session")
  ) {
    throw new Error("Invalid session storage");
  }

  return record;
};

// ================= COORDINATED SESSION WRITES =================

export const withSessionLock = async (callback) => {
  if (!navigator.locks?.request) {
    throw new Error(
      "Secure session coordination is unavailable in this browser"
    );
  }

  return navigator.locks.request(
    SESSION_LOCK,
    { mode: "exclusive" },
    callback
  );
};

// ================= WRITE SESSION =================

export const writeSession = async (
  expectedRevision,
  session
) => {
  return withSessionLock(() => {
    const current = readSession();

    if (current.revision !== expectedRevision) {
      throw new Error("Session changed. Please try again.");
    }

    const record = {
      revision: window.crypto.randomUUID(),
      session,
    };

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(record)
    );

    return record;
  });
};