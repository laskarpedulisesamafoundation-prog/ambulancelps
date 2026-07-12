import React, { useState } from 'react';
import { Trip, Patient } from '../types';
import { addTrip, updateTrip, deleteTrip, addExpense } from '../dbService';
import {
  Search,
  Plus,
  Compass,
  MapPin,
  Calendar,
  User,
  Gauge,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  X,
  Edit,
  Smile,
  Truck,
  FileText,
  Phone,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TripManagerProps {
  trips: Trip[];
  patients: Patient[];
}

export default function TripManager({ trips, patients }: TripManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [completingTrip, setCompletingTrip] = useState<Trip | null>(null);

  // Form states
  const [patientId, setPatientId] = useState('');
  const [namaPasien, setNamaPasien] = useState('');
  const [telepon, setTelepon] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [supir, setSupir] = useState('');
  const [pendamping, setPendamping] = useState('');
  const [kmSebelum, setKmSebelum] = useState<any>('');
  const [kmSesudah, setKmSesudah] = useState<any>('');
  const [status, setStatus] = useState<'dalam_perjalanan' | 'selesai' | 'batal'>('dalam_perjalanan');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Trip Associated Expense states
  const [addExpKategori, setAddExpKategori] = useState<'bensin' | 'tol' | 'makan' | 'servis_ambulance' | 'lainnya'>('bensin');
  const [addExpNominal, setAddExpNominal] = useState<any>('');
  const [addExpKeterangan, setAddExpKeterangan] = useState('');

  // Completion states
  const [finishKm, setFinishKm] = useState<any>('');
  const [finishCatatan, setFinishCatatan] = useState('');

  // Completion Associated Expense states
  const [finishExpKategori, setFinishExpKategori] = useState<'bensin' | 'tol' | 'makan' | 'servis_ambulance' | 'lainnya'>('bensin');
  const [finishExpNominal, setFinishExpNominal] = useState<any>('');
  const [finishExpKeterangan, setFinishExpKeterangan] = useState('');

  // Auto-fill patient name and phone from dropdown
  const handlePatientSelect = (id: string) => {
    setPatientId(id);
    if (id === 'custom') {
      setNamaPasien('');
      setTelepon('');
    } else {
      const selected = patients.find((p) => p.id === id);
      if (selected) {
        setNamaPasien(selected.nama);
        setTelepon(selected.telepon || '');
      }
    }
  };

  const filteredTrips = trips.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.namaPasien.toLowerCase().includes(term) ||
      t.tujuan.toLowerCase().includes(term) ||
      t.supir.toLowerCase().includes(term) ||
      (t.pendamping && t.pendamping.toLowerCase().includes(term))
    );
  });

  const openAddModal = () => {
    setEditingTrip(null);
    setPatientId('');
    setNamaPasien('');
    setTelepon('');
    setTujuan('');
    setTanggal(new Date().toISOString().split('T')[0]);
    setSupir('');
    setPendamping('');
    setKmSebelum('');
    setKmSesudah('');
    setStatus('dalam_perjalanan');
    setCatatan('');
    setAddExpKategori('bensin');
    setAddExpNominal('');
    setAddExpKeterangan('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Trip) => {
    setEditingTrip(t);
    setPatientId(t.patientId || 'custom');
    setNamaPasien(t.namaPasien);
    setTelepon(t.telepon || '');
    setTujuan(t.tujuan);
    setTanggal(t.tanggal);
    setSupir(t.supir);
    setPendamping(t.pendamping || '');
    setKmSebelum(t.kmSebelum);
    setKmSesudah(t.kmSesudah || '');
    setStatus(t.status);
    setCatatan(t.catatan || '');
    setIsModalOpen(true);
  };

  const openCompleteModal = (t: Trip) => {
    setCompletingTrip(t);
    setFinishKm(t.kmSesudah || t.kmSebelum + 10); // auto-suggestion
    setFinishCatatan(t.catatan || '');
    setFinishExpKategori('bensin');
    setFinishExpNominal('');
    setFinishExpKeterangan('');
    setIsCompleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPasien || !tujuan || !tanggal || !supir || kmSebelum === '') {
      alert('Mohon lengkapi semua field wajib!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientId: patientId === 'custom' ? '' : patientId,
        namaPasien,
        telepon,
        tujuan,
        tanggal,
        supir,
        pendamping,
        kmSebelum: Number(kmSebelum),
        kmSesudah: kmSesudah !== '' ? Number(kmSesudah) : undefined,
        status,
        catatan,
      };

      if (editingTrip) {
        await updateTrip(editingTrip.id, payload);
      } else {
        const createdTrip = await addTrip(payload);

        // Add expense if entered
        if (addExpNominal !== '' && Number(addExpNominal) > 0) {
          await addExpense({
            tripId: createdTrip.id,
            namaPasien: payload.namaPasien,
            kategori: addExpKategori,
            jumlah: Number(addExpNominal),
            keterangan: addExpKeterangan || `Pengeluaran ${addExpKategori} untuk perjalanan ke ${payload.tujuan}`,
            tanggal: payload.tanggal,
          });
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data perjalanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTrip || finishKm === '') return;

    if (Number(finishKm) < completingTrip.kmSebelum) {
      alert('Kilometer sesudah tidak boleh lebih kecil dari kilometer sebelum!');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTrip(completingTrip.id, {
        kmSesudah: Number(finishKm),
        status: 'selesai',
        catatan: finishCatatan,
      });

      // Add expense if entered during completion!
      if (finishExpNominal !== '' && Number(finishExpNominal) > 0) {
        await addExpense({
          tripId: completingTrip.id,
          namaPasien: completingTrip.namaPasien,
          kategori: finishExpKategori,
          jumlah: Number(finishExpNominal),
          keterangan: finishExpKeterangan || `Pengeluaran ${finishExpKategori} saat menyelesaikan perjalanan`,
          tanggal: completingTrip.tanggal,
        });
      }

      setIsCompleteModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui status perjalanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTrip = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin membatalkan perjalanan ambulance ini?')) {
      try {
        await updateTrip(id, { status: 'batal' });
      } catch (err) {
        console.error(err);
        alert('Gagal membatalkan perjalanan.');
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus permanen log perjalanan untuk "${name}"?`)) {
      try {
        await deleteTrip(id);
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus data.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">Log Perjalanan Ambulance</h1>
          <p className="text-sm text-slate-500">
            Catat dan monitor pergerakan ambulance, odometer awal/akhir, supir, serta tujuan darurat.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-200 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Berangkatkan Ambulance</span>
        </button>
      </div>

      {/* Stats Quick Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/50 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
            <Truck className="h-5 w-5 animate-bounce" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Dalam Perjalanan</div>
            <div className="text-xl font-black text-slate-800">
              {trips.filter((t) => t.status === 'dalam_perjalanan').length}
            </div>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Selesai Beroperasi</div>
            <div className="text-xl font-black text-slate-800">
              {trips.filter((t) => t.status === 'selesai').length}
            </div>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Batal</div>
            <div className="text-xl font-black text-slate-800">
              {trips.filter((t) => t.status === 'batal').length}
            </div>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center gap-3">
          <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total KM Tempuh</div>
            <div className="text-xl font-black text-slate-800">
              {trips
                .filter((t) => t.status === 'selesai' && t.kmSesudah)
                .reduce((acc, curr) => acc + ((curr.kmSesudah || 0) - curr.kmSebelum), 0)
                .toLocaleString('id-ID')}{' '}
              km
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-white/50 backdrop-blur-xl p-4 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama pasien, supir, tujuan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white/80 border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
          />
        </div>
        <div className="text-xs text-slate-500 font-bold">
          Total Log: <span className="text-blue-700 font-extrabold text-sm">{trips.length}</span> Perjalanan
        </div>
      </div>

      {/* Trips Table/List */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl p-12 text-center text-slate-500 shadow-xl shadow-slate-200/40">
          <Compass className="h-12 w-12 text-slate-300 mx-auto mb-3 animate-spin-slow" />
          <p className="font-semibold text-slate-800">Tidak ada log perjalanan ditemukan</p>
          <p className="text-sm text-slate-400 mt-1">Belum ada perjalanan, atau silakan buat log baru.</p>
        </div>
      ) : (
        <div className="bg-white/50 backdrop-blur-xl border border-white/50 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/30 border-b border-white/30 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Pasien & Tanggal</th>
                  <th className="px-6 py-4">Rute & Tujuan</th>
                  <th className="px-6 py-4">Supir & Pendamping</th>
                  <th className="px-6 py-4">Odometer (KM)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/25 text-sm">
                {filteredTrips.map((trip) => {
                  const distance = trip.kmSesudah ? trip.kmSesudah - trip.kmSebelum : null;

                  return (
                    <tr key={trip.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{trip.namaPasien}</div>
                        {trip.telepon && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{trip.telepon}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{trip.tanggal}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-1.5 max-w-[200px]">
                          <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <span className="text-slate-700 font-medium line-clamp-2">{trip.tujuan}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-800 font-medium flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" />
                          <span>{trip.supir}</span>
                        </div>
                        {trip.pendamping && (
                          <div className="text-xs text-slate-500 mt-0.5 pl-4">
                            Pendamping: {trip.pendamping}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span className="w-8 text-[10px] text-slate-400 font-sans uppercase">Awal:</span>
                            <span className="font-bold">{trip.kmSebelum.toLocaleString('id-ID')} km</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span className="w-8 text-[10px] text-slate-400 font-sans uppercase">Akhir:</span>
                            <span className="font-bold">
                              {trip.kmSesudah ? `${trip.kmSesudah.toLocaleString('id-ID')} km` : '—'}
                            </span>
                          </div>
                          {distance !== null && (
                            <div className="text-[10px] text-emerald-600 font-sans font-bold pl-9">
                              (+{distance} km)
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            trip.status === 'selesai'
                              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200/30'
                              : trip.status === 'batal'
                              ? 'bg-slate-500/10 text-slate-600 border-slate-200/30'
                              : 'bg-amber-500/10 text-amber-700 border-amber-200/30 animate-pulse'
                          }`}
                        >
                          {trip.status === 'selesai' ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              <span>Selesai</span>
                            </>
                          ) : trip.status === 'batal' ? (
                            <>
                              <XCircle className="h-3 w-3" />
                              <span>Batal</span>
                            </>
                          ) : (
                            <>
                              <Truck className="h-3 w-3" />
                              <span>Di Jalan</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {trip.status === 'dalam_perjalanan' && (
                            <>
                              <button
                                onClick={() => openCompleteModal(trip)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-1"
                                title="Selesaikan Perjalanan"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Tiba</span>
                              </button>
                              <button
                                onClick={() => handleCancelTrip(trip.id)}
                                className="p-1.5 border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50/50 rounded-lg transition-all"
                                title="Batalkan Perjalanan"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openEditModal(trip)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                            title="Edit Detail"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(trip.id, trip.namaPasien)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Hapus Log"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 max-w-lg w-full overflow-hidden relative z-55"
            >
              <div className="px-6 py-4 border-b border-white/40 flex justify-between items-center bg-white/30">
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  {editingTrip ? 'Edit Perjalanan Ambulance' : 'Keberangkatan Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-white/50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="space-y-4">
                  {/* Select Patient */}
                  {!editingTrip && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                        Pilih dari Database Pengguna <span className="text-slate-400">(Opsional)</span>
                      </label>
                      <select
                        value={patientId}
                        onChange={(e) => handlePatientSelect(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
                      >
                        <option value="">-- Pilih Pengguna Terdaftar (atau ketik manual dibawah) --</option>
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nama} ({p.alamat.substring(0, 30)}...)
                          </option>
                        ))}
                        <option value="custom">-- Ketik Nama Manual --</option>
                      </select>
                    </div>
                  )}

                  {/* Manual Patient Name */}
                  {(patientId === 'custom' || editingTrip || patientId === '') && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                        Nama Pasien / Pengguna <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={namaPasien}
                        onChange={(e) => setNamaPasien(e.target.value)}
                        placeholder="Contoh: Ibu Rahma"
                        className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
                      />
                    </div>
                  )}

                  {/* Passenger Phone Number */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Nomor Telepon Pasien / Pengguna {patientId === 'custom' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={patientId === 'custom'}
                      value={telepon}
                      onChange={(e) => setTelepon(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner font-semibold text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                        Tanggal Perjalanan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                        Odometer Berangkat (KM) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={kmSebelum}
                        onChange={(e) => setKmSebelum(e.target.value !== '' ? Number(e.target.value) : '')}
                        placeholder="Contoh: 124500"
                        className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all font-mono shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                        Nama Supir <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={supir}
                        onChange={(e) => setSupir(e.target.value)}
                        placeholder="Supir bertugas"
                        className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                        Nama Pendamping (Keluarga/Staff)
                      </label>
                      <input
                        type="text"
                        value={pendamping}
                        onChange={(e) => setPendamping(e.target.value)}
                        placeholder="Contoh: Tim Medis / Anak Pasien"
                        className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Rumah Sakit / Klinik / Alamat Tujuan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tujuan}
                      onChange={(e) => setTujuan(e.target.value)}
                      placeholder="Contoh: RSUD Dr. Soetomo (Unit Cuci Darah)"
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
                    />
                  </div>

                  {editingTrip && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                          Odometer Tiba (KM) <span className="text-slate-400">(Opsional)</span>
                        </label>
                        <input
                          type="number"
                          value={kmSesudah}
                          onChange={(e) => setKmSesudah(e.target.value !== '' ? Number(e.target.value) : '')}
                          placeholder="Contoh: 124550"
                          className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all font-mono shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                          Status Perjalanan
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as any)}
                          className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
                        >
                          <option value="dalam_perjalanan">Di Jalan / Aktif</option>
                          <option value="selesai">Selesai Beroperasi</option>
                          <option value="batal">Batal / Dibatalkan</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Catatan Perjalanan (Kebutuhan Khusus / Hambatan)
                    </label>
                    <textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Contoh: Macet di jalan tol, butuh pengisian tabung oksigen tambahan"
                      rows={2}
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all resize-none shadow-inner"
                    />
                  </div>

                  {/* Optional Associated Expense (only on Add Trip, not edit) */}
                  {!editingTrip && (
                    <div className="border-t border-slate-100 pt-3.5 space-y-3">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Catat Pengeluaran Perjalanan (Opsional)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                            Kategori Pengeluaran
                          </label>
                          <select
                            value={addExpKategori}
                            onChange={(e) => setAddExpKategori(e.target.value as any)}
                            className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner font-semibold text-slate-800"
                          >
                            <option value="bensin">Bahan Bakar (Bensin)</option>
                            <option value="tol">Biaya Jalan Tol</option>
                            <option value="makan">Konsumsi Crew/Supir</option>
                            <option value="servis_ambulance">Servis / Perawatan Ambulance</option>
                            <option value="lainnya">Lain-lain</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                            Nominal Pengeluaran (Rp)
                          </label>
                          <input
                            type="number"
                            value={addExpNominal}
                            onChange={(e) => setAddExpNominal(e.target.value !== '' ? Number(e.target.value) : '')}
                            placeholder="Contoh: 150000"
                            className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner font-semibold text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                          Keterangan Detail Pengeluaran
                        </label>
                        <input
                          type="text"
                          value={addExpKeterangan}
                          onChange={(e) => setAddExpKeterangan(e.target.value)}
                          placeholder="Contoh: Pembelian bensin Pertalite 15 liter"
                          className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/40 flex justify-end gap-3 bg-white/10 -mx-6 -mb-6 p-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-white/50 text-slate-600 bg-white/40 rounded-xl text-sm font-semibold hover:bg-white/80 transition-colors shadow-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perjalanan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Completion Modal ("Tiba / Selesai") */}
      <AnimatePresence>
        {isCompleteModalOpen && completingTrip && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 max-w-md w-full overflow-hidden relative z-55"
            >
              <div className="px-6 py-4 border-b border-white/40 flex justify-between items-center bg-white/30">
                <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-1.5 text-emerald-700">
                  <Truck className="h-5 w-5" />
                  <span>Ambulance Telah Tiba!</span>
                </h3>
                <button
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-white/50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
                <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl space-y-2 text-xs text-slate-600 border border-white/50 shadow-inner">
                  <p><strong>Pasien:</strong> {completingTrip.namaPasien}</p>
                  <p><strong>Tujuan:</strong> {completingTrip.tujuan}</p>
                  <p><strong>Odometer Awal:</strong> <span className="font-mono font-bold text-slate-700">{completingTrip.kmSebelum.toLocaleString('id-ID')} km</span></p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                    Odometer Saat Tiba (KM Akhir) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={finishKm}
                    onChange={(e) => setFinishKm(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all font-mono shadow-inner"
                    placeholder="Masukkan KM akhir"
                  />
                  {finishKm !== '' && Number(finishKm) >= completingTrip.kmSebelum && (
                    <p className="text-xs text-emerald-700 font-bold mt-1.5 pl-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      <span>Estimasi jarak tempuh: {Number(finishKm) - completingTrip.kmSebelum} km</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                    Catatan Kepulangan / Keterangan Tambahan
                  </label>
                  <textarea
                    value={finishCatatan}
                    onChange={(e) => setFinishCatatan(e.target.value)}
                    placeholder="Pasien aman sampai tujuan, terima kasih tim."
                    rows={2}
                    className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all resize-none shadow-inner"
                  />
                </div>

                {/* Optional Associated Expense on Trip Completion */}
                <div className="border-t border-slate-100 pt-3.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Catat Pengeluaran Perjalanan (Opsional)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                        Kategori Pengeluaran
                      </label>
                      <select
                        value={finishExpKategori}
                        onChange={(e) => setFinishExpKategori(e.target.value as any)}
                        className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner font-semibold text-slate-800"
                      >
                        <option value="bensin">Bahan Bakar (Bensin)</option>
                        <option value="tol">Biaya Jalan Tol</option>
                        <option value="makan">Konsumsi Crew/Supir</option>
                        <option value="servis_ambulance">Servis / Perawatan Ambulance</option>
                        <option value="lainnya">Lain-lain</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                        Nominal Pengeluaran (Rp)
                      </label>
                      <input
                        type="number"
                        value={finishExpNominal}
                        onChange={(e) => setFinishExpNominal(e.target.value !== '' ? Number(e.target.value) : '')}
                        placeholder="Contoh: 150000"
                        className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Keterangan Detail Pengeluaran
                    </label>
                    <input
                      type="text"
                      value={finishExpKeterangan}
                      onChange={(e) => setFinishExpKeterangan(e.target.value)}
                      placeholder="Contoh: Pembelian bensin Pertalite 15 liter"
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/40 flex justify-end gap-3 bg-white/10 -mx-6 -mb-6 p-6">
                  <button
                    type="button"
                    onClick={() => setIsCompleteModalOpen(false)}
                    className="px-4 py-2 border border-white/50 text-slate-600 bg-white/40 rounded-xl text-sm font-semibold hover:bg-white/80 transition-colors shadow-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || finishKm === ''}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Selesaikan & Log'}
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
