import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { formatCurrency } from '../utils/format';

function RotationProfile() {
  const { name } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [extendId, setExtendId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const [filterType, setFilterType] = useState('upcoming');

  const fetchData = () => {
    API.get(`/person/${name}`)
      .then(res => {
        const list = res.data.transactions || [];
        // setData(list.filter(tx => tx.transaction_type === 'rotation'));
        setData(list);
      })
      .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchData();
  }, [name]);

  if (!data) return <h2>Loading...</h2>;

  const handleDelete = async () => {
    await API.delete(`/delete/${confirmAction.id}`);
    setConfirmAction(null);
    fetchData();
  };

  const handleEditSave = async () => {
    await API.put(`/update/${editId}`, editForm);
    setEditId(null);
    fetchData();
  };
const today = new Date();
today.setHours(0,0,0,0);

const filteredData = data.filter(tx => {
  const dueDate = new Date(tx.due_date);
  dueDate.setHours(0,0,0,0);

  if (filterType === 'paid') return tx.status === 'paid';

  if (filterType === 'extended') return tx.status === 'extended';

  if (filterType === 'due') {
    return tx.status !== 'paid' && dueDate <= today;
  }

  // ✅ FIXED UPCOMING (IMPORTANT)
  if (filterType === 'upcoming') {
    return tx.status !== 'paid'; // keep ALL active (including due)
  }

  return true;
});
const sortedData = [...filteredData].sort((a, b) => {

  const today = new Date();
  today.setHours(0,0,0,0);

  const aDate = new Date(a.due_date);
  aDate.setHours(0,0,0,0);

  const bDate = new Date(b.due_date);
  bDate.setHours(0,0,0,0);

  const aOver = aDate <= today && a.status !== 'paid';
  const bOver = bDate <= today && b.status !== 'paid';

  // 🔥 overdue first
  if (aOver && !bOver) return -1;
  if (!aOver && bOver) return 1;

  // then by nearest due date
  return aDate - bDate;
});
  const renderCard = (tx) => {
    // const displayStatus = isOverdue ? 'due' : tx.status;
    const today = new Date();
today.setHours(0,0,0,0);

const dueDate = new Date(tx.due_date);
dueDate.setHours(0,0,0,0);

// const isOverdue = dueDate <= today; //this is used for Even PAID transactions will show as overdue 😐
const isOverdue = dueDate <= today && tx.status !== 'paid';

const overdueDays = isOverdue
  ? Math.max(1, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)))
  : 0;

const displayStatus = isOverdue ? 'due' : tx.status;

    let totalInterest = tx.base_interest;

    tx.extensions.forEach(ext => {
      totalInterest += ext.extra_interest;
    });

    const total = tx.principal_amount + totalInterest;

    return (
      <div key={tx._id} style={{
        padding: 12,
        borderRadius: 10,
        background: isOverdue ? '#ffe5e5' : '#fff3cd',
border: isOverdue ? '2px solid #f44336' : 'none'
      }}>
        <p style={{ fontWeight: 'bold', color: 'blue' }}>{tx.person_name}({tx.transaction_type})</p>

<p>
  <b>Start:</b>{' '}
  <span style={{ color: 'green' }}>
    {new Date(tx.start_date).toDateString()}
  </span>
</p>

<p>
  <b>Due:</b>{' '}
  <span style={{
    color: tx.status === 'extended' ? '#f44336' : 'black',
    textDecoration: tx.status === 'extended' ? 'line-through' : 'none'
  }}>
    {new Date(tx.due_date).toDateString()}
  </span>
</p>
{isOverdue && (
  <p style={{ color: '#f44336', fontWeight: 'bold' }}>
    ⚠ {overdueDays} day{overdueDays > 1 ? 's' : ''} overdue
  </p>
)}

{tx.extensions?.length > 0 && (
  <p style={{ color: '#f44336', marginLeft: 10 }}>
    {new Date(
      tx.extensions[tx.extensions.length - 1].new_due_date
    ).toDateString()}
  </p>
)}
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
  {tx.status === 'paid' && tx.paid_date && (() => {

  const paid = new Date(tx.paid_date);
  const due = new Date(tx.due_date);

  const isLate = paid > due;

  const diffDays = Math.ceil(
    (paid - due) / (1000 * 60 * 60 * 24)
  );

  return (
    <p style={{
      color: isLate ? '#f44336' : '#4CAF50',
      fontWeight: 'bold'
    }}>
      {isLate
        ? `Paid Late (${diffDays} day${diffDays > 1 ? 's' : ''}) on ${paid.toDateString()}`
        : `Paid on: ${paid.toDateString()}`
      }
    </p>
  );

})()}


<p><b>Principal:</b> {formatCurrency(tx.principal_amount)}</p>
<p><b>Interest:</b> {formatCurrency(totalInterest)}</p>
<p><b>Total {formatCurrency(total)}</b></p>

<div style={{ marginTop: 10, display: 'flex', gap: 8 }}>

  {tx.status === 'paid' ? (
    <button onClick={() =>
      setConfirmAction({ type: 'delete', id: tx._id })
    }>
      Delete
    </button>
  ) : (
    <>
      <button onClick={() =>
        setConfirmAction({ type: 'paid', id: tx._id })
      }>
        Paid
      </button>

      <button onClick={() =>
        setExtendId(tx._id)
      }>
        Extend
      </button>

      <button onClick={() => {
        setEditId(tx._id);
        setEditForm(tx);
      }}>
        Edit
      </button>

      <button onClick={() =>
        setConfirmAction({ type: 'delete', id: tx._id })
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
    <div style={{ padding: 20 }}>
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

      <h2>Rotation Profile</h2>
      <select
  value={filterType}
  onChange={(e) => setFilterType(e.target.value)}
  style={{ marginTop: 10 }}
>
  <option value="upcoming">Upcoming</option>
  <option value="due">Due</option>   {/* ✅ ADD THIS */}
  <option value="paid">Paid</option>
  <option value="extended">Extended</option>
</select>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))',
        gap: 12,
        marginTop: 20
      }}>
        {/* {filteredData.map(renderCard)} */}
        {sortedData.map(renderCard)}
      </div>

      {editId && (
        <div>
          <input
            value={editForm.base_interest}
            onChange={e =>
              setEditForm({ ...editForm, base_interest: e.target.value })
            }
          />
          <button onClick={handleEditSave}>Save</button>
        </div>
      )}

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
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'white',
        padding: 20,
        borderRadius: 10,
        width: 300
      }}
    >
      <h3 style={{ textAlign: 'center' }}>
        Are you sure to {confirmAction.type}?
      </h3>

      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button
          style={{
            flex: 1,
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: 6
          }}
          onClick={async () => {

            if (confirmAction.type === 'delete') {
              await API.delete(`/delete/${confirmAction.id}`);
            }

            else if (confirmAction.type === 'paid') {
              await API.put(`/paid/${confirmAction.id}`, {});
            }

            setConfirmAction(null);
            fetchData();
          }}
        >
          Confirm
        </button>

        <button
          style={{
            flex: 1,
            background: '#f44336',
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: 6
          }}
          onClick={() => setConfirmAction(null)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
{extendId && (
  <div
    onClick={() => setExtendId(null)}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'white',
        padding: 20,
        borderRadius: 10,
        width: 300
      }}
    >
      <h3 style={{ textAlign: 'center', marginBottom: 15 }}>
  Extend Transaction
</h3>

{/* CURRENT DUE */}
<div style={{ marginBottom: 10 }}>
  <p style={{ margin: 0, fontWeight: 'bold' }}>Current Due:</p>
  <p style={{ color: '#f44336', margin: 0 }}>
    {new Date(
      data.find(tx => tx._id === extendId)?.due_date
    ).toDateString()}
  </p>
</div>

{/* EXTEND DATE */}
<div style={{ marginBottom: 10 }}>
  <p style={{ margin: 0 }}>Extend Date:</p>
  <input
    type="date"
    onChange={(e) =>
      setEditForm({
        ...editForm,
        new_due_date: e.target.value
      })
    }
    style={{ width: '100%' }}
  />
</div>

{/* EXTRA INTEREST */}
<div style={{ marginBottom: 10 }}>
  <p style={{ margin: 0 }}>Extra Interest:</p>
  <input
    type="number"
    placeholder="Enter amount"
    onChange={(e) =>
      setEditForm({
        ...editForm,
        extra_interest: Number(e.target.value)
      })
    }
    style={{ width: '100%' }}
  />
</div>

{/* CHECKBOX */}
<label style={{ display: 'block', marginTop: 5 }}>
  <input
    type="checkbox"
    onChange={(e) =>
      setEditForm({
        ...editForm,
        interest_paid: e.target.checked
      })
    }
  />{' '}
  Last Interest Paid
</label>

{/* BUTTONS */}
<div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
  <button
    style={{
      flex: 1,
      background: '#4CAF50',
      color: 'white',
      border: 'none',
      padding: '8px',
      borderRadius: '6px'
    }}
    onClick={async () => {
      await API.put(`/extend/${extendId}`, editForm);
      setExtendId(null);
      fetchData();
    }}
  >
    Save
  </button>

  <button
    style={{
      flex: 1,
      background: '#f44336',
      color: 'white',
      border: 'none',
      padding: '8px',
      borderRadius: '6px'
    }}
    onClick={() => setExtendId(null)}
  >
    Cancel
  </button>
</div>
    </div>
  </div>
)}
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
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'white',
        padding: 20,
        borderRadius: 10,
        width: 300
      }}
    >
      <h3 style={{ textAlign: 'center', marginBottom: 15 }}>
  Edit Transaction
</h3>

{/* TOTAL */}
<div style={{ display:'flex', alignItems:'center', marginBottom:10 }}>
  <p style={{ width:60 }}>Total:</p>
  <input
    type="number"
    value={editForm.principal_amount || ''}
    onChange={(e) =>
      setEditForm({ ...editForm, principal_amount: e.target.value })
    }
    style={{ flex:1 }}
  />
</div>

{/* START */}
<div style={{ display:'flex', alignItems:'center', marginBottom:10 }}>
  <p style={{ width:60 }}>Start:</p>
  <input
    type="date"
    value={editForm.start_date?.substring(0,10) || ''}
    onChange={(e) =>
      setEditForm({ ...editForm, start_date: e.target.value })
    }
    style={{ flex:1 }}
  />
</div>

{/* DUE */}
<div style={{ display:'flex', alignItems:'center', marginBottom:10 }}>
  <p style={{ width:60 }}>Due:</p>
  <input
    type="date"
    value={editForm.due_date?.substring(0,10) || ''}
    onChange={(e) =>
      setEditForm({ ...editForm, due_date: e.target.value })
    }
    style={{ flex:1 }}
  />
</div>

{/* BUTTONS */}
<div style={{ marginTop:10, display:'flex', gap:10 }}>
  <button
    style={{
      flex:1,
      background:'#4CAF50',
      color:'white',
      border:'none',
      padding:'8px',
      borderRadius:'6px'
    }}
    onClick={handleEditSave}
  >
    Save
  </button>

  <button
    style={{
      flex:1,
      background:'#f44336',
      color:'white',
      border:'none',
      padding:'8px',
      borderRadius:'6px'
    }}
    onClick={() => setEditId(null)}
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

export default RotationProfile;