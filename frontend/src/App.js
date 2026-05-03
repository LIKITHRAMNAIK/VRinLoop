import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import TransactionList from './components/TransactionList';
import ProfileRouter from './components/ProfileRouter';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
<Route path="/profile/:name" element={<ProfileRouter />} />
      </Routes>
    </Router>
  );
}

export default App;