import { useState } from "react";

import authAPI from "../services/authApi";

import { useNavigate, useLocation } from "react-router-dom";
export default function VerifyOtp() {
  const navigate = useNavigate();

  const location = useLocation();

  const email = location.state?.email;

  const [successModal, setSuccessModal] = useState(false);

  const [otp, setOtp] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await authAPI.post(
        "/verify-otp",

        {
          email,
          otp,
        },
      );

      setSuccessModal(true);
    } catch (error) {
      alert(error.response?.data?.message || "Invalid OTP");
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
            }}
          >
            OTP Verification
          </h1>

          <p
            style={{
              color: "#64748b",
            }}
          >
            Enter the OTP sent to your email.
          </p>
        </div>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle}>
          Verify OTP
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
            <h2>✅ OTP Verified</h2>

            <p>Verification successful.</p>

            <button
              onClick={() =>
                navigate("/reset-password", {
                  state: { email },
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
