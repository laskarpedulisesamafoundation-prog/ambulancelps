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
  telepon?: string; // Passenger phone number
  tujuan: string;
  tanggal: string; // YYYY-MM-DD
  supir: string;
  pendamping?: string;
  kmSebelum: number;
  kmSesudah?: number;
  status: 'dalam_perjalanan' | 'selesai' | 'batal';
  catatan?: string;
  jamBerangkat?: string;
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
  role: 'admin' | 'staff' | 'manajer' | 'manager';
  name: string;
  telepon?: string; // Staff/user phone number
  createdAt: string;
}

export interface Booking {
  id: string;
  patientId?: string;
  namaPasien: string;
  telepon?: string;
  alamatPenjemputan: string;
  tujuan: string;
  tanggalPerjalanan: string; // YYYY-MM-DD
  jamJemput: string; // HH:MM
  jamPemesanan?: string; // HH:MM (Order time / creation time)
  namaPemesan?: string;
  hubunganPasien?: string;
  keterangan?: string;
  status: 'menunggu' | 'disetujui' | 'selesai' | 'batal';
  createdAt: string;
}


