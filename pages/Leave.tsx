import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, FileText, Camera, ArrowLeft, UploadCloud, X, CheckCircle } from 'lucide-react';
import { Button, Input, TextArea, Card } from '../components/UIComponents';
import { saveRecord, getUserProfile, compressImage } from '../services/storageService';
import { AttendanceType } from '../types';

export const Leave: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');

  // Form Data
  const [leaveType, setLeaveType] = useState<'IJIN' | 'SAKIT'>('IJIN');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [photo, setPhoto] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const savedProfile = getUserProfile();
    if (savedProfile) {
      setName(savedProfile.name);
      setNip(savedProfile.nip);
    }
  }, []);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const originalBase64 = ev.target?.result as string;
        try {
            const compressedBase64 = await compressImage(originalBase64, 800);
            setPhoto(compressedBase64);
        } catch (err) {
            setPhoto(originalBase64);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!name || !nip || !reason) {
        alert("Mohon lengkapi Nama, NIP, dan Alasan.");
        return;
    }

    setIsSaving(true);
    setStatusMessage("Mengirim laporan...");

    const result = await saveRecord({
        id: Date.now().toString(),
        type: AttendanceType.LEAVE,
        timestamp: Date.now(),
        name,
        nip,
        notes: `[${leaveType}] ${reason} (${startDate} s/d ${endDate})`,
        photoUrl: photo || undefined,
        locationName: 'Laporan Ijin/Sakit'
    });

    setIsSaving(false);

    if (result.success) {
      alert("Laporan Ijin/Sakit berhasil dikirim.");
      navigate('/');
    } else {
      alert("Gagal: " + result.message);
    }
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-900 dark:to-orange-900 p-4 -mx-6 -mt-6 mb-2 text-white shadow-md flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-1 rounded-full hover:bg-white/20">
            <ArrowLeft size={24} />
        </button>
        <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar size={24} />
                Laporan Ijin / Sakit
            </h2>
            <p className="text-amber-100 text-xs">Formulir ketidakhadiran guru.</p>
        </div>
      </div>

      <Card className="space-y-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2 flex items-center gap-2">
              <User size={18} className="text-blue-500" />
              Identitas Guru
          </h3>
          <Input label="Nama Lengkap" value={name} readOnly className="bg-gray-50 dark:bg-gray-800" />
          <Input label="NIP / NUPTK" value={nip} readOnly className="bg-gray-50 dark:bg-gray-800" />
      </Card>

      <Card className="space-y-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2 flex items-center gap-2">
             <FileText size={18} className="text-amber-500" />
             Detail Keterangan
        </h3>
        
        <div className="flex gap-2 mb-4">
            <button 
                onClick={() => setLeaveType('IJIN')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-all ${leaveType === 'IJIN' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'}`}
            >
                IJIN
            </button>
            <button 
                onClick={() => setLeaveType('SAKIT')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-all ${leaveType === 'SAKIT' ? 'bg-red-600 border-red-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'}`}
            >
                SAKIT
            </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <Input label="Mulai" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="Selesai" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <TextArea 
            label="Alasan / Keterangan" 
            placeholder="Tuliskan alasan ijin atau diagnosa singkat jika sakit..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
        />
      </Card>

      <Card className="text-center p-6 border-dashed border-2 border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center justify-center gap-2">
             <Camera size={18} className="text-purple-500" />
             Bukti Foto / Surat Dokter
        </h3>

        {photo ? (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <img src={photo} alt="Bukti" className="w-full h-full object-contain" />
                <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg">
                    <X size={16} />
                </button>
            </div>
        ) : (
            <div className="relative">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <UploadCloud size={32} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Unggah foto surat keterangan atau bukti pendukung (Opsional).</p>
                <Button className="w-full" variant="outline" icon={Camera}>Ambil Foto</Button>
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handlePhotoCapture}
                />
            </div>
        )}
      </Card>

      <Button 
        onClick={handleSave} 
        isLoading={isSaving} 
        className="w-full text-lg font-semibold py-4 shadow-xl bg-amber-600 hover:bg-amber-700"
      >
        {isSaving ? statusMessage : 'KIRIM LAPORAN'}
      </Button>
    </div>
  );
};