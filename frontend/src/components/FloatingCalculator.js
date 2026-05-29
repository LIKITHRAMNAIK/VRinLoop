import { useState } from 'react';

export default function FloatingCalculator() {

  const [open, setOpen] =
    useState(false);

  const [display, setDisplay] =
    useState('');

const [history, setHistory] =
  useState([]);

const [showAdvanced, setShowAdvanced] =
  useState(false);

const [activeTool, setActiveTool] =
  useState('calculator');

  const [loanAmount, setLoanAmount] =
  useState('');

const [interestRate, setInterestRate] =
  useState('');

const [months, setMonths] =
  useState('');

const [emiResult, setEmiResult] =
  useState(null);

const [principal, setPrincipal] =
  useState('');

const [interestAmount, setInterestAmount] =
  useState('');

const [interestResult, setInterestResult] =
  useState(null);

const formatINR = (amount) => {

  return Number(amount)
    .toLocaleString('en-IN');

};

const toolBtn = {

  padding: 12,

  border: 'none',

  borderRadius: 12,

  background: '#22c55e',

  color: 'white',

  fontWeight: 'bold',

  cursor: 'pointer'

};

const emiInput = {

  width: '100%',

  padding: 10,

  marginBottom: 10,

  borderRadius: 10,

  border:
    '1px solid #ddd',

  boxSizing:
    'border-box'

};

  const clickValue = (value) => {

    if (value === 'C') {

      setDisplay('');
      return;

    }

    if (value === '=') {

  try {

    const result =
      eval(display);

    setHistory(prev => [

      `${display}
 = ₹${formatINR(result)}`,

      ...prev

    ]);

    setDisplay(
      String(result)
    );

  } catch {

    setDisplay('Error');

  }

  return;
}

    setDisplay(
      prev => prev + value
    );

  };

  const calculateEMI = () => {

  const P =
    Number(loanAmount);

  const R =
    Number(interestRate) /
    12 /
    100;

  const N =
    Number(months);

  if (
    !P ||
    !R ||
    !N
  ) return;

  const emi =

    (P * R *

      Math.pow(
        1 + R,
        N
      ))

    /

    (

      Math.pow(
        1 + R,
        N
      ) - 1

    );

  const totalPayment =
    emi * N;

  const totalInterest =
    totalPayment - P;

setHistory(prev => [

  `EMI ₹${loanAmount}
   @ ${interestRate}% /
   ${months}M
   = ₹${formatINR(
  emi.toFixed(2)
)}`,

  ...prev

]);

  setEmiResult({

    emi:
      emi.toFixed(2),

    interest:
      totalInterest.toFixed(2),

    total:
      totalPayment.toFixed(2)

  });

};

const calculateInterest = () => {

  const total =

    Number(principal) +

    Number(
      interestAmount
    );

  setInterestResult(total);

setHistory(prev => [

  `${principal}
   + ${interestAmount}
   = ₹${formatINR(total)}`,

  ...prev

]);

};

  const buttons = [

    '7','8','9','/',
    '4','5','6','*',
    '1','2','3','-',
    '0','.','%','+',
    'C','='

  ];

  return (

    <>

      {open && (

        <div style={{

          position: 'fixed',

          bottom: 95,

          right: 25,

          width: 320,

          background: 'white',

          borderRadius: 24,

          padding: 20,

          boxShadow:
            '0 15px 40px rgba(0,0,0,0.25)',

          zIndex: 99999,

          maxHeight: '80vh',
overflowY: 'auto',

        }}>

          <div style={{

            display: 'flex',

            justifyContent:
              'space-between',

            alignItems: 'center',

            marginBottom: 15

          }}>

            <h3 style={{
              margin: 0
            }}>
              Calculator
            </h3>

            

            <button

              onClick={() =>
                setOpen(false)
              }

              style={{

                border: 'none',

                background: 'none',

                cursor: 'pointer',

                fontSize: 20

              }}

            >

              ✖

            </button>

            

          </div>

          <div style={{

  display: 'flex',

  justifyContent:
    'space-between',

  alignItems: 'center',

  marginBottom: 10

}}>

  <span
    style={{
      fontWeight: 'bold'
    }}
  >
    History
  </span>

  <button

    onClick={() =>
      setHistory([])
    }

    style={{

      border: 'none',

      background: '#ef4444',

      color: 'white',

      borderRadius: 8,

      padding: '4px 10px',

      cursor: 'pointer'

    }}

  >

    Clear

  </button>

</div>

<div style={{

  maxHeight: 100,

  overflowY: 'auto',

  marginBottom: 15,

  background: '#f8fafc',

  borderRadius: 12,

  padding: 10

}}>

  {history.length === 0
    ? 'No history'
    : history.map((item,index) => (

        <div
          key={index}
          style={{
            marginBottom: 5
          }}
        >
          {item}
        </div>

      ))
  }

</div>

          <input

            value={display}

            readOnly

            style={{

              width: '100%',

              height: 60,

              fontSize: 24,

              textAlign: 'right',

              marginBottom: 15,

              borderRadius: 12,

              border:
                '1px solid #ddd',

              padding: 10,

              boxSizing:
                'border-box'

            }}

          />

          <div style={{

            display: 'grid',

            gridTemplateColumns:
              'repeat(4,1fr)',

            gap: 10

          }}>

            {buttons.map(btn => (

              <button

                key={btn}

                onClick={() =>
                  clickValue(btn)
                }

                style={{

                  height: 55,

                  border: 'none',

                  borderRadius: 12,

                  cursor: 'pointer',

                  fontSize: 18,

                  fontWeight: 'bold'

                }}

              >

                {btn}

              </button>

            ))}

          </div>

          <button

  onClick={() =>
    setShowAdvanced(
      !showAdvanced
    )
  }

  style={{

    width: '100%',

    marginTop: 15,

    padding: 12,

    border: 'none',

    borderRadius: 12,

    background:
      '#4f46e5',

    color: 'white',

    cursor: 'pointer'

  }}

>

  Advanced Tools

</button>

{showAdvanced && (

  <div style={{

    marginTop: 12,

    display: 'flex',

    flexDirection: 'column',

    gap: 10

  }}>

    <button

      onClick={() =>
        setActiveTool(
          'emi'
        )
      }

      style={toolBtn}

    >

      EMI Calculator

    </button>

    <button

      onClick={() =>
        setActiveTool(
          'interest'
        )
      }

      style={toolBtn}

    >

      Interest Calculator

    </button>

  </div>

)}

{activeTool === 'emi' && (

  <div style={{

    marginTop: 20,

    padding: 15,

    background: '#f8fafc',

    borderRadius: 12

  }}>

    <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 15
}}>

  <h4 style={{
    margin: 0,
    color: '#4f46e5'
  }}>
    🏦 EMI Calculator
  </h4>

  <button
    onClick={() =>
      setActiveTool('calculator')
    }
    style={{
      border: 'none',
      background: '#ef4444',
      color: 'white',
      borderRadius: 8,
      padding: '5px 10px',
      cursor: 'pointer'
    }}
  >
    ✖
  </button>

</div>

    <input

      placeholder="Loan Amount"

      value={loanAmount}

      onChange={(e) =>
        setLoanAmount(
          e.target.value
        )
      }

      style={emiInput}

    />

    <input

      placeholder="Interest %"

      value={interestRate}

      onChange={(e) =>
        setInterestRate(
          e.target.value
        )
      }

      style={emiInput}

    />

    <input

      placeholder="Months"

      value={months}

      onChange={(e) =>
        setMonths(
          e.target.value
        )
      }

      style={emiInput}

    />

    <button

      onClick={
        calculateEMI
      }

      style={toolBtn}

    >

      Calculate

    </button>

    {emiResult && (

      <div style={{

  marginTop: 20,

  background:
    'linear-gradient(135deg, #0d9488, #10b981)',

  color: 'white',

  padding: 18,

  borderRadius: 15

}}>

        <p>
  💰 EMI:
  ₹{formatINR(
  emiResult.emi
)}
</p>

<p>
  📈 Interest:
  ₹{formatINR(
  emiResult.interest
)}
</p>

<p>
  🧾 Total:
  ₹{formatINR(
  emiResult.total
)}
</p>

      </div>

    )}

  </div>

)}

{activeTool === 'interest' && (

  <div style={{

    marginTop: 20,

    padding: 15,

    background: '#f8fafc',

    borderRadius: 12

  }}>

    <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 15
}}>

  <h4 style={{
    margin: 0,
    color: '#16a34a'
  }}>
    📊 Interest Calculator
  </h4>

  <button
    onClick={() =>
      setActiveTool('calculator')
    }
    style={{
      border: 'none',
      background: '#ef4444',
      color: 'white',
      borderRadius: 8,
      padding: '5px 10px',
      cursor: 'pointer'
    }}
  >
    ✖
  </button>

</div>

    <input

      placeholder="Principal"

      value={principal}

      onChange={(e) =>
        setPrincipal(
          e.target.value
        )
      }

      style={emiInput}

    />

    <input

      placeholder="Interest"

      value={interestAmount}

      onChange={(e) =>
        setInterestAmount(
          e.target.value
        )
      }

      style={emiInput}

    />

    <button

      onClick={
        calculateInterest
      }

      style={toolBtn}

    >

      Calculate

    </button>

    {interestResult && (

      <div style={{

  marginTop: 20,

  background:
    'linear-gradient(135deg,#16a34a,#22c55e)',

  color: 'white',

  padding: 18,

  borderRadius: 15

}}>

        <h3>

  Total Amount

</h3>

<h2>

  ₹{formatINR(
  interestResult
)}

</h2>

      </div>

    )}

  </div>

)}

        </div>

      )}

      <button

        onClick={() =>
          setOpen(!open)
        }

        style={{

          position: 'fixed',

          bottom: 25,

          right: 25,

          width: 65,

          height: 65,

          borderRadius: '50%',

          border: 'none',

          cursor: 'pointer',

          fontSize: 28,

          background:
            'linear-gradient(135deg,#7c3aed,#4f46e5)',

          color: 'white',

          boxShadow:
            '0 10px 25px rgba(124,58,237,0.35)',

          zIndex: 99999

        }}

      >

        🧮

      </button>

    </>

  );

}

