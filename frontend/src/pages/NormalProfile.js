import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import { formatCurrency } from "../utils/format";

// function NormalProfile() {
function NormalProfile({ data, refresh }) {
  const navigate = useNavigate();

  // const [data, setData] = useState([]);

  const [payId, setPayId] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState("");

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [confirmAction, setConfirmAction] = useState(null);

  if (!data.length) return <h2>Loading...</h2>;

  const handleInstallment = async () => {
  await API.put(`/paid/${payId}`, {
    amount: Number(payAmount),
  });

  setPayId(null);
  setPayAmount("");
  setPayType("");

  refresh();
};

  const handleFullPayment = async () => {
    const tx = data.find((t) => t._id === payId);
    const remaining = tx.principal_amount - (tx.paid_amount || 0);

    await API.put(`/paid/${payId}`, {
      amount: remaining,
    });

    setPayId(null);
    refresh();
  };

  const handleDelete = async () => {
    await API.delete(`/delete/${confirmAction.id}`);
    setConfirmAction(null);
    refresh();
  };

  const handleEditSave = async () => {
    await API.put(`/update/${editId}`, {
      ...editForm,
    });
    setEditId(null);
    refresh();
  };

  const renderCard = (tx) => {
    const paid = tx.paid_amount || 0;
    const balance = tx.principal_amount - paid;
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const due = new Date(tx.due_date);

    due.setHours(0, 0, 0, 0);

    const isOverdue = due < today && tx.status !== "paid";

    const overdueDays = Math.max(
      1,
      Math.ceil((today - due) / (1000 * 60 * 60 * 24)),
    );

    return (
      <div
        key={tx._id}
        style={{
          padding: 18,

          borderRadius: 18,

          background: (() => {
            // FULLY PAID
            if (tx.status === "paid") {
              const paidDate = new Date(tx.paid_date);

              const dueDate = new Date(tx.due_date);

              paidDate.setHours(0, 0, 0, 0);

              dueDate.setHours(0, 0, 0, 0);

              const diff = Math.ceil(
                (paidDate - dueDate) / (1000 * 60 * 60 * 24),
              );

              // LATE
              if (diff > 0) {
                return "#fff1f2";
              }

              // EARLY
              if (diff < 0) {
                return "#f0fdf4";
              }

              // ON TIME
              return "#eff6ff";
            }

            // PARTIAL PAYMENT
            if (paid > 0) {
              const percent = (paid / tx.principal_amount) * 100;

              // RED
              if (percent < 40) {
                return "#fff1f2";
              }

              // BLUE
              if (percent < 80) {
                return "#eff6ff";
              }

              // GREEN
              return "#f0fdf4";
            }

            // OVERDUE
            if (isOverdue) {
              return "#fff1f2";
            }

            // DEFAULT
            return "#f8fafc";
          })(),

          border: isOverdue ? "2px solid #ef4444" : "1px solid #e2e8f0",

          boxShadow: "0 6px 18px rgba(0,0,0,0.06)",

          position: "relative",

          transition: "0.2s",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#2563eb",
              fontSize: 22,
            }}
          >
            {tx.person_name}
          </h3>

          <span
            style={{
              padding: "6px 14px",
              borderRadius: "16px",
              fontSize: "13px",
              fontWeight: "bold",
              color: "white",
              background: tx.type === "incoming" ? "#4CAF50" : "#F44336",
            }}
          >
            {tx.type === "incoming" ? "IN" : "OUT"}
          </span>
        </div>

        {/* PRINCIPAL */}
        <p
          style={{
            margin: "12px 0",
            fontWeight: "bold",
            fontSize: 22,
            color: "#0f172a",
          }}
        >
          Principal: {formatCurrency(tx.principal_amount)}
        </p>

        {/* DATES */}
        <div
          style={{
            marginTop: 12,
            marginBottom: 14,
          }}
        >
          <p
            style={{
              color: "#16a34a",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Start: {new Date(tx.start_date).toDateString()}
          </p>

          <p
            style={{
              color: "#dc2626",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Due: {new Date(tx.due_date).toDateString()}
          </p>
        </div>
        {isOverdue && (
          <p
            style={{
              color: "red",
              fontWeight: "bold",
            }}
          >
            ⚠ {overdueDays} day{overdueDays > 1 ? "s" : ""} overdue
          </p>
        )}
        {/* INSTALLMENTS */}

        {/* PAID DATE */}
        {tx.installments &&
          tx.installments.length > 0 &&
          tx.paid_amount < tx.principal_amount && (
            <div
              style={{
                marginTop: 14,
              }}
            >
              {tx.installments
                .filter((inst) => inst.amount > 0)
                .map((inst, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: 10,

                      padding: "10px 14px",

                      borderRadius: 12,

                      background: "#ffffffaa",

                      border: "1px solid #e2e8f0",

                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: "bold",
                            color: "#0f172a",
                          }}
                        >
                          ₹{inst.amount.toLocaleString()}
                        </p>

                        <p
                          style={{
                            marginTop: 5,
                            marginBottom: 0,
                            fontSize: 13,
                            color: "#64748b",
                          }}
                        >
                          {new Date(inst.date).toDateString()}
                        </p>
                      </div>

                      <div
                        style={{
                          background: "#dbeafe",
                          color: "#2563eb",
                          padding: "6px 10px",
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        {i === tx.installments.length - 1 &&
                        tx.status === "paid"
                          ? "FINAL"
                          : "PARTIAL"}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

        {/* BALANCE */}

        {tx.installments && tx.installments.length > 0 && (
          <div
            style={{
              marginTop: 14,
            }}
          >
            {/* SIMPLE BALANCE */}

            {tx.status !== "paid" && paid === 0 ? (
              <p
                style={{
                  marginTop: 6,
                  fontWeight: "bold",
                  fontSize: 18,
                }}
              >
                Balance: {formatCurrency(balance)}
              </p>
            ) : (
              <>
                {/* PAYMENT STATUS */}

                {!(tx.status === "paid" && paid >= tx.principal_amount) && (
                  <div
                    style={{
                      padding: 14,

                      borderRadius: 14,

                      background: (() => {
                        const percent = (paid / tx.principal_amount) * 100;

                        if (percent < 40) {
                          return "#fff1f2";
                        }

                        if (percent < 80) {
                          return "#eff6ff";
                        }

                        return "#f0fdf4";
                      })(),

                      border: (() => {
                        const percent = (paid / tx.principal_amount) * 100;

                        if (percent < 40) {
                          return "1px solid #ef4444";
                        }

                        if (percent < 80) {
                          return "1px solid #3b82f6";
                        }

                        return "1px solid #22c55e";
                      })(),
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: "bold",
                        color: (() => {
                          const percent = (paid / tx.principal_amount) * 100;

                          if (percent < 40) {
                            return "#dc2626";
                          }

                          if (percent < 80) {
                            return "#2563eb";
                          }

                          return "#15803d";
                        })(),
                      }}
                    >
                      🟢 Paid: {formatCurrency(paid)}
                    </p>

                    <p
                      style={{
                        marginTop: 8,
                        marginBottom: 0,
                        fontWeight: "bold",
                        color: (() => {
                          const percent = (paid / tx.principal_amount) * 100;

                          if (percent < 40) {
                            return "#b91c1c";
                          }

                          if (percent < 80) {
                            return "#1d4ed8";
                          }

                          return "#166534";
                        })(),
                      }}
                    >
                      🔵 Remaining: {formatCurrency(balance)}
                    </p>

                    {tx.last_payment_date && (
                      <p
                        style={{
                          marginTop: 10,
                          marginBottom: 0,
                          color: "#475569",
                          fontSize: 14,
                        }}
                      >
                        Last Paid:{" "}
                        {new Date(tx.last_payment_date).toDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* PROGRESS */}

                <div
                  style={{
                    marginTop: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                      fontSize: 14,
                      fontWeight: "bold",
                    }}
                  >
                    <span>Progress</span>

                    <span>
                      {Math.round((paid / tx.principal_amount) * 100)}%
                    </span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: 10,
                      borderRadius: 20,
                      background: "#dbeafe",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(paid / tx.principal_amount) * 100}%`,
                        height: "100%",
                        background: (() => {
                          const percent = (paid / tx.principal_amount) * 100;

                          // RED
                          if (percent < 40) {
                            return "linear-gradient(90deg,#ef4444,#f87171)";
                          }

                          // BLUE
                          if (percent < 80) {
                            return "linear-gradient(90deg,#2563eb,#60a5fa)";
                          }

                          // GREEN
                          return "linear-gradient(90deg,#16a34a,#4ade80)";
                        })(),
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* BUTTONS */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {tx.status === "paid" &&
            (() => {
              const paidDate = new Date(tx.paid_date);

              const dueDate = new Date(tx.due_date);

              paidDate.setHours(0, 0, 0, 0);

              dueDate.setHours(0, 0, 0, 0);

              const diff = Math.ceil(
                (paidDate - dueDate) / (1000 * 60 * 60 * 24),
              );

              const isLate = diff > 0;

              const isEarly = diff < 0;

              return (
                <div
                  style={{
                    marginTop: 14,
                    marginBottom: 14,
                    padding: 16,
                    borderRadius: 16,

                    background: isLate ? "#fff1f2" : "#f0fdf4",

                    border: isLate ? "1px solid #ef4444" : "1px solid #22c55e",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: "bold",
                      fontSize: 18,

                      color: isLate ? "#dc2626" : "#15803d",
                    }}
                  >
                    {isLate
                      ? "🔴 Paid Late"
                      : isEarly
                        ? "🟢 Paid Early"
                        : "🔵 Paid On Time"}
                  </p>

                  <p
                    style={{
                      marginTop: 8,
                      marginBottom: 0,

                      color: isLate ? "#991b1b" : "#166534",

                      fontWeight: 500,
                    }}
                  >
                    Paid: {formatCurrency(tx.principal_amount)}
                    {" • "}
                    {isLate
                      ? `${diff} day late`
                      : isEarly
                        ? `${Math.abs(diff)} day early`
                        : "On time"}
                  </p>

                  <p
                    style={{
                      marginTop: 8,
                      marginBottom: 0,
                      fontSize: 14,

                      color: isLate ? "#991b1b" : "#166534",
                    }}
                  >
                    {paidDate.toDateString()}
                  </p>
                </div>
              );
            })()}
          {/* PAID BADGE */}
          {tx.status === "paid" && (
            <div
              style={{
                background: "#4CAF50",
                color: "white",
                padding: "5px 12px",
                borderRadius: 8,
                display: "inline-block",
                fontWeight: "bold",
                margin: "6px 0",
              }}
            >
              PAID
            </div>
          )}
          {tx.status === "paid" ? (
            <button
              onClick={() =>
                setConfirmAction({
                  id: tx._id,
                })
              }
              style={{
                background: "#ef4444",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Delete
            </button>
          ) : (
            <>
              <button
                onClick={() => setPayId(tx._id)}
                style={{
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Pay
              </button>

              <button
                onClick={() => {
                  setEditId(tx._id);

                  setEditForm(tx);
                }}
                style={{
                  background: "#0f172a",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Edit
              </button>

              <button
                onClick={() =>
                  setConfirmAction({
                    id: tx._id,
                  })
                }
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 15 }}></div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))",
          gap: 12,
          marginTop: 20,
        }}
      >
        {data.map(renderCard)}
      </div>

      {/* PAYMENT POPUP */}
      {payId && (
        <div
          onClick={() => {
            setPayId(null);
            setPayType("");
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 3000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: 20,
              borderRadius: 12,
              width: 300,
              boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
            }}
          >
            {/* <h3 style={{ textAlign: 'center' }}>Payment</h3> */}

            {!payType && (
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 25,
                }}
              >
                <div
                  style={{
                    fontSize: 42,
                    marginBottom: 10,
                  }}
                >
                  💰
                </div>

                <h2
                  style={{
                    margin: 0,
                    color: "#0f172a",
                  }}
                >
                  Payment Options
                </h2>

                <p
                  style={{
                    color: "#64748b",
                    marginTop: 8,
                    marginBottom: 20,
                  }}
                >
                  Select how you want to pay
                </p>

                <button
                  onClick={() => setPayType("installment")}
                  style={{
                    width: "100%",
                    padding: "9px",
                    border: "none",
                    borderRadius: 18,
                    background: "linear-gradient(135deg,#f59e0b,#fb923c)",
                    color: "white",
                    cursor: "pointer",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: 18,
                    }}
                  >
                    Installment Payment
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      opacity: 0.9,
                      marginTop: 4,
                    }}
                  >
                    Pay a custom amount
                  </div>
                </button>

                <button
                  onClick={() => setPayType("full")}
                  style={{
                    width: "100%",
                    padding: "9px",
                    border: "none",
                    borderRadius: 18,
                    background: "linear-gradient(135deg,#ef4444,#dc2626)",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: 18,
                    }}
                  >
                    ✅ Full Payment
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      opacity: 0.9,
                      marginTop: 4,
                    }}
                  >
                    Close the transaction completely
                  </div>
                </button>
              </div>
            )}

            {payType === "installment" && (
              <>
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 40 }}>💵</div>

                  <h2 style={{ margin: "10px 0 0" }}>Installment Payment</h2>

                  <p style={{ color: "#64748b" }}>Enter the amount to pay</p>
                </div>

                <input
                  type="number"
                  placeholder="Enter installment amount"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  style={{
                    width: "95%",
                    padding: "10px",
                    borderRadius: 12,
                    border: "1px solid #cbd5e1",
                    marginBottom: 15,
                    fontSize: 16,
                  }}
                />

                <button
                  onClick={handleInstallment}
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "none",
                    borderRadius: 12,
                    background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Confirm Installment
                </button>
              </>
            )}

            {payType === "full" && (
              <>
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 40 }}>✅</div>

                  <h2 style={{ margin: "10px 0 0" }}>Full Payment</h2>

                  <p style={{ color: "#64748b" }}>
                    Close this transaction completely
                  </p>
                </div>

                <button
                  onClick={handleFullPayment}
                  style={{
                    width: "100%",
                    padding: "16px",
                    border: "none",
                    borderRadius: 14,
                    background: "linear-gradient(135deg,#16a34a,#22c55e)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  Confirm Full Payment
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* EDIT POPUP */}
      {editId && (
        <div
          onClick={() => setEditId(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 3000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: 20,
              borderRadius: 12,
              width: 300,
            }}
          >
            <h3 style={{ textAlign: "center" }}>Edit Transaction</h3>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <p style={{ width: 60 }}>Total:</p>
              <input
                type="number"
                value={editForm.principal_amount || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, principal_amount: e.target.value })
                }
                style={{ flex: 1 }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <p style={{ width: 60 }}>Start:</p>
              <input
                type="date"
                value={editForm.start_date?.substring(0, 10) || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, start_date: e.target.value })
                }
                style={{ flex: 1 }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <p style={{ width: 60 }}>Due:</p>
              <input
                type="date"
                value={editForm.due_date?.substring(0, 10) || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, due_date: e.target.value })
                }
                style={{ flex: 1 }}
              />
            </div>

            {/* BUTTONS */}
            <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
              <button
                style={{ flex: 1, background: "#4CAF50", color: "white" }}
                onClick={handleEditSave}
              >
                Save
              </button>

              <button
                style={{ flex: 1, background: "#f44336", color: "white" }}
                onClick={() => setEditId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM POPUP */}
      {confirmAction && (
        <div
          onClick={() => setConfirmAction(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 3000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: 20,
              borderRadius: 12,
              width: 260,
              textAlign: "center",
            }}
          >
            <h3>Delete?</h3>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button
                style={{
                  flex: 1,
                  background: "#f44336",
                  color: "white",
                  border: "none",
                  padding: "8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
                onClick={handleDelete}
              >
                Confirm
              </button>

              <button
                style={{
                  flex: 1,
                  background: "#9e9e9e",
                  color: "white",
                  border: "none",
                  padding: "8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NormalProfile;
