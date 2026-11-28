import React from "react";
import { useNavigate } from "react-router-dom";
import usePrivateImage from "../utils/usePrivateImage";

import { logout, getSessionUser } from "../utils/session";
function Sidebar({ open, setOpen, onOpenExport }) {

  const navigate = useNavigate();

  const closeSidebarOnMobile = () => {
  if (window.matchMedia("(max-width: 767px)").matches) {
    setOpen(false);
  }
};

    const user = getSessionUser();

const privateProfileImage = usePrivateImage(
  user?.profile_image
);

const fallbackAvatar =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
    '<rect width="100" height="100" fill="#e2e8f0"/>' +
    '<circle cx="50" cy="35" r="18" fill="#64748b"/>' +
    '<path d="M18 100V85a32 32 0 0 1 64 0v15" fill="#64748b"/>' +
    '</svg>'
  );

  const menuItems = [
    {
      icon: "👥",
      label: "User Profiles",
      path: "/users",
    },
    {
      icon: "💳",
      label: "Loan Profiles",
      path: "/loan-users",
    },
    {
      icon: "📁",
      label: "Export Statements",
      action: "export",
    },
    {
      icon: "👤",
      label: "My Profile",
      path: "/my-profile",
    },
    {
      icon: "💡",
      label: "Feedback",
      path: "/feedback",
    },
    {
      icon: "ℹ️",
      label: "About VRinLoop",
      path: "/about",
    },
    {
      icon: "🔚",
      label: "Logout",
      action: "logout",
    },
  ];

    const handleLogout = () => {
    logout();
  };

 return (
  <>
    {/* MOBILE MENU BUTTON */}
    {!open && (
      <button
        type="button"
        className="mobile-sidebar-toggle"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        ☰
      </button>
    )}

    {/* DARK OVERLAY */}
    {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 999,
          }}
        />
      )}

      {/* SIDEBAR */}
<div
  className={`app-sidebar ${open ? "sidebar-open" : "sidebar-closed"}`}
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: open ? 240 : 70,
          height: "100vh",
          background: "#f3f1f700",
          color: "white",
          transition: "0.3s",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          paddingTop: 15,
          overflow: "hidden",
          boxShadow: "2px 0 15px rgba(22, 21, 21, 0.16)",
        }}
      >
        {/* TOP MENU BUTTON */}
        <div
          style={{
            display: "flex",
            justifyContent: open ? "space-between" : "center",
            alignItems: "center",
            padding: "0 15px",
            marginBottom: 25,
          }}
        >
          {open && (
            <h2
              style={{
                margin: 0,
                fontSize: 20,
              }}
            >
              VRinLoop
            </h2>
          )}

          <button
            onClick={() => setOpen(!open)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "none",
              background: "#f311a8",
              color: "white",
              cursor: "pointer",
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            ☰
          </button>
        </div>

        {/* USER PROFILE */}

        <div
          onClick={() => {
  closeSidebarOnMobile();
  navigate("/my-profile");
}}
          style={{
            display: "flex",

            alignItems: "center",

            gap: 12,

            padding: open ? "0 14px" : "0",

            marginBottom: 24,

            justifyContent: open ? "flex-start" : "center",

            cursor: "pointer",

            transition: "0.3s",
          }}
        >
          <img
  src={privateProfileImage || fallbackAvatar}
  onError={(event) => {
    if (event.currentTarget.src !== fallbackAvatar) {
      event.currentTarget.src = fallbackAvatar;
    }
  }}
  alt="profile"
  style={{
    width: 52,
    height: 52,
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #09d858",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
  }}
/>

          {open && (
            <div>
              <div
                style={{
                  fontWeight: "bold",

                  fontSize: 15,

                  color: "white",
                }}
              >
                {user?.name || "User"}
              </div>

              <div
                style={{
                  fontSize: 12,

                  color: "#e2e8f0",

                  marginTop: 2,

                  maxWidth: 130,

                  overflow: "hidden",

                  textOverflow: "ellipsis",
                }}
              >
                {user?.email}
              </div>
            </div>
          )}
        </div>

        {/* MENU ITEMS */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "0 10px",
          }}
        >
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={async () => {
  closeSidebarOnMobile();

  if (item.action === "export") {
    onOpenExport();

    return;
  }

  if (item.action === "logout") {
    handleLogout();

    return;
  }

  if (item.path) {
    navigate(item.path);
  }
}}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 15,
                padding: "14px 12px",
                borderRadius: 12,
                cursor: "pointer",
                background: "#fb675300",
                transition: "0.2s",
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  minWidth: 25,
                  textAlign: "center",
                }}
              >
                {item.icon}
              </span>

              {open && (
                <span
                  style={{
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
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
