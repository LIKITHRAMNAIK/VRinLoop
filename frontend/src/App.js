import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import TransactionList from './components/TransactionList';
import UsersPage from './pages/UsersPage';
import MyProfile from './pages/MyProfile';
import LoanAnalyticsPage from './pages/LoanAnalyticsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile/:name" element={<Profile />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route
  path="/loan-analytics/:name"
  element={<LoanAnalyticsPage />}
/>
      </Routes>
    </Router>
  );
}

export default App;