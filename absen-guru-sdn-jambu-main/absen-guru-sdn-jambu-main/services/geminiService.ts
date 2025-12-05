import { GoogleGenAI } from "@google/genai";

export const generateSPPDReport = async (
  destination: string,
  activityType: string,
  duration: string
): Promise<string> => {
  // Use process.env.API_KEY directly as per guidelines.
  // Vite replaces this with the string value at build time.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("API Key is missing. Returning mock data.");
    return `[Mode Demo - API Key tidak ditemukan]\n\nLaporan Kegiatan ${activityType} di ${destination}.\n\nDurasi: ${duration}\n\nSaya telah melaksanakan ${activityType} sesuai surat tugas. Kegiatan berjalan lancar, koordinasi telah dilakukan dengan pihak terkait, dan seluruh agenda kegiatan telah diselesaikan dengan baik.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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