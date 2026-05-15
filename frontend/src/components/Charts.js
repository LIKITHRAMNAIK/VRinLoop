import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';

function Charts({

  loanData,

  totalLoanEmisPaid,
  totalPendingEmis,

  totalLateEmis,
  totalAdvanceEmis,
  totalLoanPenalty

}) {

  const progressData = [

    {
      name: 'Paid',
      value: totalLoanEmisPaid
    },

    {
      name: 'Pending',
      value: totalPendingEmis
    }

  ];

  const behaviorData = [

    {
      name: 'Late',
      value: totalLateEmis
    },

    {
      name: 'Advance',
      value: totalAdvanceEmis
    }

  ];

  const COLORS = [
    '#5E35B1',
    '#E2E8F0'
  ];

  const behaviorColors = [
    '#ef4444',
    '#22c55e'
  ];

  return (

    <div style={{
      marginTop: 35,
      marginBottom: 40
    }}>

      {/* HEADER */}

      <div style={{
        marginBottom: 20
      }}>

        <h2 style={{
          margin: 0,
          color: '#0f172a'
        }}>
          📈 Loan Charts
        </h2>

        <p style={{
          marginTop: 8,
          color: '#64748b',
          fontSize: 14
        }}>
          Visual repayment analytics
        </p>

      </div>

      {/* TOP CHARTS */}

      <div style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit,minmax(320px,1fr))',
        gap: 20,
        marginBottom: 25
      }}>

        {/* ALL LOANS */}

        <div style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: 22,
          boxShadow:
            '0 10px 24px rgba(0,0,0,0.06)'
        }}>

          <h3 style={{
            marginTop: 0,
            marginBottom: 18,
            color: '#1e293b'
          }}>
            All Loans
          </h3>

          <div style={{
            height: 220
          }}>

            <ResponsiveContainer>

              <PieChart>

                <Pie
                  data={progressData}
                  innerRadius={60}
                  outerRadius={85}
                  dataKey="value"
                >

                  {progressData.map(
                    (entry, index) => (

                      <Cell
                        key={index}
                        fill={COLORS[index]}
                      />

                    )
                  )}

                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>
       
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            marginTop: 10,
            fontWeight: 'bold'
          }}>

            <div>
              🟣 Paid:
              {' '}
              {totalLoanEmisPaid}
            </div>

            <div>
              ⚪ Pending:
              {' '}
              {totalPendingEmis}
            </div>

          </div>

        </div>

        {/* BEHAVIOUR */}

        <div style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: 22,
          boxShadow:
            '0 10px 24px rgba(0,0,0,0.06)'
        }}>

          <h3 style={{
            marginTop: 0,
            marginBottom: 18,
            color: '#1e293b'
          }}>
            Payment Behaviour
          </h3>

          <div style={{
            height: 220
          }}>

            <ResponsiveContainer>

              <BarChart
                data={behaviorData}
              >

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="value"
                  radius={[10,10,0,0]}
                >

                  {behaviorData.map(
                    (entry, index) => (

                      <Cell
                        key={index}
                        fill={
                          behaviorColors[index]
                        }
                      />

                    )
                  )}

                </Bar>

              </BarChart>

            </ResponsiveContainer>

                  <div style={{
  display: 'flex',
  justifyContent: 'center',
  gap: 20,
  marginTop: 10,
  fontWeight: 'bold',
  flexWrap: 'wrap'
}}>

  <div style={{
    color: '#ef4444'
  }}>
    🔴 Late:
    {' '}
    {totalLateEmis}
  </div>

  <div style={{
    color: '#22c55e'
  }}>
    🟢 Advance:
    {' '}
    {totalAdvanceEmis}
  </div>

</div>
          </div>

        </div>

      </div>

      {/* SINGLE LOANS */}

      <div style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit,minmax(320px,1fr))',
        gap: 20
      }}>

        {loanData.map((loan, index) => {

          const paid =
            loan.completed_emi || 0;

          const pending =
            loan.remaining_emi || 0;

          let late = 0;

          let advance = 0;

          loan.emi_history?.forEach(
            emi => {

              if (
                emi.status === 'late'
              ) late++;

              if (
                emi.status === 'advance'
              ) advance++;

            }
          );

          const singleData = [

            {
              name: 'Paid',
              value: paid
            },

            {
              name: 'Pending',
              value: pending
            }

          ];

          const singleBehavior = [

            {
              name: 'Late',
              value: late
            },

            {
              name: 'Advance',
              value: advance
            }

          ];

          return (

            <div
              key={loan._id}
              style={{
                background: '#ffffff',
                borderRadius: 24,
                padding: 22,
                boxShadow:
                  '0 10px 24px rgba(0,0,0,0.06)'
              }}
            >

              <div style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom: 18
              }}>

                <div>

                  <h3 style={{
  margin: 0,
  color: '#5E35B1'
}}>
  Loan {loan.originalIndex}
  {' - '}
  {loan.person_name}
</h3>

                  <p style={{
                    marginTop: 6,
                    color: '#64748b',
                    fontSize: 13
                  }}>
                    {
                      loan.person_name
                    }
                  </p>

                </div>

                <div style={{
                  background: '#f3ecff',
                  color: '#5E35B1',
                  padding:
                    '8px 14px',
                  borderRadius: 12,
                  fontWeight: 'bold',
                  fontSize: 13
                }}>
                  ₹{loan.emi_amount}
                </div>

              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: 15
              }}>

                {/* PROGRESS */}

                <div>

                  <div style={{
                    height: 160
                  }}>

                    <ResponsiveContainer>

                      <PieChart>

                        <Pie
                          data={singleData}
                          innerRadius={38}
                          outerRadius={58}
                          dataKey="value"
                        >

                          {singleData.map(
                            (
                              entry,
                              i
                            ) => (

                              <Cell
                                key={i}
                                fill={
                                  COLORS[i]
                                }
                              />

                            )
                          )}
                          <Tooltip
  formatter={(value) => [
    value,
    'EMIs'
  ]}
/>

                        </Pie>

                      </PieChart>

                    </ResponsiveContainer>

                  </div>

                  <p style={{
                    textAlign: 'center',
                    marginTop: 0,
                    fontSize: 13,
                    fontWeight: 'bold'
                  }}>
                    EMI Progress
                  </p>
                  <div style={{
  display: 'flex',
  justifyContent: 'center',
  gap: 14,
  marginTop: 8,
  fontSize: 12,
  fontWeight: 'bold',
  flexWrap: 'wrap'
}}>

  <div style={{
    color: '#5E35B1'
  }}>
    🟣 Paid:
    {' '}
    {paid}
  </div>

  <div style={{
    color: '#64748b'
  }}>
    ⚪ Pending:
    {' '}
    {pending}
  </div>

</div>

                </div>

                {/* BEHAVIOUR */}

                <div>

                  <div style={{
                    height: 160
                  }}>

                    <ResponsiveContainer>

                      <BarChart
                        data={
                          singleBehavior
                        }
                      >

                        <XAxis
                          dataKey="name"
                        />
                        <Tooltip
  formatter={(value) => [
    value,
    'Payments'
  ]}
/>

                        <Bar
                          dataKey="value"
                          radius={[
                            8,
                            8,
                            0,
                            0
                          ]}
                        >

                          {singleBehavior.map(
                            (
                              entry,
                              i
                            ) => (

                              <Cell
                                key={i}
                                fill={
                                  behaviorColors[i]
                                }
                              />

                            )
                          )}

                        </Bar>

                      </BarChart>

                    </ResponsiveContainer>

                  </div>

                  <p style={{
                    textAlign: 'center',
                    marginTop: 0,
                    fontSize: 13,
                    fontWeight: 'bold'
                  }}>
                    Behaviour
                  </p>
                  <div style={{
  display: 'flex',
  justifyContent: 'center',
  gap: 14,
  marginTop: 8,
  fontSize: 12,
  fontWeight: 'bold',
  flexWrap: 'wrap'
}}>

  <div style={{
    color: '#ef4444'
  }}>
    🔴 Late:
    {' '}
    {late}
  </div>

  <div style={{
    color: '#22c55e'
  }}>
    🟢 Advance:
    {' '}
    {advance}
  </div>

</div>

                </div>

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

}

export default Charts;