import { useEffect, useState } from "react";

import {
  getSessionId,
  getSessionSnapshot,
  logout,
} from "./utils/session";

import {
  SESSION_KEY,
} from "./utils/sessionStorage";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import UsersPage from "./pages/UsersPage";
import MyProfile from "./pages/MyProfile";
import LoanAnalyticsPage from "./pages/LoanAnalyticsPage";
import LoanUsersPage from "./pages/LoanUsersPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import FloatingCalculator from "./components/FloatingCalculator";

import VerifyOtp from "./pages/VerifyOtp";

import ResetPassword from "./pages/ResetPassword";
import Feedback from "./pages/Feedback";
import AboutVRinLoop from "./pages/AboutVRinLoop";

function AppContent() {
  const location = useLocation();

  const [sessionId, setSessionId] = useState(getSessionId);

  const [sessionBlocked, setSessionBlocked] = useState(false);

  const hasActiveSession = Boolean(sessionId);

  useEffect(() => {
    let redirecting = false;

    // Remove legacy financial cache
    localStorage.removeItem("profileData");

    const discardSessionView = () => {
      if (redirecting) return;

      redirecting = true;

      setSessionBlocked(true);
      setSessionId(null);

      sessionStorage.removeItem("alertShownTime");

      window.location.replace("/login");
    };

    const syncSession = () => {
      if (redirecting) return;

      const currentSessionId = getSessionId();

      const snapshot = getSessionSnapshot();

      // Reject outdated or invalid session revisions
      if (!snapshot) {
        discardSessionView();
        return;
      }

      // Handle expired authenticated sessions
      if (sessionId && !currentSessionId) {
        redirecting = true;

        setSessionBlocked(true);
        setSessionId(null);

        void logout();

        return;
      }

      setSessionId(currentSessionId);
    };

    const handleStorageChange = (event) => {
      if (
        event.storageArea === localStorage &&
        (
          event.key === SESSION_KEY ||
          event.key === null
        )
      ) {
        syncSession();
      }
    };

    const handlePageShow = (event) => {
      if (event.persisted) {
        discardSessionView();
        return;
      }

      syncSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncSession();
      }
    };

    syncSession();

    // Periodically validate session identity and expiry
    const sessionInterval = window.setInterval(
      syncSession,
      1000
    );

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    window.addEventListener(
      "pageshow",
      handlePageShow
    );

    window.addEventListener(
      "focus",
      syncSession
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(sessionInterval);

      window.removeEventListener(
        "storage",
        handleStorageChange
      );

      window.removeEventListener(
        "pageshow",
        handlePageShow
      );

      window.removeEventListener(
        "focus",
        syncSession
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [sessionId]);

  useEffect(() => {
    setSessionId(getSessionId());
  }, [location.pathname]);

  // Never render protected content from a blocked session
  if (sessionBlocked) {
    return null;
  }

  const hideCalculator = [
    "/login",

    "/signup",

    "/forgot-password",

    "/verify-otp",

    "/reset-password",

    "/about",

    "/feedback",
  ].includes(location.pathname);

      return (
    <>
      {hasActiveSession && !hideCalculator && (
        <FloatingCalculator key={sessionId} />
      )}

      <Routes key={sessionId || "guest"}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/:name"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-profile"
          element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/loan-analytics/:name"
          element={
            <ProtectedRoute>
              <LoanAnalyticsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/loan-users"
          element={
            <ProtectedRoute>
              <LoanUsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <AboutVRinLoop />
            </ProtectedRoute>
          }
        />

        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/verify-otp" element={<VerifyOtp />} />

        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </>
  );
}
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
