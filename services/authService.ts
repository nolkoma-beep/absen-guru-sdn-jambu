import { saveUserProfile, getScriptUrl } from './storageService';

const AUTH_KEY = 'guruhadir_is_authenticated';

interface UserData {
  photo: string;
  role: string;
}

// Database Terpusat (Foto & Jabatan) - Menghilangkan duplikasi key nama
const USER_DATABASE: Record<string, UserData> = {
  "ASEP AWALUDIN,S.Pd": { 
    photo: "https://iili.io/fzNJbOQ.jpg", 
    role: "Kepala Sekolah" 
  },
  "MUNJI, S.Pd.I": { 
    photo: "https://iili.io/fzN21uR.jpg", 
    role: "Guru Agama" 
  },
  "MARTINI, S.Pd.I": { 
    photo: "https://iili.io/fzNFX7s.jpg", 
    role: "Guru Kelas" 
  },
  "MINARTI, S.Pd.I": { 
    photo: "https://iili.io/fzNKoyG.jpg", 
    role: "Guru Kelas" 
  },
  "DEWI HOFIANTINI, S.Pd": { 
    photo: "https://iili.io/fzNCTJ9.jpg", 
    role: "Guru Kelas" 
  },
  "A. BAIRONI,S.Pd": { 
    photo: "https://iili.io/fzNCUen.jpg", 
    role: "Guru Kelas" 
  },
  "HERNAWATI, S.Pd": { 
    photo: "https://iili.io/fzNfoKP.jpg", 
    role: "Guru Kelas" 
  },
  "AHMAD FAHMI, S.Pd.I": { 
    photo: "https://iili.io/fzN3GHb.jpg", 
    role: "Guru Kelas" 
  },
  "AMNIATUSHALIHAT, S.Pd": { 
    photo: "https://iili.io/fzNq7ku.jpg", 
    role: "Guru PJOK" 
  }
};

// Helper untuk mencari key user (Case Insensitive) agar tidak menulis logika pencarian berulang kali
const findUserKey = (name: string): string | undefined => {
  if (!name) return undefined;
  const normalizedSearch = name.trim().toLowerCase();
  return Object.keys(USER_DATABASE).find(key => key.toLowerCase() === normalizedSearch);
};

const getPhotoByName = (name: string): string | undefined => {
  const key = findUserKey(name);
  return key ? USER_DATABASE[key].photo : undefined;
};

const getRoleByName = (name: string): string => {
  const key = findUserKey(name);
  return key ? USER_DATABASE[key].role : "Guru Kelas";
};

export interface LoginResult {
  success: boolean;
  message?: string;
}

export const login = async (username: string, password: string): Promise<LoginResult> => {
  if (!username || !password) return { success: false, message: "Username dan Password harus diisi." };

  let scriptUrl = getScriptUrl();

  // 1. Mode Offline/Demo (Jika URL belum diisi)
  if (!scriptUrl) {
    if (password === '123456') {
      localStorage.setItem(AUTH_KEY, 'true');
      const displayName = username
        .split('.')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') || "Guru (Demo Mode)";
      
      const demoPhoto = getPhotoByName(displayName);
      const demoRole = getRoleByName(displayName);

      saveUserProfile(displayName, "198501012010011001", demoPhoto, demoRole);
      return { success: true };
    }
    return { success: false, message: "Mode Offline: Password salah (Default: 123456). Atau masukkan URL Server di pengaturan." };
  }

  // Validasi URL
  if (!scriptUrl.includes('script.google.com')) {
     return { success: false, message: "URL tidak valid. Harap gunakan URL Google Apps Script." };
  }
  if (!scriptUrl.endsWith('/exec')) {
     return { success: false, message: "URL salah. Gunakan URL 'Web App' yang berakhiran '/exec' (Bukan /dev atau /edit)." };
  }

  // 2. Mode Online (Cek ke Server)
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
      
      // Ambil data dari server
      const serverName = result.data.name;

      // Ambil data pelengkap dari database lokal (Foto & Jabatan)
      const matchedPhoto = getPhotoByName(serverName);
      const finalPhotoUrl = result.data.photoUrl || matchedPhoto;
      const role = getRoleByName(serverName);
      
      // Simpan profil lengkap
      saveUserProfile(serverName, result.data.nip, finalPhotoUrl, role);
      
      return { success: true };
    } else {
      return { success: false, message: "Username atau Password salah (Cek sheet 'Users')." };
    }

  } catch (error: any) {
    console.error("Login Error:", error);
    const errorMsg = error.message || error.toString();

    if (errorMsg.includes('Failed to fetch')) {
        return { 
            success: false, 
            message: "Gagal terhubung. Pastikan Deployment Access di Google Script diatur ke 'Anyone' (Siapa Saja)." 
        };
    }

    return { success: false, message: `Error: ${errorMsg}` };
  }
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem(AUTH_KEY) === 'true';
};