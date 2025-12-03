import React, { useState, useEffect } from 'react';
import { Camera, MapPin, User, Briefcase, RefreshCw, LogIn, LogOut, ArrowLeft } from 'lucide-react';
import { Button, Card, Input, TextArea } from '../components/UIComponents';
import { saveRecord, getUserProfile } from '../services/storageService';
import { AttendanceType } from '../types';
import { useNavigate } from 'react-router-dom';

interface AttendanceProps {
  specificMode?: AttendanceType;
}

export const Attendance: React.FC<AttendanceProps> = ({ specificMode }) => {
  const navigate = useNavigate();
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState('Mencari titik koordinat...');
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Mode operasional: Menggunakan props jika ada (dari URL), atau undefined (tampilkan menu)
  const mode = specificMode;

  useEffect(() => {
    // 1. Load User Profile (Auto-fill)
    const savedProfile = getUserProfile();
    if (savedProfile) {
      setName(savedProfile.name);
      setNip(savedProfile.nip);
    }

    // 2. Hanya cari lokasi jika mode sudah terpilih (Form sedang aktif)
    if (mode) {
      getLocation();
    }
  }, [mode]);

  const getLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          // Mock reverse geocoding for demo
          setLocationName(`${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)} (Terdeteksi Otomatis)`);
          setLoadingLocation(false);
        },
        (error) => {
          console.error(error);
          setLocationName("Gagal mendeteksi lokasi (Pastikan GPS aktif)");
          setLoadingLocation(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationName("GPS tidak didukung di perangkat ini");
      setLoadingLocation(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhoto(ev.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!name || !nip) {
      alert("Mohon lengkapi Nama dan NIP/NUPTK.");
      return;
    }
    if (!photo || !location) {
      alert("Mohon ambil foto live dan pastikan lokasi terdeteksi.");
      return;
    }
    if (!mode) return;

    setIsSubmitting(true);
    
    // Save record (Async) - this will also trigger Google Sheets sync if URL is present
    await saveRecord({
      id: Date.now().toString(),
      type: mode,
      timestamp: Date.now(),
      latitude: location.lat,
      longitude: location.lng,
      locationName,
      photoUrl: photo,
      notes,
      name,
      nip
    });
    
    setIsSubmitting(false);
    navigate('/');
  };

  // --- TAMPILAN 1: MENU PILIHAN (Jika tidak ada specificMode) ---
  if (!mode) {
    return (
      <div className="p-6 pb-24 space-y-6">
        <div className="text-center mb-8 mt-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Pilih Jenis Absensi</h2>
          <p className="text-gray-500 dark:text-gray-400">Silakan pilih menu absensi di bawah ini</p>
        </div>

        <div className="grid gap-4">
          <button 
            onClick={() => navigate('/attendance/in')}
            className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-900 flex items-center gap-4 transition-all active:scale-95 hover:border-blue-300 dark:hover:border-blue-700"
          >
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-blue-200 dark:shadow-none relative z-10">
              <LogIn size={28} />
            </div>
            <div className="text-left relative z-10">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Absen Datang</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Isi kehadiran saat tiba</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/attendance/out')}
            className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-orange-100 dark:border-orange-900 flex items-center gap-4 transition-all active:scale-95 hover:border-orange-300 dark:hover:border-orange-700"
          >
            <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-orange-200 dark:shadow-none relative z-10">
              <LogOut size={28} />
            </div>
            <div className="text-left relative z-10">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Absen Pulang</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Isi kehadiran saat pulang</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // --- TAMPILAN 2: FORM ABSENSI (Datang / Pulang) ---
  const isCheckIn = mode === AttendanceType.CHECK_IN;

  return (
    <div className="p-6 pb-24">
      {/* Header with Back Button */}
      <div className={`mb-6 p-4 -mx-6 -mt-6 ${isCheckIn ? 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900' : 'bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-900 dark:to-red-900'} text-white shadow-md`}>
         <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate('/attendance')} className="p-1 rounded-full hover:bg-white/20 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <h2 className="text-xl font-bold flex items-center gap-2">
                {isCheckIn ? <LogIn /> : <LogOut />}
                {isCheckIn ? 'Absen Datang' : 'Absen Pulang'}
            </h2>
         </div>
        <p className="text-white/80 text-sm pl-10">Silakan isi data kehadiran Anda.</p>
      </div>

      <div className="space-y-6">
        
        {/* Identitas Guru */}
        <Card className="space-y-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-2 mb-2 flex items-center gap-2">
                <User size={18} className="text-blue-600 dark:text-blue-400" />
                Identitas Guru
            </h3>
            <Input 
                label="Nama Lengkap" 
                placeholder="Masukkan nama lengkap beserta gelar"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <Input 
                label="NIP / NUPTK" 
                placeholder="Nomor Induk Pegawai"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                type="number"
            />
        </Card>

        {/* Lokasi Otomatis */}
        <Card className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-2 mb-2 flex items-center gap-2">
                <MapPin size={18} className="text-green-600 dark:text-green-400" />
                LOKASI (Otomatis)
            </h3>
            
            {/* Visual Map / Status */}
            <div className="h-32 bg-blue-50 dark:bg-gray-900 rounded-lg overflow-hidden relative border border-blue-100 dark:border-gray-700 transition-all">
               {loadingLocation ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-400">
                        <RefreshCw size={24} className="animate-spin mb-2" />
                        <span className="text-xs font-medium">Sedang mendeteksi lokasi...</span>
                   </div>
               ) : location ? (
                   <>
                       {/* Mock Map Background Pattern */}
                       <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                       
                       <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <div className="w-12 h-12 bg-blue-100/50 dark:bg-blue-900/50 rounded-full flex items-center justify-center animate-ping absolute"></div>
                            <MapPin size={32} className="text-red-500 drop-shadow-lg mb-1 relative z-20" />
                            <span className="text-sm text-blue-700 font-bold bg-white/80 dark:bg-gray-800/80 dark:text-blue-400 px-3 py-1 rounded-full shadow-sm mt-2 backdrop-blur-sm border border-blue-100 dark:border-gray-600">
                                Lokasi Terkunci
                            </span>
                       </div>
                       
                       <button 
                            onClick={getLocation} 
                            className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-700 rounded-full shadow-md text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 z-20 active:scale-95 transition-transform"
                            title="Perbarui Lokasi"
                        >
                            <RefreshCw size={16} />
                        </button>
                   </>
               ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-400">
                        <MapPin size={24} className="mb-2 opacity-50" />
                        <span className="text-xs font-medium">Gagal mendeteksi lokasi</span>
                         <button onClick={getLocation} className="mt-2 text-red-600 dark:text-red-400 underline text-xs">Coba Lagi</button>
                   </div>
               )}
            </div>
        </Card>

        {/* Foto Live */}
        <Card className="text-center p-6 border-dashed border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-2 mb-4 flex items-center justify-center gap-2">
                <Camera size={18} className="text-purple-600 dark:text-purple-400" />
                Foto Live {isCheckIn ? 'Kedatangan' : 'Kepulangan'}
            </h3>

            {photo ? (
                <div className="relative rounded-lg overflow-hidden bg-black">
                    <img src={photo} alt="Selfie" className="w-full h-64 object-cover" />
                    <button 
                        onClick={() => setPhoto(null)} 
                        className="absolute bottom-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
                        {new Date().toLocaleTimeString()}
                    </div>
                </div>
            ) : (
                <div className="py-4">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera size={40} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Ambil foto selfie menggunakan seragam sebagai bukti kehadiran.</p>
                    <div className="relative">
                        <Button className="w-full" icon={Camera}>Buka Kamera</Button>
                        <input 
                            type="file" 
                            accept="image/*" 
                            capture="user" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handlePhotoCapture}
                        />
                    </div>
                </div>
            )}
        </Card>

        {/* Catatan Tambahan (Khusus Pulang) */}
        {!isCheckIn && (
            <Card>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Briefcase size={18} className="text-orange-600 dark:text-orange-400" />
                    Laporan Harian
                </h3>
                <TextArea 
                    label="Ringkasan Aktivitas" 
                    placeholder="Contoh: Mengajar kelas X, Rapat guru, Mengoreksi nilai..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                />
            </Card>
        )}

        <Button 
            className={`w-full text-lg shadow-xl ${isCheckIn ? 'bg-blue-600 shadow-blue-200 dark:shadow-none' : 'bg-orange-600 shadow-orange-200 dark:shadow-none hover:bg-orange-700'}`} 
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!photo || !location || !name || !nip}
        >
            {isCheckIn ? 'KIRIM ABSEN DATANG' : 'KIRIM ABSEN PULANG'}
        </Button>
      </div>
    </div>
  );
};