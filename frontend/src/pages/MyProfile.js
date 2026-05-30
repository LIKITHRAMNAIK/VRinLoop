import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/format";
import {
  exportProfilePDF,
  exportProfileCSV,
  exportTransactionsPDF,
  exportLoanPDF,
} from "../utils/exportTransactions";
import authAPI from "../services/authApi";
import CountUp from "react-countup";

import AddTransaction from "../components/AddTransaction";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

function MyProfile() {
  const navigate = useNavigate();
  const [allTransactions, setAllTransactions] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));

  const [openForm, setOpenForm] = useState(false);

  const [showOtpPopup, setShowOtpPopup] = useState(false);

  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",

    email: user?.email || "",

    phone: user?.phone || "",
  });

  const [profileImage, setProfileImage] = useState(null);

  const [showEditProfile, setShowEditProfile] = useState(false);

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      await authAPI.post(
        "/send-profile-update-otp",

        {},

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setShowOtpPopup(true);

      alert("OTP sent to your email");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("otp", otp);

      formData.append("name", profileForm.name);

      formData.append("email", profileForm.email);

      formData.append("phone", profileForm.phone);

      if (profileImage) {
        formData.append("profile_image", profileImage);
      }

      const token = localStorage.getItem("token");

      const res = await authAPI.put(
        "/verify-profile-update-otp",

        formData,

        {
          headers: {
            Authorization: `Bearer ${token}`,

            "Content-Type": "multipart/form-data",
          },
        },
      );

      localStorage.setItem(
        "user",

        JSON.stringify(res.data.user),
      );

      alert("Profile updated successfully");

      setShowOtpPopup(false);

      setShowEditProfile(false);

      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const monthlyData = [
    {
      month: "Jan",
      incoming: 45000,
      outgoing: 12000,
      profit: 33000,
    },

    {
      month: "Feb",
      incoming: 52000,
      outgoing: 18000,
      profit: 34000,
    },

    {
      month: "Mar",
      incoming: 61000,
      outgoing: 22000,
      profit: 39000,
    },

    {
      month: "Apr",
      incoming: 48000,
      outgoing: 16000,
      profit: 32000,
    },

    {
      month: "May",
      incoming: 75000,
      outgoing: 25000,
      profit: 50000,
    },

    {
      month: "Jun",
      incoming: 90000,
      outgoing: 30000,
      profit: 60000,
    },
  ];
  const [showExportPopup, setShowExportPopup] = useState(false);

  const [stats, setStats] = useState({
    recentActivities: [],

    users: 0,

    transactions: 0,

    incoming: 0,

    outgoing: 0,

    paidIncoming: 0,

    paidOutgoing: 0,

    overdue: 0,

    totalLoans: 0,

    pendingLoans: 0,

    completedLoans: 0,

    riskyUsers: {},
  });

  const financeData = [
    {
      name: "Incoming",
      amount: stats.paidIncoming,
    },

    {
      name: "Outgoing",
      amount: stats.paidOutgoing,
    },

    {
      name: "Profit",
      amount: stats.paidIncoming - stats.paidOutgoing,
    },
  ];

  const loanData = [
    {
      name: "Completed",
      value: stats.completedLoans,
    },

    {
      name: "Pending",
      value: stats.pendingLoans,
    },
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  useEffect(() => {
    API.get("/")
      .then((res) => {
        const data = res.data;
        setAllTransactions(data);

        const usersSet = new Set();

        const activities = [];

        let incoming = 0;
        let outgoing = 0;

        let paidIncoming = 0;
        let paidOutgoing = 0;

        let overdue = 0;

        let totalLoans = 0;
        let pendingLoans = 0;
        let completedLoans = 0;

        const riskyUsers = {};

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        data.forEach((tx) => {
          usersSet.add(tx.person_name);

          activities.push({
            name: tx.person_name,

            type: tx.transaction_type,

            status: tx.status,

            amount: tx.principal_amount,

            date: tx.due_date,
          });

          const due = new Date(tx.due_date);

          due.setHours(0, 0, 0, 0);

          // ================= LOANS =================

          if (tx.transaction_type === "loan") {
            totalLoans++;

            if (tx.status === "paid") {
              completedLoans++;
            } else {
              pendingLoans++;
            }

            const remainingLoan =
              (tx.remaining_emi || 0) * (tx.emi_amount || 0);

            if (tx.status !== "paid") {
              outgoing += remainingLoan;
            }

            if (tx.status === "paid") {
              paidOutgoing += tx.completed_emi * tx.emi_amount;
            }
          }

          // ================= NORMAL =================
          else if (tx.transaction_type === "normal") {
            const paid = tx.paid_amount || 0;

            const remaining = tx.principal_amount - paid;

            if (tx.status !== "paid") {
              if (tx.type === "incoming") {
                incoming += remaining;
              } else {
                outgoing += remaining;
              }
            }

            if (paid > 0) {
              if (tx.type === "incoming") {
                paidIncoming += paid;
              } else {
                paidOutgoing += paid;
              }
            }
          }

          // ================= ROTATION =================
          else {
            let interest = tx.base_interest || 0;

            tx.extensions?.forEach((ext) => {
              interest += ext.extra_interest || 0;
            });

            const total = tx.principal_amount + interest;

            if (tx.status !== "paid") {
              if (tx.type === "incoming") {
                incoming += total;
              } else {
                outgoing += total;
              }
            }

            if (tx.status === "paid") {
              if (tx.type === "incoming") {
                paidIncoming += total;
              } else {
                paidOutgoing += total;
              }
            }
          }

          // ================= OVERDUE =================

          const paidLate =
            tx.status === "paid" &&
            tx.paid_date &&
            new Date(tx.paid_date) > due;

          if (due < today && tx.status !== "paid") {
            overdue++;
          }

          if (paidLate) {
            overdue++;
          }
        });

        // ================= RECENT ACTIVITIES =================

        const recentActivities = activities
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 6);

        // ================= RISK USERS =================

        data.forEach((tx) => {
          const due = new Date(tx.due_date);

          due.setHours(0, 0, 0, 0);

          if (due < today && tx.status !== "paid") {
            riskyUsers[tx.person_name] = (riskyUsers[tx.person_name] || 0) + 1;
          }
        });

        // ================= FINAL STATE =================

        const activeBalance = incoming - outgoing;

        const totalProfit = paidIncoming - paidOutgoing;

        const recoveryRate =
          data.length > 0
            ? Math.round(((data.length - overdue) / data.length) * 100)
            : 0;

        const overduePercent =
          data.length > 0 ? Math.round((overdue / data.length) * 100) : 0;

        const loanSuccessRate =
          totalLoans > 0 ? Math.round((completedLoans / totalLoans) * 100) : 0;

        setStats({
          users: usersSet.size,

          transactions: data.length,

          incoming,

          outgoing,

          paidIncoming,

          paidOutgoing,

          overdue,

          recentActivities,

          totalLoans,

          pendingLoans,

          completedLoans,

          riskyUsers,
          totalProfit,

          activeBalance,

          recoveryRate,

          overduePercent,

          loanSuccessRate,
        });
      })

      .catch((err) => console.log(err));
  }, []);

  return (
    <div
      style={{
        padding: "30px 30px 30px 95px",
        minHeight: "100vh",
        background: "linear-gradient(135deg,#eef2ff,#f8fafc)",
        fontFamily: "Arial",
        overflowX: "hidden",
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "100vw",
      }}
    >
      {/* TOP BAR */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
          flexWrap: "wrap",
          gap: 15,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
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
              fontSize: 15,
              boxShadow: "0 8px 18px rgba(34,197,94,0.25)",
            }}
          >
            ⬅ Dashboard
          </button>

          <button
            onClick={() => navigate("/users")}
            style={{
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              color: "white",
              border: "none",
              padding: "12px 22px",
              borderRadius: 14,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 15,
              boxShadow: "0 8px 18px rgba(124,58,237,0.25)",
            }}
          >
            👥 User Profiles
          </button>
        </div>
        <button
          onClick={() => setOpenForm(true)}
          style={{
            background: "linear-gradient(135deg,#f59e0b,#ea580c)",
            color: "white",
            border: "none",
            padding: "12px 22px",
            borderRadius: 14,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 15,
            boxShadow: "0 8px 18px rgba(234,88,12,0.25)",
          }}
        >
          ➕ Add Transaction
        </button>
        <div></div>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <button
            onClick={() => setShowEditProfile(true)}
            style={{
              background: "linear-gradient(135deg,#2563eb,#1d4ed8)",

              color: "white",

              border: "none",

              padding: "12px 22px",

              borderRadius: 14,

              cursor: "pointer",

              fontWeight: "bold",

              fontSize: 15,

              boxShadow: "0 8px 18px rgba(37,99,235,0.25)",
            }}
          >
            Edit Profile
          </button>

          <button
            onClick={() => setShowExportPopup(true)}
            style={{
              background: "linear-gradient(135deg,#0f766e,#115e59)",

              color: "white",

              border: "none",

              padding: "12px 22px",

              borderRadius: 14,

              cursor: "pointer",

              fontWeight: "bold",

              fontSize: 15,

              boxShadow: "0 8px 18px rgba(13,148,136,0.25)",
            }}
          >
            📤 Export
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("token");

              localStorage.removeItem("user");

              navigate("/login");
            }}
            style={{
              background: "linear-gradient(135deg,#dc2626,#991b1b)",

              color: "white",

              border: "none",

              padding: "12px 22px",

              borderRadius: 14,

              cursor: "pointer",

              fontWeight: "bold",

              fontSize: 15,

              boxShadow: "0 8px 18px rgba(220,38,38,0.25)",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* HERO CARD */}

      <div
        style={{
          background: "linear-gradient(135deg,#0f172a,#1e293b)",
          borderRadius: 32,
          padding: 35,
          color: "white",
          marginBottom: 35,
          boxShadow: "0 20px 45px rgba(15,23,42,0.25)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 25,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(124,58,237,0.18)",
              filter: "blur(45px)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(59,130,246,0.15)",
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
              }}
            >
              <div
                style={{
                  width: 85,
                  height: 85,
                  borderRadius: "50%",
                  overflow: "hidden",
                  boxShadow: "0 10px 25px rgba(124,58,237,0.4)",
                  border: "3px solid rgba(255,255,255,0.2)",
                }}
              >
                {user?.profile_image ? (
                  <img
                    src={`http://localhost:5000/uploads/${user.profile_image}`}
                    alt="profile"
                    style={{
                      width: "100%",

                      height: "100%",

                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",

                      height: "100%",

                      borderRadius: "50%",

                      background: "linear-gradient(135deg,#7c3aed,#4f46e5)",

                      display: "flex",

                      justifyContent: "center",

                      alignItems: "center",

                      fontSize: 34,

                      fontWeight: "bold",

                      color: "white",
                    }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 40,
                    fontWeight: "900",
                  }}
                >
                  {user?.name}
                </h1>

                <p
                  style={{
                    marginTop: 8,
                    color: "#cbd5e1",
                    fontSize: 18,
                  }}
                >
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: 18,
              flex: 1,
              minWidth: 320,
            }}
          >
            <div style={heroMiniCard()}>
              <p>💰 Total Profit</p>

              <h2>{formatCurrency(stats.paidIncoming - stats.paidOutgoing)}</h2>
            </div>

            <div style={heroMiniCard()}>
              <p>📈 Financial Health</p>

              <h2>
                {stats.overdue <= 5
                  ? "Excellent"
                  : stats.overdue <= 15
                    ? "Good"
                    : "Risk"}
              </h2>
            </div>

            <div style={heroMiniCard()}>
              <p>🏦 Active Portfolio</p>

              <h2>{formatCurrency(stats.incoming + stats.outgoing)}</h2>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 20,
          marginBottom: 45,
        }}
      >
        {/* TOTAL USERS */}

        <div
          style={miniCard("#2563eb")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px) scale(1.03)";

            e.currentTarget.style.boxShadow = "0 18px 35px rgba(0,0,0,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px) scale(1)";

            e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.12)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              filter: "blur(25px)",
            }}
          />

          <p style={miniTitle()}>👥 Total Users</p>

          <h2 style={miniValue()}>
            <CountUp end={stats.users} duration={2} />
          </h2>
        </div>

        {/* TRANSACTIONS */}

        <div
          style={miniCard("#7c3aed")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px) scale(1.03)";

            e.currentTarget.style.boxShadow = "0 18px 35px rgba(0,0,0,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px) scale(1)";

            e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.12)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              filter: "blur(25px)",
            }}
          />

          <p style={miniTitle()}>📄 Transactions</p>

          <h2 style={miniValue()}>
            <CountUp end={stats.transactions} duration={2} />+
          </h2>
        </div>

        {/* ACTIVE INCOMING */}

        <div
          style={miniCard("#16a34a")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px) scale(1.03)";

            e.currentTarget.style.boxShadow = "0 18px 35px rgba(0,0,0,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px) scale(1)";

            e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.12)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              filter: "blur(25px)",
            }}
          />

          <p style={miniTitle()}>📥 Active Incoming</p>

          <h2 style={miniValue()}>{formatCurrency(stats.incoming)}</h2>
        </div>

        {/* ACTIVE OUTGOING */}

        <div
          style={miniCard("#dc2626")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px) scale(1.03)";

            e.currentTarget.style.boxShadow = "0 18px 35px rgba(0,0,0,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px) scale(1)";

            e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.12)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              filter: "blur(25px)",
            }}
          />

          <p style={miniTitle()}>📤 Active Outgoing</p>

          <h2 style={miniValue()}>{formatCurrency(stats.outgoing)}</h2>
        </div>

        {/* PAID INCOMING */}

        <div
          style={miniCard("#0f766e")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px) scale(1.03)";

            e.currentTarget.style.boxShadow = "0 18px 35px rgba(0,0,0,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px) scale(1)";

            e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.12)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              filter: "blur(25px)",
            }}
          />

          <p style={miniTitle()}>💸 Paid Incoming</p>

          <h2 style={miniValue()}>{formatCurrency(stats.paidIncoming)}</h2>
        </div>

        {/* PAID OUTGOING */}

        <div
          style={miniCard("#ea580c")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px) scale(1.03)";

            e.currentTarget.style.boxShadow = "0 18px 35px rgba(0,0,0,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px) scale(1)";

            e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.12)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              filter: "blur(25px)",
            }}
          />

          <p style={miniTitle()}>💳 Paid Outgoing</p>

          <h2 style={miniValue()}>{formatCurrency(stats.paidOutgoing)}</h2>
        </div>

        {/* OVERDUE */}

        <div
          style={miniCard("#be123c")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px) scale(1.03)";

            e.currentTarget.style.boxShadow = "0 18px 35px rgba(0,0,0,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px) scale(1)";

            e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.12)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              filter: "blur(25px)",
            }}
          />

          <p style={miniTitle()}>⚠ Overdue Cases</p>

          <h2 style={miniValue()}>
            <CountUp end={stats.overdue} duration={2} />
          </h2>
        </div>

        {/* NET PROFIT */}

        <div
          style={miniCard("#0891b2")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px) scale(1.03)";

            e.currentTarget.style.boxShadow = "0 18px 35px rgba(0,0,0,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px) scale(1)";

            e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.12)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              filter: "blur(25px)",
            }}
          />

          <p style={miniTitle()}>💰 Net Profit</p>

          <h2 style={miniValue()}>
            {formatCurrency(stats.paidIncoming - stats.paidOutgoing)}
          </h2>
        </div>

        {/* TOTAL LOANS */}

        <div
          style={miniCard("#4338ca")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px) scale(1.03)";

            e.currentTarget.style.boxShadow = "0 18px 35px rgba(0,0,0,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px) scale(1)";

            e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.12)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              filter: "blur(25px)",
            }}
          />

          <p style={miniTitle()}>🏦 Total Loans</p>

          <h2 style={miniValue()}>{stats.totalLoans}</h2>
        </div>

        {/* LOAN STATUS */}

        <div
          style={miniCard("#7c2d12")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px) scale(1.03)";

            e.currentTarget.style.boxShadow = "0 18px 35px rgba(0,0,0,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px) scale(1)";

            e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.12)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              filter: "blur(12px)",
            }}
          />

          <p style={miniTitle()}>🏦 Loan Status</p>

          <div
            style={{
              marginTop: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                }}
              >
                ⏳ Pending
              </span>

              <span
                style={{
                  fontSize: 28,
                  fontWeight: "900",
                }}
              >
                {stats.pendingLoans}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                }}
              >
                ✅ Completed
              </span>

              <span
                style={{
                  fontSize: 28,
                  fontWeight: "900",
                }}
              >
                {stats.completedLoans}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FINANCIAL HEALTH */}

      <div
        style={{
          background: "linear-gradient(135deg,#0f172a,#1e293b)",

          borderRadius: 30,

          padding: 35,

          color: "white",

          marginBottom: 40,

          position: "relative",

          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(59,130,246,0.15)",
            filter: "blur(40px)",
          }}
        />

        <h2
          style={{
            marginTop: 0,
            fontSize: 34,
          }}
        >
          📈 Financial Health Meter
        </h2>

        <div
          style={{
            marginTop: 30,
          }}
        >
          <div
            style={{
              height: 24,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${
                  stats.overdue <= 5 ? 92 : stats.overdue <= 15 ? 68 : 40
                }%`,

                height: "100%",

                background:
                  stats.overdue <= 5
                    ? "#22c55e"
                    : stats.overdue <= 15
                      ? "#f59e0b"
                      : "#ef4444",

                borderRadius: 20,

                transition: "1s ease",
              }}
            />
          </div>

          <h1
            style={{
              marginTop: 25,
              fontSize: 50,
              marginBottom: 10,
            }}
          >
            {stats.overdue <= 5 ? "92%" : stats.overdue <= 15 ? "68%" : "40%"}
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: 18,
            }}
          >
            {stats.overdue <= 5
              ? "Excellent Financial Stability"
              : stats.overdue <= 15
                ? "Moderate Financial Risk"
                : "High Financial Risk"}
          </p>
        </div>
      </div>

      {/* ANALYTICS GRID ROW 1 */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(350px,1fr))",
          alignItems: "stretch",
          gap: 25,
          marginBottom: 25,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* MONTHLY ANALYTICS */}

        <div
          style={{
            background: "white",

            borderRadius: 30,

            padding: 30,

            boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontSize: 34,
              color: "#0f172a",
            }}
          >
            📊 Financial Performance Dashboard
          </h2>

          <div
            style={{
              marginTop: 30,
              width: "100%",
              height: 400,
            }}
          >
            <ResponsiveContainer>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />

                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="incoming"
                  stroke="#16a34a"
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                  strokeWidth={4}
                />

                <Area
                  type="monotone"
                  dataKey="outgoing"
                  stroke="#dc2626"
                  fillOpacity={0.4}
                  fill="#fecaca"
                  strokeWidth={4}
                />

                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#7c3aed"
                  strokeWidth={5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI INSIGHTS */}

        <div
          style={{
            background: "linear-gradient(135deg,#312e81,#1e1b4b)",

            borderRadius: 30,

            padding: 30,

            color: "white",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontSize: 34,
            }}
          >
            🤖 Smart AI Insights
          </h2>

          <div
            style={{
              marginTop: 25,
              display: "grid",
              gap: 18,
            }}
          >
            <div style={insightCard()}>
              💵 Active Balance:{" "}
              <span
                style={{
                  color: stats.activeBalance >= 0 ? "#4ade80" : "#f87171",
                  fontWeight: "900",
                }}
              >
                {formatCurrency(stats.activeBalance)}
              </span>
            </div>

            <div style={insightCard()}>
              📈 Net Profit: {formatCurrency(stats.totalProfit)}
            </div>

            <div style={insightCard()}>
              💰 Loan Success Rate: {stats.loanSuccessRate}%
            </div>

            <div style={insightCard()}>
              ⚠ Overdue Risk: {stats.overduePercent}%
            </div>

            <div style={insightCard()}>
              🚀 Recovery Efficiency: {stats.recoveryRate}%
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}

      <div
        style={{
          background: "white",
          borderRadius: 30,
          padding: 30,
          marginBottom: 40,
          boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            fontSize: 34,
            color: "#0f172a",
          }}
        >
          📜 Recent Activity Timeline
        </h2>

        <div
          style={{
            marginTop: 30,
          }}
        >
          {stats.recentActivities?.map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 20px",
                borderRadius: 18,
                background: index % 2 === 0 ? "#f8fafc" : "#eef2ff",
                marginBottom: 14,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    color: "#0f172a",
                  }}
                >
                  {item.name}
                </h3>

                <p
                  style={{
                    marginTop: 6,
                    color: "#64748b",
                  }}
                >
                  {item.type.toUpperCase()}
                  {" • "}
                  {item.status.toUpperCase()}
                </p>
              </div>

              <div
                style={{
                  textAlign: "right",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color: item.status === "paid" ? "#16a34a" : "#dc2626",
                  }}
                >
                  {formatCurrency(item.amount)}
                </h3>

                <p
                  style={{
                    marginTop: 6,
                    color: "#64748b",
                  }}
                >
                  {new Date(item.date).toDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LOAN ANALYTICS */}

      <div
        style={{
          background: "linear-gradient(135deg,#0f172a,#1e293b)",

          border: "1px solid rgba(255,255,255,0.08)",

          position: "relative",

          overflow: "hidden",

          borderRadius: 30,

          padding: 30,

          color: "white",

          marginBottom: 40,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            fontSize: 34,
          }}
        >
          💳 Loan Analytics
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 20,
            marginTop: 25,
          }}
        >
          <div style={loanCard()}>
            <p>Total Loans</p>

            <h1>{stats.totalLoans}</h1>
          </div>

          <div style={loanCard()}>
            <p>Pending Loans</p>

            <h1>{stats.pendingLoans}</h1>
          </div>

          <div style={loanCard()}>
            <p>Completed Loans</p>

            <h1>{stats.completedLoans}</h1>
          </div>
        </div>
      </div>

      {/* PERFORMANCE CHART */}

      <div
        style={{
          background: "white",
          borderRadius: 30,
          padding: 30,
          marginBottom: 40,
          boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            fontSize: 34,
            color: "#0f172a",
          }}
        >
          🚀 Performance Growth
        </h2>

        <div
          style={{
            width: "100%",
            height: 320,
          }}
        >
          <ResponsiveContainer>
            <LineChart
              data={[
                { month: "Jan", profit: 20000 },
                { month: "Feb", profit: 40000 },
                { month: "Mar", profit: 70000 },
                { month: "Apr", profit: 90000 },
                { month: "May", profit: 120000 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="profit"
                stroke="#7c3aed"
                strokeWidth={4}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RISK USERS */}

      <div
        style={{
          background: "white",
          borderRadius: 30,
          padding: 30,
          boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
          marginBottom: 40,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            fontSize: 34,
            color: "#991b1b",
          }}
        >
          ⚠ Overdue Risk Users
        </h2>

        <div
          style={{
            marginTop: 25,
          }}
        >
          {Object.keys(stats.riskyUsers || {}).length === 0 ? (
            <div
              style={{
                background: "#dcfce7",
                color: "#166534",
                padding: 25,
                borderRadius: 22,
                textAlign: "center",
                fontWeight: "bold",
                fontSize: 18,
              }}
            >
              🎉 No risky overdue users found
            </div>
          ) : (
            Object.entries(stats.riskyUsers || {}).map(
              ([name, count], index) => (
                <div
                  key={index}
                  style={{
                    background: "#fee2e2",
                    padding: 20,
                    borderRadius: 20,
                    marginBottom: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      color: "#991b1b",
                    }}
                  >
                    {name}
                  </h3>

                  <div
                    style={{
                      background: "#dc2626",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: 14,
                      fontWeight: "bold",
                    }}
                  >
                    {count} Overdue
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </div>

      {/* FINANCE CHARTS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: 25,
          marginBottom: 40,
        }}
      ></div>

      {/* ADVANCED ANALYTICS */}

      <div
        style={{
          background: "white",
          borderRadius: 30,
          padding: 30,
          boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
          marginBottom: 40,
        }}
      >
        <h2
          style={{
            marginTop: 0,
            fontSize: 34,
            color: "#0f172a",
          }}
        >
          📊 Financial Analytics
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            gap: 22,
            marginTop: 30,
          }}
        >
          <div style={analyticsCard()}>
            <p>Recovery Rate</p>

            <h1>
              {stats.transactions > 0
                ? Math.round(
                    ((stats.transactions - stats.overdue) /
                      stats.transactions) *
                      100,
                  )
                : 0}
              %
            </h1>
          </div>

          <div style={analyticsCard()}>
            <p>Collection Efficiency</p>

            <h1>{stats.paidIncoming > 0 ? "Strong" : "Low"}</h1>
          </div>

          <div style={analyticsCard()}>
            <p>Risk Level</p>

            <h1>
              {stats.overdue <= 5
                ? "LOW"
                : stats.overdue <= 15
                  ? "MEDIUM"
                  : "HIGH"}
            </h1>
          </div>

          <div style={analyticsCard()}>
            <p>Portfolio Strength</p>

            <h1>{stats.incoming > stats.outgoing ? "Positive" : "Negative"}</h1>
          </div>
        </div>
      </div>
      {showExportPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 30,
              borderRadius: 24,
              width: 340,
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              📤 Export Report
            </h2>

            <div
              style={{
                display: "grid",
                gap: 12,
                marginTop: 20,
              }}
            >
              <button
                onClick={() => {
                  exportProfilePDF({
                    users: stats.users,

                    transactions: allTransactions,

                    incoming: stats.incoming,

                    outgoing: stats.outgoing,

                    netIncoming: stats.paidIncoming,

                    netOutgoing: stats.paidOutgoing,

                    overdue: stats.overdue,

                    totalLoans: stats.totalLoans,

                    pendingLoans: stats.pendingLoans,

                    completedLoans: stats.completedLoans,

                    loans: allTransactions.filter(
                      (tx) => tx.transaction_type === "loan",
                    ),
                  });

                  setShowExportPopup(false);
                }}
                style={{
                  width: "100%",
                  padding: 14,
                  border: "none",
                  borderRadius: 14,
                  background: "#dc2626",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                📕 Export PDF
              </button>

              <button
                onClick={() => {
                  exportProfileCSV(stats);

                  setShowExportPopup(false);
                }}
                style={{
                  width: "100%",
                  padding: 14,
                  border: "none",
                  borderRadius: 14,
                  background: "#16a34a",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                📗 Export CSV
              </button>

              <button
                onClick={() => setShowExportPopup(false)}
                style={{
                  width: "100%",
                  padding: 12,
                  border: "none",
                  borderRadius: 12,
                  background: "#e2e8f0",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div
          style={{
            position: "fixed",

            inset: 0,

            background: "rgba(15,23,42,0.65)",

            backdropFilter: "blur(10px)",

            display: "flex",

            justifyContent: "center",

            alignItems: "center",

            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: 500,

              background: "linear-gradient(145deg,#ffffff,#f8fafc)",

              borderRadius: 35,

              padding: "38px 34px",

              boxShadow: "0 25px 60px rgba(0,0,0,0.18)",

              position: "relative",

              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",

                top: -90,
                right: -90,

                width: 220,
                height: 220,

                borderRadius: "50%",

                background: "linear-gradient(135deg,#7c3aed,#4f46e5)",

                opacity: 0.08,
              }}
            />

            <h1
              style={{
                marginTop: 0,

                marginBottom: 8,

                fontSize: 40,

                fontWeight: "900",

                color: "#0f172a",
                textAlign: "center",
              }}
            >
              Edit Profile
            </h1>

            <p
              style={{
                color: "#64748b",

                marginBottom: 28,
                textAlign: "center",
              }}
            >
              Update your profile securely
            </p>

            <div
              style={{
                display: "flex",

                justifyContent: "center",

                marginBottom: 28,
              }}
            >
              <img
                src={
                  profileImage
                    ? URL.createObjectURL(profileImage)
                    : user?.profile_image
                      ? `http://localhost:5000/uploads/${user.profile_image}`
                      : "https://ui-avatars.com/api/?name=User"
                }
                alt="profile"
                style={{
                  width: 115,

                  height: 115,

                  borderRadius: "50%",

                  objectFit: "cover",

                  border: "4px solid #7c3aed",

                  boxShadow: "0 15px 35px rgba(124,58,237,0.3)",
                }}
              />
            </div>

            <input
              type="text"
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,

                  name: e.target.value,
                })
              }
              placeholder="Full Name"
              style={premiumInput}
            />

            <input
              type="email"
              value={profileForm.email}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,

                  email: e.target.value,
                })
              }
              placeholder="Email"
              style={premiumInput}
            />

            <input
              type="text"
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,

                  phone: e.target.value,
                })
              }
              placeholder="Phone"
              style={premiumInput}
            />

            <div
              style={{
                marginTop: 18,

                background: "#f8fafc",

                borderRadius: 18,

                padding: 16,

                border: "2px dashed #cbd5e1",
              }}
            >
              <input
                type="file"
                onChange={(e) => setProfileImage(e.target.files[0])}
              />
            </div>

            <div
              style={{
                display: "flex",

                gap: 16,

                marginTop: 32,
              }}
            >
              <button
                onClick={handleProfileUpdate}
                style={{
                  flex: 1,

                  padding: 17,

                  border: "none",

                  borderRadius: 18,

                  background: "linear-gradient(135deg,#22c55e,#16a34a)",

                  color: "white",

                  fontWeight: "800",

                  fontSize: 16,

                  cursor: "pointer",

                  boxShadow: "0 12px 25px rgba(34,197,94,0.25)",
                }}
              >
                Save Changes
              </button>

              <button
                onClick={() => setShowEditProfile(false)}
                style={{
                  flex: 1,

                  padding: 17,

                  border: "none",

                  borderRadius: 18,

                  background: "linear-gradient(135deg,#ef4444,#dc2626)",

                  color: "white",

                  fontWeight: "800",

                  fontSize: 16,

                  cursor: "pointer",

                  boxShadow: "0 12px 25px rgba(239,68,68,0.25)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showOtpPopup && (
        <div
          style={{
            position: "fixed",

            inset: 0,

            background: "rgba(0,0,0,0.45)",

            backdropFilter: "blur(8px)",

            display: "flex",

            justifyContent: "center",

            alignItems: "center",

            zIndex: 99999,
          }}
        >
          <div
            style={{
              width: 420,

              background: "white",

              borderRadius: 28,

              padding: 35,

              boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
            }}
          >
            <h2
              style={{
                marginTop: 0,

                fontSize: 30,

                fontWeight: "800",
              }}
            >
              Verify OTP
            </h2>

            <p
              style={{
                color: "#64748b",

                marginBottom: 25,
              }}
            >
              Enter OTP sent to your email
            </p>

            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{
                width: "100%",

                padding: 18,

                borderRadius: 16,

                border: "1px solid #cbd5e1",

                fontSize: 22,

                letterSpacing: 8,

                textAlign: "center",

                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "flex",

                gap: 14,

                marginTop: 25,
              }}
            >
              <button
                onClick={handleVerifyOtp}
                style={{
                  flex: 1,

                  padding: 16,

                  border: "none",

                  borderRadius: 16,

                  background: "linear-gradient(135deg,#2563eb,#4f46e5)",

                  color: "white",

                  fontWeight: "bold",

                  cursor: "pointer",
                }}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                onClick={() => setShowOtpPopup(false)}
                style={{
                  flex: 1,

                  padding: 16,

                  border: "none",

                  borderRadius: 16,

                  background: "#ef4444",

                  color: "white",

                  fontWeight: "bold",

                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {openForm && (
        <div
          onClick={() => setOpenForm(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backdropFilter: "blur(4px)",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              width: "350px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            }}
          >
            <AddTransaction
              refresh={() => {
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const miniCard = (bg) => ({
  background: bg,

  color: "white",

  padding: "22px 26px",

  borderRadius: 24,

  minHeight: 120,

  display: "flex",

  flexDirection: "column",

  justifyContent: "center",

  boxShadow: "0 10px 25px rgba(0,0,0,0.12)",

  transition: "transform 0.25s ease, box-shadow 0.25s ease",

  cursor: "pointer",

  border: "1px solid rgba(255,255,255,0.08)",

  position: "relative",

  overflow: "hidden",
});

const miniTitle = () => ({
  margin: 0,

  fontSize: 18,

  fontWeight: "700",

  opacity: 0.92,

  marginBottom: 14,
});

const miniValue = () => ({
  margin: 0,

  fontSize: 38,

  fontWeight: "900",

  letterSpacing: 1,
});

const heroMiniCard = () => ({
  background: "rgba(255,255,255,0.08)",
  padding: 18,
  borderRadius: 22,
  backdropFilter: "blur(10px)",
});

const proCard = (bg) => ({
  background: bg,

  color: "white",

  padding: "30px 24px",

  borderRadius: 28,

  boxShadow: "0 12px 25px rgba(0,0,0,0.12)",

  transition: "0.3s ease",

  cursor: "pointer",

  minHeight: 180,

  display: "flex",

  flexDirection: "column",

  justifyContent: "center",

  position: "relative",

  overflow: "hidden",
});

const analyticsCard = () => ({
  background: "linear-gradient(135deg,#f8fafc,#eef2ff)",
  padding: 25,
  borderRadius: 24,
  border: "1px solid #e2e8f0",
});

const loanCard = () => ({
  background: "rgba(255,255,255,0.08)",
  padding: 25,
  borderRadius: 24,
  backdropFilter: "blur(10px)",
});

const card = (bg) => ({
  background: bg,
  color: "white",
  padding: "28px 22px",
  borderRadius: 24,
  textAlign: "center",
  boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
  transition: "0.25s ease",
  cursor: "pointer",
  minHeight: 160,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  border: "1px solid rgba(255,255,255,0.08)",
});

const insightCard = () => ({
  background: "rgba(255,255,255,0.08)",

  padding: 20,

  borderRadius: 18,

  fontSize: 18,

  fontWeight: "600",

  backdropFilter: "blur(10px)",
});

const premiumInput = {
  width: "100%",

  padding: 18,

  marginTop: 16,

  borderRadius: 18,

  border: "1px solid #dbeafe",

  background: "#f8fafc",

  fontSize: 15,

  outline: "none",

  boxSizing: "border-box",
};

const inputStyle = {
  width: "100%",

  padding: 14,

  marginTop: 14,

  borderRadius: 10,

  border: "1px solid #cbd5e1",
};

const saveBtn = {
  flex: 1,

  padding: 14,

  border: "none",

  borderRadius: 12,

  background: "#16a34a",

  color: "white",

  fontWeight: "bold",

  cursor: "pointer",
};

const cancelBtn = {
  flex: 1,

  padding: 14,

  border: "none",

  borderRadius: 12,

  background: "#ef4444",

  color: "white",

  fontWeight: "bold",

  cursor: "pointer",
};
export default MyProfile;
