import React from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BACKEND_URL }
  from "../config";

import {
  exportTransactionsCSV,
  exportTransactionsPDF,
  exportLoanCSV,
  exportLoanPDF,
} from "../utils/exportTransactions";

function Sidebar({ open, setOpen, onOpenExport }) {

  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const exportCSV = async () => {
    try {
      const res = await API.get("/");

      const data = res.data;

      const rows = [
        [
          "Name",

          "Type",

          "Transaction",

          "Original Amount",

          "Extra Interest",

          "Updated Amount",

          "Paid Amount",

          "Remaining",

          "Extended",

          "Last Interest Paid",

          "Due Date",

          "Status",
        ],
      ];

      data.forEach((tx) => {
        let updatedAmount = tx.principal_amount || 0;

        let extraInterest = 0;

        let extensionText = "No";

        let lastInterestPaid = "No";

        if (tx.extensions && tx.extensions.length > 0) {
          extensionText = "Yes";

          tx.extensions.forEach((ext) => {
            extraInterest += ext.extra_interest || 0;

            if (ext.paid) {
              lastInterestPaid = "Yes";
            }
          });

          updatedAmount += extraInterest;
        }

        let remaining = 0;

        if (tx.transaction_type === "loan") {
          remaining = (tx.remaining_emi || 0) * (tx.emi_amount || 0);
        } else {
          remaining = updatedAmount - (tx.paid_amount || 0);
        }

        rows.push([
          tx.person_name,

          tx.type,

          tx.transaction_type,

          tx.principal_amount,

          extraInterest,

          updatedAmount,

          tx.paid_amount || 0,

          remaining,

          extensionText,

          lastInterestPaid,

          new Date(tx.due_date).toLocaleDateString(),

          tx.extensions?.length > 0 ? "EXTENDED" : tx.status.toUpperCase(),
        ]);
      });

      const csvContent = rows.map((row) => row.join(",")).join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = "VRinLoop-Advanced-Report.csv";

      link.click();
    } catch (err) {
      console.log(err);
    }
  };

  const exportPDF = async () => {
    try {
      const res = await API.get("/");

      const data = res.data;

      const doc = new jsPDF();

      doc.setFontSize(22);

      doc.text("VRinLoop Financial Transactions", 14, 20);

      let y = 35;

      data.forEach((tx, index) => {
        let updatedAmount = tx.principal_amount || 0;

        let extraInterest = 0;

        let extensionText = "No";

        let lastInterestPaid = "No";

        if (tx.extensions && tx.extensions.length > 0) {
          extensionText = "Yes";

          tx.extensions.forEach((ext) => {
            extraInterest += ext.extra_interest || 0;

            if (ext.paid) {
              lastInterestPaid = "Yes";
            }
          });

          updatedAmount += extraInterest;
        }

        let remaining = 0;

        if (tx.transaction_type === "loan") {
          remaining = (tx.remaining_emi || 0) * (tx.emi_amount || 0);
        } else {
          remaining = updatedAmount - (tx.paid_amount || 0);
        }

        autoTable(doc, {
          startY: y,

          theme: "grid",

          head: [[`Transaction ${index + 1}`]],

          body: [
            ["Name", tx.person_name],

            ["Type", tx.type],

            ["Transaction", tx.transaction_type],

            ["Original Amount", `₹${tx.principal_amount}`],

            ["Extra Interest", `₹${extraInterest}`],

            ["Updated Amount", `₹${updatedAmount}`],

            ["Paid Amount", `₹${tx.paid_amount || 0}`],

            ["Remaining", `₹${remaining}`],

            ["Extended", extensionText],

            ["Last Interest Paid", lastInterestPaid],

            ["Due Date", new Date(tx.due_date).toLocaleDateString()],

            [
              "Status",
              tx.extensions?.length > 0 ? "EXTENDED" : tx.status.toUpperCase(),
            ],
          ],

          styles: {
            fontSize: 10,

            cellPadding: 4,
          },

          headStyles: {
            fillColor: [79, 70, 229],
          },
        });

        y = doc.lastAutoTable.finalY + 12;

        if (y > 250) {
          doc.addPage();

          y = 20;
        }
      });

      doc.save("VRinLoop-Advanced-Report.pdf");
    } catch (err) {
      console.log(err);
    }
  };

  const menuItems = [
    {
      icon: "👥",
      label: "User Profiles",
      path: "/users",
    },
    {
      icon: "💳",
      label: "Loan Profiles",
      path: "/loan-users",
    },
    {
      icon: "📁",
      label: "Export Statements",
      action: "export",
    },
    {
      icon: "👤",
      label: "My Profile",
      path: "/my-profile",
    },
    {
      icon: "💡",
      label: "Feedback",
      path: "/feedback",
    },
    {
      icon: "ℹ️",
      label: "About VRinLoop",
      path: "/about",
    },
    {
      icon: "🔚",
      label: "Logout",
      action: "logout",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  return (
    <>
      {/* DARK OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 999,
          }}
        />
      )}

      {/* SIDEBAR */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: open ? 240 : 70,
          height: "100vh",
          background: "#f3f1f700",
          color: "white",
          transition: "0.3s",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          paddingTop: 15,
          overflow: "hidden",
          boxShadow: "2px 0 15px rgba(22, 21, 21, 0.16)",
        }}
      >
        {/* TOP MENU BUTTON */}
        <div
          style={{
            display: "flex",
            justifyContent: open ? "space-between" : "center",
            alignItems: "center",
            padding: "0 15px",
            marginBottom: 25,
          }}
        >
          {open && (
            <h2
              style={{
                margin: 0,
                fontSize: 20,
              }}
            >
              VRinLoop
            </h2>
          )}

          <button
            onClick={() => setOpen(!open)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "none",
              background: "#f311a8",
              color: "white",
              cursor: "pointer",
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            ☰
          </button>
        </div>

        {/* USER PROFILE */}

        <div
          onClick={() => navigate("/my-profile")}
          style={{
            display: "flex",

            alignItems: "center",

            gap: 12,

            padding: open ? "0 14px" : "0",

            marginBottom: 24,

            justifyContent: open ? "flex-start" : "center",

            cursor: "pointer",

            transition: "0.3s",
          }}
        >
          <img
  src={
    user?.profile_image
      ? `${BACKEND_URL}/uploads/${user.profile_image}`
      : "https://ui-avatars.com/api/?name=User"
  }
  alt="profile"
  style={{
    width: 52,
    height: 52,
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #09d858",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
  }}
/>

          {open && (
            <div>
              <div
                style={{
                  fontWeight: "bold",

                  fontSize: 15,

                  color: "white",
                }}
              >
                {user?.name || "User"}
              </div>

              <div
                style={{
                  fontSize: 12,

                  color: "#e2e8f0",

                  marginTop: 2,

                  maxWidth: 130,

                  overflow: "hidden",

                  textOverflow: "ellipsis",
                }}
              >
                {user?.email}
              </div>
            </div>
          )}
        </div>

        {/* MENU ITEMS */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "0 10px",
          }}
        >
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={async () => {
                if (item.action === "export") {
                  onOpenExport();

                  return;
                }

                if (item.action === "logout") {
                  handleLogout();

                  return;
                }

                if (item.path) {
                  navigate(item.path);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 15,
                padding: "14px 12px",
                borderRadius: 12,
                cursor: "pointer",
                background: "#fb675300",
                transition: "0.2s",
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  minWidth: 25,
                  textAlign: "center",
                }}
              >
                {item.icon}
              </span>

              {open && (
                <span
                  style={{
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Sidebar;
