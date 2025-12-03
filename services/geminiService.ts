import { GoogleGenAI } from "@google/genai";

// Ideally, this comes from process.env.API_KEY. 
// For this demo environment, we assume it is injected.
const API_KEY = process.env.API_KEY || '';

export const generateSPPDReport = async (
  destination: string,
  activityType: string,
  duration: string
): Promise<string> => {
  if (!API_KEY) {
    console.warn("API Key is missing. Returning mock data.");
    return `[Mode Demo - API Key tidak ditemukan]\n\nLaporan Kegiatan ${activityType} di ${destination}.\n\nDurasi: ${duration}\n\nSaya telah melaksanakan ${activityType} sesuai surat tugas. Kegiatan berjalan lancar, koordinasi telah dilakukan dengan pihak terkait, dan seluruh agenda kegiatan telah diselesaikan dengan baik.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Using flash model for speed
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      Bertindaklah sebagai guru profesional yang sedang membuat Laporan Perjalanan Dinas (SPPD).
      Buatkan paragraf "Laporan Hasil Kegiatan" yang formal, ringkas, dan jelas dalam Bahasa Indonesia.
      
      Konteks:
      - Jenis Kegiatan: ${activityType}
      - Lokasi/Tujuan: ${destination}
      - Durasi: ${duration}
      
      Fokus pada hasil kegiatan, ketercapaian tujuan, dan penutup yang sopan. Panjang sekitar 3-5 kalimat.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Gagal membuat laporan otomatis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Terjadi kesalahan saat menghubungi asisten AI. Silakan tulis laporan secara manual.";
  }
};