import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { formatCurrency } from '../utils/format';

function LoanProfile({ data, refresh }) {
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState('pending');
  const [openHistory, setOpenHistory] = useState(null);
  const [deleteLoanId, setDeleteLoanId] =
  useState(null);
  const [emiCounts, setEmiCounts] =
  useState({});
  const [emiPenalties, setEmiPenalties] =
  useState({});

const [editHistory, setEditHistory] = useState(null);

const [editDate, setEditDate] = useState('');

  const today = new Date();
  today.setHours(0,0,0,0);

  const filteredData = data.filter(tx => {


    if (filterType === 'paid') {
      return tx.status === 'paid';
    }

    if (filterType === 'pending') {
      return tx.status !== 'paid';
    }

    return true;
  });

  const payLoanEmi = async (id) => {

    try {

      await API.put(

  `/loan-emi/${id}`,

  {
    emiCount:
      Number(
        emiCounts[id] || 1
      ),

    penaltyAmount:
      Number(
        emiPenalties[id] || 0
      )
  }

);
window.location.reload();

      alert('EMI Paid Successfully ✅');

      refresh();

    } catch (err) {

      console.log(err);

      alert('Error ❌');

    }

  };

  const renderCard = (tx) => {
    let totalPaid = 0;

let totalPenalty = 0;

let latePayments = 0;

let advancePayments = 0;

let onTimePayments = 0;

tx.emi_history?.forEach(emi => {

  totalPaid +=
    emi.amount || 0;

  totalPenalty +=
    emi.penalty_amount || 0;

  if (emi.status === 'late') {
    latePayments += 1;
  }

  else if (
    emi.status === 'advance'
  ) {
    advancePayments += 1;
  }

  else {
    onTimePayments += 1;
  }

});

const totalEmis =
  tx.emi_history?.length || 0;

const paymentScore =
  totalEmis === 0

    ? 100

    : Math.max(

        0,

        Math.round(

          (
            (
              onTimePayments +
              advancePayments
            ) /

            totalEmis
          ) * 100

        )

      );

    const paidMonths =
  tx.completed_emi || 0;

const totalMonths =
  tx.loan_duration || 1;

const progress =
  Math.min(
    (paidMonths / totalMonths) * 100,
    100
  );

const remainingMonths =
  tx.remaining_emi || 0;

    const dueDate = new Date(tx.due_date);

    dueDate.setHours(0,0,0,0);

    const isOverdue =
      dueDate < today &&
      tx.status !== 'paid';

      const diffTime =
  today - dueDate;

const diffDays = Math.ceil(
  diffTime / (1000 * 60 * 60 * 24)
);

const isDueToday =
  diffDays === 0;

const isUpcoming =
  diffDays < 0 &&
  Math.abs(diffDays) <= 3;

    return (

      <div
        key={tx._id}
        style={{
          padding: 15,
          borderRadius: 12,
          background: isOverdue
            ? '#ffe5e5'
            : '#ede7f6',

          border: isOverdue
            ? '2px solid #f44336'
            : '1px solid #d1c4e9'
        }}
      >

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>

          <h3
  onClick={() => {
    navigate(`/profile/${tx.person_name}`);
  }}
  style={{
    margin: 0,
    color: '#4527A0',
    cursor: 'pointer'
  }}
>
  {tx.person_name}
</h3>

          <span style={{
            background:
              tx.type === 'incoming'
                ? '#4CAF50'
                : '#f44336',

            color: 'white',
            padding: '4px 10px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 'bold'
          }}>
            {tx.type === 'incoming' ? 'IN' : 'OUT'}
          </span>

        </div>

        <p>
          <b>Principal:</b>{' '}
          {formatCurrency(tx.principal_amount)}
        </p>

        <p>
          <b>EMI:</b>{' '}
          {formatCurrency(tx.emi_amount || 0)}
        </p>

        <p>
          <b>Duration:</b>{' '}
          {tx.loan_duration || 0} months
        </p>

        <p>
          <b>Paid Months:</b>{' '}
          {paidMonths}
        </p>

        <p>
          <b>Remaining:</b>{' '}
          {remainingMonths}
        </p>
        <p>
  <b>Balance Amount:</b>{' '}
  {formatCurrency(
    remainingMonths *
    (tx.emi_amount || 0)
  )}
</p>

          <p>
  <b>Start Date:</b>{' '}
  <span style={{
    color: '#4CAF50',
    fontWeight: 'bold'
  }}>
    {new Date(tx.start_date).toDateString()}
  </span>
</p>

        <div style={{ marginTop: 10 }}>

  {/* OVERDUE */}

  {isOverdue && (

    <div style={{
      background: '#fee2e2',
      color: '#dc2626',
      padding: '8px 12px',
      borderRadius: 10,
      fontWeight: 'bold',
      marginBottom: 10,
      display: 'inline-block'
    }}>
      🔴 Overdue by {diffDays} day
      {diffDays > 1 ? 's' : ''}
    </div>

  )}

  {/* DUE TODAY */}

  {isDueToday && !isOverdue && (

    <div style={{
      background: '#ffedd5',
      color: '#ea580c',
      padding: '8px 12px',
      borderRadius: 10,
      fontWeight: 'bold',
      marginBottom: 10,
      display: 'inline-block'
    }}>
      ⚠ Due Today
    </div>

  )}

  {/* UPCOMING */}

  {isUpcoming && !isOverdue && (

    <div style={{
      background: '#fef9c3',
      color: '#ca8a04',
      padding: '8px 12px',
      borderRadius: 10,
      fontWeight: 'bold',
      marginBottom: 10,
      display: 'inline-block'
    }}>
      🟡 Due in {Math.abs(diffDays)} day
      {Math.abs(diffDays) > 1 ? 's' : ''}
    </div>

  )}

  {/* DUE DATE */}

  <p style={{
    margin: 0,
    color:
      isOverdue
        ? '#dc2626'
        : '#111827',

    fontWeight:
      isOverdue
        ? 'bold'
        : 'normal'
  }}>
    <b>Due Date:</b>{' '}
    {new Date(
      tx.due_date
    ).toDateString()}
  </p>

</div>

        <div style={{
          marginTop: 15
        }}>

          <div style={{
            height: 14,
            background: '#d1c4e9',
            borderRadius: 20,
            overflow: 'hidden'
          }}>

            <div style={{
              width: `${progress}%`,
              height: '100%',
              background:
                progress === 100
                  ? '#4CAF50'
                  : '#7E57C2',

              transition: '0.3s'
            }} />

          </div>

          <p style={{
            marginTop: 6,
            fontWeight: 'bold',
            color: '#5E35B1'
          }}>
            {progress.toFixed(0)}% Completed
          </p>

        </div>

        {tx.status !== 'paid' && (

  <div style={{
    display: 'flex',
    gap: 10,
    marginTop: 15
  }}>

    <select
  value={emiCounts[tx._id] || 1}
  onChange={(e) =>
    setEmiCounts({
      ...emiCounts,
      [tx._id]: Number(e.target.value)
    })
  }
  style={{
    width: '100%',
    padding: 10,
    borderRadius: 10,
    border: '1px solid #d1d5db',
    marginBottom: 10,
    fontWeight: 'bold'
  }}
>

  {[...Array(
    Math.min(
      tx.remaining_emi,
      6
    )
  )].map((_, index) => (

    <option
      key={index}
      value={index + 1}
    >
      Pay {index + 1} EMI
    </option>

  ))}

</select>
  {isOverdue && (

  <input
    type="number"
    placeholder="Penalty (optional)"

    value={
      emiPenalties[tx._id] || ''
    }

    onChange={(e) =>
      setEmiPenalties({

        ...emiPenalties,

        [tx._id]:
          e.target.value

      })
    }

    style={{
      width: '100%',
      padding: 10,
      borderRadius: 10,
      border: '1px solid #d1d5db',
      marginBottom: 10,
      fontWeight: 'bold'
    }}
  />

)}
    <button
      onClick={() => payLoanEmi(tx._id)}
      style={{
        flex: 1,
        background: '#5E35B1',
        color: 'white',
        border: 'none',
        padding: 10,
        borderRadius: 8,
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      Pay EMI
    </button>

    <button
      onClick={() => setOpenHistory(tx)}
      style={{
        flex: 1,
        background: '#9575CD',
        color: 'white',
        border: 'none',
        padding: 10,
        borderRadius: 8,
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      More Details
    </button>

  </div>

)}

        {tx.status === 'paid' && (

          <div style={{
            marginTop: 12,
            background: '#4CAF50',
            color: 'white',
            padding: 8,
            borderRadius: 8,
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            Loan Completed
          </div>

        )}

      </div>

    );

  };

  const handleDeleteLoan = async () => {

  try {

    await API.delete(
      `/delete/${deleteLoanId}`
    );

    setDeleteLoanId(null);

    setOpenHistory(null);

    refresh();

  } catch (err) {

    console.log(err);

    alert('Delete failed ❌');

  }

};

  return (

    <div>

      <select
        value={filterType}
        onChange={(e) =>
          setFilterType(e.target.value)
        }
      >
        <option value="pending">
          Pending
        </option>

        <option value="paid">
          Paid
        </option>
      </select>

            <div style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fill, minmax(250px,1fr))',

        gap: 15,
        marginTop: 20
      }}>

        {filteredData.map(renderCard)}

      </div>
      {editHistory && (

  <div
    onClick={() => setEditHistory(null)}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 6000
    }}
  >

    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'white',
        width: '350px',
        borderRadius: 16,
        padding: 25
      }}
    >

      <h2 style={{
        color: '#5E35B1',
        marginBottom: 20
      }}>
        Edit EMI Date
      </h2>

      <input
        type="date"
        value={editDate}
        onChange={(e) =>
          setEditDate(e.target.value)
        }
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 10,
          border: '1px solid #ccc',
          marginBottom: 20
        }}
      />

      <div style={{
        display: 'flex',
        gap: 10
      }}>

        <button
          onClick={async () => {

            try {

              await API.put(
                `/loan-history-date`,
                {
                  txId: editHistory.txId,
                  emiIndex: editHistory.emiIndex,
                  paid_date: editDate
                }
              );

              alert('Updated ✅');

              setEditHistory(null);

              refresh();

            } catch (err) {

              console.log(err);

              alert('Error ❌');

            }

          }}
          style={{
            flex: 1,
            background: '#5E35B1',
            color: 'white',
            border: 'none',
            padding: 12,
            borderRadius: 10,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Save
        </button>

        <button
          onClick={() => setEditHistory(null)}
          style={{
            flex: 1,
            background: '#f44336',
            color: 'white',
            border: 'none',
            padding: 12,
            borderRadius: 10,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Cancel
        </button>

      </div>

    </div>

  </div>

)}

      {openHistory && (

        (() => {

const analytics =
  openHistory?.emi_history || [];
  

let totalPaid = 0;

let totalPenalty = 0;

let latePayments = 0;

let advancePayments = 0;

let onTimePayments = 0;

analytics.forEach(emi => {

  totalPaid +=
    emi.amount || 0;

  totalPenalty +=
    emi.penalty_amount || 0;

  if (emi.status === 'late') {

    latePayments++;

  }

  else if (
    emi.status === 'advance'
  ) {

    advancePayments++;

  }

  else {

    onTimePayments++;

  }

});

const paymentScore =

  analytics.length === 0

    ? 100

    : Math.round(

        (
          (
            onTimePayments +
            advancePayments
          ) /

          analytics.length
        ) * 100

      );

      const nextEmiDate =
  new Date(openHistory.due_date);

nextEmiDate.setHours(
  0,0,0,0
);

const currentDate =
  new Date();

currentDate.setHours(
  0,0,0,0
);

const nextEmiDiff = Math.ceil(

  (
    nextEmiDate -
    currentDate
  ) /

  (1000 * 60 * 60 * 24)

);

const isNextOverdue =
  nextEmiDiff < 0;

const isDueToday =
  nextEmiDiff === 0;

const riskLevel =

  paymentScore >= 80
    ? 'LOW'

  : paymentScore >= 50
    ? 'MEDIUM'

  : 'HIGH';

return (

  

        <div
          onClick={() => setOpenHistory(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 5000
          }}
        >

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              width: '500px',
              maxHeight: '80vh',
              overflowY: 'auto',
              borderRadius: 18,
              padding: 25
            }}
          >

            <div style={{
  background:
    'linear-gradient(135deg,#5E35B1,#7E57C2)',
  borderRadius: 22,
  padding: 24,
  color: 'white',
  marginBottom: 20,
  boxShadow:
    '0 10px 25px rgba(94,53,177,0.25)'
}}>

  {/* HEADER */}
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 15
  }}>

    <div>

      <h2 style={{
        margin: 0,
        fontSize: 28
      }}>
        💳 Loan EMI History
      </h2>

      <p style={{
        marginTop: 8,
        color: '#e9d5ff',
        fontSize: 14
      }}>
        Complete repayment analytics & EMI tracking
      </p>

    </div>

    <div style={{
      background: 'rgba(255,255,255,0.15)',
      padding: '10px 18px',
      borderRadius: 14,
      fontWeight: 'bold',
      fontSize: 14
    }}>
      {openHistory.loan_duration} Months
    </div>

  </div>

  {/* INFO GRID */}
  <div style={{
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit,minmax(140px,1fr))',
    gap: 16,
    marginTop: 25
  }}>

    <div style={{
      background: 'rgba(255,255,255,0.12)',
      padding: 16,
      borderRadius: 16
    }}>
      <p style={{
        margin: 0,
        fontSize: 13,
        color: '#ddd6fe'
      }}>
        Name
      </p>

      <h3 style={{
        marginTop: 8,
        marginBottom: 0
      }}>
        {openHistory.person_name}
      </h3>
    </div>

    <div style={{
      background: 'rgba(255,255,255,0.12)',
      padding: 16,
      borderRadius: 16
    }}>
      <p style={{
        margin: 0,
        fontSize: 13,
        color: '#ddd6fe'
      }}>
        Principal
      </p>

      <h3 style={{
        marginTop: 8,
        marginBottom: 0
      }}>
        {formatCurrency(
          openHistory.principal_amount
        )}
      </h3>
    </div>

    <div style={{
      background: 'rgba(255,255,255,0.12)',
      padding: 16,
      borderRadius: 16
    }}>
      <p style={{
        margin: 0,
        fontSize: 13,
        color: '#ddd6fe'
      }}>
        Completed
      </p>

      <h3 style={{
        marginTop: 8,
        marginBottom: 0
      }}>
        {openHistory.completed_emi}
      </h3>
    </div>

    <div style={{
      background: 'rgba(255,255,255,0.12)',
      padding: 16,
      borderRadius: 16
    }}>
      <p style={{
        margin: 0,
        fontSize: 13,
        color: '#ddd6fe'
      }}>
        Remaining
      </p>

      <h3 style={{
        marginTop: 8,
        marginBottom: 0
      }}>
        {openHistory.remaining_emi}
      </h3>
    </div>

  </div>

</div>

<div style={{
  marginTop: 20,
  marginBottom: 20,
  padding: 22,
  borderRadius: 22,

  background:

    isNextOverdue

      ? 'linear-gradient(135deg,#7f1d1d,#dc2626)'

    : isDueToday

      ? 'linear-gradient(135deg,#9a3412,#f97316)'

    : 'linear-gradient(135deg,#0F172A,#1E293B)',

  color: 'white',

  boxShadow:
    '0 10px 25px rgba(0,0,0,0.15)'
}}>

  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 15
  }}>

    <div>

      <p style={{
        margin: 0,
        color: '#cbd5e1',
        fontSize: 13
      }}>
        📅 Next EMI Date
      </p>

      <h2 style={{
        marginTop: 10,
        marginBottom: 0
      }}>
        {nextEmiDate.toDateString()}
      </h2>

    </div>

    <div style={{
      textAlign: 'right'
    }}>

      <p style={{
        margin: 0,
        fontSize: 13,
        color: '#cbd5e1'
      }}>
        Risk Level
      </p>

      <h2 style={{
        marginTop: 10,
        marginBottom: 0,

        color:

          riskLevel === 'LOW'
            ? '#4ade80'

          : riskLevel === 'MEDIUM'
            ? '#facc15'

          : '#f87171'
      }}>
        {riskLevel}
      </h2>

    </div>

  </div>

  {/* STATUS */}

  <div style={{
    marginTop: 20,
    padding: 14,
    borderRadius: 16,

    background:
      'rgba(255,255,255,0.1)',

    fontWeight: 'bold',
    fontSize: 15
  }}>

    {

      isNextOverdue

        ? `🔴 Overdue by ${Math.abs(nextEmiDiff)} day${Math.abs(nextEmiDiff) > 1 ? 's' : ''}`

      : isDueToday

        ? '⚠ EMI Due Today'

      : `🟢 Due in ${nextEmiDiff} day${nextEmiDiff > 1 ? 's' : ''}`

    }

  </div>

</div>

            <div style={{
  marginTop: 25,
  borderRadius: 24,
  padding: 24,
  background:
    'linear-gradient(135deg,#0F172A,#1E293B)',
  color: 'white',
  boxShadow:
    '0 12px 30px rgba(0,0,0,0.15)'
}}>

  {/* HEADER */}
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 24
  }}>

    <div>

      <h3 style={{
        margin: 0,
        fontSize: 26
      }}>
        📊 Loan Analytics
      </h3>

      <p style={{
        marginTop: 8,
        color: '#cbd5e1',
        fontSize: 14
      }}>
        Repayment behaviour & performance insights
      </p>

    </div>

    <div style={{
      background:

        paymentScore >= 80
          ? 'rgba(34,197,94,0.18)'

        : paymentScore >= 50
          ? 'rgba(234,179,8,0.18)'

        : 'rgba(239,68,68,0.18)',

      color:

        paymentScore >= 80
          ? '#4ade80'

        : paymentScore >= 50
          ? '#facc15'

        : '#f87171',

      padding: '10px 18px',
      borderRadius: 14,
      fontWeight: 'bold',
      fontSize: 16
    }}>
      Score: {paymentScore}%
    </div>

  </div>

  {/* GRID */}
  <div style={{
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit,minmax(180px,1fr))',
    gap: 18
  }}>

    {/* TOTAL PAID */}
    <div style={{
      background: 'rgba(255,255,255,0.08)',
      padding: 18,
      borderRadius: 18
    }}>

      <p style={{
        margin: 0,
        color: '#cbd5e1',
        fontSize: 13
      }}>
        Total Paid
      </p>

      <h2 style={{
        marginTop: 10,
        marginBottom: 0
      }}>
        {formatCurrency(totalPaid)}
      </h2>

    </div>

    {/* PENALTY */}
    <div style={{
      background: 'rgba(239,68,68,0.12)',
      padding: 18,
      borderRadius: 18
    }}>

      <p style={{
        margin: 0,
        color: '#fecaca',
        fontSize: 13
      }}>
        Penalty Collected
      </p>

      <h2 style={{
        marginTop: 10,
        marginBottom: 0,
        color: '#f87171'
      }}>
        {formatCurrency(totalPenalty)}
      </h2>

    </div>

    {/* ADVANCE */}
    <div style={{
      background: 'rgba(34,197,94,0.12)',
      padding: 18,
      borderRadius: 18
    }}>

      <p style={{
        margin: 0,
        color: '#bbf7d0',
        fontSize: 13
      }}>
        🟢 Advance Payments
      </p>

      <h2 style={{
        marginTop: 10,
        marginBottom: 0,
        color: '#4ade80'
      }}>
        {advancePayments}
      </h2>

    </div>

    {/* ON TIME */}
    <div style={{
      background: 'rgba(59,130,246,0.12)',
      padding: 18,
      borderRadius: 18
    }}>

      <p style={{
        margin: 0,
        color: '#bfdbfe',
        fontSize: 13
      }}>
        🔵 On-Time Payments
      </p>

      <h2 style={{
        marginTop: 10,
        marginBottom: 0,
        color: '#60a5fa'
      }}>
        {onTimePayments}
      </h2>

    </div>

    {/* LATE */}
    <div style={{
      background: 'rgba(239,68,68,0.12)',
      padding: 18,
      borderRadius: 18
    }}>

      <p style={{
        margin: 0,
        color: '#fecaca',
        fontSize: 13
      }}>
        🔴 Late Payments
      </p>

      <h2 style={{
        marginTop: 10,
        marginBottom: 0,
        color: '#f87171'
      }}>
        {latePayments}
      </h2>

    </div>

    {/* EMI HEALTH */}
    <div style={{
      background:
        'linear-gradient(135deg,#7C3AED,#9333EA)',
      padding: 18,
      borderRadius: 18
    }}>

      <p style={{
        margin: 0,
        color: '#e9d5ff',
        fontSize: 13
      }}>
        EMI Health
      </p>

      <h2 style={{
        marginTop: 10,
        marginBottom: 0
      }}>
        {
          paymentScore >= 80
            ? 'Excellent'

          : paymentScore >= 50
            ? 'Average'

          : 'Risky'
        }
      </h2>

    </div>

  </div>

</div>

            {openHistory.emi_history?.length > 0 ? (

              openHistory.emi_history.map((emi, index) => (

                <div
                  key={index}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: '#f3ecff',
                    marginBottom: 12
                  }}
                >

                  <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap'
}}>

  <p style={{
    margin: 0,
    fontWeight: 'bold'
  }}>
    EMI #{emi.month_number}
  </p>

  <div style={{
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 'bold',

    background:

      emi.status === 'late'
        ? '#fee2e2'

      : emi.status === 'advance'
        ? '#dcfce7'

      : '#dbeafe',

    color:

      emi.status === 'late'
        ? '#dc2626'

      : emi.status === 'advance'
        ? '#16a34a'

      : '#2563eb'
  }}>

    {
      emi.status === 'late'
  ? `🔴 LATE (${emi.late_days || 0} day${(emi.late_days || 0) > 1 ? 's' : ''})`

      : emi.status === 'advance'
        ? '🟢 ADVANCE'

      : '🔵 PAID'
    }

  </div>

</div>

                  <p>
                    Amount: {formatCurrency(emi.amount)}
                  </p>
                  {emi.penalty_amount > 0 && (

  <p style={{
    color: '#dc2626',
    fontWeight: 'bold',
    marginTop: 6
  }}>
    Penalty:
    {' '}
    {formatCurrency(
      emi.penalty_amount
    )}
  </p>

)}

                  <p>
  Paid Date:
  {' '}
  {
    emi.paid_date
      ? new Date(
          emi.paid_date
        ).toDateString()
      : 'N/A'
  }
</p>

<button
  onClick={() => {

    setEditHistory({
      txId: openHistory._id,
      emiIndex: index
    });

    setEditDate(
      emi.paid_date
        ? emi.paid_date.substring(0,10)
        : ''
    );

  }}
  style={{
    background: '#5E35B1',
    color: 'white',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    marginTop: 8
  }}
>
  Edit Date
</button>

                </div>

              ))

            ) : (

              <p>No EMI history found</p>

            )}

            <button
  onClick={() =>
    setDeleteLoanId(
      openHistory._id
    )
  }
  style={{
    width: '100%',
    marginTop: 20,
    padding: 12,
    border: 'none',
    borderRadius: 10,
    background: '#dc2626',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer'
  }}
>
  Delete Loan
</button>

            <button
              onClick={() => setOpenHistory(null)}
              style={{
                width: '100%',
                marginTop: 15,
                padding: 12,
                border: 'none',
                borderRadius: 10,
                background: '#f44336',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Close
            </button>

          </div>

        </div>

        

      );

    })()

      )}
      {deleteLoanId && (

  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  }}>

    <div style={{
      background: 'white',
      borderRadius: 24,
      padding: 30,
      width: '400px',
      textAlign: 'center',
      boxShadow:
        '0 15px 40px rgba(0,0,0,0.2)'
    }}>

      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: '#fee2e2',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 auto 20px',
        fontSize: 36
      }}>
        🗑
      </div>

      <h2 style={{
        marginTop: 0,
        color: '#991b1b'
      }}>
        Delete Loan?
      </h2>

      <p style={{
        color: '#64748b',
        lineHeight: 1.6
      }}>
        This loan and all EMI history
        will be permanently removed.
      </p>

      <div style={{
        display: 'flex',
        gap: 12,
        marginTop: 25
      }}>

        <button
          onClick={() =>
            setDeleteLoanId(null)
          }
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: 12,
            border: 'none',
            background: '#e2e8f0',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Cancel
        </button>

        <button
          onClick={handleDeleteLoan}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: 12,
            border: 'none',
            background: '#dc2626',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Delete
        </button>

      </div>

    </div>

  </div>

)}

    </div>
  );
}

export default LoanProfile;