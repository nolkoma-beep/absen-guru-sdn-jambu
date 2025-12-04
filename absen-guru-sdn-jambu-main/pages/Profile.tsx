import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Shield, Award, MapPin, Moon, Sun } from 'lucide-react';
import { Button, Card } from '../components/UIComponents';
import { getUserProfile } from '../services/storageService';
import { logout } from '../services/authService';
import { useTheme } from '../context/ThemeContext';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; nip: string; photoUrl?: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const profile = getUserProfile();
    setUser(profile);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="p-6 space-y-6 pb-24 relative">
      
      {/* --- CUSTOM LOGOUT MODAL --- */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-sm transform scale-100 transition-all">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                        <LogOut size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Konfirmasi Keluar</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        Apakah Anda yakin ingin keluar? Anda harus login kembali untuk mengakses aplikasi.
                    </p>
                    <div className="flex gap-3">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowConfirm(false)} 
                            className="flex-1 border-gray-200 dark:border-gray-600"
                        >
                            Batal
                        </Button>
                        <Button 
                            type="button" 
                            variant="danger" 
                            onClick={handleLogout} 
                            className="flex-1"
                        >
                            Ya, Keluar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Header Profile */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-200 dark:shadow-none text-center relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        {/* Avatar Section */}
        <div className="relative mx-auto w-24 h-24 mb-4">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-blue-400/50 shadow-lg relative z-10 overflow-hidden">
                {user?.photoUrl ? (
                    <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <User size={48} className="text-blue-600" />
                )}
            </div>
        </div>
        
        <h2 className="text-xl font-bold relative z-10">{user?.name || 'Guru SD Jambu'}</h2>
        <p className="text-blue-100 text-sm opacity-90 relative z-10">NIP. {user?.nip || '-'}</p>
        
        <div className="mt-4 flex justify-center gap-2 relative z-10">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs border border-white/20">Guru Tetap</span>
            <span className="px-3 py-1 bg-green-500/30 backdrop-blur-md rounded-full text-xs border border-green-400/30">Aktif</span>
        </div>
      </div>

      <div className="space-y-4">
        
        {/* --- TEMA APLIKASI --- */}
        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wider ml-1 mt-2">Pengaturan Tampilan</h3>
        <Card className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-900/50 text-indigo-400' : 'bg-yellow-50 text-yellow-600'}`}>
                    {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Mode Gelap</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{theme === 'dark' ? 'Aktif' : 'Non-aktif'}</p>
                </div>
            </div>
            <button 
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
        </Card>

        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wider ml-1 mt-6">Informasi Pribadi</h3>
        
        <Card className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Shield size={16} />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status Kepegawaian</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">PNS / ASN</p>
                </div>
            </div>
            
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <Award size={16} />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jabatan</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Guru Kelas</p>
                </div>
            </div>

             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <MapPin size={16} />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Unit Kerja</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">SD Negeri Jambu</p>
                </div>
            </div>
        </Card>

        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wider ml-1 mt-6">Akun</h3>
        <Button 
            type="button" 
            variant="danger" 
            className="w-full justify-between" 
            onClick={() => setShowConfirm(true)}
        >
            <span className="flex items-center gap-2">
                <LogOut size={18} />
                Keluar Aplikasi
            </span>
        </Button>
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">Versi Aplikasi v1.0.1</p>
      </div>
    </div>
  );
};