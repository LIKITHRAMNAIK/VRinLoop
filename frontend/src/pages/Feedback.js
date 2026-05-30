import React, { useState } from "react";
import feedbackAPI from "../services/feedbackApi";

import Sidebar from "../components/Sidebar";

import { useNavigate } from "react-router-dom";

export default function Feedback() {
  const user = JSON.parse(localStorage.getItem("user"));

  const navigate = useNavigate();

  const [successModal, setSuccessModal] = useState(false);

  const [rating, setRating] = useState(0);

  const [open, setOpen] = useState(false);

  const [subject, setSubject] = useState("");

  const [type, setType] = useState("Bug Report");

  const [message, setMessage] = useState("");

  const [image, setImage] = useState(null);

  const submitFeedback = async () => {
    try {
      const formData = new FormData();

      formData.append("subject", subject);

      formData.append("type", type);

      formData.append("message", message);

      formData.append("rating", rating);

      if (image) {
        formData.append("image", image);
      }

      await feedbackAPI.post("/submit", formData);

      setSuccessModal(true);

      setSubject("");
      setMessage("");
      setImage(null);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit feedback",
      );
    }
  };

  return (
    <>
      <Sidebar open={open} setOpen={setOpen} />

      <div
        style={{
          minHeight: "100vh",

          padding: "40px 40px 40px 120px",

          background: "linear-gradient(135deg,#0f172a,#1e293b)",

          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{
              background: "linear-gradient(135deg,#22c55e,#16a34a)",
              color: "white",
              border: "none",
              padding: "12px 22px",
              borderRadius: 14,
              cursor: "pointer",
              fontWeight: "bold",
              marginleft: 200,
            }}
          >
            ⬅ Dashboard
          </button>

          <div />
        </div>

        <div
          style={{
            maxWidth: 1000,

            boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.08)",

            margin: "0 auto",

            background: "rgba(255,255,255,0.08)",

            borderRadius: 28,

            padding: 35,

            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: 35,
            }}
          >
            <div
              style={{
                fontSize: 55,
                marginBottom: 10,
              }}
            >
              💡
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 38,
                fontWeight: "900",
              }}
            >
              Feedback Center
            </h1>

            <p
              style={{
                color: "#cbd5e1",
                marginTop: 12,
                fontSize: 16,
              }}
            >
              Help improve VRinLoop
            </p>

            <h3
              style={{
                marginTop: 15,
                color: "#f472b6",
              }}
            >
              Your Money. Your Loop. Your Control.
            </h3>
          </div>

          <hr />

          <div
            style={{
              display: "flex",
              gap: 20,
              marginBottom: 25,
            }}
          >
            <div
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.08)",
                padding: 18,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#94a3b8",
                  fontSize: 13,
                }}
              >
                Name
              </p>

              <h3
                style={{
                  margin: "8px 0 0",
                }}
              >
                {user.name}
              </h3>
            </div>

            <div
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.08)",
                padding: 18,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#94a3b8",
                  fontSize: 13,
                }}
              >
                Email
              </p>

              <h3
                style={{
                  margin: "8px 0 0",
                  fontSize: 15,
                }}
              >
                {user.email}
              </h3>
            </div>
          </div>

          <h4>Subject</h4>

          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={inputStyle}
          />

          <h4>Feedback Type</h4>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={inputStyle}
          >
            <option>Bug Report</option>

            <option>Feature Request</option>

            <option>UI Improvement</option>

            <option>Performance Issue</option>

            <option>Other</option>
          </select>

          <h4>Message</h4>

          <textarea
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              ...inputStyle,
              resize: "none",
            }}
          />

          <h4>Rating</h4>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)}
                style={{
                  fontSize: 36,

                  cursor: "pointer",

                  transition: "0.2s",

                  color: star <= rating ? "#facc15" : "#475569",
                }}
              >
                ★
              </span>
            ))}
          </div>

          <p
            style={{
              color: "#cbd5e1",
              marginTop: 0,
            }}
          >
            {rating > 0 ? `${rating}/5 Stars` : "Select Rating"}
          </p>

          <h4>Screenshot (Optional)</h4>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",

              minHeight: 140,

              border: "2px dashed rgba(255,255,255,0.2)",

              borderRadius: 20,

              background: "rgba(255,255,255,0.04)",

              cursor: "pointer",

              transition: "0.3s",

              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 42,
                marginBottom: 10,
              }}
            >
              📎
            </div>

            <div
              style={{
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              Upload Screenshot
            </div>

            <div
              style={{
                marginTop: 8,
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              PNG, JPG, JPEG, WEBP
            </div>

            {image && (
              <div
                style={{
                  marginTop: 10,
                  color: "#22c55e",
                  fontWeight: "bold",
                }}
              >
                ✅ {image.name}
              </div>
            )}

            <input
              type="file"
              hidden
              accept="
      image/png,
      image/jpeg,
      image/webp
    "
              onChange={(e) => setImage(e.target.files[0])}
            />
          </label>

          {image && (
            <div
              style={{
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              <img
                src={URL.createObjectURL(image)}
                alt="preview"
                style={{
                  maxWidth: "100%",

                  maxHeight: 250,

                  borderRadius: 18,

                  border: "2px solid rgba(255,255,255,0.1)",

                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                }}
              />
            </div>
          )}

          <button
            onClick={submitFeedback}
            style={{
              marginTop: 30,

              width: "100%",

              padding: 18,

              border: "none",

              borderRadius: 18,

              background: "linear-gradient(135deg,#8b5cf6,#ec4899)",

              color: "white",

              fontWeight: "bold",

              cursor: "pointer",
            }}
          >
            🚀 Submit Feedback
          </button>

          {successModal && (
            <div
              style={{
                position: "fixed",

                top: 0,

                left: 0,

                width: "100%",

                height: "100%",

                background: "rgba(0,0,0,0.7)",

                backdropFilter: "blur(8px)",

                display: "flex",

                justifyContent: "center",

                alignItems: "center",

                zIndex: 9999,
              }}
            >
              <div
                style={{
                  width: 500,

                  background: "linear-gradient(135deg,#0f172a,#1e293b)",

                  borderRadius: 24,

                  padding: 35,

                  textAlign: "center",

                  border: "1px solid rgba(255,255,255,0.08)",

                  boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
                }}
              >
                <div
                  style={{
                    fontSize: 70,
                  }}
                >
                  ✅
                </div>

                <h2
                  style={{
                    color: "white",
                    marginTop: 10,
                  }}
                >
                  Feedback Submitted
                </h2>

                <p
                  style={{
                    color: "#cbd5e1",
                    lineHeight: 1.8,
                  }}
                >
                  Thank you for helping improve VRinLoop.
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 15,
                    marginTop: 25,
                  }}
                >
                  <button
                    onClick={() => setSuccessModal(false)}
                    style={{
                      flex: 1,
                      padding: 14,
                      border: "none",
                      borderRadius: 12,
                      background: "#475569",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Close
                  </button>

                  <button
                    onClick={() => navigate("/")}
                    style={{
                      flex: 1,
                      padding: 14,
                      border: "none",
                      borderRadius: 12,
                      background: "linear-gradient(135deg,#8b5cf6,#ec4899)",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const inputStyle = {
  width: "100%",

  padding: 14,

  borderRadius: 12,

  border: "none",

  marginBottom: 15,
};
