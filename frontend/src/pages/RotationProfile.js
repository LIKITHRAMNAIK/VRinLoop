import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { formatCurrency } from '../utils/format';

// function RotationProfile() {
function RotationProfile({ data, refresh }) {
  const navigate = useNavigate();

  // const [data, setData] = useState([]);
  const [extendId, setExtendId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const [payPopup, setPayPopup] = useState(null);

const [earlyPayPopup, setEarlyPayPopup] = useState(null);

const [earlyInterest, setEarlyInterest] = useState('');
const [normalPayPopup, setNormalPayPopup] = useState(null);
  const [filterType, setFilterType] = useState('upcoming');

  if (!data) return <h2>Loading...</h2>;

  const handleDelete = async () => {
    await API.delete(`/delete/${confirmAction.id}`);
    setConfirmAction(null);
    refresh();
  };

  const handleEditSave = async () => {
    await API.put(`/update/${editId}`, editForm);
    setEditId(null);
    refresh();
  };
const today = new Date();
today.setHours(0,0,0,0);

const filteredData = data.filter(tx => {
  const dueDate = new Date(tx.due_date);
  dueDate.setHours(0,0,0,0);

  if (filterType === 'paid') {
  return tx.status === 'paid';
}

if (filterType === 'extended') {

  return tx.extensions?.length > 0;

}

if (filterType === 'due') {

  return (
    dueDate < today &&
    tx.status !== 'extended' &&
    (
      tx.status !== 'paid' ||
      (
        tx.status === 'paid' &&
        new Date(tx.paid_date) > dueDate
      )
    )
  );

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

const latestDueDate =
  tx.extensions?.length > 0
    ? tx.due_date
    : tx.due_date;

const dueDate = new Date(latestDueDate);

dueDate.setHours(0,0,0,0);

const isOverdue =
  dueDate < today &&
  tx.status !== 'paid' &&
  tx.status !== 'extended';

const overdueDays = isOverdue
  ? Math.max(1, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)))
  : 0;

const displayStatus = isOverdue ? 'due' : tx.status;

    let totalInterest = tx.base_interest;

tx.extensions.forEach(ext => {

  if (ext.interest_paid) {

    totalInterest = ext.extra_interest;

  } else {

    totalInterest += ext.extra_interest;

  }

});
    const finalInterest =
  tx.early_paid
    ? tx.early_paid_interest
    : totalInterest;

const total = tx.principal_amount + finalInterest;

    return (
      <div key={tx._id} style={{
        padding: 12,
        borderRadius: 10,
        background: isOverdue ? '#ffe5e5' : '#fff3cd',
border: isOverdue ? '2px solid #f44336' : 'none'
      }}>
        <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8
}}>

  <p style={{
    fontWeight: 'bold',
    color: 'blue',
    margin: 0
  }}>
    {tx.person_name}
  </p>

  <span style={{
    background:
      tx.type === 'incoming'
        ? '#4CAF50'
        : '#f44336',

    color: 'white',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold'
  }}>
    {tx.type === 'incoming' ? 'IN' : 'OUT'}
  </span>

</div>

<p>
  <b>Start:</b>{' '}
  <span style={{ color: 'green' }}>
    {new Date(tx.start_date).toDateString()}
  </span>
</p>

<p>
  <b>Due:</b>{' '}

  <span
    style={{
      color:
        tx.extensions?.length > 0
          ? '#f44336'
          : 'black',

      textDecoration:
        tx.extensions?.length > 0
          ? 'line-through'
          : 'none'
    }}
  >
    {
      tx.extensions?.length > 0
        ? new Date(
            tx.extensions[0].old_due_date
          ).toDateString()
        : new Date(tx.due_date).toDateString()
    }
  </span>
</p>

{tx.extensions?.length > 0 && (
  <p style={{
    color: '#f44336',
    marginLeft: 10,
    fontWeight: 'bold'
  }}>
    {
      new Date(
        tx.extensions[
          tx.extensions.length - 1
        ].new_due_date
      ).toDateString()
    }
  </p>
)}
{isOverdue && (
  <p style={{ color: '#f44336', fontWeight: 'bold' }}>
    ⚠ {overdueDays} day{overdueDays > 1 ? 's' : ''} overdue
  </p>
)}

{/* {tx.status === 'extended' &&
 tx.extensions?.length > 0 && (
  <p style={{
    color: '#f44336',
    marginLeft: 10,
    fontWeight: 'bold'
  }}>
    {
      new Date(
        tx.extensions[
          tx.extensions.length - 1
        ].new_due_date
      ).toDateString()
    }
  </p>
)} */}
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
    Paid
  </div>
)}
{tx.status !== 'paid' && (
  <p style={{
    margin: '6px 0',
    fontWeight: 'bold'
  }}>
    <span style={{ color: 'black' }}>
      Status :
    </span>{' '}

    <span style={{
      color:
        displayStatus === 'due'
          ? '#f44336'
          : displayStatus === 'extended'
          ? '#ff0000'
          : '#f39521'
    }}>
      {displayStatus.toUpperCase()}
    </span>
  </p>
)}

    {tx.status === 'paid' && tx.paid_date && (() => {

  const paid = new Date(tx.paid_date);
  const due = new Date(tx.due_date);

  const isLate = paid > due;

  paid.setHours(0,0,0,0);
due.setHours(0,0,0,0);

const diffDays = Math.max(
  1,
  Math.round(
    (paid - due) / (1000 * 60 * 60 * 24)
  )
);

  return (
    <p style={{
      color:
        tx.early_paid
          ? '#ff9800'
          : isLate
          ? '#f44336'
          : '#4CAF50',
      fontWeight: 'bold'
    }}>
      {tx.early_paid
        ? `Early Pay on: ${paid.toDateString()}`
        : isLate
        ? `Paid Late (${diffDays} day${diffDays > 1 ? 's' : ''}) on ${paid.toDateString()}`
        : `Paid on: ${paid.toDateString()}`
      }
    </p>
  );

})()}


<p><b>Principal:</b> {formatCurrency(tx.principal_amount)}</p>
{/* <p><b>Interest:</b> {formatCurrency(totalInterest)}</p> */}
{tx.early_paid && (
  <p>
    <b>Normal Interest:</b>{' '}
    {formatCurrency(totalInterest)}
  </p>
)}

<p>
  <b>
    {tx.early_paid
      ? 'Early Paid Interest'
      : 'Interest'}
    :
  </b>{' '}
  {formatCurrency(finalInterest)}
</p>

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
      <button
  style={{
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 6,
    cursor: 'pointer'
  }}
  onClick={() => setPayPopup(tx)}
>
  Pay
</button>

      <button onClick={() =>
        setExtendId(tx._id)
      }>
        Extend
      </button>

      <button onClick={() => {
        setEditId(tx._id);

setEditForm({
  ...tx,

  due_date: tx.due_date
});
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

      <h2>Rotation Profile</h2> */}
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
            refresh();
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
      refresh();
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
{payPopup && (
  <div
    onClick={() => setPayPopup(null)}
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
        padding: 25,
        borderRadius: 14,
        width: 320,
        textAlign: 'center',
        boxShadow: '0 5px 25px rgba(0,0,0,0.3)'
      }}
    >

      <h2 style={{ marginBottom: 20 }}>
        Select Payment Type
      </h2>

      {/* NORMAL PAY */}
      <button
        style={{
          width: '100%',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '12px',
          borderRadius: 8,
          fontWeight: 'bold',
          cursor: 'pointer',
          marginBottom: 12
        }}
        onClick={() => {
  setNormalPayPopup(payPopup);
  setPayPopup(null);
}}
      >
        Normal Due Pay
      </button>

      {/* EARLY PAY */}
      <button
        style={{
          width: '100%',
          background: '#ff9800',
          color: 'white',
          border: 'none',
          padding: '12px',
          borderRadius: 8,
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
        onClick={() => {
          setEarlyPayPopup(payPopup);
          setPayPopup(null);
        }}
      >
        Early Pay
      </button>

      {/* CANCEL */}
      <button
        style={{
          width: '100%',
          background: '#f44336',
          color: 'white',
          border: 'none',
          padding: '10px',
          borderRadius: 8,
          fontWeight: 'bold',
          cursor: 'pointer',
          marginTop: 15
        }}
        onClick={() => setPayPopup(null)}
      >
        Cancel
      </button>

    </div>
  </div>
)}

{earlyPayPopup && (
  <div
    onClick={() => setEarlyPayPopup(null)}
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
        padding: 25,
        borderRadius: 14,
        width: 340,
        boxShadow: '0 5px 25px rgba(0,0,0,0.3)'
      }}
    >

      <h2 style={{
        textAlign: 'center',
        marginBottom: 20
      }}>
        Early Payment
      </h2>

      <p>
        <b>Principal:</b>{' '}
        {formatCurrency(earlyPayPopup.principal_amount)}
      </p>

      <p>
        <b>Original Interest:</b>{' '}
        {formatCurrency(earlyPayPopup.base_interest)}
      </p>

      <p>
  <b>Original Due:</b>{' '}

  {
  earlyPayPopup.extensions?.length > 0
    ? new Date(
        earlyPayPopup.extensions[0].old_due_date
      ).toDateString()
    : new Date(
        earlyPayPopup.due_date
      ).toDateString()
}
</p>

{earlyPayPopup.extensions?.length > 0 && (
  <p style={{
    color: '#f44336',
    fontWeight: 'bold'
  }}>
    <b>Extended Due:</b>{' '}
    {
      new Date(
        earlyPayPopup.extensions[
  earlyPayPopup.extensions.length - 1
].new_due_date
      ).toDateString()
    }
  </p>
)}

      <input
        type="number"
        placeholder="Enter New Interest"
        value={earlyInterest}
        onChange={(e) =>
          setEarlyInterest(e.target.value)
        }
        style={{
          width: '100%',
          padding: 10,
          marginTop: 15,
          marginBottom: 15,
          borderRadius: 8,
          border: '1px solid #ccc'
        }}
      />

      <div style={{
        display: 'flex',
        gap: 10
      }}>

        <button
          style={{
            flex: 1,
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: 8,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          onClick={async () => {
            console.log({
  earlyPay: true,
  newInterest: Number(earlyInterest)
});

            await API.put(
              `/paid/${earlyPayPopup._id}`,
              {
                earlyPay: true,
                newInterest: Number(earlyInterest)
              }
            );

            setEarlyPayPopup(null);
            setEarlyInterest('');

            refresh();
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
            padding: '10px',
            borderRadius: 8,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          onClick={() => {
            setEarlyPayPopup(null);
            setEarlyInterest('');
          }}
        >
          Cancel
        </button>

      </div>

    </div>
  </div>
)}

{normalPayPopup && (
  <div
    onClick={() => setNormalPayPopup(null)}
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
        padding: 25,
        borderRadius: 14,
        width: 300,
        textAlign: 'center'
      }}
    >

      <h2>Confirm Payment?</h2>

      <div style={{
        display: 'flex',
        gap: 10,
        marginTop: 20
      }}>

        <button
          style={{
            flex: 1,
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: 10,
            borderRadius: 8,
            fontWeight: 'bold'
          }}
          onClick={async () => {

            await API.put(
              `/paid/${normalPayPopup._id}`,
              {}
            );

            setNormalPayPopup(null);

            refresh();
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
            padding: 10,
            borderRadius: 8,
            fontWeight: 'bold'
          }}
          onClick={() => setNormalPayPopup(null)}
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