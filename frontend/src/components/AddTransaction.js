import React, { useState, useEffect } from "react";
import API from "../services/api";
const inputStyle = {
  width: "100%",
  padding: "8px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  outline: "none",
};

const addBtn = {
  background: "#4CAF50",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "8px",
  cursor: "pointer",
};

const closeBtn = {
  background: "#f44336",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "8px",
  cursor: "pointer",
};
function AddTransaction({ refresh }) {
  const [successModal, setSuccessModal] = useState(false);
  const [names, setNames] = useState([]);
  const [form, setForm] = useState({
    rotation_entry_mode: "new",
    person_name: "",
    type: "incoming",

    transaction_type: "rotation",

    entry_mode: "new",

    principal_amount: "",
    base_interest: "",

    start_date: "",
    due_date: "",

    paid_date: "",

    notes: "",

    loan_duration: "",
    emi_amount: "",
    interest_type: "flat",

    loan_mode: "new",
    already_paid_months: 0,
    last_paid_date: "",
  });
  const isRotation = form.transaction_type === "rotation";
  const isNormal = form.transaction_type === "normal";
  const isLoan = form.transaction_type === "loan";
  const [completedInstallments, setCompletedInstallments] = useState([
    {
      amount: "",
      date: "",
    },
  ]);

  const [rotationExtension, setRotationExtension] = useState(false);

  const [extensionData, setExtensionData] = useState({
    new_due_date: "",
    extra_interest: "",
    interest_paid: false,
  });
  useEffect(() => {
    API.get("/")
      .then((res) => {
        const unique = [...new Set(res.data.map((tx) => tx.person_name))];
        setNames(unique);
      })
      .catch((err) => console.log(err));
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "person_name") {
      value = value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("SENDING DATA:", form); // ✅ ADD THIS

    try {
      await API.post("/add", {
        extensions: rotationExtension
          ? [
              {
                old_due_date: form.due_date,

                new_due_date: extensionData.new_due_date,

                extra_interest: Number(extensionData.extra_interest),

                interest_paid: extensionData.interest_paid,
              },
            ]
          : [],
        person_name: form.person_name.trim(),
        type: form.type,
        transaction_type: form.transaction_type,
        principal_amount: Number(form.principal_amount),
        base_interest: Number(form.base_interest),
        start_date: form.start_date,
        due_date: form.due_date,
        notes: form.notes,
        loan_duration: Number(form.loan_duration),
        emi_amount: Number(form.emi_amount),
        interest_type: form.interest_type,

        entry_mode: form.entry_mode,
        rotation_entry_mode: form.rotation_entry_mode,

        paid_date:
          form.transaction_type === "rotation"
            ? completedInstallments[0]?.date
            : completedInstallments.length > 0
              ? completedInstallments[completedInstallments.length - 1].date
              : "",

        loan_mode: form.loan_mode,

        already_paid_months: Number(form.already_paid_months),

        last_paid_date: form.last_paid_date,

        installments: completedInstallments.map((inst) => ({
          amount: Number(inst.amount),

          date: inst.date,
        })),

        paid_amount: completedInstallments.reduce(
          (sum, inst) => sum + Number(inst.amount),

          0,
        ),
      });

      setSuccessModal(true);

      setForm({
        person_name: "",
        type: "incoming",

        transaction_type: "rotation",

        entry_mode: "new",
        rotation_entry_mode: "new",

        principal_amount: "",
        base_interest: "",

        start_date: "",
        due_date: "",

        paid_date: "",

        notes: "",

        loan_duration: "",

        emi_amount: "",

        interest_type: "flat",

        loan_mode: "new",

        already_paid_months: 0,

        last_paid_date: "",
      });

      setSuccessModal(true);

      setExtensionData({
        new_due_date: "",
        extra_interest: "",
        interest_paid: false,
      });

      setCompletedInstallments([
        {
          amount: "",
          date: "",
        },
      ]);
    } catch (err) {
      console.log(err);
      alert("Error ❌");
    }
  };

  useEffect(() => {
    if (
      isLoan &&
      form.principal_amount &&
      form.base_interest &&
      form.loan_duration
    ) {
      const total = Number(form.principal_amount) + Number(form.base_interest);

      const emi = Math.ceil(total / Number(form.loan_duration));

      let nextDueDate = form.due_date;

      let calculatedStartDate = form.start_date;

      // EXISTING LOAN
      if (form.loan_mode === "existing" && form.last_paid_date) {
        // NEXT EMI DATE
        const nextDate = new Date(form.last_paid_date);

        nextDate.setMonth(nextDate.getMonth() + 1);

        nextDueDate = nextDate.toISOString().split("T")[0];

        // AUTO START DATE
        const startDate = new Date(form.last_paid_date);

        startDate.setMonth(
          startDate.getMonth() - (Number(form.already_paid_months) - 1),
        );

        calculatedStartDate = startDate.toISOString().split("T")[0];
      }

      setForm((prev) => ({
        ...prev,

        emi_amount: emi,

        start_date: calculatedStartDate,

        due_date: nextDueDate,
      }));
    }
  }, [
    form.principal_amount,
    form.base_interest,
    form.loan_duration,
    form.last_paid_date,
    form.already_paid_months,
    form.loan_mode,
    isLoan,
  ]);

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <h2 style={{ textAlign: "center" }}>Add Transaction</h2>

      <div>
        <label>Transaction Type</label>
        <br />
        <select
          name="transaction_type"
          value={form.transaction_type}
          onChange={(e) => {
            const value = e.target.value;

            setForm({
              ...form,
              transaction_type: value,
              type: value === "loan" ? "outgoing" : form.type,
            });
          }}
          style={inputStyle}
        >
          <option value="rotation">Rotation</option>
          <option value="normal">Normal</option>
          <option value="loan">Loan</option>
        </select>
      </div>
      {/* ENTRY MODE ONLY FOR NORMAL */}

      {form.transaction_type === "normal" && (
        <div>
          <label>Entry Mode</label>
          <br />

          <select
            name="entry_mode"
            value={form.entry_mode}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="new">New Payment</option>

            <option value="completed">Completed Payment</option>
          </select>
        </div>
      )}

      {/* ROTATION ENTRY MODE */}

      {form.transaction_type === "rotation" && (
        <div>
          <label>Rotation Mode</label>
          <br />

          <select
            name="rotation_entry_mode"
            value={form.rotation_entry_mode || "new"}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="new">New Rotation</option>

            <option value="completed">Completed Rotation</option>
          </select>
        </div>
      )}

      {/* NAME */}
      <div>
        <label>Name</label>
        <br />
        <input
          list="names"
          name="person_name"
          placeholder="Enter name"
          value={form.person_name}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <datalist id="names">
          {names.map((n, i) => (
            <option key={i} value={n} />
          ))}
        </datalist>
      </div>

      {/* TYPE */}

      {form.transaction_type !== "loan" && (
        <>
          <label>Type</label>

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="incoming">Incoming</option>
            <option value="outgoing">Outgoing</option>
          </select>
        </>
      )}

      {/* AMOUNT */}
      <div>
        <label>
          {isNormal
            ? "Principal Amount"
            : isLoan
              ? "Loan Details"
              : "Amount Details"}
        </label>
        <br />

        {isRotation && (
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="number"
              name="principal_amount"
              placeholder="Principal"
              value={form.principal_amount}
              onChange={handleChange}
              min="0"
              max="10000000"
              required
              style={{ ...inputStyle, flex: 1 }}
            />

            <input
              type="number"
              name="base_interest"
              placeholder="Interest"
              value={form.base_interest}
              onChange={handleChange}
              min="0"
              max="10000000"
              required
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        )}

        {form.transaction_type === "loan" && (
          <div
            style={{
              marginTop: 15,
              padding: 22,
              background: "linear-gradient(135deg, #f3ecff, #e7ddff)",
              borderRadius: 18,
              border: "1px solid #d5c2ff",
              boxShadow: "0 4px 14px rgba(94,53,177,0.12)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#5E35B1",
                fontSize: 24,
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              💳 Loan Details
            </h3>
            <select
              name="loan_mode"
              value={form.loan_mode}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid #cdb7ff",
                background: "#ffffff",
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
              }}
            >
              <option value="new">New Loan</option>

              <option value="existing">Existing Loan</option>
            </select>
            {/* LOAN AMOUNT */}
            <input
              type="number"
              name="principal_amount"
              placeholder="Loan Amount"
              value={form.principal_amount}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid #cdb7ff",
                background: "#ffffff",
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {/* TOTAL INTEREST */}
            <input
              type="number"
              name="base_interest"
              placeholder="Total Interest"
              value={form.base_interest}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid #cdb7ff",
                background: "#ffffff",
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {/* DURATION */}
            <input
              type="number"
              name="loan_duration"
              placeholder="Loan Duration (Months)"
              value={form.loan_duration}
              onChange={(e) =>
                setForm({
                  ...form,
                  loan_duration: e.target.value,
                })
              }
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid #cdb7ff",
                background: "#ffffff",
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {/* EMI */}
            <input
              type="number"
              placeholder="Monthly EMI Amount"
              value={form.emi_amount}
              readOnly
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid #cdb7ff",
                background: "#ffffff",
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {form.loan_mode === "existing" && (
              <>
                <label
                  style={{
                    color: "#5E35B1",
                    fontWeight: "600",
                  }}
                >
                  Already Paid EMIs
                </label>
                <input
                  type="number"
                  name="already_paid_months"
                  min="0"
                  max={form.loan_duration || 0}
                  placeholder="Already Paid Months"
                  value={form.already_paid_months}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid #cdb7ff",
                    background: "#ffffff",
                    fontSize: 15,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <label
                  style={{
                    color: "#5E35B1",
                    fontWeight: "600",
                  }}
                >
                  Last EMI Paid Date
                </label>
                <input
                  type="date"
                  name="last_paid_date"
                  value={form.last_paid_date}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid #cdb7ff",
                    background: "#ffffff",
                    fontSize: 15,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </>
            )}
          </div>
        )}

        {isNormal && (
          <input
            type="number"
            name="principal_amount"
            placeholder="Enter amount"
            value={form.principal_amount}
            onChange={handleChange}
            min="0"
            max="10000000"
            required
            style={inputStyle}
          />
        )}
      </div>

      {/* START DATE */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <label style={{ width: "100px" }}>Start Date</label>
        <input
          type="date"
          name="start_date"
          value={form.start_date}
          onChange={handleChange}
          required
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>

      {/* DUE DATE */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <label style={{ width: "100px" }}>
          {isLoan ? "EMI Due Date" : "Due Date"}
        </label>
        <input
          type="date"
          name="due_date"
          value={form.due_date}
          onChange={handleChange}
          required
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
      {form.rotation_entry_mode === "completed" && (
        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 16,
            background: "#fff7ed",
            border: "1px solid #fdba74",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <h4
              style={{
                margin: 0,
                color: "#c2410c",
              }}
            >
              Extension Details
            </h4>

            <label
              style={{
                fontWeight: "bold",
                fontSize: 14,
              }}
            >
              <input
                type="checkbox"
                checked={rotationExtension}
                onChange={(e) => setRotationExtension(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Extended
            </label>
          </div>

          {rotationExtension && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* NEW DUE */}

              <input
                type="date"
                value={extensionData.new_due_date}
                onChange={(e) =>
                  setExtensionData({
                    ...extensionData,
                    new_due_date: e.target.value,
                  })
                }
                style={inputStyle}
              />

              {/* EXTRA INTEREST */}

              <input
                type="number"
                placeholder="Extra Interest"
                value={extensionData.extra_interest}
                onChange={(e) =>
                  setExtensionData({
                    ...extensionData,
                    extra_interest: e.target.value,
                  })
                }
                style={inputStyle}
              />

              {/* INTEREST PAID */}

              <label
                style={{
                  fontWeight: "bold",
                  color: "#9a3412",
                }}
              >
                <input
                  type="checkbox"
                  checked={extensionData.interest_paid}
                  onChange={(e) =>
                    setExtensionData({
                      ...extensionData,

                      interest_paid: e.target.checked,
                    })
                  }
                  style={{ marginRight: 8 }}
                />
                Last Interest Paid
              </label>
            </div>
          )}
        </div>
      )}

      {(form.entry_mode === "completed" ||
        form.rotation_entry_mode === "completed") && (
        <div
          style={{
            marginTop: 10,
            padding: 18,
            borderRadius: 16,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <label
            style={{
              fontWeight: "bold",
              display: "block",
              marginBottom: 14,
              color: "#0f172a",
            }}
          >
            {form.transaction_type === "rotation"
              ? "Rotation Repayment History"
              : "Installment Payments"}
          </label>

          {form.transaction_type === "rotation" && (
            <div
              style={{
                marginBottom: 16,

                padding: 14,

                borderRadius: 14,

                background: "#eff6ff",

                border: "1px solid #bfdbfe",
              }}
            >
              <p
                style={{
                  margin: "4px 0",
                  fontWeight: "bold",
                }}
              >
                Principal: ₹
                {Number(form.principal_amount || 0).toLocaleString()}
              </p>

              <p
                style={{
                  margin: "4px 0",
                  fontWeight: "bold",
                }}
              >
                Interest: ₹{Number(form.base_interest || 0).toLocaleString()}
              </p>

              <p
                style={{
                  margin: "8px 0 0",
                  fontWeight: "bold",
                  color: "#2563eb",
                  fontSize: 17,
                }}
              >
                Total Payable: ₹
                {(
                  Number(form.principal_amount || 0) +
                  (rotationExtension
                    ? extensionData.interest_paid
                      ? // ✅ old interest replaced
                        Number(extensionData.extra_interest || 0)
                      : // ✅ old + new interest
                        Number(form.base_interest || 0) +
                        Number(extensionData.extra_interest || 0)
                    : // ✅ no extension
                      Number(form.base_interest || 0))
                ).toLocaleString()}
              </p>
            </div>
          )}

          {(form.transaction_type === "rotation"
            ? [completedInstallments[0]]
            : completedInstallments
          ).map((inst, index) => (
            <div
              key={index}
              style={{
                display: "grid",

                gridTemplateColumns:
                  form.transaction_type === "rotation"
                    ? "1fr 1fr"
                    : "1fr 1fr auto",

                gap: 10,
                marginBottom: 12,
              }}
            >
              {/* AMOUNT */}

              <input
                type="number"
                placeholder={
                  form.transaction_type === "rotation"
                    ? "Final Paid Amount"
                    : "Amount"
                }
                value={inst.amount}
                onChange={(e) => {
                  const updated = [...completedInstallments];

                  updated[index].amount = e.target.value;

                  setCompletedInstallments(updated);
                }}
                style={inputStyle}
              />

              {/* DATE */}

              <input
                type="date"
                value={inst.date}
                onChange={(e) => {
                  const updated = [...completedInstallments];

                  updated[index].date = e.target.value;

                  setCompletedInstallments(updated);
                }}
                style={inputStyle}
              />

              {/* DELETE ONLY FOR NORMAL */}

              {form.transaction_type !== "rotation" && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = completedInstallments.filter(
                      (_, i) => i !== index,
                    );

                    setCompletedInstallments(updated);
                  }}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    padding: "0 14px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* NOTES */}
      <div>
        <label>Notes</label>
        <br />
        <input
          name="notes"
          placeholder="Optional notes"
          value={form.notes}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>

      {/* BUTTONS */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        <button type="submit" style={addBtn}>
          Add
        </button>

        <button type="button" onClick={() => refresh()} style={closeBtn}>
          Close
        </button>
      </div>
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
              background: "white",
              padding: 30,
              borderRadius: 20,
              width: 400,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 60,
              }}
            >
              ✅
            </div>

            <h2>Transaction Added</h2>

            <p>Transaction saved successfully.</p>

            <button
              onClick={() => {
                setSuccessModal(false);

                refresh();
              }}
              style={{
                marginTop: 15,
                background: "#22c55e",
                color: "white",
                border: "none",
                padding: "12px 25px",
                borderRadius: 12,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

export default AddTransaction;
