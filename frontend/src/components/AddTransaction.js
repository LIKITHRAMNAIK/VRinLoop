import React, { useState,useEffect } from 'react';
import API from '../services/api';
const inputStyle = {
  width: '100%',
  padding: '8px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  outline: 'none'
};

const addBtn = {
  background: '#4CAF50',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: 'pointer'
};

const closeBtn = {
  background: '#f44336',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: 'pointer'
};
function AddTransaction({ refresh }) {
  const [names, setNames] = useState([]);
  const [form, setForm] = useState({
  person_name: '',
  type: 'incoming',
  transaction_type: 'rotation',   // ✅ ADD THIS
  principal_amount: '',
  base_interest: '',
  start_date: '',
  due_date: '',
  notes: '',
  loan_duration: '',
emi_amount: '',
interest_type: 'flat',

loan_mode: 'new',
already_paid_months: 0,
last_paid_date: ''
});
const isRotation = form.transaction_type === 'rotation';
const isNormal = form.transaction_type === 'normal';
const isLoan = form.transaction_type === 'loan';
  useEffect(() => {
    API.get('/')
      .then(res => {
        const unique = [
          ...new Set(res.data.map(tx => tx.person_name))
        ];
        setNames(unique);
      })
      .catch(err => console.log(err));
  }, []);

  const handleChange = (e) => {
  let { name, value } = e.target;

  if (name === 'person_name') {
    value = value
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  setForm(prev => ({
    ...prev,
    [name]: value
  }));
};

  const handleSubmit = async (e) => {
  e.preventDefault();

  console.log("SENDING DATA:", form);   // ✅ ADD THIS

  try {
    await API.post('/add', {
      person_name: form.person_name.trim(),
      type: form.type,
      transaction_type: form.transaction_type,
      principal_amount: Number(form.principal_amount),
      base_interest: Number(form.base_interest),
      start_date: form.start_date,
      due_date: form.due_date,
      notes: form.notes,
      loan_duration: Number(form.loan_duration),
emi_amount: Number(form.emi_amount),
interest_type: form.interest_type,
loan_mode: form.loan_mode,
already_paid_months: Number(form.already_paid_months),
last_paid_date: form.last_paid_date
    });

    alert('Transaction Added ✅');

      setForm({
  person_name: '',
  type: 'incoming',
  transaction_type: 'rotation',
  principal_amount: '',
  base_interest: '',
  start_date: '',
  due_date: '',
  notes: '',
  loan_duration: '',
  emi_amount: '',
  interest_type: 'flat',
  loan_mode: 'new',
already_paid_months: 0,
last_paid_date: ''
});

      refresh();

    } catch (err) {
      console.log(err);
      alert('Error ❌');
    }
  };

  useEffect(() => {

  if (
    isLoan &&
    form.principal_amount &&
    form.base_interest &&
    form.loan_duration
  ) {

    const total =
      Number(form.principal_amount) +
      Number(form.base_interest);

    const emi =
      Math.ceil(
        total / Number(form.loan_duration)
      );

    let nextDueDate = form.due_date;

    let calculatedStartDate =
      form.start_date;

    // EXISTING LOAN
    if (
      form.loan_mode === 'existing' &&
      form.last_paid_date
    ) {

      // NEXT EMI DATE
      const nextDate = new Date(
        form.last_paid_date
      );

      nextDate.setMonth(
        nextDate.getMonth() + 1
      );

      nextDueDate =
        nextDate.toISOString()
          .split('T')[0];

      // AUTO START DATE
      const startDate = new Date(
        form.last_paid_date
      );

      startDate.setMonth(
        startDate.getMonth() -
        (
          Number(form.already_paid_months) - 1
        )
      );

      calculatedStartDate =
        startDate.toISOString()
          .split('T')[0];

    }

    setForm(prev => ({
      ...prev,

      emi_amount: emi,

      start_date: calculatedStartDate,

      due_date: nextDueDate
    }));

  }

}, [
  form.principal_amount,
  form.base_interest,
  form.loan_duration,
  form.last_paid_date,
  form.already_paid_months,
  form.loan_mode,
  isLoan
]);

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
  
      <h2 style={{ textAlign: 'center' }}>Add Transaction</h2>

<div>
  <label>Transaction Type</label><br />
  <select
    name="transaction_type"
    value={form.transaction_type}
    onChange={(e) => {
  const value = e.target.value;

  setForm({
    ...form,
    transaction_type: value,
    type: value === 'loan'
      ? 'outgoing'
      : form.type
  });
}}
    style={inputStyle}
  >
    <option value="rotation">Rotation</option>
    <option value="normal">Normal</option>
    <option value="loan">Loan</option>
  </select>
</div>
  
      {/* NAME */}
      <div>
        <label>Name</label><br />
        <input
          list="names"
          name="person_name"
          placeholder="Enter name"
          value={form.person_name}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <datalist id="names">
          {names.map((n, i) => (
            <option key={i} value={n} />
          ))}
        </datalist>
      </div>
  
      {/* TYPE */}

{form.transaction_type !== 'loan' && (
  <>
    <label>Type</label>

    <select
      name="type"
      value={form.type}
      onChange={handleChange}
      style={inputStyle}
    >
      <option value="incoming">Incoming</option>
      <option value="outgoing">Outgoing</option>
    </select>
  </>
)}
  
      {/* AMOUNT */}
      <div>
        <label>
  {
    isNormal
      ? 'Principal Amount'
      : isLoan
      ? 'Loan Details'
      : 'Amount Details'
  }
</label><br />

{isRotation && (
  <div style={{ display: 'flex', gap: '10px' }}>

    <input
      type="number"
      name="principal_amount"
      placeholder="Principal"
      value={form.principal_amount}
      onChange={handleChange}
      min="0"
      max="10000000"
      required
      style={{ ...inputStyle, flex: 1 }}
    />

    <input
      type="number"
      name="base_interest"
      placeholder="Interest"
      value={form.base_interest}
      onChange={handleChange}
      min="0"
      max="10000000"
      required
      style={{ ...inputStyle, flex: 1 }}
    />

  </div>
)}

    {form.transaction_type === 'loan' && (
  <div style={{
  marginTop: 15,
  padding: 22,
  background: 'linear-gradient(135deg, #f3ecff, #e7ddff)',
  borderRadius: 18,
  border: '1px solid #d5c2ff',
  boxShadow: '0 4px 14px rgba(94,53,177,0.12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 14
}}>

  <h3 style={{
  margin: 0,
  color: '#5E35B1',
  fontSize: 24,
  fontWeight: '700',
  display: 'flex',
  alignItems: 'center',
  gap: 10
}}>
    💳 Loan Details
  </h3>
<select
  name="loan_mode"
  value={form.loan_mode}
  onChange={handleChange}
  style={{
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid #cdb7ff',
    background: '#ffffff',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box'
  }}
>
  <option value="new">
    New Loan
  </option>

  <option value="existing">
    Existing Loan
  </option>
</select>
  {/* LOAN AMOUNT */}
  <input
    type="number"
    name="principal_amount"
    placeholder="Loan Amount"
    value={form.principal_amount}
    onChange={handleChange}
    style={{
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid #cdb7ff',
  background: '#ffffff',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box'
}}
  />

  {/* TOTAL INTEREST */}
  <input
    type="number"
    name="base_interest"
    placeholder="Total Interest"
    value={form.base_interest}
    onChange={handleChange}
    style={{
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid #cdb7ff',
  background: '#ffffff',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box'
}}
  />
  {/* DURATION */}
  <input
  type="number"
  name="loan_duration"
  placeholder="Loan Duration (Months)"
  value={form.loan_duration}
    onChange={(e) =>
      setForm({
        ...form,
        loan_duration: e.target.value
      })
    }
    style={{
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid #cdb7ff',
  background: '#ffffff',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box'
}}
  />

  {/* EMI */}
  <input
  type="number"
  placeholder="Monthly EMI Amount"
  value={form.emi_amount}
  readOnly
  style={{
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid #cdb7ff',
  background: '#ffffff',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box'
}}
/>

{form.loan_mode === 'existing' && (

  <>
<label style={{
  color: '#5E35B1',
  fontWeight: '600'
}}>
  Already Paid EMIs
</label>
    <input
      type="number"
      name="already_paid_months"
      min="0"
max={form.loan_duration || 0}
      placeholder="Already Paid Months"
      value={form.already_paid_months}
      onChange={handleChange}
      style={{
        width: '100%',
        padding: '14px 16px',
        borderRadius: 12,
        border: '1px solid #cdb7ff',
        background: '#ffffff',
        fontSize: 15,
        outline: 'none',
        boxSizing: 'border-box'
      }}
    />
<label style={{
  color: '#5E35B1',
  fontWeight: '600'
}}>
  Last EMI Paid Date
</label>
    <input
      type="date"
      name="last_paid_date"
      value={form.last_paid_date}
      onChange={handleChange}
      style={{
        width: '100%',
        padding: '14px 16px',
        borderRadius: 12,
        border: '1px solid #cdb7ff',
        background: '#ffffff',
        fontSize: 15,
        outline: 'none',
        boxSizing: 'border-box'
      }}
    />

  </>

)}


</div>
)}

{isNormal && (
  <input
    type="number"
    name="principal_amount"
    placeholder="Enter amount"
    value={form.principal_amount}
    onChange={handleChange}
    min="0"
    max="10000000"
    required
    style={inputStyle}
  />
)}


      </div>
  
      {/* START DATE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ width: '100px' }}>Start Date</label>
        <input
          type="date"
          name="start_date"
          value={form.start_date}
          onChange={handleChange}
          required
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
  
      {/* DUE DATE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ width: '100px' }}>
  {isLoan
    ? 'EMI Due Date'
    : 'Due Date'}
</label>
        <input
          type="date"
          name="due_date"
          value={form.due_date}
          onChange={handleChange}
          required
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
  
      {/* NOTES */}
      <div>
        <label>Notes</label><br />
        <input
          name="notes"
          placeholder="Optional notes"
          value={form.notes}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>
  
      {/* BUTTONS */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        marginTop: '10px'
      }}>
        <button type="submit" style={addBtn}>
          Add
        </button>
  
        <button
          type="button"
          onClick={() => refresh()}
          style={closeBtn}
        >
          Close
        </button>
      </div>
  
    </form>
  );
}

export default AddTransaction;