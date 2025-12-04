import React, { useEffect, useState } from 'react';
import { getRecords } from '../services/storageService';
import { AttendanceRecord, AttendanceType, SPPDRecord } from '../types';
import { Card } from '../components/UIComponents';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { MapPin, Briefcase } from 'lucide-react';

export const History: React.FC = () => {
  const [records, setRecords] = useState<(AttendanceRecord | SPPDRecord)[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ATTENDANCE' | 'SPPD'>('ALL');

  useEffect(() => {
    const data = getRecords();
    setRecords(data);
  }, []);

  const filteredRecords = records.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'ATTENDANCE') return r.type === AttendanceType.CHECK_IN || r.type === AttendanceType.CHECK_OUT;
    if (filter === 'SPPD') return r.type === AttendanceType.SPPD;
    return true;
  });

  return (
    <div className="p-6 pb-24 min-h-screen">
       <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Riwayat Aktivitas</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Catatan aktivitas di perangkat ini.</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['ALL', 'ATTENDANCE', 'SPPD'].map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                        filter === f 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none' 
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                    }`}
                >
                    {f === 'ALL' ? 'Semua' : f === 'ATTENDANCE' ? 'Absensi' : 'SPPD'}
                </button>
            ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-gray-400 dark:text-gray-500 text-sm">Belum ada data riwayat.</p>
            </div>
        ) : (
            filteredRecords.map((record) => (
                <Card key={record.id} className="relative overflow-hidden">
                    {/* Header Card */}
                    <div className="flex justify-between items-start mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                        <div className="flex flex-col">
                             <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider self-start mb-1 ${
                                record.type === AttendanceType.CHECK_IN ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                record.type === AttendanceType.CHECK_OUT ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            }`}>
                                {record.type === AttendanceType.CHECK_IN ? 'Datang' : 
                                 record.type === AttendanceType.CHECK_OUT ? 'Pulang' : 'Laporan SPPD'}
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                {format(record.timestamp, 'dd MMM yyyy, HH:mm', { locale: id })}
                            </span>
                        </div>
                         {/* Show NIP */}
                         {(record.name) && (
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate max-w-[120px]">{record.name}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">NIP. {record.nip}</p>
                            </div>
                         )}
                    </div>

                    {/* Content Based on Type */}
                    {record.type === AttendanceType.SPPD ? (
                        <div className="space-y-3 mt-2">
                            {/* Jenis Kegiatan */}
                            <div>
                                <label className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold flex items-center gap-1 mb-1">
                                    <Briefcase size={10} /> Jenis Kegiatan
                                </label>
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                                    {(record as SPPDRecord).activityType}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                    <MapPin size={10} /> {(record as SPPDRecord).destination}
                                </p>
                            </div>
                            
                            {/* Laporan */}
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-xs text-gray-600 dark:text-gray-300 leading-relaxed border border-purple-100 dark:border-purple-900/30">
                                <span className="font-semibold text-purple-700 dark:text-purple-400 block mb-1">Laporan Hasil:</span>
                                "{(record as SPPDRecord).reportSummary}"
                            </div>

                            {/* Attachments Grid */}
                            {(record as SPPDRecord).attachments && (record as SPPDRecord).attachments.length > 0 && (
                                <div>
                                     <label className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold mb-1 block">Lampiran Foto</label>
                                     <div className="flex gap-2 overflow-x-auto pb-1">
                                        {(record as SPPDRecord).attachments.map((img, idx) => (
                                            <div key={idx} className="w-16 h-16 shrink-0 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                                                <img src={img} alt="Lampiran" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                     </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-4 mt-2">
                            {record.photoUrl && (
                                <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <img src={record.photoUrl} alt="Bukti" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1 space-y-2">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-start gap-1">
                                    <MapPin size={14} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{record.locationName}</span>
                                </p>
                                {record.notes && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                        "{record.notes}"
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            ))
        )}
      </div>
    </div>
  );
};