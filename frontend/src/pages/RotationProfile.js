import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { formatCurrency } from '../utils/format';

// function RotationProfile() {
function RotationProfile({ data, refresh }) {

  const [extendForm, setExtendForm] = useState({
  new_due_date: '',
  extra_interest: 0,
  interest_paid: false
});
  const navigate = useNavigate();
  const [detailsPopup, setDetailsPopup] = useState(null);

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

const miniStatCard = {

  background: '#ffffff',

  padding: 10,

  borderRadius: 14

};

const miniStatTitle = {

  margin: 0,

  color: '#64748b',

  fontSize: 11

};

const miniStatValue = {

  margin: '6px 0 0',

  color: '#0f172a',

  fontSize: 18

};

const miniButtonStyle = {

  color: 'white',

  border: 'none',

  padding: '10px 14px',

  borderRadius: 12,

  fontWeight: 'bold',

  cursor: 'pointer',

  fontSize: 13
};

  const renderCard = (tx) => {
    const today = new Date();
today.setHours(0,0,0,0);

const latestDueDate =

  tx.status === 'paid'

    ? (
        tx.final_due_date ||
        tx.due_date
      )

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

    const finalInterest =

  tx.status === 'paid'

    ? Number(tx.final_interest || 0)

    : (() => {

        let interest =
          Number(tx.base_interest || 0);

        tx.extensions?.forEach(ext => {

          if (ext.interest_paid) {

            interest =
              Number(ext.extra_interest || 0);

          } else {

            interest +=
              Number(ext.extra_interest || 0);

          }

        });

        return interest;

      })();

const total =

  tx.status === 'paid'

    ? Number(tx.final_total || 0)

    : (
        Number(tx.principal_amount || 0) +
        Number(finalInterest || 0)
      );

    return (
    
    <div
      key={tx._id}
      style={{
        background:
          isOverdue
            ? '#ffe5e5'
            : tx.status === 'paid'
            ? '#e8f5e9'
            : '#f6edcf',
    
        border: isOverdue
          ? '2px solid #ef4444'
          : '1px solid #ececec',
    
        borderRadius: 20,
    
        padding: 14,
    
        position: 'relative',
    
        minHeight: 340,
width: '100%',
maxWidth: '100%',
    
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
      }}
    >
    
      {/* TOP */}
      <div>
    
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
    
          <h4
            onClick={() => {
              navigate(`/profile/${tx.person_name}`, {
                state: { type: tx.transaction_type }
              });
            }}
            style={{
              margin: 0,
              color: '#2563eb',
              cursor: 'pointer',
              fontSize: 17,
              fontWeight: '700'
            }}
          >
            {tx.person_name}
          </h4>
    
          <span style={{
            background:
              tx.type === 'incoming'
                ? '#67b357'
                : '#ef4444',
    
            color: 'white',
    
            padding: '6px 14px',
    
            borderRadius: 999,
    
            fontSize: 13,
    
            fontWeight: 'bold'
          }}>
            {tx.type === 'incoming' ? 'IN' : 'OUT'}
          </span>
    
        </div>
    
        {/* DUE DATE */}
    
    <div style={{
      marginTop: 8
    }}>
    
    {/* START DATE */}
    
      <p style={{
        margin: 0,
        color: '#3f9c35',
        fontWeight: 700,
        fontSize: 13
      }}>
    
        Start:
        {' '}
    
        {new Date(
          tx.start_date
        ).toDateString()}
    
      </p>
      {/* ORIGINAL DUE */}
    
      <p style={{
        margin: 0,
        color:
          tx.extensions?.length > 0
            ? '#dc2626'
            : '#111827',
    
        fontWeight: 600,
        fontSize: 13,
    
        textDecoration:
          tx.extensions?.length > 0
            ? 'line-through'
            : 'none'
      }}>
    
        Due:
        {' '}
    
        {new Date(
          tx.extensions?.length > 0
            ? tx.extensions[0].old_due_date
            : tx.due_date
        ).toDateString()}
    
      </p>
    
      {/* PREVIOUS EXTENSIONS */}
    
      {tx.extensions?.map((ext, index) => {
    
        const isLast =
          index === tx.extensions.length - 1;
    
        return (
    
          <p
            key={index}
            style={{
              marginTop: 6,
              marginBottom: 0,
    
              color:
                isLast
                  ? '#7c3aed'
                  : '#dc2626',
    
              fontWeight: 'bold',
    
              fontSize: 13,
    
              textDecoration:
                isLast
                  ? 'none'
                  : 'line-through'
            }}
          >
    
            {
    
              isLast
    
                ? 'New Due: '
    
                : 'Due: '
    
            }
    
            {
    
              new Date(
                ext.new_due_date
              ).toDateString()
    
            }
    
          </p>
    
        );
    
      })}
    
    </div>
    
        {/* STATUS */}
        <div style={{
          marginTop: 16
        }}>
    
          <span style={{
            background:
              displayStatus === 'paid'
                ? '#16a34a'
                : '#f0a83a',
    
            color: 'white',
    
            padding: '7px 16px',
    
            borderRadius: 999,
    
            fontWeight: 'bold',
    
            fontSize: 12,
    
            letterSpacing: 1
          }}>
            {displayStatus.toUpperCase()}
          </span>
    
        </div>
    
        {/* OVERDUE */}
        {isOverdue && (
    
          <div style={{
            marginTop: 14,
            color: '#dc2626',
            fontWeight: 'bold',
            fontSize: 13
          }}>
            ⚠ {overdueDays} days overdue
          </div>
    
        )}
    
        {/* STATS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          marginTop: 16
        }}>
    
          <div style={miniStatCard}>
            <p style={miniStatTitle}>Principal</p>
            <h4 style={miniStatValue}>
              {formatCurrency(tx.principal_amount)}
            </h4>
          </div>
    
          <div style={miniStatCard}>
            <p style={miniStatTitle}>Interest</p>
            <h4 style={miniStatValue}>
              {formatCurrency(finalInterest)}
            </h4>
          </div>
    
          <div style={{
            ...miniStatCard,
            background: '#0f172a'
          }}>
            <p style={{
              ...miniStatTitle,
              color: '#cbd5e1'
            }}>
              Total
            </p>
    
            <h4 style={{
              ...miniStatValue,
              color: 'white'
            }}>
              {formatCurrency(total)}
            </h4>
          </div>
    
        </div>
    
      </div>
    
      {/* BUTTONS */}
      {tx.status !== 'paid' ? (
    
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginTop: 16
        }}>
    
          <button
            style={{
              ...miniButtonStyle,
              background: '#2563eb'
            }}
            onClick={() => {
    
              const today = new Date();
              const dueDate = new Date(tx.due_date);
    
              today.setHours(0,0,0,0);
              dueDate.setHours(0,0,0,0);
    
              if (today < dueDate) {
                setPayPopup(tx);
              } else {
                setNormalPayPopup(tx);
              }
    
            }}
          >
            Pay
          </button>
    
          <button
            style={{
              ...miniButtonStyle,
              background: '#f59e0b'
            }}
            onClick={() =>
  setExtendId(tx._id)
}
          >
            Extend
          </button>
    
          <button
            style={{
              ...miniButtonStyle,
              background: '#0f172a'
            }}
            onClick={() => {

  setEditId(tx._id);

  setEditForm({
    ...tx,
    due_date: tx.due_date
  });

}}
          >
            Edit
          </button>
    
          <button
            style={{
              ...miniButtonStyle,
              background: '#ef4444'
            }}
            onClick={() =>
              setConfirmAction({
                type: 'delete',
                id: tx._id
              })
            }
          >
            Delete
          </button>
    
        </div>

) : (

  <div style={{
    marginTop: 16
  }}>

    <button
      style={{
        ...miniButtonStyle,
        background: '#ef4444',
        width: '100%'
      }}
      onClick={() =>
        setConfirmAction({
          type: 'delete',
          id: tx._id
        })
      }
    >
      Delete
    </button>

  </div>

)}
      <div style={{
  display: 'flex',
  justifyContent: 'center',
  marginTop: 14
}}>

<button
  style={{
    background: '#7c3aed',
    color: 'white',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 'bold'
  }}
  onClick={() => setDetailsPopup(tx)}
>

  More Details

</button>

</div>
    
    </div>
    
    );
  };

  return (
    <div>
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
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))',
  gap: 40,
  padding: 12,
  marginTop: 20
}}>
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
  setExtendForm({
    ...extendForm,
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
  setExtendForm({
    ...extendForm,
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
  setExtendForm({
    ...extendForm,
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
      await API.put(`/extend/${extendId}`, extendForm);
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

{detailsPopup && (

  <div
    onClick={() => setDetailsPopup(null)}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.55)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}
  >

    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: '420px',
        maxHeight: '85vh',
        overflowY: 'auto',
        background: 'white',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 10px 40px rgba(0,0,0,0.25)'
      }}
    >

      <h2 style={{
        marginTop: 0,
        marginBottom: 20,
        color: '#7c3aed',
        textAlign: 'center'
      }}>
        Transaction Details
      </h2>

      {/* STATUS */}
      <div style={{
        background: '#f3f4f6',
        padding: 14,
        borderRadius: 12,
        marginBottom: 15
      }}>
        <p><b>Status:</b> {detailsPopup.status}</p>

        <p>
          <b>Paid Date:</b><br />
          {
            detailsPopup.paid_date
              ? new Date(detailsPopup.paid_date).toDateString()
              : 'Not Paid'
          }
        </p>

        <p>
          <b>Final Interest:</b><br />
          ₹{detailsPopup.final_interest || 0}
        </p>

        <p>
          <b>Final Total:</b><br />
          ₹{detailsPopup.final_total || 0}
        </p>
      </div>

      {/* EXTENSIONS */}
      <div>

        <h3 style={{
          color: '#2563eb',
          marginBottom: 14
        }}>
          Extensions
        </h3>

        {

          detailsPopup.final_extensions?.length > 0

            ? detailsPopup.final_extensions.map((ext, index) => (

                <div
                  key={index}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 12
                  }}
                >

                  <h4 style={{
                    marginTop: 0,
                    color: '#7c3aed'
                  }}>
                    #{index + 1}
                  </h4>

                  <p>
                    <b>Old Due:</b><br />
                    {
                      ext.old_due_date
                        ? new Date(ext.old_due_date).toDateString()
                        : 'N/A'
                    }
                  </p>

                  <p>
                    <b>New Due:</b><br />
                    {
                      ext.new_due_date
                        ? new Date(ext.new_due_date).toDateString()
                        : 'N/A'
                    }
                  </p>

                  <p>
                    <b>Extra Interest:</b><br />
                    ₹{ext.extra_interest || 0}
                  </p>

                  <p>
                    <b>Interest Paid:</b><br />
                    {
                      ext.interest_paid
                        ? 'YES'
                        : 'NO'
                    }
                  </p>

                </div>

              ))

            : (

              <div style={{
                background: '#f8fafc',
                padding: 15,
                borderRadius: 12,
                textAlign: 'center',
                color: '#64748b'
              }}>
                No Extension History
              </div>

            )

        }

      </div>

      <button
        onClick={() => setDetailsPopup(null)}
        style={{
          width: '100%',
          marginTop: 18,
          background: '#ef4444',
          color: 'white',
          border: 'none',
          padding: '12px',
          borderRadius: 12,
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: 15
        }}
      >
        Close
      </button>

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