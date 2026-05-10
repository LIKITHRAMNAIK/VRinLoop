import React, { useState,useEffect } from 'react';
import API from '../services/api';
import { formatCurrency } from '../utils/format';
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
  notes: ''
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
      notes: form.notes
    });

    alert('Transaction Added ✅');

      setForm({
  transaction_type: 'rotation',   // ✅ NEW
  person_name: '',
  type: 'incoming',
  principal_amount: '',
  base_interest: '',
  start_date: '',
  due_date: '',
  notes: ''
});

      refresh();

    } catch (err) {
      console.log(err);
      alert('Error ❌');
    }
  };

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
    onChange={handleChange}
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
      <div>
        <label>Type</label><br />
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="incoming">Incoming</option>
          <option value="outgoing">Outgoing</option>
        </select>
      </div>
  
      {/* AMOUNT */}
      <div>
        <label>{isNormal ? 'Principal Amount' : 'Amount Details'}</label><br />

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

{isLoan && (
  <input
    type="number"
    name="principal_amount"
    placeholder="Loan amount"
    value={form.principal_amount}
    onChange={handleChange}
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
        <label style={{ width: '100px' }}>Due Date</label>
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