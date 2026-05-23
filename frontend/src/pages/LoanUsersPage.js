import React, {
  useEffect,
  useState
} from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import API from '../services/api';

function LoanUsersPage() {

  const [data, setData] =
    useState([]);

  const navigate = useNavigate();
  useEffect(() => {

  fetchData();

}, []);

const fetchData = async () => {

  try {

    const res =
      await API.get('/');

    setData(res.data);

  } catch (err) {

    console.log(err);

  }

};

  // ONLY LOANS
  const loanData = data.filter(
    tx => tx.transaction_type === 'loan'
  );

  // GROUP USERS
  const groupedUsers = {};

  loanData.forEach(tx => {

    if (!groupedUsers[tx.person_name]) {

      groupedUsers[tx.person_name] = {

        name: tx.person_name,

        totalLoans: 0,

        activeLoans: 0,

        completedLoans: 0,

        totalBorrowed: 0,

        totalRemaining: 0,

        totalLatePayments: 0,

        totalEmis: 0,

        paidEmis: 0
      };

    }

    const user =
      groupedUsers[tx.person_name];

    user.totalLoans += 1;

    user.totalBorrowed +=
      tx.principal_amount || 0;

    user.totalRemaining +=

      (tx.remaining_emi || 0) *

      (tx.emi_amount || 0);

    user.totalEmis +=
      tx.loan_duration || 0;

    user.paidEmis +=
      tx.completed_emi || 0;

    if (tx.status === 'paid') {

      user.completedLoans += 1;

    } else {

      user.activeLoans += 1;

    }

    tx.emi_history?.forEach(emi => {

      if (emi.status === 'late') {

        user.totalLatePayments += 1;

      }

    });

  });

  const users =
    Object.values(groupedUsers);

  return (

    <div style={{
      padding: 30,
      paddingLeft: 95,

      minHeight: '100vh',

      background:
        'linear-gradient(135deg,#f8fafc,#eef2ff)',

      fontFamily:
        "'Inter', sans-serif"
    }}>

      {/* HEADER */}

        <div style={{
  display: 'flex',
  gap: 12,
  marginBottom: 25,
  flexWrap: 'wrap'
}}>

  {/* DASHBOARD */}

  <button
    onClick={() => navigate('/')}
    style={{
      background:
        'linear-gradient(135deg,#2563eb,#3b82f6)',

      color: 'white',

      border: 'none',

      padding: '12px 22px',

      borderRadius: 14,

      cursor: 'pointer',

      fontWeight: 'bold',

      fontSize: 14,

      boxShadow:
        '0 8px 18px rgba(37,99,235,0.25)',

      transition: '0.25s'
    }}
  >
    ⬅ Dashboard
  </button>

  {/* USER PROFILES */}

</div>

<div style={{
        marginBottom: 35
      }}>

        <h1 style={{
          margin: 0,
          fontSize: 46,
          fontWeight: '900',
          color: '#0f172a'
        }}>
          💳 Loan Profiles
        </h1>

        <p style={{
          marginTop: 10,
          color: '#64748b',
          fontSize: 17
        }}>
          Advanced EMI tracking,
          repayment analytics and
          loan health monitoring
        </p>

      </div>

      {/* GRID */}

      <div style={{
        display: 'grid',

        gridTemplateColumns:
  'repeat(3,minmax(0,1fr))',

        gap: 16,
        marginTop: 25,
      }}>

        {users.map(user => {

          const progress =

            user.totalEmis === 0

              ? 0

              : Math.round(

                  (
                    user.paidEmis /
                    user.totalEmis
                  ) * 100

                );

          const risk =

            user.totalLatePayments === 0

              ? 'LOW'

              : user.totalLatePayments <= 3

                ? 'MEDIUM'

                : 'HIGH';

          return (

            <div
              key={user.name}

              onClick={() =>
                navigate(`/profile/${user.name}`)
              }

              onMouseEnter={(e) => {

                e.currentTarget.style.transform =
                  'translateY(-8px)';

                e.currentTarget.style.boxShadow =
                  '0 18px 40px rgba(99,102,241,0.18)';
              }}

              onMouseLeave={(e) => {

                e.currentTarget.style.transform =
                  'translateY(0px)';

                e.currentTarget.style.boxShadow =
                  '0 10px 30px rgba(15,23,42,0.08)';
              }}

              style={{

                background:
                  'linear-gradient(145deg,#ffffff,#f8fafc)',

                borderRadius: 30,

                padding: 28,

                cursor: 'pointer',

                boxShadow:
                  '0 10px 30px rgba(15,23,42,0.08)',

                transition: 'all 0.25s ease'
              }}
            >

              {/* TOP */}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24
              }}>

                <div>

                  <h2 style={{
                    margin: 0,
                    fontSize: 34,
                    fontWeight: '800',
                    color: '#4338ca'
                  }}>
                    {user.name}
                  </h2>

                  <p style={{
                    marginTop: 8,
                    color: '#64748b'
                  }}>
                    Loan Analytics Profile
                  </p>

                </div>

                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',

                  background:
                    'linear-gradient(135deg,#6366f1,#8b5cf6)',

                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',

                  color: 'white',

                  fontSize: 24,
                  fontWeight: 'bold'
                }}>
                  {user.name.charAt(0)}
                </div>

              </div>

              {/* STATS */}

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14
              }}>

                <div style={{
                  background: '#eef2ff',
                  padding: 16,
                  borderRadius: 18
                }}>

                  <p style={{
                    margin: 0,
                    color: '#64748b',
                    fontSize: 13
                  }}>
                    Total Loans
                  </p>

                  <h2 style={{
                    marginTop: 10,
                    marginBottom: 0,
                    color: '#4338ca'
                  }}>
                    {user.totalLoans}
                  </h2>

                </div>

                <div style={{
                  background: '#f0fdf4',
                  padding: 16,
                  borderRadius: 18
                }}>

                  <p style={{
                    margin: 0,
                    color: '#64748b',
                    fontSize: 13
                  }}>
                    Completed
                  </p>

                  <h2 style={{
                    marginTop: 10,
                    marginBottom: 0,
                    color: '#16a34a'
                  }}>
                    {user.completedLoans}
                  </h2>

                </div>

                <div style={{
                  background: '#fef2f2',
                  padding: 16,
                  borderRadius: 18
                }}>

                  <p style={{
                    margin: 0,
                    color: '#64748b',
                    fontSize: 13
                  }}>
                    Active Loans
                  </p>

                  <h2 style={{
                    marginTop: 10,
                    marginBottom: 0,
                    color: '#dc2626'
                  }}>
                    {user.activeLoans}
                  </h2>

                </div>

                <div style={{
                  background: '#fff7ed',
                  padding: 16,
                  borderRadius: 18
                }}>

                  <p style={{
                    margin: 0,
                    color: '#64748b',
                    fontSize: 13
                  }}>
                    Risk Level
                  </p>

                  <h2 style={{
                    marginTop: 10,
                    marginBottom: 0,

                    color:

                      risk === 'LOW'
                        ? '#16a34a'

                      : risk === 'MEDIUM'
                        ? '#f59e0b'

                      : '#dc2626'
                  }}>
                    {risk}
                  </h2>

                </div>

              </div>

              {/* PROGRESS */}

              <div style={{
                marginTop: 24
              }}>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 10
                }}>

                  <span style={{
                    color: '#64748b',
                    fontWeight: '600'
                  }}>
                    EMI Progress
                  </span>

                  <span style={{
                    color: '#4338ca',
                    fontWeight: 'bold'
                  }}>
                    {progress}%
                  </span>

                </div>

                <div style={{
                  height: 14,
                  background: '#e2e8f0',
                  borderRadius: 999,
                  overflow: 'hidden'
                }}>

                  <div style={{
                    width: `${progress}%`,
                    height: '100%',

                    background:
                      'linear-gradient(90deg,#4f46e5,#8b5cf6)',

                    borderRadius: 999
                  }} />

                </div>

              </div>

              {/* FOOTER */}

              <div style={{
                marginTop: 25,

                background:
                  'linear-gradient(135deg,#0f172a,#1e293b)',

                padding: 18,

                borderRadius: 22,

                color: 'white'
              }}>

                <p style={{
                  margin: 0,
                  color: '#cbd5e1',
                  fontSize: 13
                }}>
                  Remaining Loan Balance
                </p>

                <h1 style={{
                  marginTop: 10,
                  marginBottom: 0,
                  fontSize: 34,
                  fontWeight: '900'
                }}>
                  {formatCurrency(
                    user.totalRemaining
                  )}
                </h1>

              </div>

            </div>

          );

        })}

      </div>

    </div>
  );

}

export default LoanUsersPage;