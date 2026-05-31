import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import NormalProfile from "./NormalProfile";
import RotationProfile from "./RotationProfile";
import { formatCurrency } from "../utils/format";
import LoanProfile from "./LoanProfile";
import Charts from "../components/Charts";

function Profile() {
  const { name } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [profileFilter, setProfileFilter] = useState("all");
  const [filter, setFilter] = useState("pending");

  const [rotationFilter, setRotationFilter] = useState("pending");

  const [loanFilter, setLoanFilter] = useState("pending");

  const fetchData = () => {
    API.get(`/person/${name}`)
      .then((res) => {
        const list = res.data.transactions || [];
        setData(list);

        localStorage.setItem("profileData", JSON.stringify(list));
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchData();
  }, [name]);

  const normalData = data.filter((tx) => tx.transaction_type === "normal");

  const rotationData = data.filter((tx) => tx.transaction_type === "rotation");

  const loanData = data.filter((tx) => tx.transaction_type === "loan");

  const filteredNormalData =
    profileFilter === "all" || profileFilter === "normal" ? normalData : [];

  const filteredRotationData =
    profileFilter === "all" || profileFilter === "rotation" ? rotationData : [];

  const filteredLoanData =
    profileFilter === "all" || profileFilter === "loan" ? loanData : [];

  let incoming = 0;
  let outgoing = 0;

  let netIncoming = 0;
  let netOutgoing = 0;

  let totalLoanBalance = 0;

  let totalLoanEmisPaid = 0;

  let totalLoanPenalty = 0;

  let totalLateEmis = 0;

  let totalAdvanceEmis = 0;

  let totalPendingEmis = 0;

  loanData.forEach((tx) => {
    totalLoanBalance += (tx.remaining_emi || 0) * (tx.emi_amount || 0);

    totalLoanEmisPaid += tx.completed_emi || 0;

    totalPendingEmis += tx.remaining_emi || 0;

    tx.emi_history?.forEach((emi) => {
      totalLoanPenalty += emi.penalty_amount || 0;

      if (emi.status === "late") {
        totalLateEmis++;
      }

      if (emi.status === "advance") {
        totalAdvanceEmis++;
      }
    });
  });
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const finalFilteredNormalData = filteredNormalData.filter((tx) => {
    const dueDate = new Date(tx.due_date);

    dueDate.setHours(0, 0, 0, 0);

    const paid = tx.paid_amount || 0;

    const isPartial = paid > 0 && paid < tx.principal_amount;

    const isDue =
      (tx.status !== "paid" && dueDate < today) ||
      (tx.status === "paid" &&
        tx.paid_date &&
        new Date(tx.paid_date) > dueDate);

    if (filter === "pending") {
      return tx.status !== "paid";
    }

    if (filter === "paid") {
      return tx.status === "paid";
    }

    if (filter === "partial") {
      return isPartial;
    }

    if (filter === "due") {
      return isDue;
    }

    return true;
  });

  const finalFilteredRotationData = filteredRotationData.filter((tx) => {
    const dueDate = new Date(tx.final_due_date || tx.due_date);

    dueDate.setHours(0, 0, 0, 0);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const isExtended = tx.extensions?.length > 0;

    const paidLate =
      tx.status === "paid" && tx.paid_date && new Date(tx.paid_date) > dueDate;

    const overdue = tx.status !== "paid" && dueDate < today;

    if (rotationFilter === "pending") {
      return tx.status !== "paid";
    }

    if (rotationFilter === "paid") {
      return tx.status === "paid";
    }

    if (rotationFilter === "extended") {
      return isExtended;
    }

    if (rotationFilter === "due") {
      return overdue || paidLate;
    }

    return true;
  });

  const finalFilteredLoanData = filteredLoanData.filter((tx) => {
    const dueDate = new Date(tx.next_due_date);

    dueDate.setHours(0, 0, 0, 0);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const overdue = tx.status !== "paid" && dueDate < today;

    const paidLate =
      tx.status === "paid" &&
      tx.last_paid_date &&
      new Date(tx.last_paid_date) > dueDate;

    const partial = tx.paid_months > 0 && tx.paid_months < tx.duration_months;

    if (loanFilter === "pending") {
      return tx.status !== "paid";
    }

    if (loanFilter === "paid") {
      return tx.status === "paid";
    }

    if (loanFilter === "partial") {
      return partial;
    }

    if (loanFilter === "due") {
      return overdue || paidLate;
    }

    return true;
  });

  const totalLoanHistory = totalLoanEmisPaid + totalLateEmis + totalAdvanceEmis;

  const globalRiskScore =
    totalLoanHistory === 0
      ? 100
      : Math.max(
          0,

          Math.round(
            ((totalLoanEmisPaid + totalAdvanceEmis) /
              (totalLoanHistory + totalLateEmis)) *
              100,
          ),
        );

  const activities = [];

  data.forEach((tx) => {
    // ================= PAID LATE =================
    const timelineAmount =
  tx.transaction_type === "loan"
    ? tx.emi_amount
    : tx.transaction_type === "rotation"
      ? Number(tx.final_total || 0)
      : tx.principal_amount;

    if (
      tx.status === "paid" &&
      tx.paid_date &&
      !(tx.transaction_type === "normal" && tx.installments?.length > 0)
    ) {
      const paidDate = new Date(tx.paid_date);

      const latestDueDate =
        tx.transaction_type === "rotation"
          ? tx.final_extensions?.length > 0
            ? tx.final_extensions[tx.final_extensions.length - 1].new_due_date
            : tx.final_due_date || tx.due_date
          : tx.final_due_date || tx.due_date;

      const dueDate = new Date(latestDueDate);

      paidDate.setHours(0, 0, 0, 0);

      dueDate.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((paidDate - dueDate) / (1000 * 60 * 60 * 24));

      // LATE
      if (diffDays > 0) {
        activities.push({
          type: "paid_late",

          title: `${tx.transaction_type.toUpperCase()} Paid Late`,

          amount: timelineAmount,

          date: tx.paid_date,

          lateDays: diffDays,

          color: "#ef4444",
        });
      }

      // ON TIME
      else if (diffDays === 0) {
        activities.push({
          type: "paid_ontime",

          title: `${tx.transaction_type.toUpperCase()} Paid`,

          amount: timelineAmount,

          date: tx.paid_date,

          color: "#16a34a",
        });
      }

      // EARLY
      else {
        activities.push({
          type: "paid_early",

          title: `${tx.transaction_type.toUpperCase()} Early Paid`,

          amount:
            tx.transaction_type === "loan"
              ? tx.emi_amount
              : tx.principal_amount,

          date: tx.paid_date,

          color: "#2563eb",
        });
      }
    }
    // ================= NORMAL =================

    if (tx.transaction_type === "normal") {
      const paid = tx.paid_amount || 0;
      const remaining = tx.principal_amount - paid;

      // ACTIVE MONEY
      if (tx.status !== "paid") {
        if (tx.type === "incoming") {
          incoming += remaining;
        } else {
          outgoing += remaining;
        }
      }

      // NET MONEY
      if (paid > 0) {
        if (tx.type === "incoming") {
          netIncoming += paid;
        } else {
          netOutgoing += paid;
        }
      }

      return;
    }
    // ================= LOAN =================

    if (tx.transaction_type === "loan") {
      const remainingLoanAmount =
        (tx.remaining_emi || 0) * (tx.emi_amount || 0);

      if (tx.status !== "paid") {
        if (tx.type === "incoming") {
          incoming += remainingLoanAmount;
        } else {
          outgoing += remainingLoanAmount;
        }
      }

      return;
    }

    // ================= ROTATION =================

    let totalInterest = tx.base_interest;

    tx.extensions?.forEach((ext) => {
      totalInterest += ext.extra_interest;
    });

    const total = tx.principal_amount + totalInterest;

    // ACTIVE
    if (tx.status !== "paid") {
      if (tx.type === "incoming") {
        incoming += total;
      } else {
        outgoing += total;
      }
    }

    // NET
    if (tx.status === "paid") {
      if (tx.type === "incoming") {
        netIncoming += total;
      } else {
        netOutgoing += total;
      }
    }
  });

  const net = netIncoming + netOutgoing;
  const activeTransactions = data.filter((tx) => tx.status !== "paid").length;

  // ================= PAID EMIS =================

  const totalPaidEmis = loanData.reduce(
    (sum, tx) => sum + (tx.completed_emi || 0),
    0,
  );

  // ================= EXTENSIONS =================

  const totalExtensions = rotationData.reduce(
    (sum, tx) => sum + (tx.extensions?.length || 0),
    0,
  );

  // ================= PAID TRANSACTIONS =================

  const paidTransactions = data.filter((tx) => tx.status === "paid").length;

  // ================= LATE PAYMENTS =================

  const todayDate = new Date();

  todayDate.setHours(0, 0, 0, 0);
  const overdueCount = data.filter((tx) => {
    // ONLY ACTIVE
    if (tx.status === "paid") {
      return false;
    }

    // ================= LOAN =================

    if (tx.transaction_type === "loan") {
      if (tx.remaining_emi <= 0) {
        return false;
      }

      const nextEmiDate = new Date(tx.due_date);

      nextEmiDate.setHours(0, 0, 0, 0);

      return nextEmiDate < todayDate;
    }

    // ================= NORMAL / ROTATION =================

    const dueDate = new Date(tx.due_date);

    dueDate.setHours(0, 0, 0, 0);

    return dueDate < todayDate;
  }).length;

  data.forEach((tx) => {
    // ================= LOAN EMI HISTORY =================

    if (tx.transaction_type === "loan" && tx.emi_history?.length > 0) {
      tx.emi_history.forEach((emi) => {
        activities.push({
          penalty: emi.penalty_amount || 0,

          type: "loan_emi",

          title:
            // ✅ FINAL EMI COMPLETED

            tx.status === "paid" && emi.month_number === tx.loan_duration
              ? `🎉 ${tx.person_name} Loan Completed`
              : emi.status === "late"
                ? `Loan EMI #${emi.month_number} Late Paid (${emi.late_days || 0} day${(emi.late_days || 0) > 1 ? "s" : ""})`
                : emi.status === "advance"
                  ? `Loan EMI #${emi.month_number} Advance Paid`
                  : `Loan EMI #${emi.month_number} Paid`,

          amount:
            tx.status === "paid" && emi.month_number === tx.loan_duration
              ? tx.principal_amount
              : emi.amount,

          date: emi.paid_date,

          color:
            tx.status === "paid" && emi.month_number === tx.loan_duration
              ? "#16a34a"
              : emi.status === "late"
                ? "#dc2626"
                : emi.status === "advance"
                  ? "#16a34a"
                  : "#2563eb",

          emiStatus: emi.status,
        });
      });
    }

    // ================= LOAN COMPLETED =================

    if (
      tx.transaction_type === "loan" &&
      tx.status === "paid" &&
      tx.paid_date
    ) {
      activities.push({
        type: "loan_completed",

        title: ` ${tx.person_name} Loan Completed`,

        amount: tx.principal_amount,

        date: tx.paid_date,

        color: "#16a34a",
      });
    }

    // ================= ROTATION EXTENSIONS =================

    if (tx.transaction_type === "rotation" && tx.extensions?.length > 0) {
      tx.extensions.forEach((ext) => {
        activities.push({
          type: "rotation_extend",

          title: `Rotation Extended`,

          amount: ext.extra_interest,

          date: ext.date,

          color: "#ff9800",
        });
      });
    }

    // ================= NORMAL INSTALLMENTS =================

    if (tx.transaction_type === "normal") {
      // INSTALLMENTS
      if (tx.installments?.length > 0) {
        tx.installments.forEach((inst) => {
          if (!inst.amount || Number(inst.amount) <= 0) {
            return;
          }

          activities.push({
            type: "normal_payment",

            title:
              Number(inst.amount) >= Number(tx.principal_amount)
                ? "Normal Fully Paid"
                : `Installment Paid (Total: ₹${tx.principal_amount.toLocaleString("en-IN")})`,

            amount: inst.amount,

            date: inst.date,

            color: "#4CAF50",
          });
        });
      }

      // FULL PAYMENT
      if (
        tx.status === "paid" &&
        tx.paid_date &&
        (!tx.installments || tx.installments.length === 0)
      ) {
        activities.push({
          type: "normal_payment",

          title: (() => {
            const paidDate = new Date(tx.paid_date);

            const latestDueDate = tx.final_due_date || tx.due_date;

            const dueDate = new Date(latestDueDate);

            paidDate.setHours(0, 0, 0, 0);

            dueDate.setHours(0, 0, 0, 0);

            const diff = Math.ceil(
              (paidDate - dueDate) / (1000 * 60 * 60 * 24),
            );

            // EARLY
            if (diff < 0) {
              return `Normal Full Payment Early Paid`;
            }

            // LATE
            if (diff > 0) {
              return `Normal Full Payment Late Paid (${diff} day${diff > 1 ? "s" : ""})`;
            }

            // ON TIME
            return `Normal Full Payment Paid`;
          })(),

          amount: tx.principal_amount,

          date: tx.paid_date,

          color: "#16a34a",
        });
      }
    }
  });

  // SORT LATEST FIRST

  activities.sort((a, b) => new Date(b.date) - new Date(a.date));
  const alerts = [];
  data.forEach((tx) => {
    // ================= ACTIVE OVERDUE =================

    if (tx.status !== "paid") {
      const dueDate = new Date(tx.due_date);

      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < todayDate) {
        const lateDays = Math.ceil(
          (todayDate - dueDate) / (1000 * 60 * 60 * 24),
        );

        alerts.push({
          type: "overdue",

          title: `${tx.transaction_type.toUpperCase()} overdue`,

          days: lateDays,

          color: "#ef4444",
        });
      }
    }

    // ================= TOO MANY EXTENSIONS =================

    if (tx.transaction_type === "rotation" && tx.extensions?.length >= 3) {
      alerts.push({
        type: "extensions",

        title: "Multiple extensions used",

        days: tx.extensions.length,

        color: "#f59e0b",
      });
    }

    // ================= MANY LATE PAYMENTS =================

    let lateCount = 0;

    // NORMAL

    if (tx.transaction_type === "normal") {
      tx.installments?.forEach((inst) => {
        if (new Date(inst.date) > new Date(tx.due_date)) {
          lateCount++;
        }
      });
    }

    // LOAN

    if (tx.transaction_type === "loan") {
      tx.emi_history?.forEach((emi) => {
        if (new Date(emi.paid_date) > new Date(tx.due_date)) {
          lateCount++;
        }
      });
    }

    if (lateCount >= 3) {
      alerts.push({
        type: "late_history",

        title: "Frequent late payments",

        days: lateCount,

        color: "#dc2626",
      });
    }
  });

  return (
    <div style={{ padding: 20 }}>
      <button
        onClick={() => navigate("/")}
        style={{
          marginBottom: 15,
          padding: "8px 14px",
          borderRadius: 8,
          border: "none",
          background: "#4CAF50",
          color: "white",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        ⬅ Dashboard
      </button>

      {/* <h1>{name}'s Profile</h1> */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 34,
          padding: 16,
          marginBottom: 35,
          boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
        }}
      >
        {/* PROFILE FILTER */}

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          {[
            {
              key: "all",
              label: "📋 All",
            },
            {
              key: "normal",
              label: "💵 Normal",
            },
            {
              key: "rotation",
              label: "🔄 Rotation",
            },
            {
              key: "loan",
              label: "💳 Loans",
            },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setProfileFilter(item.key)}
              style={{
                border: "none",
                padding: "12px 18px",
                borderRadius: 14,
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 14,

                background: profileFilter === item.key ? "#2563eb" : "white",

                color: profileFilter === item.key ? "white" : "#0f172a",

                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",

                transition: "0.2s",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* PROFILE HERO */}
        <div
          style={{
            background: "linear-gradient(135deg, #0F172A, #1E293B)",
            borderRadius: 28,
            padding: "30px",
            marginBottom: 20,
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
            boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                width: 85,
                height: 85,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#8B5CF6,#6366F1)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 34,
                fontWeight: "bold",
                boxShadow: "0 8px 20px rgba(99,102,241,0.4)",
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 34,
                }}
              >
                {name}
              </h1>

              <p
                style={{
                  marginTop: 8,
                  color: "#cbd5e1",
                  fontSize: 15,
                }}
              >
                Transaction analytics, payments and loan tracking
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                padding: "14px 18px",
                borderRadius: 16,
                minWidth: 120,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#cbd5e1",
                  fontSize: 13,
                }}
              >
                Total Transactions
              </p>

              <h2
                style={{
                  margin: "8px 0 0",
                }}
              >
                {data.length}
              </h2>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                padding: "14px 18px",
                borderRadius: 16,
                minWidth: 120,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#cbd5e1",
                  fontSize: 13,
                }}
              >
                Loans
              </p>

              <h2
                style={{
                  margin: "8px 0 0",
                }}
              >
                {loanData.length}
              </h2>
            </div>
          </div>
        </div>

        {/* INCOMING / OUTGOING */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))",
            gap: 18,
          }}
        >
          {/* INCOMING */}
          <div
            style={{
              background: "linear-gradient(135deg,#16a34a,#22c55e)",
              color: "white",
              padding: 22,
              borderRadius: 24,
              boxShadow: "0 10px 25px rgba(34,197,94,0.25)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: -20,
                top: -20,
                width: 110,
                height: 110,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
              }}
            />

            <p
              style={{
                margin: 0,
                fontSize: 14,
                opacity: 0.9,
              }}
            >
              Total Incoming
            </p>

            <h1
              style={{
                marginTop: 14,
                marginBottom: 0,
                fontSize: 30,
              }}
            >
              {formatCurrency(incoming)}
            </h1>
          </div>

          {/* OUTGOING */}
          <div
            style={{
              background: "linear-gradient(135deg,#dc2626,#ef4444)",
              color: "white",
              padding: 22,
              borderRadius: 24,
              boxShadow: "0 10px 25px rgba(239,68,68,0.25)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: -20,
                top: -20,
                width: 110,
                height: 110,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
              }}
            />

            <p
              style={{
                margin: 0,
                fontSize: 14,
                opacity: 0.9,
              }}
            >
              Total Outgoing
            </p>

            <h1
              style={{
                marginTop: 14,
                marginBottom: 0,
                fontSize: 30,
              }}
            >
              {formatCurrency(outgoing)}
            </h1>
          </div>
        </div>
      </div>

      {/* ================= ALERTS ================= */}

      {alerts.length > 0 && (
        <div
          style={{
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#b91c1c",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              ⚠ Financial Alerts
            </h2>

            <div
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                padding: "8px 14px",
                borderRadius: 12,
                fontWeight: "bold",
                fontSize: 14,
              }}
            >
              {alerts.length} Alerts
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))",
              gap: 18,
            }}
          >
            {alerts.map((alert, index) => (
              <div
                key={index}
                style={{
                  background: "#ffffff",
                  borderRadius: 22,
                  padding: 22,
                  borderLeft: `6px solid ${alert.color}`,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        color: alert.color,
                        marginBottom: 10,
                      }}
                    >
                      {alert.type === "overdue"
                        ? "🚨"
                        : alert.type === "extensions"
                          ? "🔁"
                          : "⚠️"}{" "}
                      {alert.title}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "#64748b",
                        fontSize: 15,
                      }}
                    >
                      {alert.type === "overdue"
                        ? `Overdue by ${alert.days} days`
                        : alert.type === "extensions"
                          ? `${alert.days} extensions used`
                          : `${alert.days} late payments found`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GLOBAL FINANCIAL ANALYTICS */}

      <div
        style={{
          marginTop: 35,
          marginBottom: 35,
          background: "#ffffff",
          borderRadius: 30,
          padding: 28,
          boxShadow: "0 12px 35px rgba(0,0,0,0.07)",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
            marginBottom: 28,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              📊 Financial Analytics
            </h2>

            <p
              style={{
                marginTop: 6,
                color: "#64748b",
                fontSize: 14,
              }}
            >
              Combined loan performance & transaction insights
            </p>
          </div>

          <button
            onClick={() => navigate(`/loan-analytics/${name}`)}
            style={{
              background: "linear-gradient(135deg,#5E35B1,#7C3AED)",
              color: "white",
              border: "none",
              padding: "12px 18px",
              borderRadius: 14,
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 10px 24px rgba(94,53,177,0.25)",
            }}
          >
            📈 View Loan Analytics
          </button>

          {filteredLoanData.length > 0 && (
            <div
              style={{
                padding: "10px 16px",
                borderRadius: 14,

                background:
                  globalRiskScore >= 80
                    ? "#dcfce7"
                    : globalRiskScore >= 50
                      ? "#fef9c3"
                      : "#fee2e2",

                color:
                  globalRiskScore >= 80
                    ? "#16a34a"
                    : globalRiskScore >= 50
                      ? "#ca8a04"
                      : "#dc2626",

                fontWeight: "bold",
              }}
            >
              Risk Score: {globalRiskScore}%
            </div>
          )}
        </div>

        {/* GRID */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 18,
          }}
        >
          {/* LOAN BALANCE */}

          {filteredLoanData.length > 0 && (
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 22,
                padding: 20,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                Total Loan Balance
              </p>

              <h2
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "#5E35B1",
                }}
              >
                {formatCurrency(totalLoanBalance)}
              </h2>
            </div>
          )}

          {/* EMI STATUS */}

          {filteredLoanData.length > 0 && (
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 22,
                padding: 20,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                EMI Status
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 18,
                  gap: 18,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "#64748b",
                    }}
                  >
                    Pending
                  </p>

                  <h2
                    style={{
                      marginTop: 8,
                      marginBottom: 0,
                      color: "#dc2626",
                    }}
                  >
                    {totalPendingEmis}
                  </h2>
                </div>

                <div
                  style={{
                    width: 1,
                    alignSelf: "stretch",
                    background: "#e2e8f0",
                  }}
                />

                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "#64748b",
                    }}
                  >
                    Paid
                  </p>

                  <h2
                    style={{
                      marginTop: 8,
                      marginBottom: 0,
                      color: "#16a34a",
                    }}
                  >
                    {totalLoanEmisPaid}
                  </h2>
                </div>
              </div>
            </div>
          )}

          {/* PENALTY */}

          {filteredLoanData.length > 0 && totalLoanPenalty > 0 && (
            <div
              style={{
                background: "#fef2f2",
                borderRadius: 22,
                padding: 20,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                Penalties
              </p>

              <h2
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "#dc2626",
                }}
              >
                {formatCurrency(totalLoanPenalty)}
              </h2>
            </div>
          )}

          {/* LATE */}

          {filteredLoanData.length > 0 && (
            <div
              style={{
                background: "#fff7ed",
                borderRadius: 22,
                padding: 20,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                Late Payments
              </p>

              <h2
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "#ea580c",
                }}
              >
                {totalLateEmis}
              </h2>
            </div>
          )}

          {/* ACTIVE */}

          <div
            style={{
              background: "#f8fafc",
              borderRadius: 22,
              padding: 20,
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Active Transactions
            </p>

            <h2
              style={{
                marginTop: 10,
                marginBottom: 0,
                color: "#0f172a",
              }}
            >
              {activeTransactions}
            </h2>
          </div>

          {/* TOTAL */}

          <div
            style={{
              background: "#f8fafc",
              borderRadius: 22,
              padding: 20,
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Total Transactions
            </p>

            <h2
              style={{
                marginTop: 10,
                marginBottom: 0,
                color: "#5E35B1",
              }}
            >
              {activeTransactions + paidTransactions + totalExtensions}
            </h2>
          </div>

          {/* OVERDUE */}

          <div
            style={{
              background: overdueCount > 0 ? "#fef2f2" : "#f0fdf4",

              borderRadius: 22,
              padding: 20,
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Overdue Payments
            </p>

            <h2
              style={{
                marginTop: 10,
                marginBottom: 0,

                color: overdueCount > 0 ? "#ef4444" : "#16a34a",
              }}
            >
              {overdueCount}
            </h2>
          </div>

          {/* EXTENSIONS */}

          <div
            style={{
              background: "#fffbeb",
              borderRadius: 22,
              padding: 20,
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Extensions
            </p>

            <h2
              style={{
                marginTop: 10,
                marginBottom: 0,
                color: "#f59e0b",
              }}
            >
              {totalExtensions}
            </h2>
          </div>
        </div>
      </div>

      {/* NORMAL */}
      {filteredNormalData.length > 0 && (
        <>
          {filteredNormalData.length > 0 && (
            <div
              style={{
                marginBottom: 30,
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: 28,
                  padding: 24,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 20,
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 30,
                        fontWeight: "800",
                        color: "#2563eb",
                      }}
                    >
                      💵 Normal Payments
                    </h2>

                    <p
                      style={{
                        marginTop: 8,
                        color: "#64748b",
                      }}
                    >
                      Installment based payments
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "1px solid #dbeafe",
                        background: "#f8fafc",
                        fontWeight: "600",
                        minWidth: 140,
                      }}
                    >
                      <option value="all">All</option>

                      <option value="pending">Pending</option>

                      <option value="paid">Paid</option>

                      <option value="partial">Partial</option>

                      <option value="due">Due</option>
                    </select>

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          background: "#eff6ff",
                          color: "#2563eb",
                          padding: "10px 16px",
                          borderRadius: 14,
                          fontWeight: "bold",
                        }}
                      >
                        Total: {filteredNormalData.length}
                      </div>

                      <div
                        style={{
                          background: "#f0fdf4",
                          color: "#16a34a",
                          padding: "10px 16px",
                          borderRadius: 14,
                          fontWeight: "bold",
                        }}
                      >
                        Paid:{" "}
                        {
                          filteredNormalData.filter(
                            (tx) => tx.status === "paid",
                          ).length
                        }
                      </div>

                      <div
                        style={{
                          background: "#fff7ed",
                          color: "#ea580c",
                          padding: "10px 16px",
                          borderRadius: 14,
                          fontWeight: "bold",
                        }}
                      >
                        Pending:{" "}
                        {
                          filteredNormalData.filter(
                            (tx) => tx.status !== "paid",
                          ).length
                        }
                      </div>

                      <div
                        style={{
                          background: "#fef2f2",
                          color: "#dc2626",
                          padding: "10px 16px",
                          borderRadius: 14,
                          fontWeight: "bold",
                        }}
                      >
                        Overdue:{" "}
                        {
                          filteredNormalData.filter((tx) => {
                            const due = new Date(tx.due_date);

                            const today = new Date();

                            due.setHours(0, 0, 0, 0);
                            today.setHours(0, 0, 0, 0);

                            return tx.status !== "paid" && due < today;
                          }).length
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <NormalProfile
                  data={finalFilteredNormalData}
                  refresh={fetchData}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* ROTATION */}
      {filteredRotationData.length > 0 && (
        <>
          {filteredRotationData.length > 0 && (
            <div
              style={{
                marginBottom: 30,
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: 28,
                  padding: 24,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 20,
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 30,
                        fontWeight: "800",
                        color: "#ea580c",
                      }}
                    >
                      🔄 Rotation Payments
                    </h2>

                    <p
                      style={{
                        marginTop: 8,
                        color: "#64748b",
                      }}
                    >
                      Interest and rotation based payments
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    <select
                      value={rotationFilter}
                      onChange={(e) => setRotationFilter(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "1px solid #fed7aa",
                        background: "#fff7ed",
                        fontWeight: "600",
                        minWidth: 160,
                      }}
                    >
                      <option value="all">All</option>

                      <option value="pending">Pending</option>

                      <option value="paid">Paid</option>

                      <option value="extended">Extended</option>

                      <option value="due">Due</option>
                    </select>

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          background: "#fff7ed",
                          color: "#ea580c",
                          padding: "10px 16px",
                          borderRadius: 14,
                          fontWeight: "bold",
                        }}
                      >
                        Total: {finalFilteredRotationData.length}
                      </div>

                      <div
                        style={{
                          background: "#f0fdf4",
                          color: "#16a34a",
                          padding: "10px 16px",
                          borderRadius: 14,
                          fontWeight: "bold",
                        }}
                      >
                        Paid:{" "}
                        {
                          finalFilteredRotationData.filter(
                            (tx) => tx.status === "paid",
                          ).length
                        }
                      </div>

                      <div
                        style={{
                          background: "#eff6ff",
                          color: "#2563eb",
                          padding: "10px 16px",
                          borderRadius: 14,
                          fontWeight: "bold",
                        }}
                      >
                        Extended:{" "}
                        {
                          finalFilteredRotationData.filter(
                            (tx) => tx.extensions?.length > 0,
                          ).length
                        }
                      </div>

                      <div
                        style={{
                          background: "#fef2f2",
                          color: "#dc2626",
                          padding: "10px 16px",
                          borderRadius: 14,
                          fontWeight: "bold",
                        }}
                      >
                        Due:{" "}
                        {
                          finalFilteredRotationData.filter((tx) => {
                            const dueDate = new Date(
                              tx.final_due_date || tx.due_date,
                            );

                            dueDate.setHours(0, 0, 0, 0);

                            const today = new Date();

                            today.setHours(0, 0, 0, 0);

                            const paidLate =
                              tx.status === "paid" &&
                              tx.paid_date &&
                              new Date(tx.paid_date) > dueDate;

                            const overdue =
                              tx.status !== "paid" && dueDate < today;

                            return overdue || paidLate;
                          }).length
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <RotationProfile
                  data={finalFilteredRotationData}
                  refresh={fetchData}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* LOANS */}
      {filteredLoanData.length > 0 && (
        <>
          {filteredLoanData.length > 0 && (
            <div
              style={{
                marginBottom: 30,
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: 28,
                  padding: 24,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 20,
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 30,
                        fontWeight: "800",
                        color: "#4338ca",
                      }}
                    >
                      💳 Loan Payments
                    </h2>

                    <p
                      style={{
                        marginTop: 8,
                        color: "#64748b",
                      }}
                    >
                      EMI and loan management
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    <select
                      value={loanFilter}
                      onChange={(e) => setLoanFilter(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "1px solid #c7d2fe",
                        background: "#eef2ff",
                        fontWeight: "600",
                        minWidth: 160,
                      }}
                    >
                      <option value="all">All</option>

                      <option value="pending">Pending</option>

                      <option value="paid">Paid</option>

                      <option value="due">Due</option>
                    </select>

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          background: "#eef2ff",
                          color: "#4338ca",
                          padding: "10px 16px",
                          borderRadius: 14,
                          fontWeight: "bold",
                        }}
                      >
                        Total: {finalFilteredLoanData.length}
                      </div>

                      <div
                        style={{
                          background: "#f0fdf4",
                          color: "#16a34a",
                          padding: "10px 16px",
                          borderRadius: 14,
                          fontWeight: "bold",
                        }}
                      >
                        Paid:{" "}
                        {
                          finalFilteredLoanData.filter(
                            (tx) => tx.status === "paid",
                          ).length
                        }
                      </div>

                      <div
                        style={{
                          background: "#fff7ed",
                          color: "#ea580c",
                          padding: "10px 16px",
                          borderRadius: 14,
                          fontWeight: "bold",
                        }}
                      >
                        Partial:{" "}
                        {
                          finalFilteredLoanData.filter(
                            (tx) =>
                              tx.paid_months > 0 &&
                              tx.paid_months < tx.duration_months,
                          ).length
                        }
                      </div>

                      <div
                        style={{
                          background: "#fef2f2",
                          color: "#dc2626",
                          padding: "10px 16px",
                          borderRadius: 14,
                          fontWeight: "bold",
                        }}
                      >
                        Due:{" "}
                        {
                          finalFilteredLoanData.filter((tx) => {
                            const dueDate = new Date(tx.next_due_date);

                            dueDate.setHours(0, 0, 0, 0);

                            const today = new Date();

                            today.setHours(0, 0, 0, 0);

                            const overdue =
                              tx.status !== "paid" && dueDate < today;

                            const paidLate =
                              tx.status === "paid" &&
                              tx.last_paid_date &&
                              new Date(tx.last_paid_date) > dueDate;

                            return overdue || paidLate;
                          }).length
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <LoanProfile data={finalFilteredLoanData} refresh={fetchData} />
              </div>
            </div>
          )}
        </>
      )}
      {/* ================= ACTIVITY TIMELINE ================= */}

      {activities.length > 0 && (
        <div style={{ marginTop: 50 }}>
          <h2
            style={{
              marginBottom: 25,
              color: "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            📜 Activity Timeline
          </h2>

          <div
            style={{
              position: "relative",
              paddingLeft: 30,
            }}
          >
            {/* LINE */}
            <div
              style={{
                position: "absolute",
                left: 10,
                top: 0,
                bottom: 0,
                width: 3,
                background: "#dbeafe",
                borderRadius: 10,
              }}
            />

            {activities.map((activity, index) => (
              <div
                key={index}
                style={{
                  position: "relative",
                  marginBottom: 22,
                }}
              >
                {/* DOT */}
                <div
                  style={{
                    position: "absolute",
                    left: -26,
                    top: 12,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: activity.color,
                    border: "3px solid white",
                    boxShadow: "0 0 0 3px rgba(0,0,0,0.06)",
                  }}
                />

                {/* CARD */}
                <div
                  style={{
                    background: "white",
                    borderRadius: 18,
                    padding: 18,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.06)",

                    borderLeft: `5px solid ${activity.color}`,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      marginBottom: 8,
                      color: activity.color,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span>
                      {activity.type === "loan_emi"
                        ? "💳"
                        : activity.type === "rotation_extend"
                          ? "🔁"
                          : activity.type === "normal_payment"
                            ? "💰"
                            : activity.type === "paid_late"
                              ? "⚠️"
                              : activity.type === "paid_ontime"
                                ? "✅"
                                : activity.type === "paid_early"
                                  ? "🚀"
                                  : "📌"}
                    </span>

                    {activity.title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      fontWeight: "bold",
                      fontSize: 17,
                    }}
                  >
                    {formatCurrency(activity.amount)}
                  </p>
                  {activity.penalty > 0 && (
                    <p
                      style={{
                        marginTop: 8,
                        marginBottom: 0,
                        color: "#dc2626",
                        fontWeight: "bold",
                      }}
                    >
                      Penalty: {formatCurrency(activity.penalty)}
                    </p>
                  )}

                  {activity.lateDays && (
                    <p
                      style={{
                        marginTop: 8,
                        marginBottom: 0,
                        color: "#ef4444",
                        fontWeight: "bold",
                      }}
                    >
                      Paid {activity.lateDays} day
                      {activity.lateDays > 1 ? "s" : ""}
                      late
                    </p>
                  )}
                  <p
                    style={{
                      marginTop: 10,
                      marginBottom: 0,
                      color: "#64748b",
                      fontSize: 14,
                    }}
                  >
                    {activity.date
                      ? new Date(activity.date).toDateString()
                      : "No Date"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
