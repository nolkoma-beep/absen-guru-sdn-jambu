import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, CheckCircle, AlertCircle, LogIn, LogOut, Users, RefreshCw, X } from 'lucide-react';
import { Card } from '../components/UIComponents';
import { getTodayStatus, getUserProfile, getTodayDataFromCloud, CloudAttendance } from '../services/storageService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState(getTodayStatus());
  const [userName, setUserName] = useState('Pak Guru');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  // State untuk Rekap Sekolah
  const [showRecap, setShowRecap] = useState(false);
  const [cloudData, setCloudData] = useState<CloudAttendance[]>([]);
  const [loadingCloud, setLoadingCloud] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Load User Profile
    const profile = getUserProfile();
    if (profile) {
      if (profile.name) setUserName(profile.name);
      if (profile.photoUrl) setUserPhoto(profile.photoUrl);
    }

    setStatus(getTodayStatus());

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const handleFetchRecap = async () => {
    // Toggle tutup jika sudah terbuka
    if (showRecap) {
        setShowRecap(false);
        return;
    }

    setShowRecap(true);
    setLoadingCloud(true);
    const data = await getTodayDataFromCloud();
    setCloudData(data);
    setLoadingCloud(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-200 dark:shadow-none transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium mb-1">{format(currentTime, 'EEEE, d MMMM yyyy', { locale: id })}</p>
            <h2 className="text-2xl font-bold mb-1">{getGreeting()}, <br/>{userName}!</h2>
            <p className="text-blue-100 text-sm opacity-90">Jangan lupa isi kehadiran hari ini.</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm overflow-hidden border border-white/30">
             {userPhoto ? (
                <img src={userPhoto} alt="Profile" className="w-full h-full object-cover" />
             ) : (
                <UserAvatar />
             )}
          </div>
        </div>
        
        <div className="mt-6 flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2">
                <Clock size={16} />
                <span className="font-mono font-semibold">{format(currentTime, 'HH:mm:ss')}</span>
            </div>
            {status.hasCheckedInToday ? (
                <div className="bg-green-500/30 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-green-50 border border-green-400/30">
                    <CheckCircle size={16} />
                    <span className="text-xs font-semibold">Sudah Absen</span>
                </div>
            ) : (
                <div className="bg-amber-500/30 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-amber-50 border border-amber-400/30">
                    <AlertCircle size={16} />
                    <span className="text-xs font-semibold">Belum Absen</span>
                </div>
            )}
        </div>
      </div>

      {/* Quick Actions - GRID 2x2 */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Aksi Cepat</h3>
        <div className="grid grid-cols-2 gap-4">
            {/* 1. Absen Datang */}
            <button 
                onClick={() => navigate('/attendance/in')}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-blue-100 dark:border-blue-900 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors group"
            >
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <LogIn size={24} />
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Absen Datang</span>
            </button>
            
            {/* 2. Absen Pulang */}
            <button 
                onClick={() => navigate('/attendance/out')}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-orange-100 dark:border-orange-900 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors group"
            >
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                    <LogOut size={24} />
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Absen Pulang</span>
            </button>

            {/* 3. Laporan SPPD */}
            <button 
                onClick={() => navigate('/sppd')}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-purple-900 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors group"
            >
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                    <FileTextIcon />
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Laporan SPPD</span>
            </button>

            {/* 4. Rekap Sekolah (Baru) */}
            <button 
                onClick={handleFetchRecap}
                className={`p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center gap-2 transition-all group ${
                    showRecap 
                    ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' 
                    : 'bg-white dark:bg-gray-800 border-green-100 dark:border-green-900 hover:bg-green-50 dark:hover:bg-gray-700'
                }`}
            >
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                    <Users size={24} />
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Rekap Sekolah</span>
            </button>
        </div>
      </div>

      {/* --- REKAP SEKOLAH SECTION (Muncul jika tombol diklik) --- */}
      {showRecap && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
             <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Users size={20} className="text-green-600 dark:text-green-400" />
                    Kehadiran Hari Ini
                </h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => { setLoadingCloud(true); getTodayDataFromCloud().then(data => { setCloudData(data); setLoadingCloud(false); }); }} 
                        className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100"
                        disabled={loadingCloud}
                    >
                        <RefreshCw size={16} className={loadingCloud ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setShowRecap(false)}
                        className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full hover:bg-gray-200"
                    >
                        <X size={16} />
                    </button>
                </div>
             </div>

             {loadingCloud ? (
                 <div className="py-12 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                     <RefreshCw size={32} className="animate-spin text-green-500 mx-auto mb-3" />
                     <p className="text-sm text-gray-500">Mengambil data dari sekolah...</p>
                 </div>
             ) : cloudData.length === 0 ? (
                 <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-400 dark:text-gray-500 text-sm">Belum ada data absensi dari rekan guru hari ini.</p>
                 </div>
             ) : (
                 <div className="space-y-3">
                     {cloudData.map((item, idx) => (
                         <Card key={idx} className="flex items-center gap-3 !p-3">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                                 item.type === 'DATANG' 
                                 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                                 : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                             }`}>
                                 {item.name.charAt(0)}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start">
                                     <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{item.name}</h4>
                                     <span className="font-mono text-[10px] font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                         {item.time.substring(0, 5)}
                                     </span>
                                 </div>
                                 <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                                     <span className={`font-bold ${item.type === 'DATANG' ? 'text-green-600' : 'text-orange-600'}`}>
                                         {item.type}
                                     </span>
                                     <span>•</span>
                                     <MapPin size={10} /> {item.location || 'Lokasi GPS'}
                                 </p>
                             </div>
                         </Card>
                     ))}
                 </div>
             )}
        </div>
      )}
    </div>
  );
};

// Simple Icon Wrappers
const UserAvatar = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);