import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CallTrackingProvider } from './context/CallTrackingContext';
import DriverView from './pages/DriverView';
import AdminPortal from './pages/AdminPortal';
import './App.css';

function App() {
  return (
    <CallTrackingProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DriverView />} />
          <Route path="/admin" element={<AdminPortal />} />
        </Routes>
      </BrowserRouter>
    </CallTrackingProvider>
  );
}

export default App;
