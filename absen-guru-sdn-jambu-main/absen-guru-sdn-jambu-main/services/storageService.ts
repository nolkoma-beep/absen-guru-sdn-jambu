import { AttendanceRecord, AttendanceType, SPPDRecord } from '../types';

const STORAGE_KEY = 'guruhadir_records';
const PROFILE_KEY = 'guruhadir_user_profile';
const SCRIPT_URL_KEY = 'guruhadir_script_url';

// URL Default dari pengguna (Google Apps Script) - INI URL UTAMA
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzn1cVuZFWeqmE3n_PBQqhPWJwR2vblOIGzl4iUtADfBP1B1sTVUuso-bHo0vw_kYlmfw/exec';

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

export const saveUserProfile = (name: string, nip: string, photoUrl?: string) => {
  const current = getUserProfile();
  const newData = {
    ...current, // Preserve existing data like photoUrl if not provided
    name,
    nip
  };
  
  if (photoUrl !== undefined) {
    newData.photoUrl = photoUrl;
  }

  localStorage.setItem(PROFILE_KEY, JSON.stringify(newData));
};

export const getUserProfile = (): { name: string; nip: string; photoUrl?: string } | null => {
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
    lastCheckInTime: checkIn?.timestamp
  };
};

export const clearData = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(SCRIPT_URL_KEY);
};