import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { formatCurrency } from "../utils/format";

function LoanPaymentSuccess({ open, selectedLoan, onClose }) {
  if (!selectedLoan) return null;

  const progress = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((selectedLoan.completed_emi || 0) /
          (selectedLoan.loan_duration || 1)) *
          100
      )
    )
  );

  return (
    <Dialog
      open={open}
      aria-labelledby="emi-success-title"
      slotProps={{
        paper: {
          sx: {
            width: {
              xs: "256px",
              md: "420px",
            },
            maxWidth: "calc(100% - 32px)",
            maxHeight: "calc(100% - 32px)",
            margin: "16px",
            borderRadius: "18px",
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle
        id="emi-success-title"
        sx={{
          background: "#f0fdf4",
          textAlign: "center",
          padding: "16px 12px",
        }}
      >
        {/* SUCCESS ICON */}
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 10px",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="19" fill="#16a34a" />
            <path
              d="M11 20 L17 26 L29 14"
              fill="none"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div
          style={{
            color: "#166534",
            fontSize: 20,
            fontWeight: 800,
          }}
        >
          {selectedLoan.remaining_emi === 0
            ? "Loan Completed!"
            : "Payment Successful!"}
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            marginTop: 4,
            overflowWrap: "anywhere",
          }}
        >
          {selectedLoan.person_name || "Loan Payment"}
          {" · "}
          Payment recorded
        </div>
      </DialogTitle>

      <DialogContent
        sx={{
          padding: "14px !important",
          overflowY: "auto",
        }}
      >
        {/* EMI SUMMARY CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <div
            style={{
              background: "#f0fdf4",
              borderRadius: 12,
              padding: "12px 6px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#15803d",
              }}
            >
              {selectedLoan.completed_emi || 0}
              {" / "}
              {selectedLoan.loan_duration || 0}
            </div>

            <div style={{ fontSize: 11, color: "#166534" }}>
              Completed EMIs
            </div>
          </div>

          <div
            style={{
              background: "#f5f3ff",
              borderRadius: 12,
              padding: "12px 6px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#6d28d9",
              }}
            >
              {selectedLoan.remaining_emi || 0}
            </div>

            <div style={{ fontSize: 11, color: "#6d28d9" }}>
              Remaining EMIs
            </div>
          </div>
        </div>

        {/* LOAN PROGRESS */}
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 7,
              color: "#334155",
            }}
          >
            <span>Loan Progress</span>

            <span style={{ color: "#15803d" }}>
              {progress}%
            </span>
          </div>

          <div
            style={{
              height: 8,
              background: "#e2e8f0",
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background:
                  "linear-gradient(90deg,#22c55e,#15803d)",
                borderRadius: 20,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* REMAINING BALANCE */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 6,
            background: "#f8fafc",
            borderRadius: 10,
            padding: 12,
            marginTop: 14,
            fontSize: 12,
            color: "#475569",
          }}
        >
          <span>Remaining Balance</span>

          <strong style={{ fontSize: 16, color: "#0f172a" }}>
            {formatCurrency(
              (selectedLoan.remaining_emi || 0) *
                (selectedLoan.emi_amount || 0)
            )}
          </strong>
        </div>

        {/* LOAN COMPLETION MESSAGE */}
        {selectedLoan.remaining_emi === 0 && (
          <div
            style={{
              background: "#f0fdf4",
              color: "#166534",
              padding: 10,
              borderRadius: 10,
              textAlign: "center",
              fontSize: 12,
              fontWeight: 600,
              marginTop: 12,
            }}
          >
            Congratulations! All EMIs are completed.
          </div>
        )}
      </DialogContent>

      {/* DONE BUTTON */}
      <DialogActions sx={{ padding: "0 14px 14px" }}>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            background: "#15803d",
            borderRadius: "10px",
            padding: "10px",
            fontWeight: 700,
            textTransform: "none",
            "&:hover": {
              background: "#166534",
            },
          }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default LoanPaymentSuccess;