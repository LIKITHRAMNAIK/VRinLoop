import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/format';

function MyProfile() {

  const navigate = useNavigate();

  const [stats, setStats] = useState({
    users: 0,
    transactions: 0,
    incoming: 0,
    outgoing: 0,
    paidIncoming: 0,
    paidOutgoing: 0,
    overdue: 0
  });

  useEffect(() => {

    API.get('/')
      .then(res => {

        const data = res.data;

        const usersSet = new Set();

        let incoming = 0;
        let outgoing = 0;

        let paidIncoming = 0;
        let paidOutgoing = 0;

        let overdue = 0;

        const today = new Date();

        today.setHours(0,0,0,0);

        data.forEach(tx => {

          usersSet.add(tx.person_name);

          const due = new Date(tx.due_date);

          due.setHours(0,0,0,0);

          // ================= NORMAL =================

          if (tx.transaction_type === 'normal') {

            const paid = tx.paid_amount || 0;

            const remaining =
              tx.principal_amount - paid;

            // ACTIVE
            if (tx.status !== 'paid') {

              if (tx.type === 'incoming') {
                incoming += remaining;
              }
              else {
                outgoing += remaining;
              }

            }

            // PAID
            if (paid > 0) {

              if (tx.type === 'incoming') {
                paidIncoming += paid;
              }
              else {
                paidOutgoing += paid;
              }

            }

          }

          // ================= ROTATION =================

          else {

            let interest = tx.base_interest;

            tx.extensions?.forEach(ext => {
              interest += ext.extra_interest;
            });

            const total =
              tx.principal_amount + interest;

            // ACTIVE
            if (tx.status !== 'paid') {

              if (tx.type === 'incoming') {
                incoming += total;
              }
              else {
                outgoing += total;
              }

            }

            // PAID
            if (tx.status === 'paid') {

              if (tx.type === 'incoming') {
                paidIncoming += total;
              }
              else {
                paidOutgoing += total;
              }

            }

          }

          // OVERDUE

          const paidLate =
            tx.status === 'paid' &&
            tx.paid_date &&
            new Date(tx.paid_date) > due;

          if (
            due < today &&
            tx.status !== 'paid'
          ) {
            overdue++;
          }

          if (paidLate) {
            overdue++;
          }

        });

        setStats({
          users: usersSet.size,
          transactions: data.length,
          incoming,
          outgoing,
          paidIncoming,
          paidOutgoing,
          overdue
        });

      })
      .catch(err => console.log(err));

  }, []);

  return (
    <div style={{
  padding: 25,
  paddingLeft: 95,
  fontFamily: 'Arial',
  minHeight: '100vh',
  background: '#f4f7fb'
}}>

      {/* BACK BUTTON */}

      <button
        onClick={() => navigate('/')}
        style={{
          marginBottom: 15,
          padding: '8px 14px',
          borderRadius: 8,
          border: 'none',
          background: '#4CAF50',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        ⬅ Dashboard
      </button>

      {/* TITLE */}

      <h1 style={{
        marginBottom: 30
      }}>
        👤 My Profile
      </h1>

      {/* OWNER CARD */}

      <div style={{
  background: 'linear-gradient(135deg, #1e1e1e, #2b2b2b)',
  color: 'white',
  padding: 30,
  borderRadius: 24,
  marginBottom: 35,
  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
  border: '1px solid rgba(255,255,255,0.05)'
}}>

        <h2 style={{
          marginTop: 0
        }}>
          Likith Ram Naik
        </h2>

        <p style={{
          opacity: 0.8
        }}>
          Money Management System Owner
        </p>

      </div>

      {/* STATS GRID */}

      <div style={{
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px,1fr))',
  gap: 22,
  alignItems: 'stretch'
}}>

        {/* USERS */}

        <div
  style={card('#1565C0')}
  onClick={() => navigate('/users')}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      'translateY(-6px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      'translateY(0px)';
  }}
>
  <h3>Total Users</h3>
  <h1>{stats.users}</h1>
</div>

        {/* TRANSACTIONS */}

        <div
  style={card('#6A1B9A')}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      'translateY(-6px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      'translateY(0px)';
  }}
>
          <h3>Total Transactions</h3>
          <h1>{stats.transactions}</h1>
        </div>

        {/* ACTIVE INCOMING */}

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
          <h3>Active Incoming</h3>
          <h2>{formatCurrency(stats.incoming)}</h2>
        </div>

        {/* ACTIVE OUTGOING */}

        <div
  style={card('#f44336')}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      'translateY(-6px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      'translateY(0px)';
  }}
>
          <h3>Active Outgoing</h3>
          <h2>{formatCurrency(stats.outgoing)}</h2>
        </div>

        {/* PAID INCOMING */}

        <div
  style={card('#00897B')}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      'translateY(-6px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      'translateY(0px)';
  }}
>
          <h3>Paid Incoming</h3>
          <h2>{formatCurrency(stats.paidIncoming)}</h2>
        </div>

        {/* PAID OUTGOING */}

        <div
  style={card('#EF6C00')}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      'translateY(-6px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      'translateY(0px)';
  }}
>
          <h3>Paid Outgoing</h3>
          <h2>{formatCurrency(stats.paidOutgoing)}</h2>
        </div>

        {/* OVERDUE */}

        <div style={{
          ...card('#D32F2F'),
        }}>
          <h3>Total Overdue Cases</h3>
          <h1>{stats.overdue}</h1>
        </div>

      </div>

    </div>
  );
}

const card = (bg) => ({
  background: bg,
  color: 'white',
  padding: '28px 22px',
  borderRadius: 24,
  textAlign: 'center',
  boxShadow: '0 10px 20px rgba(0,0,0,0.12)',
  transition: '0.25s ease',
  cursor: 'pointer',
  minHeight: 160,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  border: '1px solid rgba(255,255,255,0.08)'
});

export default MyProfile;