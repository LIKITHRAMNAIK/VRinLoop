import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../utils/format';




const getColor = (name) => {
  const colors = ['#e3f2fd', '#fce4ec', '#e8f5e9', '#fff3e0'];
  return colors[name.charCodeAt(0) % colors.length];
};

function TransactionList({ refresh }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [selectedName, setSelectedName] = useState('all');
  const [showAlert, setShowAlert] = useState(true);

  const [confirmAction, setConfirmAction] = useState(null);

  const [filterType, setFilterType] = useState('upcoming');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [sortType, setSortType] = useState('date');

  const [payId, setPayId] = useState(null);
const [payType, setPayType] = useState('');
const [payAmount, setPayAmount] = useState(0);

const [showExportPopup, setShowExportPopup] = useState(false);
const [exportType, setExportType] = useState('all'); // all | normal | rotation
const [exportMonth, setExportMonth] = useState('');

  // ✅ EDIT STATE
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    principal_amount: 0,
    base_interest: 0,
    start_date: '',
    due_date: ''
  });

  // ✅ EXTEND STATE
  const [extendId, setExtendId] = useState(null);
  const [extendForm, setExtendForm] = useState({
    new_due_date: '',
    extra_interest: 0,
    interest_paid: false
  });

  // ✅ POPUP STATE
  const [showNoDuePopup, setShowNoDuePopup] = useState(false);

  const today = new Date();
  const dueTransactions = data.filter(
    tx => new Date(tx.due_date) < today && tx.status !== 'paid'
  );
  const upcomingTransactions = data
  .filter(tx => {
    const due = new Date(tx.due_date);
    const diff = (due - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7 && tx.status !== 'paid';
  })
  .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));  // ✅ SORT ADDED

  const badgeStyle = (bg) => ({
    background: bg,
    color: 'white',
    padding: '5px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  });

  // ✅ COUNTS
  const pendingCount = data.filter(tx => tx.status !== 'paid').length;
  const paidCount = data.filter(tx => tx.status === 'paid').length;
  const extendedCount = data.filter(tx => tx.extensions.length > 0).length;
  const dueCount = data.filter(
    tx => new Date(tx.due_date) < today && tx.status !== 'paid'
  ).length;

  const totalDueAmount = data
  .filter(tx => new Date(tx.due_date) < today && tx.status !== 'paid')
  .reduce((sum, tx) => {
    let totalInterest = tx.base_interest;

    tx.extensions.forEach(ext => {
      if (ext.interest_paid) {
        totalInterest = ext.extra_interest;
      } else {
        totalInterest += ext.extra_interest;
      }
    });

    return sum + tx.principal_amount + totalInterest;
  }, 0);

  const fetchData = () => {
    API.get('/')
      .then(res => setData(res.data))
      .catch(err => console.log(err));
  };

  const names = [
    'All Users',
    ...Array.from(
      new Map(
        data.map(tx => [
          tx.person_name.toLowerCase(),
          tx.person_name
        ])
      ).values()
    )
  ];

  useEffect(() => {
    fetchData();
  }, [refresh]);

  useEffect(() => {
    if (filterType === 'due' && dueCount === 0) {
      setShowNoDuePopup(true);
  
      setTimeout(() => {
        setShowNoDuePopup(false);
      }, 2000);
    }
  }, [filterType, dueCount]);

  // ✅ ACTIONS
  const handlePaid = async (id) => {
    await API.put(`/paid/${id}`);
    fetchData();
  };

  const handleDelete = (id) => {
    setConfirmAction({
      type: 'delete',
      id
    });
  };

  const executeAction = async () => {
  if (!confirmAction) return;

  const { type, id, tx } = confirmAction;

  // 🔥 GET TRANSACTION TYPE
  const txData = data.find(t => t._id === id);
  const transactionType = txData?.transaction_type || 'rotation';

  // ✅ NORMAL → OPEN PAYMENT POPUP (NO CONFIRM)
  if (type === 'paid' && transactionType === 'normal') {
    setPayId(id);
    setConfirmAction(null);
    return;
  }

  try {
    if (type === 'delete') {
      await API.delete(`/delete/${id}`);
    }

    if (type === 'paid') {
      await API.put(`/paid/${id}`);
    }

    if (type === 'extend') {
      setExtendId(id);
      setConfirmAction(null);
      return;
    }

    if (type === 'edit') {
      setEditId(id);
      setConfirmAction(null);
      return;
    }

    setConfirmAction(null);
    fetchData();

  } catch (err) {
    console.log(err);
    setConfirmAction(null);
  }
};

  const handleExport = (type, month) => {

    const rows = [];
  
    let filteredSortedData = [...data];

// ✅ TYPE FILTER
if (type === 'normal') {
  filteredSortedData = filteredSortedData.filter(tx => tx.transaction_type === 'normal');
}

if (type === 'rotation') {
  filteredSortedData = filteredSortedData.filter(tx => tx.transaction_type !== 'normal');
}

// ✅ MONTH FILTER
if (month) {
  filteredSortedData = filteredSortedData.filter(tx => {
    const txDate = new Date(tx.start_date);
    return txDate.toISOString().slice(0, 7) === month;
  });
}
  
    // 🔥 MAIN EXPORT LOGIC
filteredSortedData.forEach((tx, index, arr) => {

  // 👉 logic used: detect single full payment
  let isSinglePayment =
    tx.installments?.length === 1 &&
    Number(tx.installments[0].amount) >= tx.principal_amount;

  // ================= SINGLE PAYMENT =================
  if (isSinglePayment) {

    const inst = tx.installments[0];

    rows.push([
      // 👉 logic used: show type inside name column
`${tx.person_name} (${tx.transaction_type === 'normal' ? 'Normal' : 'Rotation'})`,
      tx.type,
      'Original',
      tx.principal_amount.toLocaleString('en-IN'),
      new Date(tx.start_date).toLocaleDateString('en-GB'),
      new Date(tx.due_date).toLocaleDateString('en-GB'),

      '', // 👉 logic used: remove interest
      tx.principal_amount.toLocaleString('en-IN'),

      inst.amount.toLocaleString('en-IN'),
      '0',

      new Date(inst.date).toLocaleDateString('en-GB'),
      'single payment',

      'paid'
    ]);

  }

  // ================= MULTIPLE INSTALLMENTS =================
  else {

    // 👉 logic used: base row (no payment data)
    rows.push([
      // 👉 logic used: show type inside name column
`${tx.person_name} (${tx.transaction_type === 'normal' ? 'Normal' : 'Rotation'})`,
      tx.type,
      'Original',
      tx.principal_amount.toLocaleString('en-IN'),
      new Date(tx.start_date).toLocaleDateString('en-GB'),
      new Date(tx.due_date).toLocaleDateString('en-GB'),

      '', // no interest
      tx.principal_amount.toLocaleString('en-IN'),

      '', '', '', '',
      tx.status
    ]);

    // 👉 logic used: running balance calculation
    let runningPaid = 0;

    tx.installments?.forEach((inst, i) => {
      runningPaid += Number(inst.amount);

      rows.push([
        '',
        '',
        `Payment ${i + 1}`,
        '',
        '',
        '',
        '',
        '',

        inst.amount.toLocaleString('en-IN'),
        (tx.principal_amount - runningPaid).toLocaleString('en-IN'),

        new Date(inst.date).toLocaleDateString('en-GB'),
        `₹${inst.amount}`,

        runningPaid >= tx.principal_amount ? 'paid' : 'partial'
      ]);
    });

  }

  // 👉 logic used: add gap only between different transactions
  const nextTx = arr[index + 1];

  if (
  !nextTx ||
  nextTx.person_name !== tx.person_name ||
  nextTx._id !== tx._id
){
    if (tx.installments?.length > 0) {
  rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '']);
}
  }

});
  
    // 👉 logic used: dynamic header based on export type
const nameHeader =
  type === 'normal'
    ? 'Name (Normal)'
    : type === 'rotation'
    ? 'Name (Rotation)'
    : 'Name (All)';

const csv =
  `${getReportTitle(type, month)}\n` +
  "Generated Transactions Report\n\n" +
  `${nameHeader},Type,Stage,Principal,Start,Due,Interest,Total,Paid,Balance,Paid Date,Installments,Status\n` +
  rows.map(r =>
    Object.values(r)
      .map(val => `"${val}"`)
      .join(",")
  ).join("\n");
  
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
  
    // ✅ TYPE NAME
let fileType = 'all';

if (type === 'normal') fileType = 'normal';
if (type === 'rotation') fileType = 'rotation';

// ✅ MONTH NAME
let fileMonth = '';
if (month) {
  const date = new Date(month + '-01');
  const m = date.toLocaleString('default', { month: 'short' });
  const y = date.getFullYear();
  fileMonth = `-${m}-${y}`;
}

// ✅ FINAL NAME
a.download = `${fileType}-transactions${fileMonth}.csv`;
    a.click();
  };
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
  const getReportTitle = (type, month) => {

  let typeName = 'All Transactions';

  if (type === 'normal') typeName = 'Normal Transactions';
  if (type === 'rotation') typeName = 'Rotation Transactions';

  let monthText = '';

  if (month) {
    const date = new Date(month + '-01');
    const m = date.toLocaleString('default', { month: 'long' });
    const y = date.getFullYear();
    monthText = ` - ${m} ${y}`;
  }

  return `${typeName}${monthText} - Money Report`;
};
  const handleExportPDF = (type, month) => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(getReportTitle(type, month), 14, 15);
    
    doc.setFontSize(10);
    doc.text("Generated Transactions Report", 14, 22);
    const rows = [];
  
    let filteredSortedData = [...data];

// ✅ TYPE FILTER
if (type === 'normal') {
  filteredSortedData = filteredSortedData.filter(
    tx => tx.transaction_type === 'normal'
  );
}

if (type === 'rotation') {
  filteredSortedData = filteredSortedData.filter(
    tx => tx.transaction_type !== 'normal'
  );
}

// ✅ MONTH FILTER
if (month) {
  filteredSortedData = filteredSortedData.filter(tx => {
    const txDate = new Date(tx.start_date);
    return txDate.toISOString().slice(0, 7) === month;
  });
}

// ✅ SORT
filteredSortedData.sort((a, b) => {
  if (a.person_name !== b.person_name) {
    return a.person_name.localeCompare(b.person_name);
  }
  return new Date(a.start_date) - new Date(b.start_date);
});
  
    // 🔥 PDF EXPORT LOGIC
filteredSortedData.forEach((tx) => {

  // 👉 logic used: detect single payment
  let isSinglePayment =
    tx.installments?.length === 1 &&
    Number(tx.installments[0].amount) >= tx.principal_amount;

  // ================= SINGLE =================
  if (isSinglePayment) {

    const inst = tx.installments[0];

    rows.push([
      // 👉 logic used: show type inside name column
`${tx.person_name} (${tx.transaction_type === 'normal' ? 'Normal' : 'Rotation'})`,
      tx.type,
      'Original',
      tx.principal_amount.toLocaleString('en-IN'),
      new Date(tx.start_date).toLocaleDateString('en-GB'),
      new Date(tx.due_date).toLocaleDateString('en-GB'),

      '', // 👉 no interest
      tx.principal_amount.toLocaleString('en-IN'),

      inst.amount.toLocaleString('en-IN'),
      '0',

      new Date(inst.date).toLocaleDateString('en-GB'),
      'single payment',

      'paid'
    ]);

  }

  // ================= MULTIPLE =================
  else {

    rows.push([
      // 👉 logic used: show type inside name column
`${tx.person_name} (${tx.transaction_type === 'normal' ? 'Normal' : 'Rotation'})`,
      tx.type,
      'Original',
      tx.principal_amount.toLocaleString('en-IN'),
      new Date(tx.start_date).toLocaleDateString('en-GB'),
      new Date(tx.due_date).toLocaleDateString('en-GB'),

      '', // no interest
      tx.principal_amount.toLocaleString('en-IN'),

      '', '', '', '',
      tx.status
    ]);

    let runningPaid = 0;

    tx.installments?.forEach((inst, i) => {
      runningPaid += Number(inst.amount);

      rows.push([
        '',
        '',
        `Payment ${i + 1}`,
        '',
        '',
        '',
        '',
        '',

        inst.amount.toLocaleString('en-IN'),
        (tx.principal_amount - runningPaid).toLocaleString('en-IN'),

        new Date(inst.date).toLocaleDateString('en-GB'),
        `₹${inst.amount}`,

        runningPaid >= tx.principal_amount ? 'paid' : 'partial'
      ]);
    });

  }

  // 👉 gap between transactions
  rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '']);

});
  const nameHeader =
  type === 'normal'
    ? 'Name (Normal)'
    : type === 'rotation'
    ? 'Name (Rotation)'
    : 'Name (All)';
    autoTable(doc, {
  startY: 30,

  head: [[
    'Name',
    'Type',
    'Stage',
    'Principal',
    'Start',
    'Due',
    'Interest',
    'Total',
    'Paid',
    'Balance',
    'Paid Date',
    'Installments',
    'Status'
  ]],

  body: rows,

  // 👉 logic used: prevent text breaking
  styles: {
    fontSize: 8,
    cellPadding: 2,
    overflow: 'linebreak' // wrap properly
  },

  // 👉 logic used: give more width to Name column
  columnStyles: {
    0: { cellWidth: 35 }, // Name column bigger
    1: { cellWidth: 18 },
    2: { cellWidth: 18 },
    3: { cellWidth: 22 },
    4: { cellWidth: 22 },
    5: { cellWidth: 22 },
    6: { cellWidth: 18 },
    7: { cellWidth: 22 },
    8: { cellWidth: 18 },
    9: { cellWidth: 20 },
    10: { cellWidth: 25 },
    11: { cellWidth: 30 },
    12: { cellWidth: 18 }
  },

  // 👉 logic used: avoid cutting words
  didParseCell: function (data) {
    data.cell.styles.valign = 'middle';
  }
});
  
    // ✅ TYPE NAME
let fileType = 'all';

if (type === 'normal') fileType = 'normal';
if (type === 'rotation') fileType = 'rotation';

// ✅ MONTH NAME
let fileMonth = '';
if (month) {
  const date = new Date(month + '-01');
  const m = date.toLocaleString('default', { month: 'short' });
  const y = date.getFullYear();
  fileMonth = `-${m}-${y}`;
}

// ✅ FINAL NAME
doc.save(`${fileType}-transactions${fileMonth}.pdf`);
  };

  const handleExtend = async (id) => {
    await API.put(`/extend/${id}`, extendForm);

    setExtendForm({
      new_due_date: '',
      extra_interest: 0,
      interest_paid: false
    });

    setExtendId(null);
    fetchData();
  };

  // ✅ FILTER LOGIC
  console.log("ALL DATA:", data);
  let filteredData = [...data];
  if (search.trim() !== '') {
    filteredData = filteredData.filter(tx =>
      tx.person_name.toLowerCase().includes(search.toLowerCase())
    );
  }

// FIRST filter by user
if (selectedName !== 'all') {
  filteredData = filteredData.filter(
    tx => tx.person_name.toLowerCase() === selectedName.toLowerCase()
  );
}

// THEN month

if (selectedMonth) {
  filteredData = filteredData.filter(tx => {
    const txDate = new Date(tx.start_date);
    const month = txDate.toISOString().slice(0, 7);
    return month === selectedMonth;
  });
}

if (filterType === 'pending') {
  filteredData = filteredData.filter(tx => {
    if (tx.transaction_type === 'normal') {
      return true;
    }
    return tx.status !== 'paid';
  });
}

if (filterType === 'upcoming') {
  filteredData = filteredData.filter(tx => {
    if (tx.transaction_type === 'normal') {
      return true; // ✅ always show normal
    }
    return new Date(tx.due_date) >= today && tx.status !== 'paid';
  });
}

  if (filterType === 'paid') {
    filteredData = filteredData.filter(tx => tx.status === 'paid');
  }

  if (filterType === 'extended') {
    filteredData = filteredData.filter(tx => tx.extensions.length > 0);
  }

  if (filterType === 'due') {
    filteredData = filteredData.filter(
      tx => new Date(tx.due_date) < today && tx.status !== 'paid'
    );
  }

  // SORT
  if (sortType === 'date') {
    filteredData.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }
  
  if (sortType === 'name') {
    filteredData.sort((a, b) => a.person_name.localeCompare(b.person_name));
  }

  const renderDueCard = (tx) => {
    let totalInterest = tx.base_interest;
  
    tx.extensions.forEach(ext => {
      if (ext.interest_paid) {
        totalInterest = ext.extra_interest;
      } else {
        totalInterest += ext.extra_interest;
      }
    });
  
    const total = tx.principal_amount + totalInterest;
  
    const due = new Date(tx.due_date);
    const overdueDays = Math.floor((today - due) / (1000 * 60 * 60 * 24));
    const type = (tx.transaction_type || 'rotation').toLowerCase();
    const isNormal = type.includes('normal');


    return (
        
      
      <div
        key={tx._id}
        style={{
          background: '#ffe5e5',
          padding: '8px',
          borderRadius: '10px',
          border: '2px solid #f44336',
          fontSize: '12px'
        }}
      >
  <div
    key={tx._id}
    onClick={() => navigate(`/profile/${tx.person_name}`)}   // ✅ CLICKABLE
    style={{
      background: '#ffe5e5',
      padding: '10px',
      borderRadius: '12px',
      border: '2px solid #f44336',
      fontSize: '12px',
      cursor: 'pointer',
      transition: '0.2s'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
  >

    {/* 🔹 TOP ROW */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <b style={{ fontSize: '15px' }}>{tx.person_name}</b>

      <span style={{
        background: tx.type === 'incoming' ? '#4CAF50' : '#F44336',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '11px',
       padding: '3px 10px'
      }}>
        {tx.type === 'incoming' ? 'IN' : 'OUT'}
      </span>
    </div>

    {/* 🔹 OVERDUE */}
    <p style={{
      color: 'red',
      margin: '4px 0',
      fontSize: '13px',
fontWeight: '500'
    }}>
      ⚠ {overdueDays} days
    </p>

    {/* 🔹 DATES SAME ROW */}
    <p style={{
      fontSize: '12px',
      margin: '4px 0'
    }}>
      {new Date(tx.start_date).toDateString()} -
      <span style={{ color: 'red', marginLeft: 5 }}>
        {new Date(tx.due_date).toDateString()}
      </span>
    </p>

    {/* 🔹 TOTAL */}
    <p style={{
      textAlign: 'right',
      fontWeight: 'bold',
      fontSize: '18px',
fontWeight: 'bold',
      marginTop: '6px'
    }}>
      {formatCurrency(total)}
    </p>

  </div>
      </div>
    );
  };
  // ✅ CARD
  const renderCard = (tx) => {
  console.log("TX DATA:", tx);

  // 🔥 FIX: decide type properly
  const type = tx.transaction_type || 'rotation';

  // ✅ NORMAL INSTALLMENT CARD
  if (type === 'normal') {
  const paid = tx.paid_amount || 0;
  const total = tx.principal_amount;
  const balance = total - paid;

  const start = new Date(tx.start_date).toDateString();
  const due = new Date(tx.due_date).toDateString();

  return (
    <div style={{
      padding: 15,
      borderRadius: 12,
      background: '#e3f2fd',
      position: 'relative'
    }}>

      {/* 🔥 TITLE + BADGE */}
      <h4
  style={{ marginBottom: 5, cursor: 'pointer', color: 'blue' }}
  onClick={() => navigate(`/profile/${tx.person_name}`)}
>
  {tx.person_name}
</h4>

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

      {/* 📅 DATE RANGE */}
      <p style={{ margin: '8px 0' }}>
        <span style={{ color: 'green', fontWeight: 'bold' }}>
          {start}
        </span>
        {' - '}
        <span style={{ color: 'red', fontWeight: 'bold' }}>
          {due}
        </span>
      </p>

      <hr />

      {/* 💰 DATA */}
      <p>Total: {formatCurrency(total)}</p>
      <p>Paid: {formatCurrency(paid)}</p>
      <p>Balance: {formatCurrency(balance)}</p>

      {balance === 0 && (
  <div style={{
    background: '#4CAF50',
    color: 'white',
    padding: '5px 10px',
    borderRadius: 8,
    display: 'inline-block',
    fontWeight: 'bold',
    marginTop: 5
  }}>
    PAID
  </div>
)}

      {/* 🔘 BUTTONS */}
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button onClick={() => setPayId(tx._id)}>Pay</button>

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
      </div>

    </div>
  );
}

  // ================= ROTATION (OLD LOGIC) =================

  let totalInterest = tx.base_interest;

  tx.extensions.forEach(ext => {
    if (ext.interest_paid) {
      totalInterest = ext.extra_interest;
    } else {
      totalInterest += ext.extra_interest;
    }
  });

  const total = tx.principal_amount + totalInterest;

  const due = new Date(tx.due_date);
  const overdueDays = Math.max(0, Math.floor((today - due) / (1000 * 60 * 60 * 24)));

  let dueHistory = [tx.due_date];

  tx.extensions.forEach(ext => {
    dueHistory.push(ext.new_due_date);
  });

  return (
    
    <div
  key={tx._id}
  style={{
    padding: '12px',
    borderRadius: '10px',
    background:
      overdueDays > 0
        ? '#ffcccc'
        : tx.status === 'paid'
        ? '#e8f5e9'
        : '#fff3cd',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',

    position: 'relative'   // 🔥 ADD THIS LINE
  }}
>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h4
  style={{ marginBottom: 5, cursor: 'pointer', color: 'blue' }}
  onClick={() => navigate(`/profile/${tx.person_name}`)}
>
  {tx.person_name}
</h4>

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
      </div>

      <p><b>Start:</b> {new Date(tx.start_date).toDateString()}</p>

      <div>
        <b>Due:</b>
        {dueHistory.map((date, i) => {
          const last = i === dueHistory.length - 1;
          return (
            <p key={i}
              style={{
                color: last ? 'green' : 'red',
                textDecoration: last ? 'none' : 'line-through'
              }}>
              {new Date(date).toDateString()}
            </p>
          );
        })}
      </div>

      {overdueDays > 0 && (
        <p style={{ color: 'red' }}>Overdue: {overdueDays} days</p>
      )}

      <p><b>Status:</b> {tx.status}</p>
      <p><b>Principal:</b> {formatCurrency(tx.principal_amount)}</p>
      <p><b>Interest:</b> {formatCurrency(totalInterest)}</p>
      <p><b>Total {formatCurrency(total)}</b></p>

      <button
  onClick={() => {
    const type = tx.transaction_type || 'rotation';

    if (type === 'normal') {
      // ✅ OPEN PAYMENT POPUP
      setPayId(tx._id);
    } else {
      // ✅ NORMAL CONFIRM FLOW
      setConfirmAction({ type: 'paid', id: tx._id });
    }
  }}
>
  {tx.transaction_type === 'normal' ? 'Pay' : 'Paid'}
</button>

      <button onClick={() =>
        setConfirmAction({ type: 'extend', id: tx._id })
      }>
        Extend
      </button>

      <button onClick={() =>
        setConfirmAction({ type: 'edit', id: tx._id, tx })
      }>
        Edit
      </button>

      <button onClick={() =>
        setConfirmAction({ type: 'delete', id: tx._id })
      }>
        Delete
      </button>

    </div>
  );
};

  const getConfirmMessage = () => {
    if (!confirmAction) return '';
  
    if (confirmAction.type === 'delete') return 'Are you sure to Delete?';
    // if (confirmAction.type === 'paid') return 'Are you sure to mark as Paid?';
    if (confirmAction.type === 'paid') {

  const txData = data.find(t => t._id === confirmAction.id);
  const type = txData?.transaction_type || 'rotation';

  // ❌ DO NOT SHOW CONFIRM FOR NORMAL
  if (type === 'normal') {
    return '';   // no message
  }

  return 'Are you sure to mark as Paid?';
}
    if (confirmAction.type === 'extend') return 'Are you sure to Extend?';
    if (confirmAction.type === 'edit') return 'Are you sure to Edit?';
  
    return 'Are you sure?';
  };
 const normalData = filteredData   // ✅ USE FILTERED DATA
  .filter(tx => tx.transaction_type === 'normal')
  // .filter(tx => (tx.paid_amount || 0) < tx.principal_amount);
  .filter(tx => {
  if (filterType === 'paid') return tx.status === 'paid';
  return (tx.paid_amount || 0) < tx.principal_amount;
});

const rotationData = filteredData
  .filter(tx => tx.transaction_type !== 'normal')
  .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const handleInstallment = async () => {
  if (!payAmount) {
    alert("Enter amount");
    return;
  }

  try {
    await API.put(`/paid/${payId}`, {
      amount: Number(payAmount)
    });

    alert("Payment successful ✅");

    setPayAmount('');
    setPayId(null);
    fetchData();

  } catch (err) {
    console.log(err);
    alert("Error ❌");
  }
};

const handleFullPayment = async () => {
  try {
    const tx = data.find(t => t._id === payId);

    const remaining =
      Number(tx.principal_amount) - Number(tx.paid_amount || 0);

    if (remaining <= 0) {
      alert("Already fully paid");
      return;
    }

    await API.put(`/paid/${payId}`, {
      amount: remaining
    });

    alert("Full Payment Done ✅");

    setPayId(null);
    setPayType(null);

    fetchData();

  } catch (err) {
    console.log(err);
    alert("Error ❌");
  }
};
  return (
    
    
    <div>
{confirmAction && (() => {
  const txData = data.find(t => t._id === confirmAction.id);
  const type = txData?.transaction_type || 'rotation';

  // ❌ DO NOT SHOW CONFIRM FOR NORMAL
  if (confirmAction.type === 'paid' && type === 'normal') {
    return null;
  }

  return (
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
        alignItems: 'center',
        zIndex: 2000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          padding: 20,
          borderRadius: 10,
          width: 300,
          textAlign: 'center'
        }}
      >
        <h3>{getConfirmMessage()}</h3>

        <div style={{ marginTop: 15, display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={executeAction}>Confirm</button>
          <button onClick={() => setConfirmAction(null)}>Cancel</button>
        </div>
      </div>
    </div>
  );
})()}

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
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 4000   // 👈 higher than alert
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

      <h3>Payment</h3>

      {!payType && (
        <>
          <button
            style={{ width: '100%', marginBottom: 10 }}
            onClick={() => setPayType('installment')}
          >
            Pay by Installment
          </button>

          <button
            style={{ width: '100%' }}
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
            value={payAmount || ''}
            onChange={(e) => setPayAmount(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />

          <button
  style={{ width: '100%' }}
  onClick={handleInstallment}
>
  Confirm Installment
</button>
        </>
      )}

      {payType === 'full' && (
        <button
  style={{ width: '100%' }}
  onClick={handleFullPayment}
>
  Confirm Full Payment
</button>
      )}

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
      alignItems: 'center',
      zIndex: 1000
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
      <h3>Extend Transaction</h3>

      <input
        type="date"
        onChange={(e) =>
          setExtendForm({
            ...extendForm,
            new_due_date: e.target.value
          })
        }
      />

      <input
        type="number"
        placeholder="Extra Interest"
        onChange={(e) =>
          setExtendForm({
            ...extendForm,
            extra_interest: Number(e.target.value)
          })
        }
      />

      <label style={{ display: 'block', marginTop: 5 }}>
        <input
          type="checkbox"
          onChange={(e) =>
            setExtendForm({
              ...extendForm,
              interest_paid: e.target.checked
            })
          }
        />
        Last Interest Paid
      </label>

      <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
        <button
          onClick={async () => {
            await API.put(`/extend/${extendId}`, extendForm);
            setExtendId(null);
            fetchData();
          }}
        >
          Save
        </button>

        <button onClick={() => setExtendId(null)}>Cancel</button>
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
      alignItems: 'center',
      zIndex: 1000
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
      <h3>Edit Transaction</h3>

      <input
        type="number"
        value={editForm.principal_amount}
        onChange={(e) =>
          setEditForm({ ...editForm, principal_amount: e.target.value })
        }
        placeholder="Principal"
      />

      <input
        type="number"
        value={editForm.base_interest}
        onChange={(e) =>
          setEditForm({ ...editForm, base_interest: e.target.value })
        }
        placeholder="Interest"
      />

      <input
        type="date"
        value={editForm.start_date}
        onChange={(e) =>
          setEditForm({ ...editForm, start_date: e.target.value })
        }
      />

      <input
        type="date"
        value={editForm.due_date}
        onChange={(e) =>
          setEditForm({ ...editForm, due_date: e.target.value })
        }
      />

      <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
        <button
          onClick={async () => {
            await API.put(`/update/${editId}`, {
              ...editForm,
              principal_amount: Number(editForm.principal_amount),
              base_interest: Number(editForm.base_interest)
            });

            setEditId(null);
            fetchData();
          }}
        >
          Save
        </button>

        <button onClick={() => setEditId(null)}>Cancel</button>
      </div>
    </div>
  </div>
)}

{showAlert && (dueTransactions.length > 0 || upcomingTransactions.length > 0) && (
  <div style={{
    position: 'fixed',
    top: 60,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
    zIndex: 3000,
    width: '420px',
    maxHeight: '70vh',
    overflowY: 'auto'
  }}>


<h3 style={{ textAlign: 'center', marginBottom: 10 }}>
  🚨 Alerts
</h3>

{/* 🔴 OVERDUE */}
{dueTransactions.length > 0 && (
  <>
    <h4 style={{
      color: '#f44336',
      marginBottom: 8
    }}>
      🔴 Overdue
    </h4>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {dueTransactions.map(tx => {
        let totalInterest = tx.base_interest;

        tx.extensions.forEach(ext => {
          if (ext.interest_paid) {
            totalInterest = ext.extra_interest;
          } else {
            totalInterest += ext.extra_interest;
          }
        });

        const total = tx.principal_amount + totalInterest;

        const overdueDays = Math.floor(
          (today - new Date(tx.due_date)) / (1000 * 60 * 60 * 24)
        );

        return (
          <div
            key={tx._id}
            style={{
              padding: '10px',
              borderRadius: '10px',
              background: '#ffe5e5',
              border: '1px solid #f44336',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <b>{tx.person_name}</b>
              <p style={{ margin: 0, fontSize: 12, color: 'red' }}>
                ⚠ {overdueDays} days
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{formatCurrency(total)}</p>
              <span style={{
                background: tx.type === 'incoming' ? '#4CAF50' : '#F44336',
                color: 'white',
                padding: '2px 6px',
                borderRadius: 6,
                fontSize: 10
              }}>
                {tx.type === 'incoming' ? 'IN' : 'OUT'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </>
)}

{/* 🟡 UPCOMING */}
{upcomingTransactions.length > 0 && (
  <>
    <h4 style={{
      color: '#ff9800',
      marginTop: 12,
      marginBottom: 8
    }}>
      🟡 Upcoming (7 days)
    </h4>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {upcomingTransactions.map(tx => {
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

          
          <div
            key={tx._id}
            style={{
              padding: '10px',
              borderRadius: '10px',
              background: '#fff3cd',
              border: '1px solid #ff9800',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <b>{tx.person_name}</b>
              <p style={{ margin: 0, fontSize: 12 }}>
                {new Date(tx.due_date).toDateString()}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{formatCurrency(total)}</p>
              <span style={{
                background: tx.type === 'incoming' ? '#4CAF50' : '#F44336',
                color: 'white',
                padding: '2px 6px',
                borderRadius: 6,
                fontSize: 10
              }}>
                {tx.type === 'incoming' ? 'IN' : 'OUT'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </>
)}

{/* CLOSE BUTTON */}
<button
  onClick={() => setShowAlert(false)}
  style={{
    marginTop: '15px',
    width: '100%',
    padding: '10px',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
  }}
>
  Close
</button>

  </div>
)}
      {/* 🔥 EXPORT POPUP */}
      {showExportPopup && (
  <div
    onClick={() => setShowExportPopup(false)}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.4)',
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
        padding: 20,
        borderRadius: 10,
        width: 300
      }}
    >

      <h3>Export Options</h3>

      {/* TYPE */}
      <select
        value={exportType}
        onChange={(e) => setExportType(e.target.value)}
        style={{ width: '100%', marginBottom: 10 }}
      >
        <option value="all">All</option>
        <option value="normal">Normal</option>
        <option value="rotation">Rotation</option>
      </select>

      {/* MONTH */}
      <input
        type="month"
        value={exportMonth}
        onChange={(e) => setExportMonth(e.target.value)}
        style={{ width: '100%', marginBottom: 10 }}
      />

      {/* ACTION */}
      <button
        style={{ width: '100%' }}
        onClick={() => {
          if (showExportPopup === 'csv') {
            handleExport(exportType, exportMonth);
          } else {
            handleExportPDF(exportType, exportMonth);
          }
          setShowExportPopup(false);
        }}
      >
        Download
      </button>

    </div>
  </div>
)}
      {/* 🔥 POPUP (ADD HERE — TOP INSIDE RETURN) */}
      {showNoDuePopup && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: '#4CAF50',
          color: 'white',
          padding: '10px 15px',
          borderRadius: 8,
          boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
          zIndex: 999
        }}>
          🎉 No overdue payments
        </div>
      )}

{/* 🔴 AUTO DUE SECTION */}
{dueTransactions.length > 0 && (
  <div style={{ marginBottom: 15 }}>

    <h3 style={{
      color: '#f44336',
      marginBottom: 8
    }}>
      ⚠ Overdue Payments
    </h3>

    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',   // ✅ 5 cards per row
      gap: '10px'
    }}>
      {dueTransactions.map(renderDueCard)}
    </div>

  </div>
)}
      
      {/* 🔥 BADGES */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '10px'
      }}>
        {/* <span style={badgeStyle('#ff9800')}>Pending: {pendingCount}</span> */}
        <span
  onClick={() => setFilterType('pending')}
  style={{
    ...badgeStyle('#ff9800'),
    cursor: 'pointer',
    border: filterType === 'pending' ? '2px solid black' : 'none'
  }}
>
  Pending: {pendingCount}
</span>
        {/* <span style={badgeStyle('#4caf50')}>Paid: {paidCount}</span>
        <span style={badgeStyle('#2196f3')}>Extended: {extendedCount}</span>
        <span style={badgeStyle('#f44336')}>Due: {dueCount}</span> */}

<span
  onClick={() => setFilterType('paid')}
  style={{
    ...badgeStyle('#4caf50'),
    cursor: 'pointer',
    border: filterType === 'paid' ? '2px solid black' : 'none'
  }}
>
  Paid: {paidCount}
</span>

<span
  onClick={() => setFilterType('extended')}
  style={{
    ...badgeStyle('#2196f3'),
    cursor: 'pointer',
    border: filterType === 'extended' ? '2px solid black' : 'none'
  }}
>
  Extended: {extendedCount}
</span>

<span
  onClick={() => setFilterType('due')}
  style={{
    ...badgeStyle('#f44336'),
    cursor: 'pointer',
    border: filterType === 'due' ? '2px solid black' : 'none'
  }}
>
  Due: {dueCount}
</span>
{/* <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}></div> */}
      </div>
      
      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>

  {/* 🔍 SEARCH */}
  <input
    type="text"
    placeholder="Search by name..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      padding: '5px 10px',
      borderRadius: 6,
      border: '1px solid #ccc'
    }}
  />

  {/* 👤 USER FILTER */}
  <select onChange={(e) => setSelectedName(e.target.value)}>
    <option value="all">All Users</option>
    {names.slice(1).map(name => (
      <option key={name} value={name}>{name}</option>
    ))}
  </select>

  {/* 📊 STATUS FILTER */}
  <select onChange={(e) => setFilterType(e.target.value)}>
    <option value="upcoming">Upcoming</option>
    <option value="pending">Pending</option>
    <option value="paid">Paid</option>
    <option value="extended">Extended</option>
    <option value="due">Overdue</option>
  </select>

  {/* 🔽 SORT */}
  <select onChange={(e) => setSortType(e.target.value)}>
    <option value="date">Sort by Date</option>
    <option value="name">Sort by Name</option>
  </select>

  {/* 📅 MONTH */}
  <input
    type="month"
    onChange={(e) => setSelectedMonth(e.target.value)}
  />

  {/* 📄 EXPORT */}
  <button onClick={() => setShowExportPopup('csv')}>
  Export CSV
</button>

<button onClick={() => setShowExportPopup('pdf')}>
  Export PDF
</button>

</div>
  
      {/* FILTER + SORT */}
      

{/* 💰 TOTAL DUE */}
<div style={{
  marginTop: 10,
  padding: 10,
  background: '#fff3cd',
  borderRadius: 10,
  fontWeight: 'bold'
}}>


  💰 Total Due: {formatCurrency(totalDueAmount)}
</div>
  <div style={{ marginTop: 20 }}>

  <h3>Normal Payments</h3>
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 12,
    marginBottom: 20
  }}>
    {normalData.map(renderCard)}
  </div>

  <h3>Rotation Payments</h3>
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 12
  }}>
    {rotationData.map(renderCard)}
  </div>

</div>
      {/* CARDS */}
      {filterType === 'due' && filteredData.length === 0 && (
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

  
    </div>
  );
}

export default TransactionList;