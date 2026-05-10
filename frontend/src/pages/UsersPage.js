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
      padding: 25,
      paddingLeft: 95,
      fontFamily: 'Arial'
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

<h1 style={{
  marginBottom: 25
}}>
  👥 User Profiles
</h1>

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
              onClick={() =>
                navigate(`/profile/${user.name}`)
              }
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 20,
                cursor: 'pointer',
                boxShadow:
                  '0 3px 12px rgba(0,0,0,0.12)',
                transition: '0.2s'
              }}
            >

              <h2 style={{
                marginTop: 0,
                marginBottom: 15,
                color: '#1565C0'
              }}>
                {user.name}
              </h2>

              <p>
                <b>Total Payments:</b>{' '}
                {user.total}
              </p>

              <p style={{ color: '#4CAF50' }}>
                <b>Upcoming:</b>{' '}
                {user.upcoming}
              </p>

              <p style={{ color: '#f44336' }}>
                <b>Overdue:</b>{' '}
                {user.overdue}
              </p>

              <p style={{ color: '#2196F3' }}>
                <b>Paid:</b>{' '}
                {user.paid}
              </p>

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