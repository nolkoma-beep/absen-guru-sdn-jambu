import React, { useState, useEffect } from 'react';
import { Camera, MapPin, User, Briefcase, RefreshCw, LogIn, LogOut, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button, Card, Input, TextArea } from '../components/UIComponents';
import { saveRecord, getUserProfile, compressImage, getTodayStatus } from '../services/storageService';
import { AttendanceType } from '../types';
import { useNavigate } from 'react-router-dom';

interface AttendanceProps {
  specificMode?: AttendanceType;
}

// KOORDINAT SEKOLAH: SD NEGERI JAMBU (Updated)
const SCHOOL_LOCATION = {
  lat: -6.282759, 
  lng: 106.264251,
  radius: 100 // Radius 100 Meter
};

export const Attendance: React.FC<AttendanceProps> = ({ specificMode }) => {
  const navigate = useNavigate();
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState('Mencari titik koordinat...');
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Geofencing State
  const [distance, setDistance] = useState<number | null>(null);
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  
  // Status Harian (Untuk Cek Double Absen)
  const [todayStatus, setTodayStatus] = useState(getTodayStatus());

  // Mode operasional
  const mode = specificMode;

  useEffect(() => {
    // 1. Refresh status harian terbaru
    const currentStatus = getTodayStatus();
    setTodayStatus(currentStatus);

    // 2. Proteksi Double Absen (Jika akses via URL langsung)
    if (mode === AttendanceType.CHECK_IN && currentStatus.hasCheckedInToday) {
        alert("Anda sudah melakukan Absen Datang hari ini. Tidak bisa input ulang.");
        navigate('/attendance');
        return;
    }
    if (mode === AttendanceType.CHECK_OUT && currentStatus.hasCheckedOutToday) {
        alert("Anda sudah melakukan Absen Pulang hari ini. Tidak bisa input ulang.");
        navigate('/attendance');
        return;
    }

    // 3. Load User Profile (Auto-fill)
    const savedProfile = getUserProfile();
    if (savedProfile) {
      setName(savedProfile.name);
      setNip(savedProfile.nip);
    }

    // 4. Cari lokasi jika mode aktif
    if (mode) {
      getLocation();
    }
  }, [mode, navigate]);

  // Rumus Haversine untuk hitung jarak
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Radius bumi dalam meter
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Hasil dalam meter
  };

  const getLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setLocation({ lat, lng });
          
          // Hitung Jarak ke Sekolah
          const dist = calculateDistance(lat, lng, SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng);
          setDistance(dist);
          
          // Validasi Radius
          if (dist > SCHOOL_LOCATION.radius) {
            setIsOutOfRange(true);
            setLocationName(`Diluar jangkauan (${Math.round(dist)}m dari sekolah)`);
          } else {
            setIsOutOfRange(false);
            setLocationName(`${lat.toFixed(5)}, ${lng.toFixed(5)} (${Math.round(dist)}m dari sekolah)`);
          }

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
      reader.onload = async (ev) => {
        const originalBase64 = ev.target?.result as string;
        // KOMPRESI GAMBAR
        try {
            const compressedBase64 = await compressImage(originalBase64, 800);
            setPhoto(compressedBase64);
        } catch (err) {
            console.error("Kompresi gagal, pakai original", err);
            setPhoto(originalBase64);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    // Validasi Double Absen (Safety Check Terakhir)
    const latestStatus = getTodayStatus();
    if (mode === AttendanceType.CHECK_IN && latestStatus.hasCheckedInToday) {
        alert("Gagal: Data absen datang hari ini sudah ada.");
        navigate('/');
        return;
    }
    if (mode === AttendanceType.CHECK_OUT && latestStatus.hasCheckedOutToday) {
        alert("Gagal: Data absen pulang hari ini sudah ada.");
        navigate('/');
        return;
    }

    if (!name || !nip) {
      alert("Mohon lengkapi Nama dan NIP/NUPTK.");
      return;
    }
    if (!photo || !location) {
      alert("Mohon ambil foto live dan pastikan lokasi terdeteksi.");
      return;
    }
    // Validasi Akhir Radius
    if (isOutOfRange) {
        alert(`Anda berada di luar radius sekolah (${Math.round(distance || 0)}m). Maksimal ${SCHOOL_LOCATION.radius}m.`);
        return;
    }

    if (!mode) return;

    setIsSubmitting(true);
    setStatusMessage("Sedang mengirim data...");
    
    // Gunakan saveRecord
    const result = await saveRecord({
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

    if (result.success) {
      alert(result.message);
      navigate('/');
    } else {
      alert("Gagal: " + result.message);
    }
  };

  if (!mode) {
    return (
      <div className="p-6 pb-24 space-y-6">
        <div className="text-center mb-8 mt-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Pilih Jenis Absensi</h2>
          <p className="text-gray-500 dark:text-gray-400">Silakan pilih menu absensi di bawah ini</p>
        </div>

        <div className="grid gap-4">
          {/* TOMBOL ABSEN DATANG */}
          <button 
            onClick={() => {
                if (todayStatus.hasCheckedInToday) {
                    alert("Anda sudah melakukan absen datang hari ini.");
                } else {
                    navigate('/attendance/in');
                }
            }}
            disabled={todayStatus.hasCheckedInToday}
            className={`group relative overflow-hidden p-6 rounded-2xl shadow-lg flex items-center gap-4 transition-all 
                ${todayStatus.hasCheckedInToday 
                    ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-75 cursor-not-allowed' 
                    : 'bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900 active:scale-95 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
          >
            {!todayStatus.hasCheckedInToday && (
                 <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            )}
            
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white relative z-10 ${todayStatus.hasCheckedInToday ? 'bg-gray-400' : 'bg-blue-600 shadow-blue-200 dark:shadow-none'}`}>
              {todayStatus.hasCheckedInToday ? <CheckCircle size={28} /> : <LogIn size={28} />}
            </div>
            <div className="text-left relative z-10">
              <h3 className={`text-xl font-bold transition-colors ${todayStatus.hasCheckedInToday ? 'text-gray-500' : 'text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                  {todayStatus.hasCheckedInToday ? 'Sudah Tercatat' : 'Absen Datang'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                  {todayStatus.hasCheckedInToday ? 'Anda sudah absen masuk' : 'Isi kehadiran saat tiba'}
              </p>
            </div>
          </button>

          {/* TOMBOL ABSEN PULANG */}
          <button 
            onClick={() => {
                if (todayStatus.hasCheckedOutToday) {
                    alert("Anda sudah melakukan absen pulang hari ini.");
                } else {
                    navigate('/attendance/out');
                }
            }}
            disabled={todayStatus.hasCheckedOutToday}
            className={`group relative overflow-hidden p-6 rounded-2xl shadow-lg flex items-center gap-4 transition-all 
                ${todayStatus.hasCheckedOutToday 
                    ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-75 cursor-not-allowed' 
                    : 'bg-white dark:bg-gray-800 border border-orange-100 dark:border-orange-900 active:scale-95 hover:border-orange-300 dark:hover:border-orange-700'
                }`}
          >
            {!todayStatus.hasCheckedOutToday && (
                <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            )}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white relative z-10 ${todayStatus.hasCheckedOutToday ? 'bg-gray-400' : 'bg-orange-500 shadow-orange-200 dark:shadow-none'}`}>
              {todayStatus.hasCheckedOutToday ? <CheckCircle size={28} /> : <LogOut size={28} />}
            </div>
            <div className="text-left relative z-10">
              <h3 className={`text-xl font-bold transition-colors ${todayStatus.hasCheckedOutToday ? 'text-gray-500' : 'text-gray-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400'}`}>
                  {todayStatus.hasCheckedOutToday ? 'Sudah Tercatat' : 'Absen Pulang'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                  {todayStatus.hasCheckedOutToday ? 'Anda sudah absen pulang' : 'Isi kehadiran saat pulang'}
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  const isCheckIn = mode === AttendanceType.CHECK_IN;

  return (
    <div className="p-6 pb-24">
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

        <Card className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-2 mb-2 flex items-center gap-2">
                <MapPin size={18} className="text-green-600 dark:text-green-400" />
                LOKASI (Radius {SCHOOL_LOCATION.radius}m)
            </h3>
            
            <div className="h-32 bg-blue-50 dark:bg-gray-900 rounded-lg overflow-hidden relative border border-blue-100 dark:border-gray-700 transition-all">
               {loadingLocation ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-400">
                        <RefreshCw size={24} className="animate-spin mb-2" />
                        <span className="text-xs font-medium">Sedang mendeteksi lokasi...</span>
                   </div>
               ) : location ? (
                   <>
                       <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                       
                       <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center animate-ping absolute ${isOutOfRange ? 'bg-red-100/50' : 'bg-blue-100/50'}`}></div>
                            <MapPin size={32} className={`drop-shadow-lg mb-1 relative z-20 ${isOutOfRange ? 'text-red-500' : 'text-blue-500'}`} />
                            <span className={`text-sm font-bold bg-white/80 dark:bg-gray-800/80 px-3 py-1 rounded-full shadow-sm mt-2 backdrop-blur-sm border ${isOutOfRange ? 'text-red-600 border-red-100' : 'text-blue-700 dark:text-blue-400 border-blue-100'}`}>
                                {isOutOfRange ? 'Diluar Radius' : 'Dalam Radius'}
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
            
            {/* Alert Jarak */}
            {isOutOfRange && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800 flex items-start gap-2">
                    <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-red-600 dark:text-red-300">
                        <span className="font-bold block mb-1">Lokasi Terlalu Jauh!</span>
                        Anda berada <span className="font-bold underline">{Math.round(distance || 0)} meter</span> dari sekolah. 
                        Maksimal radius adalah {SCHOOL_LOCATION.radius}m. Mohon mendekat ke lokasi.
                    </div>
                </div>
            )}
            {!isOutOfRange && location && (
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-100 dark:border-green-800 text-center">
                    <p className="text-xs text-green-700 dark:text-green-300">
                        Jarak Anda: <b>{Math.round(distance || 0)} meter</b>. (Aman)
                    </p>
                </div>
            )}
        </Card>

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
            disabled={!photo || !location || !name || !nip || isOutOfRange}
        >
            {isSubmitting ? statusMessage : (isCheckIn ? 'KIRIM ABSEN DATANG' : 'KIRIM ABSEN PULANG')}
        </Button>
      </div>
    </div>
  );
};