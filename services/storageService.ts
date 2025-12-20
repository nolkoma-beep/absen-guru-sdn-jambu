import { AttendanceRecord, AttendanceType, SPPDRecord, LeaveRecord } from '../types';

const STORAGE_KEY = 'guruhadir_records';
const PROFILE_KEY = 'guruhadir_user_profile';
const SCRIPT_URL_KEY = 'guruhadir_script_url';

// URL BARU DARI PENGGUNA
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzlX7ZuWc0lyuq3asy8i-oTZTXAupcpTeLDP57Bj3ZgtBee1warYqqtA1AhP7IqjoKP6A/exec';

export const getRecords = (): (AttendanceRecord | SPPDRecord | LeaveRecord)[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRecord = async (record: AttendanceRecord | SPPDRecord | LeaveRecord): Promise<{ success: boolean; message: string }> => {
  try {
    // 1. Simpan Lokal Dulu (Agar data aman jika offline)
    saveToLocalStorage(record);
    saveUserProfile(record.name, record.nip);
    
    // 2. Coba kirim ke Cloud (Google Sheets)
    const scriptUrl = getScriptUrl();
    if (scriptUrl) {
       await syncToGoogleSheets(scriptUrl, record);
       return { success: true, message: "Data tersimpan di Lokal & Server!" };
    }

    return { success: true, message: "Data tersimpan di Lokal (Offline Mode)." };
  } catch (error: any) {
    console.warn("Error saat menyimpan:", error);
    return { success: true, message: "Tersimpan di Lokal. Gagal koneksi server." };
  }
};

// Fungsi Sinkronisasi ke Google Sheets (Backend Baru)
const syncToGoogleSheets = async (url: string, record: AttendanceRecord | SPPDRecord | LeaveRecord) => {
  try {
    // Persiapkan Payload sesuai Backend Baru
    const payload: any = {
      action: 'save_record',
      id: record.id,
      timestamp: record.timestamp,
      nama: record.name, 
      nip: record.nip,
      status: record.type,
      lokasi: record.locationName || '',
      latitude: record.latitude,
      longitude: record.longitude,
      keterangan: record.notes || ''
    };

    // Mapping Khusus SPPD
    if (record.type === AttendanceType.SPPD) {
      const sppd = record as SPPDRecord;
      payload.tujuan = sppd.destination;
      payload.jenis_kegiatan = sppd.activityType;
      payload.tanggal_mulai = sppd.startDate;
      payload.tanggal_selesai = sppd.endDate;
      payload.laporan = sppd.reportSummary;
      
      if (sppd.attachments && Array.isArray(sppd.attachments)) {
        payload.foto_1 = sppd.attachments[0] || '';
        payload.foto_2 = sppd.attachments[1] || '';
        payload.foto_3 = sppd.attachments[2] || '';
        payload.foto_4 = sppd.attachments[3] || '';
      }
    } else {
      // Mapping Absen Biasa (Datang/Pulang/Ijin) -> Single Foto
      payload.foto = record.photoUrl || '';
    }

    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    if (result.result !== 'success') {
        throw new Error(result.message || "Gagal menyimpan di sisi server");
    }

  } catch (e) {
    console.error("Gagal sync ke Google Sheets:", e);
    throw e;
  }
};

// Fungsi Utilitas: Kompresi Gambar agar payload ringan & cepat upload
export const compressImage = (base64Str: string, maxWidth = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      // Jika gambar kecil, jangan dikompres
      if (img.width <= maxWidth) {
        resolve(base64Str);
        return;
      }

      const canvas = document.createElement('canvas');
      const ratio = maxWidth / img.width;
      
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.fillStyle = "#FFFFFF"; // Cegah background transparan jadi hitam
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Kompres jadi JPEG kualitas 70%
          resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      } else {
          resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

// --- FITUR: REKAP SEKOLAH (Get Data) ---
export interface CloudAttendance {
  timestamp: string;
  time: string;
  name: string;
  type: string;
  location: string;
}

export const getTodayDataFromCloud = async (): Promise<CloudAttendance[]> => {
  const url = getScriptUrl();
  if (!url) return [];

  try {
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'get_today_data' })
    });

    if (!response.ok) return [];

    const json = await response.json();
    if (json.result === 'success' && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (error) {
    console.error("Gagal mengambil data cloud:", error);
    return [];
  }
};

// --- LOCAL STORAGE HELPERS ---

const saveToLocalStorage = (record: AttendanceRecord | SPPDRecord | LeaveRecord) => {
  try {
    const records = getRecords();
    const newRecords = [record, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
  } catch (e: any) {
    // Handle Quota Penuh
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
      console.warn("Storage quota exceeded. Trimming old records...");
      try {
        const records = getRecords();
        // Simpan cuma 5 terakhir agar muat
        const trimmedRecords = records.slice(0, 5);
        const newRecords = [record, ...trimmedRecords];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
      } catch (retryError) {
        // Jika masih penuh, reset history
        localStorage.setItem(STORAGE_KEY, JSON.stringify([record]));
      }
    } else {
      throw e;
    }
  }
};

export const saveUserProfile = (name: string, nip: string, photoUrl?: string, role?: string) => {
  const current = getUserProfile();
  const newData: { name: string; nip: string; photoUrl?: string; role?: string } = {
    ...current, 
    name,
    nip
  };
  
  if (photoUrl !== undefined) newData.photoUrl = photoUrl;
  if (role !== undefined) newData.role = role;

  localStorage.setItem(PROFILE_KEY, JSON.stringify(newData));
};

export const getUserProfile = (): { name: string; nip: string; photoUrl?: string; role?: string } | null => {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : null;
};

// --- URL SCRIPT CONFIG ---
export const saveScriptUrl = (url: string) => {
  if (url && url.trim().length > 0) {
      localStorage.setItem(SCRIPT_URL_KEY, url.trim());
  }
};

export const getScriptUrl = (): string => {
  return DEFAULT_SCRIPT_URL;
};

export const getTodayStatus = () => {
  const records = getRecords();
  const today = new Date().setHours(0, 0, 0, 0);

  const todayRecords = records.filter(r => {
    const recordDate = new Date(r.timestamp).setHours(0, 0, 0, 0);
    return recordDate === today;
  });

  const checkIn = todayRecords.find(r => r.type === AttendanceType.CHECK_IN);
  const checkOut = todayRecords.find(r => r.type === AttendanceType.CHECK_OUT);

  return {
    hasCheckedInToday: !!checkIn,
    hasCheckedOutToday: !!checkOut,
    checkInTime: checkIn?.timestamp,
    checkOutTime: checkOut?.timestamp
  };
};

export const clearData = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(SCRIPT_URL_KEY);
};