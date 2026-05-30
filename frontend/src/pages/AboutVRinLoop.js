import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AboutVRinLoop() {
  const navigate = useNavigate();

  const [showManual, setShowManual] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "linear-gradient(135deg,#eef2ff,#f8fafc)",
        fontFamily: "Arial",
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
        }}
      >
        ⬅ Dashboard
      </button>

      <div
        style={{
          maxWidth: 900,
          margin: "40px auto",
          background: "white",
          borderRadius: 30,
          padding: 40,
          boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: 50,
            marginBottom: 10,
          }}
        >
          VRinLoop
        </h1>

        <h3
          style={{
            textAlign: "center",
            color: "#64748b",
          }}
        >
          Your Money. Your Loop. Your Control.
        </h3>

        <hr
          style={{
            margin: "30px 0",
          }}
        />
        <button
          onClick={() => setShowManual(!showManual)}
          style={{
            background: "linear-gradient(135deg,#0f172a,#334155)",
            color: "white",
            border: "none",
            padding: "14px 28px",
            borderRadius: 14,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 16,
            margin: "20px auto",
            display: "block",
            boxShadow: "0 8px 20px rgba(79,70,229,0.3)",
          }}
        >
          {showManual ? "📕 Hide User Manual" : "📖 View User Manual"}
        </button>
        {showManual && (
          <>
            <h2
              style={{
                marginTop: 40,
              }}
            >
              📖 User Manual
            </h2>

            <div
              style={{
                background: "#f8fafc",
                padding: 25,
                borderRadius: 20,
                lineHeight: 1.8,
              }}
            >
              <h3>🏠 Dashboard</h3>

              <p>
                The Dashboard provides a complete overview of your financial
                activities. You can add transactions, track payments, view due
                dates, monitor today's events, and access analytics.
              </p>

              <hr />

              <h3>💵 Normal Transactions</h3>

              <p>Used for standard money lending or borrowing.</p>

              <ul>
                <li>IN → Money coming to you</li>
                <li>OUT → Money you owe someone</li>
                <li>Full Payment Support</li>
                <li>Installment Payment Support</li>
                <li>Balance Tracking</li>
                <li>Payment History</li>
              </ul>

              <hr />

              <h3>🔄 Rotation Transactions</h3>

              <p>
                Manage rotating money arrangements with interest calculations.
              </p>

              <ul>
                <li>Principal Tracking</li>
                <li>Interest Tracking</li>
                <li>Extension Support</li>
                <li>Extension Interest Tracking</li>
                <li>Due Date Management</li>
              </ul>

              <p>
                <b>Total Payable = Principal + Interest + Extension Interest</b>
              </p>

              <hr />

              <h3>💳 Loan Management</h3>

              <p>Track EMI-based loans efficiently.</p>

              <ul>
                <li>EMI Tracking</li>
                <li>Loan Progress Monitoring</li>
                <li>Remaining EMI Calculation</li>
                <li>Payment History</li>
                <li>Due Date Tracking</li>
              </ul>

              <hr />

              <h3>👥 User Profiles</h3>

              <p>View complete financial history for a person.</p>

              <ul>
                <li>Active Transactions</li>
                <li>Paid Transactions</li>
                <li>Timeline Activity</li>
                <li>Payment Progress</li>
                <li>Analytics</li>
              </ul>

              <hr />

              <h3>📊 Analytics</h3>

              <ul>
                <li>Total Money In</li>
                <li>Total Money Out</li>
                <li>Profit Analysis</li>
                <li>Due Amount Analysis</li>
                <li>Monthly Performance Tracking</li>
              </ul>

              <hr />

              <h3>📁 Export Statements</h3>

              <p>
                Export your financial records for reporting and personal
                bookkeeping.
              </p>

              <ul>
                <li>PDF Export</li>
                <li>CSV Export</li>
              </ul>

              <hr />

              <h3>🧮 Floating Calculator</h3>

              <p>Accessible from every page for quick calculations.</p>

              <ul>
                <li>Addition (+)</li>
                <li>Subtraction (-)</li>
                <li>Multiplication (×)</li>
                <li>Division (÷)</li>
                <li>Percentage (%)</li>
              </ul>

              <hr />

              <h3>💡 Feedback Center</h3>

              <p>
                Help improve VRinLoop by reporting issues or suggesting new
                features.
              </p>

              <ul>
                <li>Bug Reports</li>
                <li>Feature Requests</li>
                <li>General Feedback</li>
                <li>Screenshot Upload Support</li>
                <li>Star Rating System</li>
              </ul>

              <hr />

              <h3>👤 My Profile</h3>

              <ul>
                <li>Update Profile Information</li>
                <li>Update Profile Photo</li>
                <li>Email Verification</li>
                <li>Phone Number Management</li>
              </ul>

              <hr />

              <h3>🔐 Security</h3>

              <ul>
                <li>JWT Authentication</li>
                <li>Protected Routes</li>
                <li>OTP Verification</li>
                <li>Encrypted Password Storage</li>
              </ul>
            </div>
          </>
        )}

        <h2>About VRinLoop</h2>

        <p
          style={{
            lineHeight: 1.8,
            color: "#475569",
          }}
        >
          VRinLoop is a modern personal finance management platform designed to
          help users track transactions, manage loans, monitor repayments,
          analyze financial performance, and maintain complete control over
          their money.
        </p>

        <h2
          style={{
            marginTop: 40,
          }}
        >
          Founder
        </h2>

        <div
          style={{
            background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
            color: "white",
            padding: 25,
            borderRadius: 20,
          }}
        >
          <h3>Likith Ram Naik</h3>

          <p>Full Stack Developer</p>

          <p>B.Tech CSE - Full Stack Development</p>

          <p>Lovely Professional University</p>
        </div>

        <h2
          style={{
            marginTop: 40,
          }}
        >
          🌐 Connect
        </h2>

        <div
          style={{
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <a href="https://likithramportfolio.netlify.app/">
            <button style={btn}>Portfolio</button>
          </a>

          <a
            href="https://github.com/LIKITHRAMNAIK"
            target="_blank"
            rel="noreferrer"
          >
            <button style={btn}>GitHub</button>
          </a>

          <a
            href="https://linkedin.com/in/likith-ram-naik"
            target="_blank"
            rel="noreferrer"
          >
            <button style={btn}>LinkedIn</button>
          </a>

          <a href="mailto:likithramnaik123@gmail.com">
            <button style={btn}>Email</button>
          </a>
        </div>

        <div
          style={{
            marginTop: 50,
            textAlign: "center",
            color: "#64748b",
          }}
        >
          <h3>VRinLoop v1.0</h3>

          <p>Founder & Developer</p>

          <p
            style={{
              fontWeight: "bold",
            }}
          >
            Likith Ram Naik
          </p>

          <p>© 2026 VRinLoop. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
}

// const btn = {
//   background:
//     'linear-gradient(135deg,#2563eb,#4f46e5)',
//   color: 'white',
//   border: 'none',
//   padding: '12px 22px',
//   borderRadius: 14,
//   cursor: 'pointer',
//   fontWeight: 'bold'
// };

const btn = {
  background: "transparent",

  color: "#4f46e5",

  border: "2px solid #4f46e5",

  padding: "12px 22px",

  borderRadius: 14,

  cursor: "pointer",

  fontWeight: "bold",

  transition: "0.3s",

  backdropFilter: "blur(10px)",
};
