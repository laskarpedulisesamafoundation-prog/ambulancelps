export interface Patient {
  id: string;
  nama: string;
  nik?: string;
  alamat: string;
  telepon: string;
  kontakDarurat?: string;
  kategoriStatus: string; // e.g. "Sangat Kurang Mampu", "Kurang Mampu", "Yatim/Piatu", "Lainnya"
  catatanMedis?: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  patientId?: string;
  namaPasien: string;
  tujuan: string;
  tanggal: string; // YYYY-MM-DD
  supir: string;
  pendamping?: string;
  kmSebelum: number;
  kmSesudah?: number;
  status: 'dalam_perjalanan' | 'selesai' | 'batal';
  catatan?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  tripId?: string; // Optional: associated with a specific trip
  namaPasien?: string; // Cache patient name for view
  kategori: 'bensin' | 'tol' | 'makan' | 'servis_ambulance' | 'lainnya';
  jumlah: number;
  keterangan: string;
  tanggal: string; // YYYY-MM-DD
  createdAt: string;
}

export interface AppUser {
  id: string;
  username: string;
  password?: string; // stored in plaintext or masked for simple local security
  role: 'admin' | 'staff';
  name: string;
  createdAt: string;
}

