import { AttendanceRecord, AttendanceType, SPPDRecord } from '../types';

const STORAGE_KEY = 'guruhadir_records';
const PROFILE_KEY = 'guruhadir_user_profile';
const SCRIPT_URL_KEY = 'guruhadir_script_url';

// URL Default dari pengguna (Google Apps Script)
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbymllukoh70QEjoUzbEMX45g0eHk8pq5jTKHH8509vwyYXxQ4pZEhpjkOs0RDxVTdpwdA/exec';

export const getRecords = (): (AttendanceRecord | SPPDRecord)[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
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

export const saveRecord = async (record: AttendanceRecord | SPPDRecord): Promise<boolean> => {
  try {
    // 1. Simpan ke Local Storage (HP) dulu agar aman
    saveToLocalStorage(record);
    
    // Simpan profile untuk auto-fill berikutnya
    saveUserProfile(record.name, record.nip);
    
    // 2. KIRIM KE GOOGLE SHEETS & DRIVE (Async)
    const scriptUrl = getScriptUrl();
    if (scriptUrl) {
       console.log("Mengirim data ke server...", record.type);
       // Kita tidak perlu await di sini agar UI tidak lag, biarkan berjalan di background
       // atau await jika ingin memastikan terkirim sebelum pindah halaman
       await syncToGoogleSheets(scriptUrl, record);
    }

    return true;
  } catch (error) {
    console.warn("Failed to save process:", error);
    // Tetap return true karena minimal sudah tersimpan di HP
    return true; 
  }
};

// Fungsi Sinkronisasi ke Google Sheets
const syncToGoogleSheets = async (url: string, record: AttendanceRecord | SPPDRecord) => {
  try {
    const dateObj = new Date(record.timestamp);
    
    // Payload dikirim LENGKAP dengan Base64 (yang sudah dikompres di Page)
    const payload = {
      action: 'save_record',
      ...record,
      // Format tanggal tambahan untuk spreadsheet
      formattedDate: dateObj.toISOString().split('T')[0], // YYYY-MM-DD
      formattedTime: dateObj.toTimeString().split(' ')[0], // HH:MM:SS
    };

    console.log("Ukuran Payload (karakter):", JSON.stringify(payload).length);

    // PENTING: Gunakan method POST dengan Content-Type text/plain 
    await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
         'Content-Type': 'text/plain;charset=utf-8', 
      },
      body: JSON.stringify(payload)
    });
    
    console.log("Data berhasil dikirim ke server.");
  } catch (e) {
    console.error("Gagal sync ke Google Sheets:", e);
  }
};

// Helper to handle storage quota
const saveToLocalStorage = (record: AttendanceRecord | SPPDRecord) => {
  try {
    // KITA BUAT SALINAN DATA UNTUK DISIMPAN DI HP
    // Agar memori HP tidak penuh, kita hapus kode foto yang panjang dari salinan ini
    const localRecord = { ...record }; 
    
    // Hapus foto profil/absen dari local storage HP
    if (localRecord.photoUrl && localRecord.photoUrl.length > 200) {
        localRecord.photoUrl = "https://cdn-icons-png.flaticon.com/512/2965/2965327.png"; 
        localRecord.notes = (localRecord.notes ? localRecord.notes + " " : "") + "(Foto tersimpan di Server)";
    }

    // Hapus foto lampiran SPPD dari local storage HP
    if (localRecord.type === AttendanceType.SPPD) {
        const sppdRec = localRecord as SPPDRecord;
        if (sppdRec.attachments && Array.isArray(sppdRec.attachments)) {
            sppdRec.attachments = sppdRec.attachments.map(a => 
                (a && a.length > 200) ? "https://cdn-icons-png.flaticon.com/512/2965/2965327.png" : a
            ).filter(Boolean) as string[];
        }
    }

    const records = getRecords();
    const newRecords = [localRecord, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
  } catch (e: any) {
    // Check for QuotaExceededError
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
      console.warn("Storage quota exceeded. Trimming old records...");
      try {
        const records = getRecords();
        const trimmedRecords = records.slice(0, 10); // Simpan cuma 10 terakhir
        const newRecords = [record, ...trimmedRecords];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
      } catch (retryError) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([record]));
      }
    }
  }
};

export const saveUserProfile = (name: string, nip: string, photoUrl?: string, role?: string) => {
  const current = getUserProfile();
  const newData = {
    ...(current || {}),
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
  return localStorage.getItem(SCRIPT_URL_KEY) || DEFAULT_SCRIPT_URL;
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