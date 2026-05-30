import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import TransactionList from "./components/TransactionList";
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
      {!hideCalculator && <FloatingCalculator />}

      <Routes>
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
