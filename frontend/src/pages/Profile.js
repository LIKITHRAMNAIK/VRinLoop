import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../utils/format';

const card = (color) => ({
  background: color,
  color: 'white',
  padding: '15px',
  borderRadius: '10px',
  textAlign: 'center',
  fontWeight: 'bold'
});

function Profile() {
  const { name } = useParams();
  const navigate = useNavigate(); 
  const [data, setData] = useState(null);
  const [filterType, setFilterType] = useState('upcoming');

  const fetchData = () => {
    API.get(`/person/${name}`)
      .then(res => setData(res.data))
      .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchData();
  }, [name]);

  useEffect(() => {
    if (filterType === 'due') {
      const dueData = data?.transactions.filter(
        tx => new Date(tx.due_date) < new Date()
      );
  
      if (dueData && dueData.length === 0) {
        alert("🎉 No overdue payments!");
      }
    }
  }, [filterType, data]);

  if (!data) return <h2>Loading...</h2>;

  // 🔥 SUMMARY
  let incoming = 0;
  let outgoing = 0;

  data.transactions.forEach(tx => {
    let interest = tx.base_interest;

tx.extensions.forEach(ext => {
  if (ext.interest_paid) {
    interest = ext.extra_interest;
  } else {
    interest += ext.extra_interest;
  }
});

    const total = tx.principal_amount + interest;

    if (tx.type === 'incoming') incoming += total;
    else outgoing += total;
  });

  const net = incoming - outgoing;

  // 🔥 FILTER LOGIC
  let filtered = [...data.transactions];
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

  if (filterType === 'upcoming') {
  filtered = filtered
    .filter(tx => tx.status !== 'paid' && new Date(tx.due_date) >= today)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
}

  const calculateTotal = (tx, uptoIndex) => {
    let totalInterest = tx.base_interest;
  
    for (let i = 0; i <= uptoIndex; i++) {
      const ext = tx.extensions[i];
  
      if (ext.interest_paid) {
        // keep principal + ONLY new interest
        totalInterest = ext.extra_interest;
      } else {
        totalInterest += ext.extra_interest;
      }
    }
  
    return tx.principal_amount + totalInterest;
  };
  const handleUserExport = () => {

    const rows = [];
  
    const sortedData = data.transactions
  .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  
    sortedData.forEach((tx, index, arr) => {
  
      let totalInterest = tx.base_interest;
      tx.extensions.forEach(ext => {
        if (ext.interest_paid) {
          totalInterest = ext.extra_interest;
        } else {
          totalInterest += ext.extra_interest;
        }
      });
  
      const total = tx.principal_amount + totalInterest;
  
      // 🔹 ORIGINAL
      rows.push({
        Name: tx.person_name,
        Type: tx.type,
        Stage: 'Original',
        Principal: tx.principal_amount.toLocaleString('en-IN'),
        Start: new Date(tx.start_date).toLocaleDateString('en-GB'),
        Due: new Date(
          tx.extensions.length > 0
            ? tx.extensions[0].old_due_date
            : tx.due_date
        ).toLocaleDateString('en-GB'),
        Interest: tx.base_interest.toLocaleString('en-IN'),
        Total: (tx.principal_amount + tx.base_interest).toLocaleString('en-IN'),
        Status: tx.status
      });
  
      // 🔹 EXTENSIONS
      tx.extensions.forEach((ext, i) => {
        rows.push({
          Name: tx.person_name,
          Type: tx.type,
          Stage: `Extended ${i + 1}`,
          Principal: tx.principal_amount.toLocaleString('en-IN'),
          Start: new Date(ext.old_due_date).toLocaleDateString('en-GB'),
          Due: new Date(
            i === tx.extensions.length - 1
              ? tx.due_date
              : tx.extensions[i + 1].old_due_date
          ).toLocaleDateString('en-GB'),
          Interest: ext.extra_interest.toLocaleString('en-IN'),
          Total: calculateTotal(tx, i).toLocaleString('en-IN'),
  Status: 'extended'
        });
      });
  
      // 🔥 EMPTY ROW PER TRANSACTION
      const nextTx = arr[index + 1];
      if (!nextTx || nextTx._id !== tx._id) {
        rows.push({
          Name: '',
          Type: '',
          Stage: '',
          Principal: '',
          Start: '',
          Due: '',
          Interest: '',
          Status: ''
        });
      }
  
    });
  
    // 🔥 USER TOTAL ROW
    let totalAmount = 0;
  
    data.transactions.forEach(tx => {
      let totalInterest = tx.base_interest;
      tx.extensions.forEach(ext => {
        if (ext.interest_paid) {
          totalInterest = ext.extra_interest;
        } else {
          totalInterest += ext.extra_interest;
        }
      });
  
      totalAmount += tx.principal_amount + totalInterest;
    });
  
    rows.push({
      Name: 'TOTAL',
      Type: '',
      Stage: '',
      Principal: '',
      Start: '',
      Due: '',
      Interest: '',
      Status: `₹${totalAmount.toLocaleString('en-IN')}`
    });
  
    const csv =
      "💰 MoMaS - User Report\n\n" +
      "Name,Type,Stage,Principal,Start,Due,Interest,Total,Status\n" +
      rows.map(r =>
        Object.values(r)
          .map(val => `"${val}"`)
          .join(",")
      ).join("\n");
  
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
  
    const fileName = data.name || 'user';
a.download = `${fileName}-transactions.csv`;
  
    a.click();
  };

  const handleUserPDF = () => {
    const doc = new jsPDF();
    doc.text(`${name} - Transaction Report`, 14, 15);

    const rows = [];
  
    data.transactions.forEach(tx => {
  
      rows.push([
        tx.person_name,
        tx.type,
        'Original',
        tx.principal_amount.toLocaleString('en-IN'),
        new Date(tx.start_date).toLocaleDateString('en-GB'),
        new Date(tx.due_date).toLocaleDateString('en-GB'),
        tx.base_interest.toLocaleString('en-IN'),
        (tx.principal_amount + tx.base_interest).toLocaleString('en-IN'),
tx.status
      ]);
  
      tx.extensions.forEach((ext, i) => {
        rows.push([
          tx.person_name,
          tx.type,
          `Extended ${i + 1}`,
          tx.principal_amount.toLocaleString('en-IN'),
          new Date(ext.old_due_date).toLocaleDateString('en-GB'),
          new Date(tx.due_date).toLocaleDateString('en-GB'),
          ext.extra_interest.toLocaleString('en-IN'),
calculateTotal(tx, i).toLocaleString('en-IN'),
'extended'
        ]);
      });
  
      rows.push(['', '', '', '', '', '', '', '']);
    });
  
    autoTable(doc, {
      head: [['Name', 'Type', 'Stage', 'Principal', 'Start', 'Due', 'Interest', 'Total', 'Status']],
      body: rows
    });
  
    doc.save(`${name}-transactions.pdf`);
  };

  const renderCard = (tx) => {

  // ✅ NORMAL CARD
  if (tx.transaction_type === 'normal') {
    return (
      <div key={tx._id} style={{
        padding: 12,
        borderRadius: 10,
        background: '#e3f2fd'
      }}>

        {/* HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          
          <h4 style={{ margin: 0 }}>Normal</h4>

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
          {/* 🔥 PRINCIPAL BELOW HEADER */}
<p style={{
  margin: '6px 0',
  fontWeight: 'bold'
}}>
  Principal: {formatCurrency(tx.principal_amount)}
</p>
        <p style={{ color: '#4CAF50', fontWeight: 500 }}>
  Start: {new Date(tx.start_date).toDateString()}
</p>

        <p style={{ color: '#f44336', fontWeight: 500 }}>
  Due: {new Date(tx.due_date).toDateString()}
</p>
        {/* 🔥 INSTALLMENT HISTORY */}
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


        {/* 🔥 PAID DATE (ADD THIS) */}
{tx.status === 'paid' && tx.paid_date && (() => {

  const paid = new Date(tx.paid_date);
  const due = new Date(tx.due_date);

  const isLate = paid > due;

  const diffDays = Math.ceil((paid - due) / (1000 * 60 * 60 * 24));

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
        {/* ✅ PAID BOX */}
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

        {/* <p><b>Total {formatCurrency(tx.principal_amount)}</b></p> */}
        {/* <p style={{ marginTop: 6, fontWeight: 'bold' }}>
  Balance: {formatCurrency(
    tx.principal_amount - (tx.paid_amount || 0)
  )}
</p> */}

{tx.status !== 'paid' && (
  <p style={{ marginTop: 6, fontWeight: 'bold' }}>
    Balance: {formatCurrency(
      tx.principal_amount - (tx.paid_amount || 0)
    )}
  </p>
)}

      </div>
    );
  }

  // ✅ ROTATION CARD (KEEP YOUR OLD LOGIC)
  let totalInterest = tx.base_interest;

  tx.extensions.forEach(ext => {
    if (ext.interest_paid) {
      totalInterest = ext.extra_interest;
    } else {
      totalInterest += ext.extra_interest;
    }
  });

  const total = tx.principal_amount + totalInterest;

  return (
  <div key={tx._id} style={{
    padding: 12,
    borderRadius: 10,
    background: '#fff3cd',
    position: 'relative'   // ✅ IMPORTANT
  }}>

    {/* 🔥 IN / OUT BADGE (SAME AS DASHBOARD) */}
    <span style={{
      position: 'absolute',
      top: 10,
      right: 10,
      background: tx.type === 'incoming' ? '#4CAF50' : '#f44336',
      color: 'white',
      padding: '4px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 'bold'
    }}>
      {tx.type === 'incoming' ? 'IN' : 'OUT'}
    </span>

    {/* NAME */}
    <p style={{ fontWeight: 'bold', color: 'blue' }}>
      Rotation
    </p>

    {/* DATES */}
    <p>Start: {new Date(tx.start_date).toDateString()}</p>
    <p>Due: {new Date(tx.due_date).toDateString()}</p>
    

    {/* DATA */}
    <p>Status: {tx.status}</p>
    <p>Principal {formatCurrency(tx.principal_amount)}</p>
    <p>Interest {formatCurrency(totalInterest)}</p>
    <p><b>Total {formatCurrency(total)}</b></p>

  </div>
);
};
  return (
    <div style={{ padding: 20 }}>
      <button
  onClick={() => navigate('/')}
  style={{
    marginBottom: 10,
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#3f51b5',
    color: 'white',
    cursor: 'pointer'
  }}
>
  ⬅ Back to Dashboard
</button>
      <h1>{name}'s Profile</h1>

      <button
  onClick={handleUserExport}
  style={{
    marginTop: 10,
    marginBottom: 10,
    padding: '8px 12px',
    cursor: 'pointer'
  }}
>
  Export This User
</button>
<button
  onClick={handleUserPDF}
  style={{
    marginBottom: 10,
    padding: '8px 12px',
    cursor: 'pointer'
  }}
>
  Export PDF
</button>

      {/* 🔥 SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <div style={card('#4CAF50')}>Incoming {formatCurrency(incoming)}</div>
        <div style={card('#F44336')}>Outgoing {formatCurrency(outgoing)}</div>
        <div style={card(net >= 0 ? '#009688' : '#D32F2F')}>
          Net {formatCurrency(net)}
        </div>
      </div>

      {/* 🔥 FILTER */}
      <div style={{ marginTop: 20 }}>
        <select onChange={(e) => setFilterType(e.target.value)}>
          <option value="upcoming">Upcoming (Default)</option>
          <option value="paid">Paid</option>
          <option value="extended">Extended</option>
          <option value="due">Due / Overdue</option>
        </select>
      </div>

      {filterType === 'due' && filtered.length === 0 && (
  <div style={{
    padding: 20,
    background: '#e8f5e9',
    borderRadius: 10,
    marginTop: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'green'
  }}>
    🎉 No overdue payments
  </div>
)}

      {/* 🔥 CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))',
        gap: 12,
        marginTop: 20
      }}>
        {filtered.map(renderCard)}
      </div>
    </div>
  );
}

export default Profile;