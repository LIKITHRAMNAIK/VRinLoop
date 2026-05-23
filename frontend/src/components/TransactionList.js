import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../utils/format';
import LoanProfile from '../pages/LoanProfile';

const getColor = (name) => {
  const colors = ['#e3f2fd', '#fce4ec', '#e8f5e9', '#fff3e0'];
  return colors[name.charCodeAt(0) % colors.length];
};
const miniButtonStyle = {
  color: 'white',
  border: 'none',
  padding: '8px 10px',
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
  flex: 1,
  minWidth: 0
};

const miniStatCard = {
  background: 'rgba(255,255,255,0.85)',
  padding: 8,
  borderRadius: 10
};

const miniStatTitle = {
  margin: 0,
  fontSize: 11,
  color: '#64748b'
};

const miniStatValue = {
  margin: '4px 0 0',
  fontSize: 15,
  fontWeight: 'bold',
  color: '#0f172a'
};
function TransactionList({ refresh }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [selectedName, setSelectedName] = useState('all');
  const [showAlert, setShowAlert] = useState(true);

  const [confirmAction, setConfirmAction] = useState(null);

  const [filterType, setFilterType] = useState('pending');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [sortType, setSortType] = useState('date');

  const [payId, setPayId] = useState(null);
const [payType, setPayType] = useState('');
const [payAmount, setPayAmount] = useState(0);

const [showExportPopup, setShowExportPopup] = useState(false);
const [exportType, setExportType] = useState('all'); // all | normal | rotation
const [exportMonth, setExportMonth] = useState('');

const [payPopup, setPayPopup] = useState(null);

const [earlyPayPopup, setEarlyPayPopup] = useState(null);

const [earlyInterest, setEarlyInterest] = useState('');

const [normalPayPopup, setNormalPayPopup] = useState(null);

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
  today.setHours(0,0,0,0);
  const dueTransactions = data.filter(
    tx => {
      const due = new Date(tx.due_date);
      due.setHours(0,0,0,0);
      return due < today && tx.status !== 'paid';
    }
  );
  const upcomingTransactions = data
  .filter(tx => {

    // ================= LOAN EMI =================

    if (tx.transaction_type === 'loan') {

      if (
        tx.remaining_emi <= 0
      ) {
        return false;
      }

      const todayDate = new Date();

      todayDate.setHours(0,0,0,0);

      const nextEmiDate = new Date(tx.due_date);

      nextEmiDate.setHours(0,0,0,0);

      const diff =
        (nextEmiDate - todayDate) /
        (1000 * 60 * 60 * 24);

      return diff >= 0 && diff <= 7;
    }

    // ================= NORMAL / ROTATION =================

    const due = new Date(tx.due_date);

    due.setHours(0,0,0,0);

    const diff =
      (due - today) /
      (1000 * 60 * 60 * 24);

    return (
      diff >= 0 &&
      diff <= 7 &&
      tx.status !== 'paid'
    );

  })

  .sort(
    (a, b) =>
      new Date(a.due_date) -
      new Date(b.due_date)
  );

  const badgeStyle = (bg) => ({
    background: bg,
    color: 'white',
    padding: '5px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  });

  // ✅ COUNTS
const pendingCount = data.filter(tx => {

  // NORMAL
  if (tx.transaction_type === 'normal') {
    return (tx.principal_amount - (tx.paid_amount || 0)) > 0;
  }

  // LOAN
  if (tx.transaction_type === 'loan') {
    return (tx.remaining_emi || 0) > 0;
  }

  // ROTATION
  return tx.status !== 'paid';

}).length;


const paidCount = data.filter(tx => {

  // NORMAL
  if (tx.transaction_type === 'normal') {
    return (tx.principal_amount - (tx.paid_amount || 0)) <= 0;
  }

  // LOAN
  if (tx.transaction_type === 'loan') {
    return (tx.remaining_emi || 0) <= 0;
  }

  // ROTATION
  return tx.status === 'paid';

}).length;


const extendedCount = data.filter(tx =>
  tx.transaction_type === 'rotation' &&
  tx.extensions?.length > 0
).length;
  const dueCount = data.filter(
    tx => {
      const due = new Date(tx.due_date);
      due.setHours(0,0,0,0);
      return due < today && tx.status !== 'paid';
    }
  ).length;

  const totalDueAmount = data
  .filter(tx => {
    const due = new Date(tx.due_date);

    due.setHours(0,0,0,0);

    return (
      due < today &&
      tx.status !== 'paid'
    );
  })

  .reduce((sum, tx) => {

    let totalInterest =
      Number(tx.base_interest || 0);

    tx.extensions.forEach(ext => {

      if (ext.interest_paid) {

        totalInterest =
          Number(ext.extra_interest || 0);

      } else {

        totalInterest +=
          Number(ext.extra_interest || 0);

      }

    });

    const finalInterest =

      tx.final_interest > 0

        ? Number(tx.final_interest)

        : (

            tx.early_paid

              ? Number(tx.early_paid_interest || 0)

              : totalInterest

          );

    const total =

      tx.final_total > 0

        ? Number(tx.final_total)

        : (
            Number(tx.principal_amount || 0) +
            Number(finalInterest || 0)
          );

    return sum + total;

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

  const executeAction = async () => {
  if (!confirmAction) return;

  const { type, id } = confirmAction;

  const txData = data.find(t => t._id === id);
  const transactionType = txData?.transaction_type || 'rotation';

  try {

    if (type === 'delete') {
      await API.delete(`/delete/${id}`);
    }

    if (type === 'paid') {

      // 🔥 NORMAL → open popup
      if (transactionType === 'normal') {
        setPayId(id);
        setConfirmAction(null);
        return;
      }

      // 🔥 ROTATION → direct payment
      await API.put(`/paid/${id}`);

      alert("Marked as Paid ✅");   // 👈 ADD THIS (IMPORTANT)
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

    fetchData();   // 👈 MUST BE AFTER EVERYTHING

  } catch (err) {
    console.log(err);
    alert("Error ❌");
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

  const today = new Date();

  today.setHours(0,0,0,0);

  filteredData = filteredData.filter(tx => {

    // NORMAL
    if (tx.transaction_type === 'normal') {

      return (
        (tx.paid_amount || 0) <
        tx.principal_amount
      );

    }

    // LOAN + ROTATION
    return tx.status !== 'paid';

  });

}

  if (filterType === 'paid') {
    filteredData = filteredData.filter(tx => tx.status === 'paid');
  }

  if (filterType === 'extended') {
    filteredData = filteredData.filter(tx => tx.extensions?.length > 0);
  }

  if (filterType === 'due') {

  filteredData = filteredData.filter(tx => {

    const due = new Date(tx.due_date);

    due.setHours(0,0,0,0);

    // active overdue
    if (
  due < today &&
  tx.status !== 'paid' &&
  tx.status !== 'extended'
) {
      return true;
    }

    // paid late
    if (
      tx.status === 'paid' &&
      tx.paid_date
    ) {

      const paidDate = new Date(tx.paid_date);

      paidDate.setHours(0,0,0,0);

      return paidDate > due;
    }

    return false;

  });

}

  // SORT
  if (sortType === 'date') {
    filteredData.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }
  
  if (sortType === 'name') {
    filteredData.sort((a, b) => a.person_name.localeCompare(b.person_name));
  }

  const renderDueCard = (tx) => {
    let totalInterest =
  Number(tx.base_interest || 0);

tx.extensions.forEach(ext => {

  if (ext.interest_paid) {

    totalInterest =
      Number(ext.extra_interest || 0);

  } else {

    totalInterest +=
      Number(ext.extra_interest || 0);

  }

});

const finalInterest =

  tx.final_interest > 0

    ? Number(tx.final_interest)

    : (

        tx.early_paid

          ? Number(tx.early_paid_interest || 0)

          : totalInterest

      );

const total =

  tx.final_total > 0

    ? Number(tx.final_total)

    : (
        Number(tx.principal_amount || 0) +
        Number(finalInterest || 0)
      );
  
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
    onClick={() => {
      // navigate(`/profile/${tx.person_name}`);
      navigate(`/profile/${tx.person_name}`, {
  state: { type: tx.transaction_type }
});
    }}   // ✅ CLICKABLE
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
const isLoan = type === 'loan';
  

  // ✅ NORMAL INSTALLMENT CARD
  if (type === 'normal') {
  const paid = tx.paid_amount || 0;
  const total = tx.principal_amount;
  const balance = total - paid;
  const today = new Date();

today.setHours(0,0,0,0);

const dueDate = new Date(tx.due_date);

dueDate.setHours(0,0,0,0);

const isOverdue =

  tx.status !== 'paid' &&

  dueDate < today;

const overdueDays = Math.max(
  1,
  Math.ceil(
    (today - dueDate) /
    (1000 * 60 * 60 * 24)
  )
);

  const start = new Date(tx.start_date).toDateString();
  const due = new Date(tx.due_date).toDateString();

  return (
    <div style={{
      padding: 15,
      borderRadius: 12,
      background: isOverdue ? '#ffe5e5' : '#e3f2fd',
      border: isOverdue ? '2px solid #f44336' : 'none',
      position: 'relative'
    }}>

      {/* 🔥 TITLE + BADGE */}
      <h4
  style={{ marginBottom: 5, cursor: 'pointer', color: 'blue' }}
  onClick={() => {
  // navigate(`/profile/${tx.person_name}`);
  navigate(`/profile/${tx.person_name}`, {
  state: { type: tx.transaction_type }
});
}}
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
        {tx.status !== 'paid' && isOverdue && (

  <p style={{
    color: 'red',
    fontWeight: 'bold'
  }}>
    ⚠ {overdueDays} day
    {overdueDays > 1 ? 's' : ''}
    {' '}overdue
  </p>

)}
      {/* 💰 DATA */}
      
      <p>Total: {formatCurrency(total)}</p>

{tx.status !== 'paid' ? (

  <div style={{
  marginTop: 14
}}>

  {/* PAYMENT BOX */}

  <div style={{

  padding: 10,

  borderRadius: 14,

  background:

    (() => {

      const percent =
        (paid / total) * 100;

      // RED
      if (percent < 40) {
        return '#fff1f2';
      }

      // BLUE
      if (percent < 80) {
        return '#eff6ff';
      }

      // GREEN
      return '#f0fdf4';

    })(),

  border:

    (() => {

      const percent =
        (paid / total) * 100;

      // RED
      if (percent < 40) {
        return '1px solid #ef4444';
      }

      // BLUE
      if (percent < 80) {
        return '1px solid #3b82f6';
      }

      // GREEN
      return '1px solid #22c55e';

    })()

}}>

    <p style={{
      margin: 0,
      fontWeight: 'bold',
      color:

  (() => {

    const percent =
      (paid / total) * 100;

    // RED
    if (percent < 40) {
      return '#dc2626';
    }

    // BLUE
    if (percent < 80) {
      return '#2563eb';
    }

    // GREEN
    return '#15803d';

  })()
    }}>
      🟢 Paid:
      {' '}
      {formatCurrency(paid)}
    </p>

    <p style={{
      marginTop: 8,
      marginBottom: 0,
      fontWeight: 'bold',
      color:

  (() => {

    const percent =
      (paid / total) * 100;

    // RED
    if (percent < 40) {
      return '#991b1b';
    }

    // BLUE
    if (percent < 80) {
      return '#1d4ed8';
    }

    // GREEN
    return '#166534';

  })()
    }}>
      🔵 Remaining:
      {' '}
      {formatCurrency(balance)}
    </p>

    {tx.last_payment_date && (

      <p style={{
        marginTop: 10,
        marginBottom: 0,
        color: '#475569',
        fontSize: 14
      }}>
        Last Paid:
        {' '}
        {new Date(
          tx.last_payment_date
        ).toDateString()}
      </p>

    )}

  </div>

  {/* PROGRESS */}

  <div style={{
    marginTop: 14
  }}>

    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 6,
      fontSize: 12,
      fontWeight: 'bold'
    }}>

      <span>
        Progress
      </span>

      <span>
        {

          Math.round(
            (paid / total) * 100
          )

        }%
      </span>

    </div>

    <div style={{
      width: '100%',
      height: 10,
      borderRadius: 20,
      background: '#dbeafe',
      overflow: 'hidden'
    }}>

      <div style={{
        width:
          `${(paid / total) * 100}%`,
        height: '100%',
        background:

  (() => {

    const percent =
      (paid / total) * 100;

    // RED
    if (percent < 40) {

      return 'linear-gradient(90deg,#ef4444,#f87171)';

    }

    // BLUE
    if (percent < 80) {

      return 'linear-gradient(90deg,#2563eb,#60a5fa)';

    }

    // GREEN
    return 'linear-gradient(90deg,#16a34a,#4ade80)';

  })()
      }} />

    </div>

  </div>

</div>

) : (

  (() => {

    const paidDate =
      new Date(tx.paid_date);

    const latestDueDate =

  tx.final_due_date ||

  tx.due_date;

const dueDate =
  new Date(latestDueDate);

    paidDate.setHours(0,0,0,0);

    dueDate.setHours(0,0,0,0);

    const diff = Math.ceil(
      (paidDate - dueDate) /
      (1000 * 60 * 60 * 24)
    );

    const isLate = diff > 0;

    const isEarly = diff < 0;

    return (

      <div style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 14,

        background:

          isLate
            ? '#fee2e2'
            : '#dcfce7',

        border:

          isLate
            ? '1px solid #ef4444'
            : '1px solid #22c55e'
      }}>

        <p style={{
          margin: 0,
          fontWeight: 'bold',

          color:

            isLate
              ? '#dc2626'
              : '#166534'
        }}>

          {

            isLate

              ? `🔴 Paid Late`

              : isEarly

                ? `🟢 Paid Early`

                : `🔵 Paid On Time`

          }

        </p>

        <p style={{
          marginTop: 6,
          marginBottom: 0,

          color:

            isLate
              ? '#991b1b'
              : '#166534'
        }}>

          Paid:
          {' '}
          {formatCurrency(total)}

          {' • '}

          {

            isLate

              ? `${diff} day late`

              : isEarly

                ? `${Math.abs(diff)} day early`

                : 'On time'

          }

        </p>

        <p style={{
          marginTop: 5,
          marginBottom: 0,
          fontSize: 13,

          color:

            isLate
              ? '#991b1b'
              : '#166534'
        }}>
          {paidDate.toDateString()}
        </p>

      </div>

    );

  })()

)}

    

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

  {tx.status === 'paid' ? (
    <button
  style={{
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 12,
    fontWeight: 'bold',
    cursor: 'pointer'
  }}
  onClick={() =>
    setConfirmAction({ type: 'delete', id: tx._id })
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
        setConfirmAction({ type: 'delete', id: tx._id })
      }>
        Delete
      </button>
    </>
  )}

</div>

    </div>
  );
}

  // ================= ROTATION (NEW LOGIC) =================

let totalInterest =
  Number(tx.base_interest || 0);

tx.extensions.forEach(ext => {

  if (ext.interest_paid) {

    totalInterest =
      Number(ext.extra_interest || 0);

  } else {

    totalInterest +=
      Number(ext.extra_interest || 0);

  }

});

const finalInterest =

  tx.final_interest > 0

    ? Number(tx.final_interest)

    : (

        tx.early_paid

          ? Number(tx.early_paid_interest || 0)

          : totalInterest
      );

const total =

  tx.final_total > 0

    ? Number(tx.final_total)

    : (
        Number(tx.principal_amount || 0) +
        Number(finalInterest || 0)
      );

  const due = new Date(tx.due_date);

const todayDate = new Date();

todayDate.setHours(0,0,0,0);
due.setHours(0,0,0,0);

const isOverdue =
  tx.status !== 'paid' &&
  due < todayDate;

const displayStatus =
  tx.status === 'extended'
    ? 'extended'
    : tx.status === 'paid'
    ? 'paid'
    : 'pending';

const overdueDays = Math.max(
  1,
  Math.ceil(
    (todayDate - due) /
    (1000 * 60 * 60 * 24)
  )
);

  let dueHistory = [tx.due_date];

  tx.extensions.forEach(ext => {
    dueHistory.push(ext.new_due_date);
  });

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

    minHeight: 260,

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
          setConfirmAction({
            type: 'extend',
            id: tx._id
          })
        }
      >
        Extend
      </button>

      <button
        style={{
          ...miniButtonStyle,
          background: '#0f172a'
        }}
        onClick={() =>
          setConfirmAction({
            type: 'edit',
            id: tx._id,
            tx
          })
        }
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
  
  .filter(tx => {
  if (filterType === 'paid') return tx.status === 'paid';
  return (tx.paid_amount || 0) < tx.principal_amount;
});

const rotationData = filteredData
  .filter(tx => tx.transaction_type === 'rotation')
  .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

const loanData = filteredData
  .filter(tx => tx.transaction_type === 'loan')
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

const filteredLoanData = loanData.filter(tx => {

  const matchesSearch =
    tx.person_name
      .toLowerCase()
      .includes(search.toLowerCase());

  const matchesStatus =

    filterType === 'all'

      ? true

      : filterType === 'pending'

        ? tx.status !== 'paid'

        : filterType === 'paid'

          ? tx.status === 'paid'

          : true;

  return (
    matchesSearch &&
    matchesStatus
  );

});

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
  onClick={async () => {

  if (confirmAction.type === 'delete') {
    await API.delete(`/delete/${confirmAction.id}`);
  }

  else if (confirmAction.type === 'paid') {
  await API.put(`/paid/${confirmAction.id}`, {
    amount: null
  });
}

  else if (confirmAction.type === 'extend') {
    setExtendId(confirmAction.id);
    setConfirmAction(null);
    return;
  }

  else if (confirmAction.type === 'edit') {
    setEditId(confirmAction.id);
    setEditForm(confirmAction.tx);
    setConfirmAction(null);
    return;
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
      <h3 style={{ textAlign: 'center', marginBottom: 15 }}>
  Extend Transaction
</h3>

{/* CURRENT DUE DATE (READ ONLY) */}
<div style={{ marginBottom: 10 }}>
  <p style={{ margin: 0, fontWeight: 'bold' }}>Current Due:</p>
  <p style={{ color: '#f44336', margin: 0 }}>
    {new Date(
      data.find(tx => tx._id === extendId)?.due_date
    ).toDateString()}
  </p>
</div>

{/* NEW DATE */}
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
      borderRadius: '6px',
      cursor: 'pointer'
    }}
    onClick={async () => {
      await API.put(`/extend/${extendId}`, extendForm);
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
      borderRadius: '6px',
      cursor: 'pointer'
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
      {/* <h3>Edit Transaction vbnm</h3> */}

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


      <div style={{ marginTop:10, display:'flex', gap:10 }}>
  <button
    style={{
      flex:1,
      background:'#4CAF50',
      color:'white',
      border:'none',
      padding:'8px',
      borderRadius:'6px',
      cursor:'pointer'
    }}
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

  <button
    style={{
      flex:1,
      background:'#f44336',
      color:'white',
      border:'none',
      padding:'8px',
      borderRadius:'6px',
      cursor:'pointer'
    }}
    onClick={() => setEditId(null)}
  >
    Cancel
  </button>
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
        let totalInterest =
  Number(tx.base_interest || 0);

tx.extensions.forEach(ext => {

  if (ext.interest_paid) {

    totalInterest =
      Number(ext.extra_interest || 0);

  } else {

    totalInterest +=
      Number(ext.extra_interest || 0);

  }

});

const finalInterest =

  tx.final_interest > 0

    ? Number(tx.final_interest)

    : (

        tx.early_paid

          ? Number(tx.early_paid_interest || 0)

          : totalInterest

      );

const total =

  tx.final_total > 0

    ? Number(tx.final_total)

    : (
        Number(tx.principal_amount || 0) +
        Number(finalInterest || 0)
      );

        const todayDate = new Date();
todayDate.setHours(0, 0, 0, 0);

const dueDate = new Date(tx.due_date);
dueDate.setHours(0, 0, 0, 0);

const overdueDays = Math.max(
  1,
  Math.floor((todayDate - dueDate) / (1000 * 60 * 60 * 24))
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
        let totalInterest =
  Number(tx.base_interest || 0);

tx.extensions.forEach(ext => {

  if (ext.interest_paid) {

    totalInterest =
      Number(ext.extra_interest || 0);

  } else {

    totalInterest +=
      Number(ext.extra_interest || 0);

  }

});

const finalInterest =

  tx.final_interest > 0

    ? Number(tx.final_interest)

    : (

        tx.early_paid

          ? Number(tx.early_paid_interest || 0)

          : totalInterest

      );

const total =

  tx.final_total > 0

    ? Number(tx.final_total)

    : (
        Number(tx.principal_amount || 0) +
        Number(finalInterest || 0)
      );
        
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
                {
  tx.extensions?.length > 0
    ? new Date(
        tx.extensions[tx.extensions.length - 1].new_due_date
      ).toDateString()
    : new Date(tx.due_date).toDateString()
}
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
      <div style={{
  display: 'grid',
  gap: 12,
  marginTop: 20
}}>

  <button
    onClick={() => {

      handleExportPDF(
        exportType,
        exportMonth
      );

      setShowExportPopup(false);

    }}
    style={{
      width: '100%',
      padding: 14,
      border: 'none',
      borderRadius: 14,
      background: '#dc2626',
      color: 'white',
      fontWeight: 'bold',
      cursor: 'pointer'
    }}
  >
    📕 Export PDF
  </button>

  <button
    onClick={() => {

      handleExport(
        exportType,
        exportMonth
      );

      setShowExportPopup(false);

    }}
    style={{
      width: '100%',
      padding: 14,
      border: 'none',
      borderRadius: 14,
      background: '#16a34a',
      color: 'white',
      fontWeight: 'bold',
      cursor: 'pointer'
    }}
  >
    📗 Export CSV
  </button>

  <button
    onClick={() =>
      setShowExportPopup(false)
    }
    style={{
      width: '100%',
      padding: 12,
      border: 'none',
      borderRadius: 12,
      background: '#e2e8f0',
      fontWeight: 'bold',
      cursor: 'pointer'
    }}
  >
    Close
  </button>

</div>

    </div>
  </div>
)}
      {/* 🔥 POPUP (ADD HERE — TOP INSIDE RETURN) */}
      {showNoDuePopup && (
        <div style={{
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: '#4CAF50',
  color: 'white',
  padding: '14px 22px',
  borderRadius: 12,
  boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
  zIndex: 9999,
  fontWeight: 'bold',
  fontSize: '16px'
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
      {/* ================= PRO FILTER TOOLBAR ================= */}

<div style={{
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',

  padding: 24,
  borderRadius: 28,

  marginTop: 20,
  marginBottom: 24,

  boxShadow: '0 10px 40px rgba(0,0,0,0.08)',

  border: '1px solid rgba(255,255,255,0.4)',

  position: 'sticky',
  top: 15,
  zIndex: 50
}}>
{/* TOP ROW */}
<div style={{
  display: 'flex',
  gap: 14,
  alignItems: 'center',
  flexWrap: 'wrap',
  marginBottom: 20
}}>

  {/* SEARCH */}
  <div style={{
    flex: '1 1 350px',
minWidth: 280,
maxWidth: '100%'
  }}>

    <input
      type="text"
      placeholder="🔍 Search by name..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      style={{
        width: 'calc(100% - 36px)',
        padding: '14px 18px',
        borderRadius: 16,
        border: '1px solid #ddd',
        fontSize: 15,
        outline: 'none',
        background: '#f8fafc'
      }}
    />

  </div>

  {/* USER */}
  <select
    value={selectedName}
    onChange={(e) => setSelectedName(e.target.value)}
    style={{
      padding: '12px 16px',
      borderRadius: 14,
      border: '1px solid #ddd',
      background: '#f8fafc',
      minWidth: 170,
      fontWeight: '600',
      cursor: 'pointer'
    }}
  >
    <option value="all">👤 All Users</option>

    {names.slice(1).map(name => (
      <option
        key={name}
        value={name}
      >
        {name}
      </option>
    ))}
  </select>

  {/* STATUS */}
  <select
    value={filterType}
    onChange={(e) => setFilterType(e.target.value)}
    style={{
      padding: '12px 16px',
      borderRadius: 14,
      border: '1px solid #ddd',
      background: '#f8fafc',
      minWidth: 150,
      fontWeight: '600',
      cursor: 'pointer'
    }}
  >
    <option value="pending">🟠 Pending</option>
    <option value="paid">🟢 Paid</option>
    <option value="extended">🔵 Extended</option>
    <option value="due">🔴 Overdue</option>
  </select>

  {/* SORT */}
  <select
    value={sortType}
    onChange={(e) => setSortType(e.target.value)}
    style={{
      padding: '12px 16px',
      borderRadius: 14,
      border: '1px solid #ddd',
      background: '#f8fafc',
      minWidth: 150,
      fontWeight: '600',
      cursor: 'pointer'
    }}
  >
    <option value="date">📅 Sort by Date</option>
    <option value="name">🔤 Sort by Name</option>
  </select>

</div>

{/* SECOND ROW BADGES */}
<div style={{
  display: 'flex',
  gap: 14,
  flexWrap: 'wrap'
}}>

</div>


  {/* BADGES */}
  <div style={{
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap'
  }}>

    {/* PENDING */}
    <div
      onClick={() => setFilterType('pending')}
      onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-3px)';
}}

onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0px)';
}}
      style={{
        background:
          filterType === 'pending'
            ? 'linear-gradient(135deg,#ff9800,#ffb74d)'
            : '#fff3e0',

        color:
          filterType === 'pending'
            ? 'white'
            : '#e65100',

        padding: '12px 18px',
        borderRadius: 999,
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transform: 'translateY(0px)',
transition: '0.25s ease',
        boxShadow:
          filterType === 'pending'
            ? '0 8px 20px rgba(255,152,0,0.35)'
            : 'none',

        transition: '0.25s'
      }}
    >
      🟠 Pending: {pendingCount}
    </div>

    {/* PAID */}
    <div
      onClick={() => setFilterType('paid')}
      onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-3px)';
}}

onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0px)';
}}
      style={{
        background:
          filterType === 'paid'
            ? 'linear-gradient(135deg,#4CAF50,#66BB6A)'
            : '#e8f5e9',

        color:
          filterType === 'paid'
            ? 'white'
            : '#1b5e20',

        padding: '12px 18px',
        borderRadius: 999,
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transform: 'translateY(0px)',
transition: '0.25s ease',
        boxShadow:
          filterType === 'paid'
            ? '0 8px 20px rgba(76,175,80,0.35)'
            : 'none',

        transition: '0.25s'
      }}
    >
      🟢 Paid: {paidCount}
    </div>

    {/* EXTENDED */}
    <div
      onClick={() => setFilterType('extended')}
      onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-3px)';
}}

onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0px)';
}}
      style={{
        background:
          filterType === 'extended'
            ? 'linear-gradient(135deg,#2196F3,#64B5F6)'
            : '#e3f2fd',

        color:
          filterType === 'extended'
            ? 'white'
            : '#0d47a1',

        padding: '12px 18px',
        borderRadius: 999,
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transform: 'translateY(0px)',
transition: '0.25s ease',
        boxShadow:
          filterType === 'extended'
            ? '0 8px 20px rgba(33,150,243,0.35)'
            : 'none',

        transition: '0.25s'
      }}
    >
      🔵 Extended: {extendedCount}
    </div>

    {/* DUE */}
    <div
      onClick={() => setFilterType('due')}
      onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-3px)';
}}

onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0px)';
}}
      style={{
        background:
          filterType === 'due'
            ? 'linear-gradient(135deg,#F44336,#EF5350)'
            : '#ffebee',

        color:
          filterType === 'due'
            ? 'white'
            : '#b71c1c',

        padding: '12px 18px',
        borderRadius: 999,
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transform: 'translateY(0px)',
transition: '0.25s ease',
        boxShadow:
          filterType === 'due'
            ? '0 8px 20px rgba(244,67,54,0.35)'
            : 'none',

        transition: '0.25s'
      }}
    >
      🔴 Due: {dueCount}
    </div>

  </div>

</div>
  
      {/* FILTER + SORT */}
      

{/* 💰 TOTAL DUE */}
<div style={{
  marginTop: 20,
  marginBottom: 35,

  background:
    'linear-gradient(135deg,#fef3c7,#fde68a)',

  borderRadius: 24,

  padding: '22px 28px',

  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',

  boxShadow:
    '0 10px 25px rgba(0,0,0,0.08)'
}}>

  <div>

    <p style={{
      margin: 0,
      color: '#92400e',
      fontSize: 13,
      fontWeight: 'bold',
      letterSpacing: 1
    }}>
      TOTAL ACTIVE DUE
    </p>

    <h1 style={{
      margin: '8px 0 0',
      color: '#78350f',
      fontSize: 38,
      fontWeight: '800'
    }}>
      {formatCurrency(totalDueAmount)}
    </h1>

  </div>

  <div style={{
    fontSize: 55
  }}>
    💰
  </div>

</div>
  <div style={{ marginTop: 20 }}>

  <h2 style={{
  fontSize: 32,
  fontWeight: '800',
  marginBottom: 20,
  color: '#0f172a',
  display: 'flex',
  alignItems: 'center',
  gap: 10
}}>
  💵 Normal Payments
</h2>
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 12,
    marginBottom: 20
  }}>
    {normalData.map(renderCard)}
  </div>

  <h2 style={{
  fontSize: 32,
  fontWeight: '800',
  marginBottom: 20,
  marginTop: 50,
  color: '#eb530cec',
  display: 'flex',
  alignItems: 'center',
  gap: 10
}}>
  🔄 Rotation Payments
</h2>
  <div style={{
    display: 'grid',
    gridTemplateColumns:
  'repeat(5, minmax(0,1fr))',
    gap: 12
  }}>
    {rotationData.map(renderCard)}
  </div>

  <h2 style={{
  fontSize: 32,
  fontWeight: '800',
  marginBottom: 20,
  marginTop: 50,
  color: '#4338ca',
  display: 'flex',
  alignItems: 'center',
  gap: 10
}}>
  💳 Loan Payments
</h2>

{/* <LoanProfile
  data={loanData}
  refresh={fetchData}
/> */}

<LoanProfile
  data={filteredLoanData}
  refresh={fetchData}
/>

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


export default TransactionList;