import { useState } from "react";

import authAPI from "../services/authApi";

import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,

      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await authAPI.post(
        "/login",

        form,
      );

      localStorage.setItem(
        "token",

        res.data.token,
      );

      localStorage.setItem(
        "user",

        JSON.stringify(res.data.user),
      );

      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        overflow: "hidden",

        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 80,
        padding: "0px 40px",
        flexWrap: "wrap",
        boxSizing: "border-box",

        background: "linear-gradient(135deg,#eef2ff,#ede9fe,#f8fafc)",
      }}
    >
      <div
        style={{
          maxWidth: 500,
          marginTop: "-30px",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            fontSize: 70,
            marginTop: 0,
            marginBottom: 10,
            color: "#4f46e5",
          }}
        >
          VRinLoop
        </h1>

        <h2
          style={{
            color: "#334155",
            lineHeight: 1.4,
          }}
        >
          Your Money.
          <br />
          Your Loop.
          <br />
          Your Control.
        </h2>

        <div
          style={{
            marginTop: 40,
            color: "#475569",
            fontSize: 18,
            lineHeight: 2,
          }}
        >
          <div>✓ Track Transactions</div>
          <div>✓ Manage Loans</div>
          <div>✓ Export Reports</div>
          <div>✓ Financial Analytics</div>
          <div>✓ Personal Finance Dashboard</div>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "rgba(255,255,255,0.8)",

          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.5)",

          padding: 50,

          borderRadius: 20,

          width: 450,
          zIndex: 2,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          <h1
            style={{
              marginBottom: 8,
              color: "#4f46e5",
              fontSize: 42,
            }}
          >
            Login
          </h1>

          <p
            style={{
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Login to continue managing your finances with VRinLoop.
          </p>
        </div>

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <div
          style={{
            position: "relative",
          }}
        >
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            onChange={handleChange}
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
          Login
        </button>

        <div
          style={{
            marginTop: 25,
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#64748b",
              marginBottom: 18,
            }}
          >
            New to VRinLoop?
            <Link
              to="/signup"
              style={{
                color: "#7c3aed",
                textDecoration: "none",
                fontWeight: "bold",
                marginLeft: 6,
              }}
            >
              Create Account →
            </Link>
          </p>

          <Link
            to="/forgot-password"
            style={{
              display: "inline-block",
              padding: "10px 18px",
              borderRadius: 12,
              background: "rgba(124,58,237,0.08)",
              color: "#ed523a",
              textDecoration: "none",
              fontWeight: "bold",
              border: "1px solid rgba(124,58,237,0.15)",
            }}
          >
            Forgot Password?
          </Link>
          <p
            style={{
              textAlign: "center",
              marginTop: 25,
              color: "#94a3b8",
              fontSize: 12,
            }}
          >
            VRinLoop v1.0
          </p>
        </div>
      </form>
    </div>
  );
}

// const inputStyle = {

//   width: '100%',

//   padding: 14,

//   marginTop: 15,

//   borderRadius: 10,

//   border: '1px solid #cbd5e1'

// };

const inputStyle = {
  width: "100%",

  padding: 16,

  marginTop: 15,

  borderRadius: 14,

  border: "1px solid #d8b4fe",

  outline: "none",

  fontSize: 15,

  background: "rgba(255,255,255,0.8)",
};

// const buttonStyle = {

//   width: '100%',

//   padding: 14,

//   marginTop: 20,

//   border: 'none',

//   borderRadius: 12,

//   background:
// 'linear-gradient(135deg,#7c3aed,#a855f7)',

//   color: 'white',

//   fontWeight: 'bold',

//   cursor: 'pointer'

// };

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

  letterSpacing: 0.5,

  boxShadow: "0 10px 25px rgba(124,58,237,0.35)",

  cursor: "pointer",

  transition: "0.3s",
};
