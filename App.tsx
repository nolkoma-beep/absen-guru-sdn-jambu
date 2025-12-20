import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Attendance } from './pages/Attendance';
import { SPPD } from './pages/SPPD';
import { Leave } from './pages/Leave';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { AttendanceType } from './types';
import { isAuthenticated } from './services/authService';
import { ThemeProvider } from './context/ThemeContext';

// Komponen Pembungkus untuk Halaman yang Membutuhkan Login
const RequireAuth = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          {/* Halaman Login (Publik) */}
          <Route path="/login" element={<Login />} />

          {/* Halaman yang Dilindungi (Perlu Login) */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              
              <Route path="attendance" element={<Attendance />} />
              <Route path="attendance/in" element={<Attendance specificMode={AttendanceType.CHECK_IN} />} />
              <Route path="attendance/out" element={<Attendance specificMode={AttendanceType.CHECK_OUT} />} />
              
              <Route path="sppd" element={<SPPD />} />
              <Route path="leave" element={<Leave />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;