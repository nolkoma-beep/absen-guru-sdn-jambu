import { saveUserProfile, getScriptUrl } from './storageService';

const AUTH_KEY = 'guruhadir_is_authenticated';

// Database Foto (Mapping Nama -> URL) sesuai data Spreadsheet yang diberikan
const PHOTO_DATABASE: Record<string, string> = {
  "ASEP AWALUDIN,S.Pd": "https://iili.io/fzNJbOQ.jpg",
  "MUNJI, S.Pd.I": "https://iili.io/fzN21uR.jpg",
  "MARTINI, S.Pd.I": "https://iili.io/fzNFX7s.jpg",
  "MINARTI, S.Pd.I": "https://iili.io/fzNKoyG.jpg",
  "DEWI HOFIANTINI, S.Pd": "https://iili.io/fzNCTJ9.jpg",
  "A. BAIRONI,S.Pd": "https://iili.io/fzNCUen.jpg",
  "HERNAWATI, S.Pd": "https://iili.io/fzNfoKP.jpg",
  "AHMAD FAHMI, S.Pd.I": "https://iili.io/fzN3GHb.jpg",
  "AMNIATUSHALIHAT, S.Pd": "https://iili.io/fzNq7ku.jpg"
};

// Helper untuk mencari foto berdasarkan nama (Case Insensitive)
const getPhotoByName = (name: string): string | undefined => {
  if (!name) return undefined;
  const normalizedSearch = name.trim().toLowerCase();
  
  // Cari key yang cocok
  const matchedKey = Object.keys(PHOTO_DATABASE).find(key => 
    key.toLowerCase() === normalizedSearch
  );
  
  return matchedKey ? PHOTO_DATABASE[matchedKey] : undefined;
};

export interface LoginResult {
  success: boolean;
  message?: string;
}

export const login = async (username: string, password: string): Promise<LoginResult> => {
  if (!username || !password) return { success: false, message: "Username dan Password harus diisi." };

  let scriptUrl = getScriptUrl();

  // 1. Jika URL Spreadsheet BELUM diisi, gunakan Mode Offline/Demo
  if (!scriptUrl) {
    if (password === '123456') {
      localStorage.setItem(AUTH_KEY, 'true');
      const displayName = username
        .split('.')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') || "Guru (Demo Mode)";
      
      // Coba cari foto juga untuk mode demo jika nama cocok
      const demoPhoto = getPhotoByName(displayName);

      // Default dummy photo for demo if not found
      saveUserProfile(displayName, "198501012010011001", demoPhoto);
      return { success: true };
    }
    return { success: false, message: "Mode Offline: Password salah (Default: 123456). Atau masukkan URL Server di pengaturan." };
  }

  // Validasi URL: Harus domain google dan berakhiran /exec
  if (!scriptUrl.includes('script.google.com')) {
     return { success: false, message: "URL tidak valid. Harap gunakan URL Google Apps Script." };
  }
  if (!scriptUrl.endsWith('/exec')) {
     return { success: false, message: "URL salah. Gunakan URL 'Web App' yang berakhiran '/exec' (Bukan /dev atau /edit)." };
  }

  // 2. Jika URL Spreadsheet SUDAH diisi, cek ke server
  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'login',
        username: username,
        password: password
      })
    });

    if (!response.ok) {
        return { success: false, message: `Server Error: ${response.status} ${response.statusText}` };
    }

    const result = await response.json();

    if (result.result === 'success') {
      localStorage.setItem(AUTH_KEY, 'true');
      
      // Ambil nama dari response server
      const serverName = result.data.name;

      // Logika Penentuan Foto:
      // 1. Cek apakah server mengirimkan URL foto (future proofing)
      // 2. Jika tidak, cari di database lokal (PHOTO_DATABASE) berdasarkan Nama
      const matchedPhoto = getPhotoByName(serverName);
      const finalPhotoUrl = result.data.photoUrl || matchedPhoto;
      
      // Simpan profil lengkap ke storage
      saveUserProfile(serverName, result.data.nip, finalPhotoUrl);
      
      return { success: true };
    } else {
      return { success: false, message: "Username atau Password salah (Cek sheet 'Users')." };
    }

  } catch (error: any) {
    console.error("Login Error:", error);
    const errorMsg = error.message || error.toString();

    // Deteksi error CORS / Network
    if (errorMsg.includes('Failed to fetch')) {
        return { 
            success: false, 
            message: "Gagal terhubung. Pastikan Deployment Access di Google Script diatur ke 'Anyone' (Siapa Saja) dan Anda memiliki koneksi internet." 
        };
    }

    return { success: false, message: `Error: ${errorMsg}` };
  }
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
  // Kita tidak menghapus data profile agar auto-fill tetap jalan,
  // tapi user harus login lagi untuk refresh session/data.
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem(AUTH_KEY) === 'true';
};