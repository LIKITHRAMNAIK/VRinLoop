import { useState } from 'react';

import { useParams } from 'react-router-dom';

import Charts from '../components/Charts';

function LoanAnalyticsPage() {
    const [selectedLoan, setSelectedLoan] =
  useState('all');

  const { name } = useParams();

  const data =
    JSON.parse(
      localStorage.getItem(
        'profileData'
      )
    ) || [];

  const loanData = data.filter(
    tx =>
      tx.transaction_type === 'loan'
  );
  const filteredLoans =

  selectedLoan === 'all'

    ? loanData

    : loanData.filter(
        loan =>
          loan._id === selectedLoan
      );

  let totalLoanEmisPaid = 0;

  let totalPendingEmis = 0;

  let totalLateEmis = 0;

  let totalAdvanceEmis = 0;

  let totalLoanPenalty = 0;

  loanData.forEach(tx => {

    totalLoanEmisPaid +=
      tx.completed_emi || 0;

    totalPendingEmis +=
      tx.remaining_emi || 0;

    tx.emi_history?.forEach(emi => {

      totalLoanPenalty +=
        emi.penalty_amount || 0;

      if (emi.status === 'late') {
        totalLateEmis++;
      }

      if (
        emi.status === 'advance'
      ) {
        totalAdvanceEmis++;
      }

    });

  });

  return (

  <div style={{
    padding: 25,
    background: '#f8fafc',
    minHeight: '100vh'
  }}>

    {/* HEADER */}

    <div style={{
      background:
        'linear-gradient(135deg,#0F172A,#1E293B)',
      borderRadius: 28,
      padding: 30,
      marginBottom: 30,
      color: 'white',
      boxShadow:
        '0 12px 35px rgba(0,0,0,0.15)'
    }}>

      <button
        onClick={() =>
          window.history.back()
        }
        style={{
          background:
            'rgba(18, 240, 33, 0.71)',
          color: 'white',
          border: 'none',
          padding: '10px 16px',
          borderRadius: 12,
          cursor: 'pointer',
          fontWeight: 'bold',
          marginBottom: 25
        }}
      >
        ⬅ Back Profile
      </button>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
      }}>

        <div>

          <h1 style={{
            margin: 0,
            fontSize: 34
          }}>
            📈 Loan Analytics
          </h1>

          <p style={{
            marginTop: 10,
            color: '#cbd5e1',
            fontSize: 15
          }}>
            Advanced loan repayment insights & visual analytics
          </p>

        </div>

        <div style={{
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap'
        }}>

          <div style={{
            background:
              'rgba(255,255,255,0.08)',
            padding: '14px 18px',
            borderRadius: 16,
            minWidth: 120
          }}>

            <p style={{
              margin: 0,
              color: '#cbd5e1',
              fontSize: 13
            }}>
              Total Loans
            </p>

            <h2 style={{
              margin: '8px 0 0'
            }}>
              {loanData.length}
            </h2>

          </div>

          <div style={{
            background:
              'rgba(255,255,255,0.08)',
            padding: '14px 18px',
            borderRadius: 16,
            minWidth: 120
          }}>

            <p style={{
              margin: 0,
              color: '#cbd5e1',
              fontSize: 13
            }}>
              Paid EMIs
            </p>

            <h2 style={{
              margin: '8px 0 0'
            }}>
              {totalLoanEmisPaid}
            </h2>

          </div>

          <div style={{
            background:
              'rgba(255,255,255,0.08)',
            padding: '14px 18px',
            borderRadius: 16,
            minWidth: 120
          }}>

            <p style={{
              margin: 0,
              color: '#cbd5e1',
              fontSize: 13
            }}>
              Pending
            </p>

            <h2 style={{
              margin: '8px 0 0'
            }}>
              {totalPendingEmis}
            </h2>

          </div>

        </div>

      </div>

    </div>

<div style={{
  marginBottom: 25,
  display: 'flex',
  justifyContent: 'flex-end'
}}>

  <select
    value={selectedLoan}
    onChange={(e) =>
      setSelectedLoan(
        e.target.value
      )
    }
    style={{
      padding: '12px 18px',
      borderRadius: 14,
      border: '1px solid #ddd',
      background: 'white',
      fontWeight: 'bold',
      cursor: 'pointer',
      minWidth: 220
    }}
  >

    <option value="all">
      All Loans
    </option>

    {loanData.map((loan, index) => (

      <option
        key={loan._id}
        value={loan._id}
      >
        Loan {index + 1}
        {' - '}
        {loan.person_name}
      </option>

    ))}

  </select>

</div>
      <Charts

        loanData={filteredLoans.map(
  (loan) => ({

    ...loan,

    originalIndex:
      loanData.findIndex(
        l => l._id === loan._id
      ) + 1

  })
)}

        totalLoanEmisPaid={
          totalLoanEmisPaid
        }

        totalPendingEmis={
          totalPendingEmis
        }

        totalLateEmis={
          totalLateEmis
        }

        totalAdvanceEmis={
          totalAdvanceEmis
        }

        totalLoanPenalty={
          totalLoanPenalty
        }

      />

    </div>

  );

}

export default LoanAnalyticsPage;