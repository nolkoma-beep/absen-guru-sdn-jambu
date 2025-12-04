import React, { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, X, User, Briefcase, UploadCloud } from 'lucide-react';
import { Button, Input, TextArea, Card } from '../components/UIComponents';
import { saveRecord, getUserProfile } from '../services/storageService';
import { AttendanceType, SPPDRecord } from '../types';
import { useNavigate } from 'react-router-dom';

export const SPPD: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');

  // Form Data
  const [activityType, setActivityType] = useState(''); // Jenis Kegiatan
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState('');
  
  // Photos (Max 4)
  const [attachments, setAttachments] = useState<(string | null)[]>([null, null, null, null]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedProfile = getUserProfile();
    if (savedProfile) {
      setName(savedProfile.name);
      setNip(savedProfile.nip);
    }
  }, []);

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newAttachments = [...attachments];
        newAttachments[index] = ev.target?.result as string;
        setAttachments(newAttachments);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const removePhoto = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments[index] = null;
    setAttachments(newAttachments);
  };

  const handleSave = async () => {
    // Validasi Field Wajib
    if (!name || !nip) {
        alert("Nama dan NIP wajib diisi.");
        return;
    }
    if (!activityType || !report) {
        alert("Jenis Kegiatan dan Laporan Hasil Kegiatan wajib diisi.");
        return;
    }

    // Filter valid photos
    const validPhotos = attachments.filter(p => p !== null) as string[];

    setIsSaving(true);
    
    const record: SPPDRecord = {
        id: Date.now().toString(),
        type: AttendanceType.SPPD,
        timestamp: Date.now(),
        destination: destination, // Tetap disimpan untuk data teknis
        activityType: activityType,
        startDate: startDate,
        endDate: endDate,
        reportSummary: report,
        attachments: validPhotos,
        locationName: destination, 
        name: name,
        nip: nip
    };

    // Save record (Async)
    await saveRecord(record);
    
    setIsSaving(false);
    navigate('/');
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-900 dark:to-indigo-900 p-4 -mx-6 -mt-6 mb-2 text-white shadow-md transition-colors">
        <h2 className="text-xl font-bold flex items-center gap-2">
            <Briefcase size={24} />
            Laporan SPPD
        </h2>
        <p className="text-purple-100 text-sm">Formulir pertanggungjawaban dinas luar.</p>
      </div>

      {/* 1. Nama & NIP */}
      <Card className="space-y-4 border-l-4 border-blue-500">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-2 mb-2 flex items-center gap-2">
              <User size={18} className="text-blue-500" />
              Identitas Pelaksana
          </h3>
          <Input 
              label="Nama Lengkap" 
              placeholder="Nama lengkap beserta gelar"
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

      {/* 2. Jenis Kegiatan & Detail */}
      <Card className="space-y-4 border-l-4 border-orange-500">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-2 mb-2 flex items-center gap-2">
             <Briefcase size={18} className="text-orange-500" />
             Detail Kegiatan
        </h3>
        
        <Input 
            label="Jenis Kegiatan" 
            placeholder="Contoh: Pelatihan Kurikulum, Pendampingan Siswa, Rapat MKKS"
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
        />

        {/* Data Pendukung (Tujuan & Tanggal) - Tetap diperlukan untuk laporan yang valid */}
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg space-y-3 border border-gray-200 dark:border-gray-600">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Data Surat Tugas</p>
            <Input 
                label="Lokasi / Tujuan" 
                placeholder="Tempat pelaksanaan"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="bg-white dark:bg-gray-800 dark:text-white"
            />
            <div className="grid grid-cols-2 gap-3">
                <Input label="Tgl Mulai" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white dark:bg-gray-800 dark:text-white" />
                <Input label="Tgl Selesai" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white dark:bg-gray-800 dark:text-white" />
            </div>
        </div>
      </Card>

      {/* 3. Laporan Hasil Kegiatan */}
      <Card className="border-l-4 border-purple-500">
         <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-2 mb-2 flex items-center gap-2">
             <FileText size={18} className="text-purple-500" />
             Laporan Hasil Kegiatan
        </h3>
        <div className="relative">
            <TextArea 
                label=""
                placeholder="Uraian hasil kegiatan yang telah dilaksanakan..."
                value={report}
                onChange={(e) => setReport(e.target.value)}
                rows={8}
                className="mb-1"
            />
        </div>
      </Card>

      {/* 4. Lampiran Foto (4 Foto) */}
      <Card className="border-l-4 border-pink-500">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-2 mb-4 flex items-center gap-2">
             <ImageIcon size={18} className="text-pink-500" />
             Lampiran Dokumentasi (4 Foto)
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="relative aspect-square">
                    {attachments[idx] ? (
                        <div className="w-full h-full relative group">
                            <img 
                                src={attachments[idx]!} 
                                alt={`Lampiran ${idx + 1}`} 
                                className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                            />
                            <button 
                                onClick={() => removePhoto(idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all">
                            <UploadCloud size={24} className="text-gray-400 dark:text-gray-500 mb-1" />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Foto {idx + 1}</span>
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handlePhotoUpload(idx, e)}
                            />
                        </label>
                    )}
                </div>
            ))}
        </div>
      </Card>

      <Button onClick={handleSave} isLoading={isSaving} className="w-full text-lg font-semibold py-4 shadow-xl shadow-purple-200 dark:shadow-none bg-purple-600 hover:bg-purple-700">
        KIRIM LAPORAN SPPD
      </Button>
    </div>
  );
};