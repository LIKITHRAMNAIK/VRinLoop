import React from 'react';
import { useNavigate } from 'react-router-dom';

function Sidebar({ open, setOpen }) {

  const navigate = useNavigate();

  const menuItems = [
    {
      icon: '👥',
      label: 'User Profiles',
      path: '/users'
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
              onClick={() => {
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

    </>
  );
}

export default Sidebar;