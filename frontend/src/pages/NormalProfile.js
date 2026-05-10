import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { formatCurrency } from '../utils/format';


// function NormalProfile() {
  function NormalProfile({ data, refresh }) {
  const navigate = useNavigate();

  // const [data, setData] = useState([]);

  const [payId, setPayId] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payType, setPayType] = useState('');

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [confirmAction, setConfirmAction] = useState(null);

  const [filterType, setFilterType] = useState('upcoming');


  if (!data.length) return <h2>Loading...</h2>;

  const handleInstallment = async () => {
    await API.put(`/paid/${payId}`, {
      amount: Number(payAmount)
    });
    setPayId(null);
    refresh();
  };

  const handleFullPayment = async () => {
    const tx = data.find(t => t._id === payId);
    const remaining = tx.principal_amount - (tx.paid_amount || 0);

    await API.put(`/paid/${payId}`, {
      amount: remaining
    });

    setPayId(null);
    refresh();
  };

  const handleDelete = async () => {
    await API.delete(`/delete/${confirmAction.id}`);
    setConfirmAction(null);
    refresh();
  };

  const handleEditSave = async () => {
    await API.put(`/update/${editId}`, {
      ...editForm
    });
    setEditId(null);
    refresh();
  };
  let filtered = [...data];
const today = new Date();

if (filterType === 'paid') {
  filtered = filtered.filter(tx => tx.status === 'paid');
}

if (filterType === 'extended') {
  filtered = filtered.filter(tx => tx.extensions.length > 0);
}

if (filterType === 'due') {
  filtered = filtered.filter(tx => new Date(tx.due_date) < today);
}

// if (filterType === 'upcoming') {
//   filtered = filtered
//     .filter(tx => tx.status !== 'paid' && new Date(tx.due_date) >= today)
//     .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
// }
if (filterType === 'upcoming') {
  filtered = filtered
    .filter(tx => tx.status !== 'paid')   // ✅ include due also
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
}

const renderCard = (tx) => {
  const paid = tx.paid_amount || 0;
  const balance = tx.principal_amount - paid;
  const today = new Date();

today.setHours(0,0,0,0);

const due = new Date(tx.due_date);

due.setHours(0,0,0,0);

const isOverdue =
  due < today &&
  tx.status !== 'paid';

const overdueDays = Math.max(
  1,
  Math.ceil(
    (today - due) /
    (1000 * 60 * 60 * 24)
  )
);

  return (
    <div key={tx._id} style={{
      padding: 12,
      borderRadius: 10,
      background: isOverdue ? '#ffe5e5' : '#e3f2fd',
      border: isOverdue ? '2px solid #f44336' : 'none'
    }}>

      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h4 style={{ margin: 0 }}>{tx.person_name}</h4>

        <span style={{
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'white',
          background: tx.type === 'incoming' ? '#4CAF50' : '#F44336'
        }}>
          {tx.type === 'incoming' ? 'IN' : 'OUT'}
        </span>
      </div>

      {/* PRINCIPAL */}
      <p style={{ margin: '6px 0', fontWeight: 'bold' }}>
        Principal: {formatCurrency(tx.principal_amount)}
      </p>

      {/* DATES */}
      <p style={{ color: '#4CAF50', fontWeight: 500 }}>
        Start: {new Date(tx.start_date).toDateString()}
      </p>

      <p style={{ color: '#f44336', fontWeight: 500 }}>
        Due: {new Date(tx.due_date).toDateString()}
      </p>
        {isOverdue && (
  <p style={{
    color: 'red',
    fontWeight: 'bold'
  }}>
    ⚠ {overdueDays} day{overdueDays > 1 ? 's' : ''} overdue
  </p>
)}
      {/* INSTALLMENTS */}
      {tx.installments &&
       tx.installments.length > 0 &&
       !(tx.installments.length === 1 &&
         tx.installments[0].amount === tx.principal_amount) && (
        <div style={{ marginTop: 6 }}>
          {tx.installments.map((inst, i) => (
            <p key={i} style={{
              color: '#ff9800',
              margin: 0,
              fontWeight: 500
            }}>
              ₹{inst.amount} paid on {new Date(inst.date).toDateString()}
            </p>
          ))}
        </div>
      )}

      {/* PAID DATE */}
      {tx.status === 'paid' && tx.paid_date && (() => {
        const paidDate = new Date(tx.paid_date);
        const due = new Date(tx.due_date);

        const isLate = paidDate > due;
        const diffDays = Math.ceil((paidDate - due) / (1000 * 60 * 60 * 24));

        return (
          <p style={{
            color: isLate ? '#f44336' : '#4CAF50',
            fontWeight: 'bold'
          }}>
            {isLate
              ? `Paid Late (${diffDays} day${diffDays > 1 ? 's' : ''}) on ${paidDate.toDateString()}`
              : `Paid on: ${paidDate.toDateString()}`
            }
          </p>
        );
      })()}

      {/* PAID BADGE */}
      {tx.status === 'paid' && (
        <div style={{
          background: '#4CAF50',
          color: 'white',
          padding: '5px 12px',
          borderRadius: 8,
          display: 'inline-block',
          fontWeight: 'bold',
          margin: '6px 0'
        }}>
          PAID
        </div>
      )}

      {/* BALANCE */}
      {tx.status !== 'paid' && (
        <p style={{ marginTop: 6, fontWeight: 'bold' }}>
          Balance: {formatCurrency(balance)}
        </p>
      )}

      {/* BUTTONS */}
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>

  {tx.status === 'paid' ? (
    <button
      onClick={() =>
        setConfirmAction({ id: tx._id })
      }
    >
      Delete
    </button>
  ) : (
    <>
      <button onClick={() => setPayId(tx._id)}>Pay</button>

      <button onClick={() => {
        setEditId(tx._id);
        setEditForm(tx);
      }}>
        Edit
      </button>

      <button onClick={() =>
        setConfirmAction({ id: tx._id })
      }>
        Delete
      </button>
    </>
  )}

</div>

    </div>
  );
};

  return (
    // <div style={{ padding: 20 }}>
    <div>
      {/* <button
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

      <h2>{filtered[0]?.person_name || 'Normal'}'s Profile</h2> */}

      <div style={{ marginBottom: 15 }}>
  <select
    value={filterType}
    onChange={(e) => setFilterType(e.target.value)}
    style={{
      padding: '6px 10px',
      borderRadius: 6
    }}
  >
    <option value="upcoming">Upcoming</option>
    <option value="paid">Paid</option>
    <option value="extended">Extended</option>
    <option value="due">Due</option>
  </select>
</div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))',
        gap: 12,
        marginTop: 20
      }}>
        {filtered.map(renderCard)}
      </div>

      {/* PAYMENT POPUP */}
      {/* PAYMENT POPUP */}
{payId && (
  <div
    onClick={() => {
      setPayId(null);
      setPayType('');
    }}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3000
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'white',
        padding: 20,
        borderRadius: 12,
        width: 300,
        boxShadow: '0 5px 20px rgba(0,0,0,0.3)'
      }}
    >
      {/* <h3 style={{ textAlign: 'center' }}>Payment</h3> */}

      <h3 style={{ textAlign: 'center', marginBottom: 15 }}>
  Payment
</h3>

{!payType && (
  <>
    <button
      style={{
        width: '100%',
        marginBottom: 10,
        background: '#ff9800',
        color: 'white',
        border: 'none',
        padding: '8px',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
      onClick={() => setPayType('installment')}
    >
      Pay by Installment
    </button>

    <button
      style={{
        width: '100%',
        background: '#f44336',
        color: 'white',
        border: 'none',
        padding: '8px',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
      onClick={() => setPayType('full')}
    >
      Full Payment
    </button>
  </>
)}

      {payType === 'installment' && (
        <>
          <input
            type="number"
            placeholder="Enter amount"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
          <button style={{ width: '100%' }} onClick={handleInstallment}>
            Confirm Installment
          </button>
        </>
      )}

      {payType === 'full' && (
        <button style={{ width: '100%' }} onClick={handleFullPayment}>
          Confirm Full Payment
        </button>
      )}
    </div>
  </div>
)}

{/* EDIT POPUP */}
{editId && (
  <div
    onClick={() => setEditId(null)}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3000
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'white',
        padding: 20,
        borderRadius: 12,
        width: 300
      }}
    >
      <h3 style={{ textAlign: 'center' }}>Edit Transaction</h3>

<div style={{ display:'flex', alignItems:'center', marginBottom:10 }}>
  <p style={{ width:60 }}>Total:</p>
  <input type="number" value={editForm.principal_amount || ''}
  onChange={(e)=>setEditForm({...editForm,principal_amount:e.target.value})}
  style={{ flex:1 }} />
</div>

<div style={{ display:'flex', alignItems:'center', marginBottom:10 }}>
  <p style={{ width:60 }}>Start:</p>
  <input type="date" value={editForm.start_date?.substring(0,10) || ''}
  onChange={(e)=>setEditForm({...editForm,start_date:e.target.value})}
  style={{ flex:1 }} />
</div>

<div style={{ display:'flex', alignItems:'center', marginBottom:10 }}>
  <p style={{ width:60 }}>Due:</p>
  <input type="date" value={editForm.due_date?.substring(0,10) || ''}
  onChange={(e)=>setEditForm({...editForm,due_date:e.target.value})}
  style={{ flex:1 }} />
</div>

      {/* BUTTONS */}
      <div style={{ marginTop:10, display:'flex', gap:10 }}>
  <button
    style={{ flex:1, background:'#4CAF50', color:'white' }}
    onClick={handleEditSave}
  >
    Save
  </button>

  <button
    style={{ flex:1, background:'#f44336', color:'white' }}
    onClick={() => setEditId(null)}
  >
    Cancel
  </button>
</div>
    </div>
  </div>
)}

{/* DELETE CONFIRM POPUP */}
{confirmAction && (
  <div
    onClick={() => setConfirmAction(null)}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3000
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'white',
        padding: 20,
        borderRadius: 12,
        width: 260,
        textAlign: 'center'
      }}
    >
      <h3>Delete?</h3>

      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
  <button
    style={{
      flex: 1,
      background: '#f44336',
      color: 'white',
      border: 'none',
      padding: '8px',
      borderRadius: '6px',
      cursor: 'pointer'
    }}
    onClick={handleDelete}
  >
    Confirm
  </button>

  <button
    style={{
      flex: 1,
      background: '#9e9e9e',
      color: 'white',
      border: 'none',
      padding: '8px',
      borderRadius: '6px',
      cursor: 'pointer'
    }}
    onClick={() => setConfirmAction(null)}
  >
    Cancel
  </button>
</div>
    </div>
  </div>
)}
    </div>
  );
}

export default NormalProfile;