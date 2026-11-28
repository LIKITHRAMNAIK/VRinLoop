import { useEffect, useState } from "react";
import { BACKEND_URL } from "../config";

import {
  getToken,
  getSessionId,
  isCurrentSession,
} from "./session";

const allowedFilename =
  /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i;

const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const usePrivateImage = (filename) => {
  const token = getToken();
  const sessionId = getSessionId();

  const [image, setImage] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    let objectUrl = null;
    let disposed = false;

    setImage(null);

    const sessionIsValid = () =>
      !disposed &&
      !controller.signal.aborted &&
      isCurrentSession(token, sessionId);

    const loadImage = async () => {
      // Validate filename and active session
      if (
        typeof filename !== "string" ||
        filename.length > 255 ||
        !allowedFilename.test(filename) ||
        !sessionIsValid()
      ) {
        return;
      }

      try {
        const response = await fetch(
          `${BACKEND_URL}/api/images/${encodeURIComponent(filename)}`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
            },

            signal: controller.signal,
            cache: "no-store",
            credentials: "omit",
            redirect: "error",
          }
        );

        // Reject outdated responses
        if (!sessionIsValid()) {
          return;
        }

        if (!response.ok) {
          return;
        }

        // Validate response content type
        const contentType = (
          response.headers.get("Content-Type") || ""
        )
          .split(";")[0]
          .trim()
          .toLowerCase();

        if (!allowedContentTypes.has(contentType)) {
          return;
        }

        const blob = await response.blob();

        // Validate downloaded image
        if (
          !sessionIsValid() ||
          blob.size === 0 ||
          blob.size > MAX_IMAGE_SIZE ||
          !allowedContentTypes.has(blob.type)
        ) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);

        // Final session verification
        if (!sessionIsValid()) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
          return;
        }

        setImage({
          url: objectUrl,
          filename,
          token,
          sessionId,
        });
      } catch {
        // Missing, cancelled or inaccessible images
        // will use the component's fallback.
      }
    };

    loadImage();

    // Cancel requests and release temporary image URLs
    return () => {
      disposed = true;

      controller.abort();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };
  }, [filename, token, sessionId]);

  // Never return an image belonging to an outdated session
  if (
    !image ||
    image.filename !== filename ||
    image.token !== token ||
    image.sessionId !== sessionId ||
    !isCurrentSession(token, sessionId)
  ) {
    return null;
  }

  return image.url;
};

export default usePrivateImage;