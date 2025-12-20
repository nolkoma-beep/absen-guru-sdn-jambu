import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Calendar, User, FileText } from 'lucide-react';

export const Layout: React.FC = () => {
  const location = useLocation();
  const pageTitles: Record<string, string> = {
    '/': 'Beranda',
    '/attendance': 'Absensi',
    '/sppd': 'Laporan SPPD',
    '/leave': 'Ijin / Sakit',
    '/history': 'Riwayat'
  };

  const title = pageTitles[location.pathname] || 'GuruHadir';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-20 border-b border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <div className="flex items-center gap-3">
          {/* LOGO SEKOLAH / TUT WURI HANDAYANI */}
          <img 
            src="https://iili.io/fA8Fe3X.png" 
            alt="Logo Tut Wuri Handayani" 
            className="w-10 h-10 object-contain drop-shadow-sm"
          />
          
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{title}</h1>
            <div className="flex flex-col mt-0.5">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">SD NEGERI JAMBU</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">KEC. TUNJUNG TEJA - KAB. SERANG</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 fixed bottom-0 w-full max-w-md z-30 pb-safe transition-colors duration-200">
        <div className="flex justify-around items-center h-16">
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <Home size={22} />
            <span className="text-[10px] font-medium">Beranda</span>
          </NavLink>
          
          <NavLink 
            to="/attendance" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-xl ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                   <ClipboardList size={22} />
                </div>
                <span className="text-[10px] font-medium">Absen</span>
              </>
            )}
          </NavLink>

          {/* TOMBOL TENGAH - TETAP SPPD */}
          <div className="-mt-8">
            <NavLink 
              to="/sppd" 
              className={({ isActive }) => `flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-blue-200 dark:shadow-none transition-transform active:scale-95 ${isActive ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}`}
            >
              <FileText size={24} />
            </NavLink>
            <div className="text-center mt-1">
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">SPPD</span>
            </div>
          </div>

          <NavLink 
            to="/history" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <ClipboardList size={22} />
            <span className="text-[10px] font-medium">Riwayat</span>
          </NavLink>

          <NavLink 
            to="/profile" 
            className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <User size={22} />
            <span className="text-[10px] font-medium">Profil</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};