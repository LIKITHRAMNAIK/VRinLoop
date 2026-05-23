import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import AddTransaction from '../components/AddTransaction';
import { formatCurrency } from '../utils/format';


function UsersPage() {

  const [users, setUsers] = useState([]);
  const [openForm, setOpenForm] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {

    API.get('/')
      .then(res => {

        const data = res.data;

        const grouped = {};

        data.forEach(tx => {

          const name = tx.person_name;

          if (!grouped[name]) {
            grouped[name] = {
  name,
  total: 0,
  upcoming: 0,
  overdue: 0,
  paid: 0,

  incoming: 0,
  outgoing: 0,

  netIncoming: 0,
  netOutgoing: 0
};
          }

          grouped[name].total++;

          const due = new Date(tx.due_date);

          const today = new Date();

          due.setHours(0,0,0,0);

          today.setHours(0,0,0,0);

          const isLatePaid =
  tx.status === 'paid' &&
  tx.paid_date &&
  new Date(tx.paid_date) > due;

if (tx.status === 'paid') {

  grouped[name].paid++;

  // include paid overdue history
  if (isLatePaid) {
    grouped[name].overdue++;
  }

}
else if (due < today) {

  grouped[name].overdue++;

}
else {

  grouped[name].upcoming++;

}

          // NORMAL
          if (tx.transaction_type === 'normal') {

  const paid = tx.paid_amount || 0;

  // ACTIVE
  const remaining =
    tx.principal_amount - paid;

  if (tx.status !== 'paid') {

    if (tx.type === 'incoming') {
      grouped[name].incoming += remaining;
    }
    else {
      grouped[name].outgoing += remaining;
    }

  }

  // NET
  if (paid > 0) {

  if (tx.type === 'incoming') {
    grouped[name].netIncoming += paid;
  }
  else {
    grouped[name].netOutgoing += paid;
  }

}

}

          // ROTATION
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
      grouped[name].incoming += total;
    }
    else {
      grouped[name].outgoing += total;
    }

  }

  // NET
  if (tx.status === 'paid') {

  if (tx.type === 'incoming') {
    grouped[name].netIncoming += total;
  }
  else {
    grouped[name].netOutgoing += total;
  }

}

}

        });

        setUsers(Object.values(grouped));

      })
      .catch(err => console.log(err));

  }, []);

  return (
    <div style={{
  padding: 30,
  paddingLeft: 95,
  minHeight: '100vh',

  background:
    'linear-gradient(135deg,#f8fafc,#eef2ff)',

  fontFamily:
    "'Inter', sans-serif"
}}>

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
          window.location.reload();
        }}
      />

    </div>
  </div>
)}

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

<div style={{
  marginBottom: 35
}}>

  <h1 style={{
    margin: 0,
    fontSize: 46,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: '-1px'
  }}>
    👥 User Profiles
  </h1>

  <p style={{
    marginTop: 10,
    color: '#64748b',
    fontSize: 17
  }}>
    Smart financial overview of all users,
    transactions and payment activity
  </p>

</div>

      <div style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20
      }}>

        {users.map(user => {

          const net =
  user.netIncoming +
  user.netOutgoing;

          return (
            <div
  key={user.name}

  onMouseEnter={(e) => {

    e.currentTarget.style.transform =
      'translateY(-8px)';

    e.currentTarget.style.boxShadow =
      '0 18px 40px rgba(99,102,241,0.18)';
  }}

  onMouseLeave={(e) => {

    e.currentTarget.style.transform =
      'translateY(0px)';

    e.currentTarget.style.boxShadow =
      '0 10px 30px rgba(15,23,42,0.08)';
  }}

  onClick={() =>
    navigate(`/profile/${user.name}`)
  }
              style={{
  background:
    'linear-gradient(145deg,#ffffff,#f8fafc)',

  borderRadius: 30,

  padding: 28,

  cursor: 'pointer',

  border:
    '1px solid rgba(255,255,255,0.6)',

  boxShadow:
    '0 10px 30px rgba(15,23,42,0.08)',

  transition:
    'all 0.25s ease',

  position: 'relative',

  overflow: 'hidden'
}}
            >

              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20
}}>

  <div>

    <h2 style={{
      margin: 0,
      fontSize: 34,
      fontWeight: '800',
      color: '#2563eb'
    }}>
      {user.name}
    </h2>

    <p style={{
      marginTop: 6,
      color: '#64748b',
      fontSize: 14
    }}>
      Financial Profile Overview
    </p>

  </div>

  <div style={{
    width: 58,
    height: 58,
    borderRadius: '50%',

    background:
      'linear-gradient(135deg,#6366f1,#8b5cf6)',

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    color: 'white',

    fontSize: 22,
    fontWeight: 'bold'
  }}>
    {user.name.charAt(0)}
  </div>

</div>

              <div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
  marginBottom: 24
}}>

  <div style={{
    background: '#eff6ff',
    padding: 16,
    borderRadius: 18
  }}>
    <p style={{
      margin: 0,
      color: '#64748b',
      fontSize: 13
    }}>
      Total Payments
    </p>

    <h2 style={{
      marginTop: 10,
      marginBottom: 0,
      color: '#2563eb'
    }}>
      {user.total}
    </h2>
  </div>

  <div style={{
    background: '#f0fdf4',
    padding: 16,
    borderRadius: 18
  }}>
    <p style={{
      margin: 0,
      color: '#64748b',
      fontSize: 13
    }}>
      Upcoming
    </p>

    <h2 style={{
      marginTop: 10,
      marginBottom: 0,
      color: '#16a34a'
    }}>
      {user.upcoming}
    </h2>
  </div>

  <div style={{
    background: '#fef2f2',
    padding: 16,
    borderRadius: 18
  }}>
    <p style={{
      margin: 0,
      color: '#64748b',
      fontSize: 13
    }}>
      Overdue
    </p>

    <h2 style={{
      marginTop: 10,
      marginBottom: 0,
      color: '#dc2626'
    }}>
      {user.overdue}
    </h2>
  </div>

  <div style={{
    background: '#eef2ff',
    padding: 16,
    borderRadius: 18
  }}>
    <p style={{
      margin: 0,
      color: '#64748b',
      fontSize: 13
    }}>
      Paid
    </p>

    <h2 style={{
      marginTop: 10,
      marginBottom: 0,
      color: '#4f46e5'
    }}>
      {user.paid}
    </h2>
  </div>

</div>

              <hr />

<div style={{
  display: 'flex',
  gap: 10,
  marginTop: 15,
  marginBottom: 15
}}>

  <div style={{
    flex: 1,
    background: '#4CAF50',
    color: 'white',
    padding: 12,
    borderRadius: 10,
    textAlign: 'center'
  }}>
    <p style={{
      margin: 0,
      fontSize: 13,
      fontWeight: 'bold'
    }}>
      Incoming
    </p>

    <h3 style={{
      margin: '8px 0 0'
    }}>
      {formatCurrency(user.incoming)}
    </h3>
  </div>

  <div style={{
    flex: 1,
    background: '#f44336',
    color: 'white',
    padding: 12,
    borderRadius: 10,
    textAlign: 'center'
  }}>
    <p style={{
      margin: 0,
      fontSize: 13,
      fontWeight: 'bold'
    }}>
      Outgoing
    </p>

    <h3 style={{
      margin: '8px 0 0'
    }}>
      {formatCurrency(user.outgoing)}
    </h3>
  </div>

</div>

<p style={{
  fontWeight: 'bold',
  fontSize: 20,
  textAlign: 'center',
  marginBottom: 0
}}>
  Net: {formatCurrency(net)}
</p>

            </div>
          );

        })}

      </div>

    </div>
  );
}

export default UsersPage;