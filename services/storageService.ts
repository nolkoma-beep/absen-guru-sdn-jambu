import { AttendanceRecord, AttendanceType, SPPDRecord } from '../types';

const STORAGE_KEY = 'guruhadir_records';
const PROFILE_KEY = 'guruhadir_user_profile';
const SCRIPT_URL_KEY = 'guruhadir_script_url';

// URL Default dari pengguna (Google Apps Script) - UPDATE KE URL TERBARU
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbymllukoh70QEjoUzbEMX45g0eHk8pq5jTKHH8509vwyYXxQ4pZEhpjkOs0RDxVTdpwdA/exec';

export const getRecords = (): (AttendanceRecord | SPPDRecord)[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRecord = async (record: AttendanceRecord | SPPDRecord): Promise<boolean> => {
  try {
    saveToLocalStorage(record);
    // Simpan profile, tapi biarkan photoUrl apa adanya (undefined arguments tidak akan menimpa photoUrl yang ada)
    saveUserProfile(record.name, record.nip);
    
    // Coba kirim ke Google Sheets jika URL tersedia
    const scriptUrl = getScriptUrl();
    if (scriptUrl) {
       await syncToGoogleSheets(scriptUrl, record);
    }

    return true;
  } catch (error) {
    console.warn("Failed to save to Local Storage:", error);
    return false;
  }
};

// Fungsi Utilitas: Kompresi Gambar agar payload ringan
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

// Fungsi Sinkronisasi ke Google Sheets
const syncToGoogleSheets = async (url: string, record: AttendanceRecord | SPPDRecord) => {
  try {
    // Gunakan fetch dengan mode POST standard. Content-Type text/plain agar tidak terkena CORS preflight.
    await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
         'Content-Type': 'text/plain;charset=utf-8', 
      },
      body: JSON.stringify({
        ...record,
        action: 'save_record' // Penanda aksi
      })
    });
  } catch (e) {
    console.error("Gagal sync ke Google Sheets:", e);
    // Tidak throw error agar aplikasi tetap jalan offline
  }
};

// --- FITUR BARU: AMBIL DATA CLOUD ---
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

// Helper to handle storage quota
const saveToLocalStorage = (record: AttendanceRecord | SPPDRecord) => {
  try {
    const records = getRecords();
    const newRecords = [record, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
  } catch (e: any) {
    // Check for QuotaExceededError
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
      console.warn("Storage quota exceeded. Trimming old records...");
      
      // Strategy 1: Keep only the 10 most recent records
      try {
        const records = getRecords();
        const trimmedRecords = records.slice(0, 10);
        const newRecords = [record, ...trimmedRecords];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
      } catch (retryError) {
        // Strategy 2: If still full (e.g. large photos), save only the new record
        console.warn("Still full. Resetting history to current record only.");
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
    ...current, // Preserve existing data like photoUrl if not provided
    name,
    nip
  };
  
  if (photoUrl !== undefined) {
    newData.photoUrl = photoUrl;
  }
  
  if (role !== undefined) {
    newData.role = role;
  }

  localStorage.setItem(PROFILE_KEY, JSON.stringify(newData));
};

export const getUserProfile = (): { name: string; nip: string; photoUrl?: string; role?: string } | null => {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : null;
};

// --- URL SCRIPT CONFIG ---
export const saveScriptUrl = (url: string) => {
  // Hanya simpan jika user benar-benar memasukkan URL yang valid (bukan string kosong)
  if (url && url.trim().length > 0) {
      localStorage.setItem(SCRIPT_URL_KEY, url.trim());
  }
};

export const getScriptUrl = (): string => {
  // Prioritaskan DEFAULT_SCRIPT_URL agar aplikasi selalu terhubung
  // Kita mengabaikan localStorage sementara ini untuk menghindari error "Failed to fetch" akibat URL kosong/salah yang tersimpan sebelumnya.
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

export const getMonthlyStats = () => {
  const records = getRecords();
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();

  const thisMonthRecords = records.filter(r => {
    const d = new Date(r.timestamp);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const hadirCount = thisMonthRecords.filter(r => r.type === AttendanceType.CHECK_IN).length;
  const sppdCount = thisMonthRecords.filter(r => r.type === AttendanceType.SPPD).length;

  return {
    hadir: hadirCount,
    sppd: sppdCount,
    monthName: now.toLocaleString('id-ID', { month: 'long' })
  };
};

export const clearData = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(SCRIPT_URL_KEY);
};