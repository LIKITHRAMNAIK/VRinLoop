import React from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


import {

  exportTransactionsCSV,
  exportTransactionsPDF,

  exportLoanCSV,
  exportLoanPDF

} from '../utils/exportTransactions';

function Sidebar({ open, setOpen }) {

  const [showLoanPopup, setShowLoanPopup] =
  React.useState(false);

  const navigate = useNavigate();
  
  const exportCSV = async () => {

  try {

    const res = await API.get('/');

    const data = res.data;

    const rows = [[

      'Name',

      'Type',

      'Transaction',

      'Original Amount',

      'Extra Interest',

      'Updated Amount',

      'Paid Amount',

      'Remaining',

      'Extended',

      'Last Interest Paid',

      'Due Date',

      'Status'

    ]];

    data.forEach(tx => {

      let updatedAmount =
        tx.principal_amount || 0;

      let extraInterest = 0;

      let extensionText = 'No';

      let lastInterestPaid = 'No';

      if (
        tx.extensions &&
        tx.extensions.length > 0
      ) {

        extensionText = 'Yes';

        tx.extensions.forEach(ext => {

          extraInterest +=
            ext.extra_interest || 0;

          if (ext.paid) {
            lastInterestPaid = 'Yes';
          }

        });

        updatedAmount += extraInterest;

      }

      let remaining = 0;

      if (
        tx.transaction_type === 'loan'
      ) {

        remaining =
          (tx.remaining_emi || 0) *
          (tx.emi_amount || 0);

      } else {

        remaining =
          updatedAmount -
          (tx.paid_amount || 0);

      }

      rows.push([

        tx.person_name,

        tx.type,

        tx.transaction_type,

        tx.principal_amount,

        extraInterest,

        updatedAmount,

        tx.paid_amount || 0,

        remaining,

        extensionText,

        lastInterestPaid,

        new Date(
          tx.due_date
        ).toLocaleDateString(),

        tx.extensions?.length > 0
          ? 'EXTENDED'
          : tx.status.toUpperCase()

      ]);

    });

    const csvContent = rows
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob(
      [csvContent],
      {
        type:
          'text/csv;charset=utf-8;'
      }
    );

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;

    link.download =
      'MoMaS-Advanced-Report.csv';

    link.click();

  } catch (err) {

    console.log(err);

  }

};

const exportPDF = async () => {

  try {

    const res = await API.get('/');

    const data = res.data;

    const doc = new jsPDF();

    doc.setFontSize(22);

    doc.text(
      'MoMaS Financial Transactions',
      14,
      20
    );

    let y = 35;

    data.forEach((tx, index) => {

      let updatedAmount =
        tx.principal_amount || 0;

      let extraInterest = 0;

      let extensionText = 'No';

      let lastInterestPaid = 'No';

      if (
        tx.extensions &&
        tx.extensions.length > 0
      ) {

        extensionText = 'Yes';

        tx.extensions.forEach(ext => {

          extraInterest +=
            ext.extra_interest || 0;

          if (ext.paid) {
            lastInterestPaid = 'Yes';
          }

        });

        updatedAmount += extraInterest;

      }

      let remaining = 0;

      if (
        tx.transaction_type === 'loan'
      ) {

        remaining =
          (tx.remaining_emi || 0) *
          (tx.emi_amount || 0);

      } else {

        remaining =
          updatedAmount -
          (tx.paid_amount || 0);

      }

      autoTable(doc, {

        startY: y,

        theme: 'grid',

        head: [[
          `Transaction ${index + 1}`
        ]],

        body: [

          [
            'Name',
            tx.person_name
          ],

          [
            'Type',
            tx.type
          ],

          [
            'Transaction',
            tx.transaction_type
          ],

          [
            'Original Amount',
            `₹${tx.principal_amount}`
          ],

          [
            'Extra Interest',
            `₹${extraInterest}`
          ],

          [
            'Updated Amount',
            `₹${updatedAmount}`
          ],

          [
            'Paid Amount',
            `₹${tx.paid_amount || 0}`
          ],

          [
            'Remaining',
            `₹${remaining}`
          ],

          [
            'Extended',
            extensionText
          ],

          [
            'Last Interest Paid',
            lastInterestPaid
          ],

          [
            'Due Date',
            new Date(
              tx.due_date
            ).toLocaleDateString()
          ],

          [
            'Status',
            tx.extensions?.length > 0
              ? 'EXTENDED'
              : tx.status.toUpperCase()
          ]

        ],

        styles: {

          fontSize: 10,

          cellPadding: 4

        },

        headStyles: {

          fillColor: [79, 70, 229]

        }

      });

      y =
        doc.lastAutoTable.finalY + 12;

      if (y > 250) {

        doc.addPage();

        y = 20;

      }

    });

    doc.save(
      'MoMaS-Advanced-Report.pdf'
    );

  } catch (err) {

    console.log(err);

  }

};

  const menuItems = [
    {
      icon: '👥',
      label: 'User Profiles',
      path: '/users'
    },
    {
  icon: '💳',
  label: 'Loan Profiles',
  path: '/loan-users'
},
{
  icon: '🏦',
  label: 'Loan Statements'
},
    {
      icon: '📄',
      label: 'Export CSV'
    },
    {
      icon: '📑',
      label: 'Export PDF'
    },
    
    {
      icon: '👤',
      label: 'My Profile',
      path: '/my-profile'
    }
  ];

  return (
    <>

      {/* DARK OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 999
          }}
        />
      )}

      {/* SIDEBAR */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: open ? 240 : 70,
        height: '100vh',
        background: '#fbf7fb00',
        color: 'white',
        transition: '0.3s',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 15,
        overflow: 'hidden',
        boxShadow: '2px 0 15px rgba(15, 14, 14, 0.25)'
      }}>

        {/* TOP MENU BUTTON */}
        <div style={{
          display: 'flex',
          justifyContent: open ? 'space-between' : 'center',
          alignItems: 'center',
          padding: '0 15px',
          marginBottom: 25
        }}>

          {open && (
            <h2 style={{
              margin: 0,
              fontSize: 20
            }}>
              MoMaS
            </h2>
          )}

          <button
            onClick={() => setOpen(!open)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: 'none',
              background: '#e70f9f',
              color: 'white',
              cursor: 'pointer',
              fontSize: 20,
              fontWeight: 'bold'
            }}
          >
            ☰
          </button>

        </div>

        {/* MENU ITEMS */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: '0 10px'
        }}>

          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={async () => {

                if (
  item.label === 'Loan Statements'
) {

  setShowLoanPopup(true);

  return;

}

  if (item.label === 'Export CSV') {

    try {

      const res = await API.get('/');

      exportTransactionsCSV(
        res.data,
        'all'
      );

    } catch (err) {

      console.log(err);

    }

    return;

  }

  if (item.label === 'Export PDF') {

    try {

      const res = await API.get('/');

      exportTransactionsPDF(
        res.data,
        'all'
      );

    } catch (err) {

      console.log(err);

    }

    return;

  }

  if (item.path) {

    navigate(item.path);

  }

}}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 15,
                padding: '14px 12px',
                borderRadius: 12,
                cursor: 'pointer',
                background: '#147ca5',
                transition: '0.2s'
              }}
            >

              <span style={{
                fontSize: 22,
                minWidth: 25,
                textAlign: 'center'
              }}>
                {item.icon}
              </span>

              {open && (
                <span style={{
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}>
                  {item.label}
                </span>
              )}

            </div>
          ))}

        </div>

      </div>

      {showLoanPopup && (

  <div style={{
    position: 'fixed',
    inset: 0,
    background:
      'rgba(0,0,0,0.45)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  }}>

    <div style={{
      width: 340,
      background: 'white',
      borderRadius: 24,
      padding: 30
    }}>

      <h2 style={{
        marginTop: 0
      }}>
        🏦 Loan Statements
      </h2>

      <div style={{
        display: 'grid',
        gap: 14,
        marginTop: 25
      }}>

        <button

          onClick={async () => {

            try {

              const res =
                await API.get('/');

              const loans =
                res.data.filter(
                  tx =>
                    tx.transaction_type ===
                    'loan'
                );

              exportLoanCSV(loans);

              setShowLoanPopup(false);

            } catch (err) {

              console.log(err);

            }

          }}

          style={{
            padding: 14,
            border: 'none',
            borderRadius: 14,
            background: '#16a34a',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          📗 Export Loan CSV
        </button>

        <button

          onClick={async () => {

            try {

              const res =
                await API.get('/');

              const loans =
                res.data.filter(
                  tx =>
                    tx.transaction_type ===
                    'loan'
                );

              exportLoanPDF(loans);

              setShowLoanPopup(false);

            } catch (err) {

              console.log(err);

            }

          }}

          style={{
            padding: 14,
            border: 'none',
            borderRadius: 14,
            background: '#dc2626',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          📕 Export Loan PDF
        </button>

        <button

          onClick={() =>
            setShowLoanPopup(false)
          }

          style={{
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

    </>
  );
}

export default Sidebar;