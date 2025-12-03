export enum AttendanceType {
  CHECK_IN = 'DATANG',
  CHECK_OUT = 'PULANG',
  SPPD = 'SPPD'
}

export interface AttendanceRecord {
  id: string;
  type: AttendanceType;
  timestamp: number;
  latitude?: number;
  longitude?: number;
  photoUrl?: string; // Base64 or mock URL
  notes?: string;
  locationName?: string;
  // New fields requested
  name: string;
  nip: string;
}

export interface SPPDRecord extends AttendanceRecord {
  destination: string;
  activityType: string; // Jenis Kegiatan
  startDate: string;
  endDate: string;
  reportSummary: string;
  attachments: string[]; // 4 Photos
}

export interface UserState {
  hasCheckedInToday: boolean;
  hasCheckedOutToday: boolean;
  lastCheckInTime?: number;
}