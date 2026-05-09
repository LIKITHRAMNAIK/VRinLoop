import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import NormalProfile from './NormalProfile';
import RotationProfile from './RotationProfile';
import { formatCurrency } from '../utils/format';

function Profile() {
  const { name } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState([]);

  const fetchData = () => {
    API.get(`/person/${name}`)
      .then(res => {
        const list = res.data.transactions || [];
        setData(list);
      })
      .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchData();
  }, [name]);

  const normalData = data.filter(
    tx => tx.transaction_type === 'normal'
  );

  const rotationData = data.filter(
    tx => tx.transaction_type !== 'normal'
  );
  let incoming = 0;
let outgoing = 0;

let netIncoming = 0;
let netOutgoing = 0;

data.forEach(tx => {

  // ================= NORMAL =================

  if (tx.transaction_type === 'normal') {

    const paid = tx.paid_amount || 0;
    const remaining = tx.principal_amount - paid;

    // ACTIVE MONEY
    if (tx.status !== 'paid') {

      if (tx.type === 'incoming') {
        incoming += remaining;
      } else {
        outgoing += remaining;
      }

    }

    // NET MONEY
    if (paid > 0) {

      if (tx.type === 'incoming') {
        netIncoming += paid;
      } else {
        netOutgoing += paid;
      }

    }

    return;
  }

  // ================= ROTATION / LOAN =================

  let totalInterest = tx.base_interest;

  tx.extensions?.forEach(ext => {
    totalInterest += ext.extra_interest;
  });

  const total = tx.principal_amount + totalInterest;

  // ACTIVE
  if (tx.status !== 'paid') {

    if (tx.type === 'incoming') {
      incoming += total;
    } else {
      outgoing += total;
    }

  }

  // NET
  if (tx.status === 'paid') {

    if (tx.type === 'incoming') {
      netIncoming += total;
    } else {
      netOutgoing += total;
    }

  }

});

const net = netIncoming + netOutgoing;

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

      <h1>{name}'s Profile</h1>
      <div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))',
  gap: 15,
  marginTop: 20,
  marginBottom: 30
}}>

  <div style={{
    background: '#4CAF50',
    color: 'white',
    padding: 20,
    borderRadius: 12
  }}>
    <h3>Incoming</h3>
    <h2>{formatCurrency(incoming)}</h2>
  </div>

  <div style={{
    background: '#F44336',
    color: 'white',
    padding: 20,
    borderRadius: 12
  }}>
    <h3>Outgoing</h3>
    <h2>{formatCurrency(outgoing)}</h2>
  </div>


  <div style={{
  background: net >= 0 ? '#009688' : '#D32F2F',
  color: 'white',
  padding: 20,
  borderRadius: 12,
  gridColumn: 'span 3'
}}>
  <h3>Net</h3>
  <h2>{formatCurrency(net)}</h2>
</div>

</div>

      {/* NORMAL */}
      {normalData.length > 0 && (
        <>
          <h2 style={{ marginTop: 25 }}>
            Normal Payments
          </h2>

          <NormalProfile
            data={normalData}
            refresh={fetchData}
          />
        </>
      )}

      {/* ROTATION */}
      {rotationData.length > 0 && (
        <>
          <h2 style={{ marginTop: 35 }}>
            Rotation Payments
          </h2>

          <RotationProfile
            data={rotationData}
            refresh={fetchData}
          />
        </>
      )}

    </div>
  );
}

export default Profile;