import React, { useEffect, useState } from "react";
import API from "../services/api";
import AddTransaction from "../components/AddTransaction";
import TransactionList from "../components/TransactionList";
import { formatCurrency } from "../utils/format";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

const card = (bg) => ({
  background: bg,
  color: "white",
  padding: "12px 14px",
  borderRadius: 24,
  textAlign: "center",
  fontWeight: "600",
  fontSize: "15px",
  boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
  transition: "0.25s ease",
  cursor: "pointer",
  minHeight: 45,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  border: "1px solid rgba(255,255,255,0.08)",
});

function Dashboard() {
  const [data, setData] = useState(null);
  const [calendarTxs, setCalendarTxs] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const [openForm, setOpenForm] = useState(false);
  const [reload, setReload] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [showExportPopup, setShowExportPopup] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const dashboardRes = await API.get("/dashboard");

      setData(dashboardRes.data);

      const txRes = await API.get("/");

      setCalendarTxs(txRes.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f4f7fb",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "70px",
            height: "70px",
            border: "6px solid #dbeafe",
            borderTop: "6px solid #2563eb",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />

        <h2
          style={{
            margin: 0,
            color: "#1e293b",
            fontSize: "28px",
          }}
        >
          💰 Loading Dashboard...
        </h2>

        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: "15px",
          }}
        >
          Fetching transactions & analytics
        </p>

        <style>
          {`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
        </style>
      </div>
    );
  const profitLoss = data.incoming - data.outgoing;

  const total = data.incoming + data.outgoing;

  const incomingPercent = total === 0 ? 0 : (data.incoming / total) * 100;

  const outgoingPercent = total === 0 ? 0 : (data.outgoing / total) * 100;

  const today = new Date();

  const day = today.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const date = today.getDate();

  const month = today.toLocaleDateString("en-US", {
    month: "long",
  });

  const year = today.getFullYear();

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const todayEvents = calendarTxs.filter((tx) => {
    const due = new Date(tx.due_date);

    return (
      due.getDate() === today.getDate() &&
      due.getMonth() === today.getMonth() &&
      due.getFullYear() === today.getFullYear() &&
      tx.status !== "paid"
    );
  });

  const hasDueOnDate = (dayNumber) => {
    return calendarTxs.some((tx) => {
      const due = new Date(tx.due_date);

      return (
        due.getDate() === dayNumber &&
        due.getMonth() === currentMonth &&
        due.getFullYear() === currentYear &&
        tx.status !== "paid"
      );
    });
  };
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div
      style={{
        padding: "30px",
        paddingLeft: "95px",
        fontFamily: "Arial",
        transition: "0.3s",
        background: "#f4f7fb",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        onOpenExport={() => setShowExportPopup(true)}
      />

      {/* HEADER CONTAINER */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
          color: "white",
          padding: "28px 30px",
          borderRadius: 24,
          marginBottom: 25,
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        {/* Title Section */}
        <div>
          <h1
            style={{
              margin: 0,

              fontSize: 32,

              fontWeight: "800",

              color: "white",
            }}
          >
            Welcome Back, {user?.name || "User"} 👋
          </h1>

          <p
            style={{
              marginTop: 8,

              opacity: 0.75,

              fontSize: 15,
            }}
          >
            Manage payments, profiles and analytics
          </p>

          {/* NEW TRANSACTION BUTTON (Moved inside the layout flow) */}
          <button
            onClick={() => setOpenForm(true)}
            style={{
              background: "#4CAF50",
              color: "white",
              border: "none",
              padding: "12px 18px",
              borderRadius: "25px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
              whiteSpace: "nowrap",
            }}
          >
            + New Transaction
          </button>
        </div>

        {/* Right Actions Section (Bundles Date and Button Together) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* Date Card */}

          <div
            style={{
              width: 470,

              minHeight: 230,

              borderRadius: 24,

              background: "rgba(255,255,255,0.08)",

              backdropFilter: "blur(12px)",

              border: "1px solid rgba(255,255,255,0.08)",

              padding: 14,

              display: "flex",

              justifyContent: "space-between",

              gap: 14,
            }}
          >
            {/* LEFT */}

            <div
              style={{
                width: 150,
              }}
            >
              <div
                style={{
                  color: "#cbd5e1",

                  fontSize: 12,

                  fontWeight: "bold",

                  letterSpacing: 2,
                }}
              >
                {day.toUpperCase()}
              </div>

              <div
                style={{
                  fontSize: 58,

                  fontWeight: "900",

                  color: "white",

                  lineHeight: 1,
                }}
              >
                {date}
              </div>

              <div
                style={{
                  marginTop: 18,

                  color: "#fff",

                  fontWeight: "bold",

                  marginBottom: 10,
                }}
              >
                Today's Events
              </div>

              <div
                style={{
                  display: "flex",

                  flexDirection: "column",

                  gap: 8,
                }}
              >
                {todayEvents.length === 0 ? (
                  <span
                    style={{
                      fontSize: 12,

                      color: "#94a3b8",
                    }}
                  >
                    No events today
                  </span>
                ) : (
                  todayEvents.slice(0, 3).map((tx) => {
                    let amount = 0;

                    // NORMAL
                    if (tx.transaction_type === "normal") {
                      amount =
                        Number(tx.principal_amount || 0) -
                        Number(tx.paid_amount || 0);
                    }

                    // ROTATION
                    else if (tx.transaction_type === "rotation") {
                      let totalInterest = Number(tx.base_interest || 0);

                      tx.extensions?.forEach((ext) => {
                        if (ext.interest_paid) {
                          totalInterest = Number(ext.extra_interest || 0);
                        } else {
                          totalInterest += Number(ext.extra_interest || 0);
                        }
                      });

                      amount = Number(tx.principal_amount || 0) + totalInterest;
                    }

                    // LOAN
                    else if (tx.transaction_type === "loan") {
                      amount = Number(tx.emi_amount || 0);
                    }

                    return (
                      <div
                        key={tx._id}
                        style={{
                          fontSize: 11,
                          color: "#fff",
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          🔴 {tx.person_name}
                          {" | "}
                          {tx.type === "incoming" ? "In" : "Out"}
                          {" | "}
                          {tx.transaction_type === "normal"
                            ? "N"
                            : tx.transaction_type === "rotation"
                              ? "R"
                              : "L"}
                        </div>

                        <div
                          style={{
                            color: "#22c55e",

                            fontWeight: "bold",

                            marginTop: 2,
                          }}
                        >
                          ₹{amount.toLocaleString("en-IN")}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT */}

            <div
              style={{
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                  color: "#fff",
                  fontWeight: "bold",
                }}
              >
                <button
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);

                      setCurrentYear((prev) => prev - 1);
                    } else {
                      setCurrentMonth((prev) => prev - 1);
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                >
                  ◀
                </button>

                <span>
                  {monthNames[currentMonth].toUpperCase()} {currentYear}
                </span>

                <button
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);

                      setCurrentYear((prev) => prev + 1);
                    } else {
                      setCurrentMonth((prev) => prev + 1);
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                >
                  ▶
                </button>
              </div>

              <div
                style={{
                  display: "grid",

                  gridTemplateColumns: "repeat(7,1fr)",

                  gap: 5,

                  fontSize: 12,

                  textAlign: "center",
                }}
              >
                {["S", "M", "T", "W", "T", "F", "S"].map((dayName) => (
                  <div
                    key={dayName}
                    style={{
                      color: "#94a3b8",

                      fontWeight: "bold",
                    }}
                  >
                    {dayName}
                  </div>
                ))}

                {calendarDays.map((dayNum, index) => {
                  if (!dayNum) {
                    return <div key={index} />;
                  }

                  const isToday =
                    dayNum === today.getDate() &&
                    currentMonth === today.getMonth() &&
                    currentYear === today.getFullYear();

                  const hasDue = hasDueOnDate(dayNum);

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        const events = calendarTxs.filter((tx) => {
                          const due = new Date(tx.due_date);

                          return (
                            due.getDate() === dayNum &&
                            due.getMonth() === currentMonth &&
                            due.getFullYear() === currentYear &&
                            tx.status !== "paid"
                          );
                        });

                        setSelectedDayEvents(events);
                        setShowCalendarPopup(true);
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        margin: "0 auto",
                        fontSize: 12,
                        fontWeight: "bold",
                        cursor: "pointer",
                        color: isToday || hasDue ? "white" : "#e2e8f0",

                        background:
                          isToday && hasDue
                            ? "#7c3aed"
                            : hasDue
                              ? "#ef4444"
                              : isToday
                                ? "#22c55e"
                                : "transparent",

                        boxShadow:
                          isToday || hasDue
                            ? "0 0 12px rgba(255,255,255,0.15)"
                            : "none",
                      }}
                    >
                      {dayNum}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP */}
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

              maxHeight: "90vh",
              overflowY: "auto",

              scrollbarWidth: "thin",
            }}
          >
            <AddTransaction
              refresh={() => {
                fetchData();
                setReload((prev) => !prev);
                setOpenForm(false);
              }}
            />
          </div>
        </div>
      )}

      {/* DASHBOARD CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))",
          gap: 22,
          marginTop: "20px",
          marginBottom: "28px",
          alignItems: "stretch",
        }}
      >
        <div
          style={card("#4CAF50")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-6px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px)";
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: 10,
              fontSize: 20,
            }}
          >
            Incoming
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: "bold",
            }}
          >
            {formatCurrency(data.incoming)}
          </p>
        </div>

        <div
          style={card("#F44336")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-6px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px)";
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: 10,
              fontSize: 20,
            }}
          >
            Outgoing
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: "bold",
            }}
          >
            {formatCurrency(data.outgoing)}
          </p>
        </div>

        <div
          style={card("#009688")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-6px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px)";
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: 10,
              fontSize: 20,
            }}
          >
            Principal
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: "bold",
            }}
          >
            {formatCurrency(data.principal)}
          </p>
        </div>

        <div
          style={card("#FF9800")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-6px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px)";
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: 10,
              fontSize: 20,
            }}
          >
            Interest
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: "bold",
            }}
          >
            {formatCurrency(data.interest)}
          </p>
        </div>

        <div
          style={{
            ...card(profitLoss >= 0 ? "#4CAF50" : "#D32F2F"),
            gridColumn: "span 4",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-6px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px)";
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: 10,
              fontSize: 20,
            }}
          >
            {profitLoss >= 0 ? "Profit" : "Loss"}
          </h3>

          <p
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: "bold",
            }}
          >
            {formatCurrency(profitLoss)}
          </p>
        </div>
      </div>

      {/* 🔥 PROFIT BAR (CORRECT LOCATION) */}
      <div style={{ marginTop: "10px", marginBottom: "20px" }}>
        <h3 style={{ marginBottom: 8 }}>🔥 PROFIT BAR</h3>

        <div
          style={{
            width: "100%",
            height: "25px",
            borderRadius: "20px",
            overflow: "hidden",
            display: "flex",
            background: "#eee",
          }}
        >
          <div
            style={{
              width: `${incomingPercent}%`,
              background: "#4CAF50",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {incomingPercent > 10 && `${incomingPercent.toFixed(0)}%`}
          </div>

          <div
            style={{
              width: `${outgoingPercent}%`,
              background: "#F44336",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {outgoingPercent > 10 && `${outgoingPercent.toFixed(0)}%`}
          </div>
        </div>
      </div>

      {showExportPopup && (
        <div
          onClick={() => setShowExportPopup(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(5px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "420px",
              background: "white",
              borderRadius: "28px",
              padding: "30px",
              boxShadow: "0 15px 35px rgba(0,0,0,0.25)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 8,
                color: "#0f172a",
              }}
            >
              📁 Export Statements
            </h2>

            <p
              style={{
                marginTop: 0,
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Export transaction and loan reports
            </p>

            <div
              style={{
                display: "grid",
                gap: "16px",
                marginTop: "28px",
              }}
            >
              {/* CSV */}
              <div
                onClick={async () => {
                  try {
                    const res = await API.get("/");

                    const data = res.data.filter(
                      (tx) => tx.transaction_type !== "loan",
                    );

                    const { exportTransactionsCSV } =
                      await import("../utils/exportTransactions");

                    exportTransactionsCSV(data, "all");

                    setShowExportPopup(false);
                  } catch (err) {
                    console.log(err);
                  }
                }}
                style={{
                  padding: "18px",
                  borderRadius: "18px",
                  background: "linear-gradient(135deg,#16a34a,#22c55e)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                  }}
                >
                  📗 Export CSV
                </h3>

                <p
                  style={{
                    marginBottom: 0,
                    opacity: 0.9,
                    fontSize: "13px",
                  }}
                >
                  Download transaction CSV report
                </p>
              </div>

              {/* PDF */}
              <div
                onClick={async () => {
                  try {
                    const res = await API.get("/");

                    const data = res.data.filter(
                      (tx) => tx.transaction_type !== "loan",
                    );

                    const { exportTransactionsPDF } =
                      await import("../utils/exportTransactions");

                    exportTransactionsPDF(data, "all");

                    setShowExportPopup(false);
                  } catch (err) {
                    console.log(err);
                  }
                }}
                style={{
                  padding: "18px",
                  borderRadius: "18px",
                  background: "linear-gradient(135deg,#dc2626,#ef4444)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                  }}
                >
                  📕 Export PDF
                </h3>

                <p
                  style={{
                    marginBottom: 0,
                    opacity: 0.9,
                    fontSize: "13px",
                  }}
                >
                  Download formatted PDF report
                </p>
              </div>

              {/* LOAN */}
              <div
                onClick={async () => {
                  try {
                    const res = await API.get("/");

                    const loans = res.data.filter(
                      (tx) => tx.transaction_type === "loan",
                    );

                    const { exportLoanPDF } =
                      await import("../utils/exportTransactions");

                    exportLoanPDF(loans);

                    setShowExportPopup(false);
                  } catch (err) {
                    console.log(err);
                  }
                }}
                style={{
                  padding: "18px",
                  borderRadius: "18px",
                  background: "linear-gradient(135deg,#2563eb,#3b82f6)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                  }}
                >
                  🏦 Loan Statements
                </h3>

                <p
                  style={{
                    marginBottom: 0,
                    opacity: 0.9,
                    fontSize: "13px",
                  }}
                >
                  Export professional loan reports
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowExportPopup(false)}
              style={{
                marginTop: "24px",
                width: "100%",
                padding: "12px",
                border: "none",
                borderRadius: "14px",
                background: "#e2e8f0",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showCalendarPopup && (
        <div
          onClick={() => setShowCalendarPopup(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: 25,
              borderRadius: 20,
              width: 400,
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <h2>📅 Due Payments</h2>

            {selectedDayEvents.length === 0 ? (
              <p>No payments due.</p>
            ) : (
              selectedDayEvents.map((tx) => {
                const isOverdue =
                  new Date(tx.due_date) < new Date() && tx.status !== "paid";

                let amount = 0;

if (tx.transaction_type === "loan") {
  amount = Number(tx.emi_amount || 0);
}

else if (tx.transaction_type === "rotation") {
  let totalInterest = Number(tx.base_interest || 0);

  (tx.extensions || []).forEach((ext) => {
    if (ext.interest_paid) {
      totalInterest = Number(ext.extra_interest || 0);
    } else {
      totalInterest += Number(ext.extra_interest || 0);
    }
  });

  amount =
    Number(tx.principal_amount || 0) +
    Number(totalInterest || 0);
}

else {
  amount =
    Number(tx.principal_amount || 0) -
    Number(tx.paid_amount || 0);
}

                return (
                  <div
                    key={tx._id}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      marginBottom: 10,

                      background: isOverdue ? "#fee2e2" : "#f8fafc",

                      border: isOverdue
                        ? "1px solid #ef4444"
                        : "1px solid #e2e8f0",
                    }}
                  >
                    {isOverdue && (
                      <div
                        style={{
                          color: "#dc2626",
                          fontSize: 12,
                          fontWeight: "bold",
                          marginBottom: 6,
                        }}
                      >
                        🔴 OVERDUE
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontWeight: "bold",
                        fontSize: 14,
                      }}
                    >
                      <span
                        onClick={() => {
                          navigate(`/profile/${tx.person_name}`, {
                            state: {
                              type: tx.transaction_type,
                            },
                          });

                          setShowCalendarPopup(false);
                        }}
                        style={{
                          color: "#2563eb",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        {tx.person_name}
                      </span>

                      <span>
                        {tx.type === "incoming" ? "IN" : "OUT"}
                        {" | "}
                        {tx.transaction_type === "normal"
                          ? "N"
                          : tx.transaction_type === "rotation"
                            ? "R"
                            : "L"}
                        {" | "}
                        Total ₹{amount.toLocaleString("en-IN")}
                      </span>
                      {tx.transaction_type === "normal" && (
                        <div
                          style={{
                            marginTop: 8,
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 13,
                            fontWeight: "bold",
                          }}
                        >
                          <span
                            style={{
                              color: "#16a34a",
                            }}
                          >
                            🟢 Paid ₹
                            {Number(tx.paid_amount || 0).toLocaleString(
                              "en-IN",
                            )}
                          </span>

                          <span
                            style={{
                              color: "#2563eb",
                            }}
                          >
                            🔵 Bal ₹
                            {(
                              Number(tx.principal_amount || 0) -
                              Number(tx.paid_amount || 0)
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      {/* TRANSACTIONS */}
      <TransactionList refresh={reload} />
    </div>
  );
}

export default Dashboard;
