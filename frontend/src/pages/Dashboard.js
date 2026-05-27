import React, { useEffect, useState } from 'react';
import API from '../services/api';
import AddTransaction from '../components/AddTransaction';
import TransactionList from '../components/TransactionList';
// import Charts from '../components/Charts';
import { formatCurrency } from '../utils/format';
import Sidebar from '../components/Sidebar';

const card = (bg) => ({
  background: bg,
  color: 'white',
  padding: '12px 14px',
  borderRadius: 24,
  textAlign: 'center',
  fontWeight: '600',
  fontSize: '15px',
  boxShadow: '0 10px 20px rgba(0,0,0,0.12)',
  transition: '0.25s ease',
  cursor: 'pointer',
  minHeight: 45,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  border: '1px solid rgba(255,255,255,0.08)'
});

function Dashboard() {
  const [data, setData] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [reload, setReload] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showExportPopup, setShowExportPopup] =
  useState(false);

  const fetchData = () => {
    API.get('/dashboard')
      .then(res => setData(res.data))
      .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data)
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f4f7fb',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      <div
        style={{
          width: '70px',
          height: '70px',
          border: '6px solid #dbeafe',
          borderTop: '6px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />

      <h2
        style={{
          margin: 0,
          color: '#1e293b',
          fontSize: '28px'
        }}
      >
        💰 Loading Dashboard...
      </h2>

      <p
        style={{
          margin: 0,
          color: '#64748b',
          fontSize: '15px'
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

const incomingPercent =
  total === 0 ? 0 : (data.incoming / total) * 100;

const outgoingPercent =
  total === 0 ? 0 : (data.outgoing / total) * 100;

  return (
  <div style={{
    padding: '30px',
    paddingLeft: '95px',
    fontFamily: 'Arial',
    transition: '0.3s',
    background: '#f4f7fb',
    minHeight: '100vh',
    position: 'relative',
  }}>
    <Sidebar
  open={sidebarOpen}
  setOpen={setSidebarOpen}
  onOpenExport={() =>
    setShowExportPopup(true)
  }
/>
    
    {/* HEADER CONTAINER */}
    <div style={{
      background: 'linear-gradient(135deg, #0F2027, #203A43, #2C5364)',
      color: 'white',
      padding: '28px 30px',
      borderRadius: 24,
      marginBottom: 25,
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 20
    }}>
      {/* Title Section */}
      <div>
        <h1 style={{ margin: 0, fontSize: 32 }}>
          💰 Money Dashboard
        </h1>
        <p style={{ marginTop: 8, opacity: 0.75, fontSize: 15 }}>
          Manage payments, profiles and analytics
        </p>
      </div>

      {/* Right Actions Section (Bundles Date and Button Together) */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '20px', 
        flexWrap: 'wrap' 
      }}>
        {/* Date Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.06)',
          padding: '14px 18px',
          borderRadius: 16,
          textAlign: 'center',
          minWidth: 180
        }}>
          <p style={{ margin: 0, opacity: 0.7, fontSize: 14 }}>
            Today
          </p>
          <h3 style={{ margin: '8px 0 0' }}>
            {new Date().toDateString()}
          </h3>
        </div>

        {/* NEW TRANSACTION BUTTON (Moved inside the layout flow) */}
        <button
  onClick={() => setOpenForm(true)}
  style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '12px 18px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap'
          }}
        >
          + New Transaction
        </button>

      </div>
    </div>

    {/* POPUP */}
    {openForm && (
      <div
        onClick={() => setOpenForm(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backdropFilter: 'blur(4px)',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
  background: 'white',
  padding: '25px',
  borderRadius: '12px',
  width: '350px',
  boxShadow: '0 5px 15px rgba(0,0,0,0.3)',

  maxHeight: '90vh',
  overflowY: 'auto',

  scrollbarWidth: 'thin'
}}
        >
          <AddTransaction
            refresh={() => {
              fetchData();
              setReload(prev => !prev);
              setOpenForm(false);
            }}
          />
        </div>
      </div>
    )}

    {/* DASHBOARD CARDS */}
    <div style={{
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px,1fr))',
  gap: 22,
  marginTop: '20px',
  marginBottom: '28px',
  alignItems: 'stretch'
}}>

      <div
  style={card('#4CAF50')}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      'translateY(-6px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      'translateY(0px)';
  }}
>
        <h3 style={{
  margin: 0,
  marginBottom: 10,
  fontSize: 20
}}>
  Incoming
</h3>
        <p style={{
  margin: 0,
  fontSize: 24,
  fontWeight: 'bold'
}}>
  {formatCurrency(data.incoming)}
</p>
      </div>

      <div
  style={card('#F44336')}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      'translateY(-6px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      'translateY(0px)';
  }}
>
        
        
        <h3 style={{
  margin: 0,
  marginBottom: 10,
  fontSize: 20
}}>
  Outgoing
</h3>
        <p style={{
  margin: 0,
  fontSize: 24,
  fontWeight: 'bold'
}}>
  {formatCurrency(data.outgoing)}
</p>
      </div>

      <div
  style={card('#009688')}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      'translateY(-6px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      'translateY(0px)';
  }}
>
        <h3 style={{
  margin: 0,
  marginBottom: 10,
  fontSize: 20
}}>
  Principal
</h3>
        <p style={{
  margin: 0,
  fontSize: 24,
  fontWeight: 'bold'
}}>
  {formatCurrency(data.principal)}
</p>
      </div>

      <div
  style={card('#FF9800')}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      'translateY(-6px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      'translateY(0px)';
  }}
>
        <h3 style={{
  margin: 0,
  marginBottom: 10,
  fontSize: 20
}}>
  Interest
</h3>
        <p style={{
  margin: 0,
  fontSize: 24,
  fontWeight: 'bold'
}}>
  {formatCurrency(data.interest)}
</p>
      </div>

      <div
  style={{
    ...card(profitLoss >= 0 ? '#4CAF50' : '#D32F2F'),
    gridColumn: 'span 4'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      'translateY(-6px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      'translateY(0px)';
  }}
>
  <h3 style={{
    margin: 0,
    marginBottom: 10,
    fontSize: 20
  }}>
    {profitLoss >= 0 ? 'Profit' : 'Loss'}
  </h3>

  <p style={{
    margin: 0,
    fontSize: 24,
    fontWeight: 'bold'
  }}>
    {formatCurrency(profitLoss)}
  </p>
</div>

    </div>

    {/* 🔥 PROFIT BAR (CORRECT LOCATION) */}
    <div style={{ marginTop: '10px', marginBottom: '20px' }}>

      <h3 style={{ marginBottom: 8 }}>🔥 PROFIT BAR</h3>

      <div style={{
        width: '100%',
        height: '25px',
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'flex',
        background: '#eee'
      }}>

        <div style={{
  width: `${incomingPercent}%`,
  background: '#4CAF50',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '12px',
  fontWeight: 'bold'
}}>
  {incomingPercent > 10 && `${incomingPercent.toFixed(0)}%`}
</div>

<div style={{
  width: `${outgoingPercent}%`,
  background: '#F44336',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '12px',
  fontWeight: 'bold'
}}>
  {outgoingPercent > 10 && `${outgoingPercent.toFixed(0)}%`}
</div>

      </div>

    </div>

{showExportPopup && (

  <div
    onClick={() =>
      setShowExportPopup(false)
    }
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}
  >

    <div
      onClick={(e) =>
        e.stopPropagation()
      }
      style={{
        width: '420px',
        background: 'white',
        borderRadius: '28px',
        padding: '30px',
        boxShadow:
          '0 15px 35px rgba(0,0,0,0.25)'
      }}
    >

      <h2 style={{
        marginTop: 0,
        marginBottom: 8,
        color: '#0f172a'
      }}>
        📁 Export Statements
      </h2>

      <p style={{
        marginTop: 0,
        color: '#64748b',
        fontSize: '14px'
      }}>
        Export transaction and loan reports
      </p>

      <div style={{
        display: 'grid',
        gap: '16px',
        marginTop: '28px'
      }}>

        {/* CSV */}
        <div
          onClick={async () => {

            try {

              const res =
                await API.get('/');

              const data =
                res.data.filter(
                  tx =>
                    tx.transaction_type !==
                    'loan'
                );

              const {
                exportTransactionsCSV
              } = await import(
                '../utils/exportTransactions'
              );

              exportTransactionsCSV(
                data,
                'all'
              );

              setShowExportPopup(false);

            } catch (err) {

              console.log(err);

            }

          }}
          style={{
            padding: '18px',
            borderRadius: '18px',
            background:
              'linear-gradient(135deg,#16a34a,#22c55e)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <h3 style={{
            margin: 0
          }}>
            📗 Export CSV
          </h3>

          <p style={{
            marginBottom: 0,
            opacity: 0.9,
            fontSize: '13px'
          }}>
            Download transaction CSV report
          </p>
        </div>

        {/* PDF */}
        <div
          onClick={async () => {

            try {

              const res =
                await API.get('/');

              const data =
                res.data.filter(
                  tx =>
                    tx.transaction_type !==
                    'loan'
                );

              const {
                exportTransactionsPDF
              } = await import(
                '../utils/exportTransactions'
              );

              exportTransactionsPDF(
                data,
                'all'
              );

              setShowExportPopup(false);

            } catch (err) {

              console.log(err);

            }

          }}
          style={{
            padding: '18px',
            borderRadius: '18px',
            background:
              'linear-gradient(135deg,#dc2626,#ef4444)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <h3 style={{
            margin: 0
          }}>
            📕 Export PDF
          </h3>

          <p style={{
            marginBottom: 0,
            opacity: 0.9,
            fontSize: '13px'
          }}>
            Download formatted PDF report
          </p>
        </div>

        {/* LOAN */}
        <div
          onClick={async () => {

            try {

              const res =
                await API.get('/');

              const loans =
                res.data.filter(
                  tx =>
                    tx.transaction_type ===
                    'loan'
                );

              const {
                exportLoanPDF
              } = await import(
                '../utils/exportTransactions'
              );

              exportLoanPDF(loans);

              setShowExportPopup(false);

            } catch (err) {

              console.log(err);

            }

          }}
          style={{
            padding: '18px',
            borderRadius: '18px',
            background:
              'linear-gradient(135deg,#2563eb,#3b82f6)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <h3 style={{
            margin: 0
          }}>
            🏦 Loan Statements
          </h3>

          <p style={{
            marginBottom: 0,
            opacity: 0.9,
            fontSize: '13px'
          }}>
            Export professional loan reports
          </p>
        </div>

      </div>

      <button
        onClick={() =>
          setShowExportPopup(false)
        }
        style={{
          marginTop: '24px',
          width: '100%',
          padding: '12px',
          border: 'none',
          borderRadius: '14px',
          background: '#e2e8f0',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Close
      </button>

    </div>

  </div>

)}
    {/* TRANSACTIONS */}
    <TransactionList refresh={reload} />

  </div>
);
}

export default Dashboard;