import { useState } from "react";

import authAPI from "../services/authApi";

import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const [image, setImage] = useState(null);
  const [successModal, setSuccessModal] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,

      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      Object.keys(form).forEach((key) => {
        formData.append(key, form[key]);
      });

      if (image) {
        formData.append("profile_image", image);
      }

      await authAPI.post("/signup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessModal(true);
    } catch (error) {
      alert(error.response?.data?.message || "Signup failed");
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

          padding: "22px 40px",
          borderRadius: 18,

          width: 450,
          zIndex: 2,

          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <h1
            style={{
              marginBottom: 8,
              color: "#4f46e5",
              fontSize: 42,
            }}
          >
            Signup
          </h1>

          <p
            style={{
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Create your VRinLoop account and start managing finances.
          </p>
        </div>

        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
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

        <label
          style={{
            display: "block",
            marginTop: 15,
            padding: 16,
            borderRadius: 14,
            border: "2px dashed #c4b5fd",
            textAlign: "center",
            cursor: "pointer",
            color: "#7c3aed",
            fontWeight: "bold",
          }}
        >
          📷 Upload Profile Photo (Optional)
          <input
            type="file"
            hidden
            onChange={(e) => setImage(e.target.files[0])}
          />
        </label>

        {image && (
          <div
            style={{
              textAlign: "center",
              marginTop: 15,
            }}
          >
            <img
              src={URL.createObjectURL(image)}
              alt="preview"
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid #c4b5fd",
              }}
            />
          </div>
        )}

        <button type="submit" style={buttonStyle}>
          Signup
        </button>

        <div
          style={{
            marginTop: 15,
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#64748b",
            }}
          >
            Already have an account?
            <Link
              to="/login"
              style={{
                color: "#7c3aed",
                textDecoration: "none",
                fontWeight: "bold",
                marginLeft: 6,
              }}
            >
              Login →
            </Link>
          </p>

          <p
            style={{
              marginTop: 10,
              color: "#94a3b8",
              fontSize: 12,
            }}
          >
            VRinLoop v1.0
          </p>
        </div>
      </form>
      {successModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
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
              width: 420,
              background: "white",
              padding: 35,
              borderRadius: 24,
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                fontSize: 60,
              }}
            >
              🎉
            </div>

            <h2
              style={{
                color: "#4f46e5",
              }}
            >
              Account Created
            </h2>

            <p
              style={{
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              Welcome to VRinLoop.
              <br />
              Your account has been created successfully.
            </p>

            <button
              onClick={() => navigate("/login")}
              style={{
                marginTop: 20,
                border: "none",
                padding: "14px 24px",
                borderRadius: 14,
                background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Go To Login →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",

  padding: 16,

  marginTop: 12,

  borderRadius: 14,

  border: "1px solid #d8b4fe",

  outline: "none",

  fontSize: 15,

  background: "rgba(255,255,255,0.8)",
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

  letterSpacing: 0.5,

  boxShadow: "0 10px 25px rgba(124,58,237,0.35)",

  cursor: "pointer",

  transition: "0.3s",
};
