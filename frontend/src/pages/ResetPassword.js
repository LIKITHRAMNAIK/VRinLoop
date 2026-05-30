import { useState } from "react";

import authAPI from "../services/authApi";

import { useNavigate, useLocation } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();

  const location = useLocation();

  const email = location.state?.email;

  const [successModal, setSuccessModal] = useState(false);

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await authAPI.post(
        "/reset-password",

        {
          email,
          password,
        },
      );

      setSuccessModal(true);
    } catch (error) {
      alert(error.response?.data?.message || "Reset failed");
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
            Create New Password
          </h1>

          <p
            style={{
              color: "#64748b",
            }}
          >
            Choose a strong password for your account.
          </p>
        </div>

        <div
          style={{
            position: "relative",
          }}
        >
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",

              right: 18,

              top: "58%",

              transform: "translateY(-50%)",

              cursor: "pointer",

              fontWeight: "bold",

              color: "#c85b1c",
            }}
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        <button type="submit" style={buttonStyle}>
          Update Password
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
            <h2>🎉 Password Updated</h2>

            <p>Your password has been updated successfully.</p>

            <button onClick={() => navigate("/login")} style={buttonStyle}>
              Login Now →
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
