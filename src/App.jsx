import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LeadSourcePage from './pages/LeadSourcePage';
import ManagerDashboard from './pages/ManagerDashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<ManagerDashboard />} />
        <Route path="/:slug" element={<LeadSourcePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
