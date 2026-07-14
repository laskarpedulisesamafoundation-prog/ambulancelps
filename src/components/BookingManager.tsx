import React, { useState } from 'react';
import { Booking, Patient } from '../types';
import { addBooking, updateBooking, deleteBooking, addTrip } from '../dbService';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Compass,
  Phone,
  ArrowRight,
  Info,
  CalendarDays,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BookingManagerProps {
  bookings: Booking[];
  patients: Patient[];
  userRole: 'admin' | 'staff' | 'manajer' | 'manager';
}

export default function BookingManager({ bookings, patients, userRole }: BookingManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'menunggu' | 'disetujui' | 'selesai' | 'batal'>('semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Dispatch Trip states
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchTarget, setDispatchTarget] = useState<Booking | null>(null);
  const [supir, setSupir] = useState('');
  const [pendamping, setPendamping] = useState('');
  const [kmSebelum, setKmSebelum] = useState<any>('');

  // Form states
  const [patientId, setPatientId] = useState('');
  const [namaPasien, setNamaPasien] = useState('');
  const [telepon, setTelepon] = useState('');
  const [alamatPenjemputan, setAlamatPenjemputan] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [tanggalPerjalanan, setTanggalPerjalanan] = useState(new Date().toISOString().split('T')[0]);
  const [jamJemput, setJamJemput] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const [keterangan, setKeterangan] = useState('');
  const [status, setStatus] = useState<'menunggu' | 'disetujui' | 'selesai' | 'batal'>('menunggu');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      b.namaPasien.toLowerCase().includes(term) ||
      b.alamatPenjemputan.toLowerCase().includes(term) ||
      b.tujuan.toLowerCase().includes(term) ||
      (b.telepon && b.telepon.includes(term));

    const matchesStatus = statusFilter === 'semua' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate quick statistics
  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === 'menunggu').length;
  const approvedCount = bookings.filter((b) => b.status === 'disetujui').length;
  const completedCount = bookings.filter((b) => b.status === 'selesai').length;

  const handlePatientSelect = (pId: string) => {
    setPatientId(pId);
    if (!pId) {
      setNamaPasien('');
      setTelepon('');
      setAlamatPenjemputan('');
      return;
    }
    const selected = patients.find((p) => p.id === pId);
    if (selected) {
      setNamaPasien(selected.nama);
      setTelepon(selected.telepon);
      setAlamatPenjemputan(selected.alamat);
    }
  };

  const openAddModal = () => {
    setEditingBooking(null);
    setPatientId('');
    setNamaPasien('');
    setTelepon('');
    setAlamatPenjemputan('');
    setTujuan('');
    setTanggalPerjalanan(new Date().toISOString().split('T')[0]);
    
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setJamJemput(`${hours}:${minutes}`);
    
    setKeterangan('');
    setStatus('menunggu');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Booking) => {
    setEditingBooking(b);
    setPatientId(b.patientId || '');
    setNamaPasien(b.namaPasien);
    setTelepon(b.telepon || '');
    setAlamatPenjemputan(b.alamatPenjemputan);
    setTujuan(b.tujuan);
    setTanggalPerjalanan(b.tanggalPerjalanan);
    setJamJemput(b.jamJemput);
    setKeterangan(b.keterangan || '');
    setStatus(b.status);
    setIsModalOpen(true);
  };

  const openDispatchWizard = (b: Booking) => {
    setDispatchTarget(b);
    setSupir('');
    setPendamping('');
    setKmSebelum('');
    setIsDispatchModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPasien || !alamatPenjemputan || !tujuan || !tanggalPerjalanan || !jamJemput) {
      alert('Mohon lengkapi seluruh kolom yang bertanda bintang (*)');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientId: patientId || undefined,
        namaPasien,
        telepon: telepon || undefined,
        alamatPenjemputan,
        tujuan,
        tanggalPerjalanan,
        jamJemput,
        keterangan: keterangan || undefined,
        status,
        jamPemesanan: editingBooking?.jamPemesanan || jamJemput,
      };

      if (editingBooking) {
        await updateBooking(editingBooking.id, payload);
      } else {
        await addBooking(payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Gagal menyimpan pesanan. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTarget || !supir || !kmSebelum) {
      alert('Mohon isi Nama Supir dan Odometer Berangkat');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create trip
      const tripPayload = {
        patientId: dispatchTarget.patientId || undefined,
        namaPasien: dispatchTarget.namaPasien,
        telepon: dispatchTarget.telepon || undefined,
        tujuan: dispatchTarget.tujuan,
        tanggal: dispatchTarget.tanggalPerjalanan,
        supir,
        pendamping: pendamping || undefined,
        kmSebelum: Number(kmSebelum),
        status: 'dalam_perjalanan' as const,
        jamBerangkat: dispatchTarget.jamJemput,
        catatan: `[Diberangkatkan dari Pesanan/Booking] ${dispatchTarget.keterangan || ''}`.trim(),
      };

      await addTrip(tripPayload);

      // 2. Update booking status to disetujui (or selesai since it is dispatched)
      await updateBooking(dispatchTarget.id, { status: 'disetujui' });

      setIsDispatchModalOpen(false);
      setDispatchTarget(null);
      alert('Ambulance berhasil diberangkatkan! Perjalanan terekam di Log Perjalanan.');
    } catch (error) {
      console.error('Error dispatching ambulance:', error);
      alert('Gagal memberangkatkan ambulance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) {
      try {
        await deleteBooking(id);
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Gagal menghapus pesanan.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest bg-red-50 border border-red-100/50 px-2.5 py-1 rounded-full">
            Fitur Pemesanan Ambulance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display mt-2 tracking-tight">
            Daftar Pesanan & Booking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Input, pantau, dan berangkatkan ambulance langsung dari antrean pesanan masuk.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-200 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Pesanan Baru</span>
        </button>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Pesanan</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 font-display mt-1">{totalCount}</div>
        </div>
        <div className="bg-amber-50/50 backdrop-blur-md p-4 rounded-2xl border border-amber-100/50 shadow-sm">
          <div className="text-xs font-bold text-amber-500 uppercase">Menunggu</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-display mt-1">{pendingCount}</div>
        </div>
        <div className="bg-blue-50/50 backdrop-blur-md p-4 rounded-2xl border border-blue-100/50 shadow-sm">
          <div className="text-xs font-bold text-blue-500 uppercase">Disetujui / Jalan</div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 font-display mt-1">{approvedCount}</div>
        </div>
        <div className="bg-emerald-50/50 backdrop-blur-md p-4 rounded-2xl border border-emerald-100/50 shadow-sm">
          <div className="text-xs font-bold text-emerald-500 uppercase">Selesai</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-display mt-1">{completedCount}</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pasien, asal, atau tujuan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/80 border border-slate-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 shadow-sm"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {(['semua', 'menunggu', 'disetujui', 'selesai', 'batal'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                statusFilter === filter
                  ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                  : 'bg-white/60 text-slate-600 border-slate-200/40 hover:bg-white'
              }`}
            >
              {filter === 'semua' ? 'Semua' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Display */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white/40 border border-white/60 rounded-2xl p-12 text-center text-slate-400">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-35" />
          <p className="font-bold text-sm text-slate-600">Tidak ada pesanan ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan pencarian atau filter status Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((b) => (
            <motion.div
              layout
              key={b.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
            >
              {/* Status ribbon */}
              <div className="absolute right-4 top-4 flex items-center gap-1.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    b.status === 'menunggu'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                      : b.status === 'disetujui'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/50 animate-pulse'
                      : b.status === 'selesai'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                      : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                  }`}
                >
                  {b.status === 'menunggu'
                    ? 'Menunggu'
                    : b.status === 'disetujui'
                    ? 'Disetujui/Jalan'
                    : b.status === 'selesai'
                    ? 'Selesai'
                    : 'Batal'}
                </span>
              </div>

              <div>
                {/* Patient / Passenger name */}
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center font-bold text-xs uppercase text-slate-600">
                    {b.namaPasien.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight leading-none">
                      {b.namaPasien}
                    </h3>
                    {b.telepon ? (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 leading-none">
                        <Phone className="h-2.5 w-2.5" />
                        <span>{b.telepon}</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1 leading-none italic">Tidak ada telepon</p>
                    )}
                  </div>
                </div>

                {/* Timing */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50/50 border border-slate-100/50 rounded-xl p-2.5 my-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{b.tanggalPerjalanan}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-blue-700 font-bold bg-blue-50/60 px-1.5 py-0.5 rounded border border-blue-100/30">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    <span>{b.jamJemput} WIB</span>
                  </div>
                </div>

                {/* Locations map and target */}
                <div className="space-y-2 mt-2">
                  <div className="flex gap-2 text-xs">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <div className="w-[1px] flex-1 bg-slate-200 my-0.5"></div>
                    </div>
                    <div className="flex-1 text-slate-500 min-w-0">
                      <span className="font-bold text-[9px] text-blue-500 uppercase block tracking-wider leading-none">Penjemputan:</span>
                      <p className="truncate mt-0.5 font-medium">{b.alamatPenjemputan}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs">
                    <div className="flex flex-col items-center">
                      <MapPin className="h-3 w-3 text-red-500" />
                    </div>
                    <div className="flex-1 text-slate-800 min-w-0">
                      <span className="font-bold text-[9px] text-red-500 uppercase block tracking-wider leading-none">Tujuan:</span>
                      <p className="truncate mt-0.5 font-bold">{b.tujuan}</p>
                    </div>
                  </div>
                </div>

                {/* Keterangan */}
                {b.keterangan && (
                  <div className="mt-3 text-xs bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-slate-600">
                    <span className="font-bold text-[9px] text-slate-400 uppercase block mb-0.5">Catatan:</span>
                    {b.keterangan}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-4">
                <span className="text-[10px] text-slate-400">
                  Dipesan: {b.jamPemesanan || '--:--'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Edit Booking"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Booking"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {b.status === 'menunggu' && (
                    <button
                      onClick={() => openDispatchWizard(b)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                    >
                      <Compass className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                      <span>Berangkatkan</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Form Modal (Add/Edit) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-100 rounded-3xl w-full max-w-lg shadow-2xl border border-white/40 overflow-hidden"
            >
              <div className="px-6 py-4 bg-white/60 backdrop-blur-md border-b border-white/30 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800 font-display">
                  {editingBooking ? 'Edit Pesanan Booking' : 'Keberangkatan Baru / Booking'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
                {/* Patient Database Auto Selector */}
                {!editingBooking && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      PILIH DARI DATABASE PENGGUNA (opsional)
                    </label>
                    <select
                      value={patientId}
                      onChange={(e) => handlePatientSelect(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-sm"
                    >
                      <option value="">-- Pilih Pengguna Terdaftar (atau ketik manual dibawah) --</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nama} ({p.alamat})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Nama Pasien */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                    NAMA PASIEN / PENGGUNA <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ibu Rahma"
                    value={namaPasien}
                    onChange={(e) => setNamaPasien(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-sm"
                  />
                </div>

                {/* Telepon */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                    NOMOR TELEPON PASIEN / PENGGUNA
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Tanggal Perjalanan */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      TANGGAL PERJALANAN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={tanggalPerjalanan}
                      onChange={(e) => setTanggalPerjalanan(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-sm"
                    />
                  </div>

                  {/* Jam Depart */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      JAM BERANGKAT / JEMPUT PASIEN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={jamJemput}
                      onChange={(e) => setJamJemput(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-sm"
                    />
                  </div>
                </div>

                {/* Alamat Penjemputan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                    ALAMAT PENJEMPUTAN PASIEN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jl. Diponegoro No. 12, Sidoarjo"
                    value={alamatPenjemputan}
                    onChange={(e) => setAlamatPenjemputan(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-sm"
                  />
                </div>

                {/* Tujuan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                    RUMAH SAKIT / KLINIK / ALAMAT TUJUAN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: RSUD Dr. Soetomo (Unit Cuci Darah)"
                    value={tujuan}
                    onChange={(e) => setTujuan(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-sm"
                  />
                </div>

                {/* Status Booking */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                    STATUS BOOKING / PESANAN
                  </label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-sm font-bold"
                  >
                    <option value="menunggu">Menunggu Penjemputan</option>
                    <option value="disetujui">Disetujui / Jalan</option>
                    <option value="selesai">Selesai Diantar</option>
                    <option value="batal">Dibatalkan</option>
                  </select>
                </div>

                {/* Keterangan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                    CATATAN PERJALANAN (KEBUTUHAN KHUSUS / HAMBATAN)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Membawa kursi roda sendiri, kondisi sesak ringan..."
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-sm"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Pesanan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dispatch Ambulance Wizard Modal */}
      <AnimatePresence>
        {isDispatchModalOpen && dispatchTarget && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5 animate-pulse" />
                  <h2 className="text-base font-black font-display uppercase tracking-wider">
                    Dispatch Ambulance Lapangan
                  </h2>
                </div>
                <button
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="p-1 hover:bg-red-700 rounded-full transition-colors text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase">Pasien:</span>
                  <span className="text-slate-800 font-extrabold">{dispatchTarget.namaPasien}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase">Tujuan:</span>
                  <span className="text-slate-800 font-extrabold truncate max-w-[200px]">{dispatchTarget.tujuan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase">Jadwal Jemput:</span>
                  <span className="text-blue-600 font-extrabold">{dispatchTarget.tanggalPerjalanan} pada {dispatchTarget.jamJemput} WIB</span>
                </div>
              </div>

              <form onSubmit={handleDispatchSubmit} className="p-6 space-y-4">
                {/* Supir */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                    NAMA SUPIR YANG BERTUGAS <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Supir Budi"
                    value={supir}
                    onChange={(e) => setSupir(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/70 focus:bg-white focus:border-red-500 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner text-slate-800 font-medium"
                  />
                </div>

                {/* Pendamping */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                    NAMA PENDAMPING / MEDIS (opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Suster Lusi / Keluarga"
                    value={pendamping}
                    onChange={(e) => setPendamping(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/70 focus:bg-white focus:border-red-500 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner text-slate-800 font-medium"
                  />
                </div>

                {/* Odometer */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                    ODOMETER AWAL AMBULANCE (KM) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 124500"
                    value={kmSebelum}
                    onChange={(e) => setKmSebelum(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/70 focus:bg-white focus:border-red-500 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner text-slate-800 font-medium"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDispatchModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-1.5"
                  >
                    <Compass className="h-4 w-4 shrink-0" />
                    <span>{isSubmitting ? 'Memproses...' : 'Berangkatkan!'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
