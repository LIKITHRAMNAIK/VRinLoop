import React, { useEffect, useState } from 'react';
import API from '../services/api';
import AddTransaction from '../components/AddTransaction';
import TransactionList from '../components/TransactionList';
import Charts from '../components/Charts';
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

  const fetchData = () => {
    API.get('/dashboard')
      .then(res => setData(res.data))
      .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data) return <h2>Loading...</h2>;
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
  minHeight: '100vh'
}}>
    <Sidebar
  open={sidebarOpen}
  setOpen={setSidebarOpen}
/>
    

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

  <div>
    <h1 style={{
      margin: 0,
      fontSize: 32
    }}>
      💰 Money Dashboard
    </h1>

    <p style={{
      marginTop: 8,
      opacity: 0.75,
      fontSize: 15
    }}>
      Manage payments, profiles and analytics
    </p>
  </div>

  <div style={{
    background: 'rgba(255, 255, 255, 0.06)',
    padding: '14px 18px',
    borderRadius: 16,
    textAlign: 'center',
    minWidth: 180
  }}>
    <p style={{
      margin: 0,
      opacity: 0.7,
      fontSize: 14
    }}>
      Today
    </p>

    <h3 style={{
      margin: '8px 0 0'
    }}>
      {new Date().toDateString()}
    </h3>
  </div>

</div>

    {/* + BUTTON */}
    <button
      onClick={() => setOpenForm(true)}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        padding: '10px 16px',
        borderRadius: '25px',
        cursor: 'pointer',
        fontWeight: 'bold',
        boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}
    >
      + New Transaction
    </button>

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
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
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

    {/* TRANSACTIONS */}
    <TransactionList refresh={reload} />

  </div>
);
}

export default Dashboard;