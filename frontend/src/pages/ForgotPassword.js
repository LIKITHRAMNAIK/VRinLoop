import { useState } from "react";

import authAPI from "../services/authApi";

import { useNavigate } from "react-router-dom";
export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

const [successModal, setSuccessModal] = useState(false);

const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();

  if (loading || successModal) return;

  const cleanEmail = email.trim();

  if (
    cleanEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  ) {
    alert("Please enter a valid email address.");
    return;
  }

  setLoading(true);

  try {
    const response = await authAPI.post(
      "/forgot-password",
      {
        email: cleanEmail,
      },
    );

    if (response.data?.success !== true) {
      alert("Unable to process request. Please try again.");
      return;
    }

    setEmail(cleanEmail);

    setSuccessModal(true);
  } catch (error) {
    alert(
      error.response?.data?.message ||
      "Unable to process request. Please try again."
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <div
          style={{
            textAlign: "center",
            marginBottom: 25,
          }}
        >
          <h1
            style={{
              color: "#4f46e5",
              marginBottom: 10,
            }}
          >
            Password Recovery
          </h1>

          <p
            style={{
              color: "#64748b",
            }}
          >
            Enter your registered email to receive an OTP.
          </p>
        </div>

        <input
  type="email"
  placeholder="Enter Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  autoComplete="email"
  maxLength={254}
  disabled={loading || successModal}
  required
  style={inputStyle}
/>

        <button
  type="submit"
  disabled={loading || successModal}
  style={{
    ...buttonStyle,
    opacity: loading || successModal ? 0.7 : 1,
    cursor: loading || successModal
      ? "not-allowed"
      : "pointer",
  }}
>
  {loading ? "Processing..." : "Send OTP"}
</button>
      </form>
      {successModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 35,
              borderRadius: 24,
              width: 420,
              textAlign: "center",
            }}
          >
            <h2>📧 Request Submitted</h2>

<p>
  If your email is registered, you will receive an OTP.
  Please check your inbox and spam folder.
</p>

            <button
              onClick={() =>
  navigate("/verify-otp", {
    state: { email },
    replace: true,
  })
}
              style={buttonStyle}
            >
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const containerStyle = {
  minHeight: "100vh",

  overflow: "hidden",

  display: "flex",

  justifyContent: "center",

  alignItems: "center",

  background: "linear-gradient(135deg,#eef2ff,#ede9fe,#f8fafc)",
};

const formStyle = {
  background: "rgba(255,255,255,0.8)",

  backdropFilter: "blur(16px)",

  border: "1px solid rgba(255,255,255,0.5)",

  padding: 40,

  borderRadius: 20,

  width: 450,

  zIndex: 2,

  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
};

const inputStyle = {
  width: "100%",

  padding: 16,

  marginTop: 15,

  borderRadius: 14,

  border: "1px solid #d8b4fe",

  outline: "none",

  fontSize: 15,
};

const buttonStyle = {
  width: "100%",

  padding: 16,

  marginTop: 20,

  border: "none",

  borderRadius: 14,

  background: "linear-gradient(135deg,#7c3aed,#a855f7)",

  color: "white",

  fontWeight: "bold",

  fontSize: 16,

  cursor: "pointer",
};
