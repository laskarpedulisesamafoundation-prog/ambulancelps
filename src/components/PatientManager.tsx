import React, { useState } from 'react';
import { Patient } from '../types';
import { addPatient, updatePatient, deletePatient } from '../dbService';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  User,
  Phone,
  MapPin,
  Heart,
  AlertTriangle,
  X,
  ClipboardList,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PatientManagerProps {
  patients: Patient[];
}

export default function PatientManager({ patients }: PatientManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Form states
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [alamat, setAlamat] = useState('');
  const [telepon, setTelepon] = useState('');
  const [kontakDarurat, setKontakDarurat] = useState('');
  const [kategoriStatus, setKategoriStatus] = useState('Sangat Kurang Mampu');
  const [catatanMedis, setCatatanMedis] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter
  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.nama.toLowerCase().includes(term) ||
      p.alamat.toLowerCase().includes(term) ||
      p.telepon.includes(term) ||
      (p.nik && p.nik.includes(term))
    );
  });

  const openAddModal = () => {
    setEditingPatient(null);
    setNama('');
    setNik('');
    setAlamat('');
    setTelepon('');
    setKontakDarurat('');
    setKategoriStatus('Sangat Kurang Mampu');
    setCatatanMedis('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Patient) => {
    setEditingPatient(p);
    setNama(p.nama);
    setNik(p.nik || '');
    setAlamat(p.alamat);
    setTelepon(p.telepon);
    setKontakDarurat(p.kontakDarurat || '');
    setKategoriStatus(p.kategoriStatus);
    setCatatanMedis(p.catatanMedis || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !alamat || !telepon) {
      alert('Mohon isi field wajib (Nama, Alamat, Telepon)');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nama,
        nik,
        alamat,
        telepon,
        kontakDarurat,
        kategoriStatus,
        catatanMedis,
      };

      if (editingPatient) {
        await updatePatient(editingPatient.id, payload);
      } else {
        await addPatient(payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('Gagal menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data pengguna "${name}"?`)) {
      try {
        await deletePatient(id);
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Gagal menghapus data.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Database Pengguna (Pasien)</h1>
          <p className="text-sm text-slate-500">
            Kelola data masyarakat penerima manfaat layanan ambulance gratis Yayasan Laskar Peduli Sesama.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-red-100 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-white/50 backdrop-blur-xl p-4 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, alamat, telepon, atau NIK..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white/80 border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
          />
        </div>
        <div className="text-xs text-slate-500 font-bold">
          Total Terdaftar: <span className="text-blue-700 font-extrabold text-sm">{patients.length}</span> Pengguna
        </div>
      </div>

      {/* Desktop Grid / List */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl p-12 text-center text-slate-500 shadow-xl shadow-slate-200/40">
          <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-800">Tidak ada data pengguna ditemukan</p>
          <p className="text-sm text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian Anda atau tambah pengguna baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <motion.div
              key={patient.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white/50 backdrop-blur-xl border border-white/50 rounded-3xl p-5 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all relative flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                      patient.kategoriStatus === 'Sangat Kurang Mampu'
                        ? 'bg-red-500/10 text-red-700 border-red-200/30'
                        : patient.kategoriStatus === 'Kurang Mampu'
                        ? 'bg-amber-500/10 text-amber-700 border-amber-200/30'
                        : 'bg-blue-500/10 text-blue-700 border-blue-200/30'
                    }`}
                  >
                    {patient.kategoriStatus}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(patient)}
                      className="p-1.5 hover:bg-white/60 text-slate-500 hover:text-slate-800 rounded-lg transition-colors border border-transparent hover:border-white/50"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(patient.id, patient.nama)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 line-clamp-1 font-display">{patient.nama}</h3>
                {patient.nik && (
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">NIK: {patient.nik}</p>
                )}

                <div className="space-y-2.5 mt-4 text-xs text-slate-600 border-t border-white/30 pt-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{patient.alamat}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{patient.telepon}</span>
                  </div>
                  {patient.kontakDarurat && (
                    <div className="flex items-center gap-2 text-slate-600 bg-white/40 p-1.5 rounded-xl border border-white/50">
                      <Heart className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span className="truncate">Darurat: {patient.kontakDarurat}</span>
                    </div>
                  )}
                </div>
              </div>

              {patient.catatanMedis && (
                <div className="mt-4 pt-3 border-t border-white/30 text-[11px] text-slate-500">
                  <div className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                    <span>Catatan Medis:</span>
                  </div>
                  <p className="line-clamp-2 bg-white/40 border border-white/50 p-2 rounded-xl italic">
                    "{patient.catatanMedis}"
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
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
                  {editingPatient ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-white/50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Nama Lengkap Pasien <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Nomor NIK (KTP/KK)
                    </label>
                    <input
                      type="text"
                      value={nik}
                      onChange={(e) => setNik(e.target.value)}
                      placeholder="16-digit nomor induk"
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      No. Telepon / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={telepon}
                      onChange={(e) => setTelepon(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Kategori Status Sosial <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={kategoriStatus}
                      onChange={(e) => setKategoriStatus(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
                    >
                      <option value="Sangat Kurang Mampu">Sangat Kurang Mampu (Duafa Ekstrem)</option>
                      <option value="Kurang Mampu">Kurang Mampu (Prasejahtera)</option>
                      <option value="Yatim / Piatu">Yatim / Piatu</option>
                      <option value="Lainnya">Lainnya / Umum Sosial</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Alamat Rumah Lengkap <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      placeholder="Jalan, RT/RW, Dusun, Kelurahan, Kecamatan, Kota/Kabupaten"
                      rows={2}
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all resize-none shadow-inner"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Kontak Darurat (Nama, Hubungan, Telepon)
                    </label>
                    <input
                      type="text"
                      value={kontakDarurat}
                      onChange={(e) => setKontakDarurat(e.target.value)}
                      placeholder="Contoh: Ibu Siti (Istri) - 08129876543"
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Catatan Medis / Keterangan Kondisi
                    </label>
                    <textarea
                      value={catatanMedis}
                      onChange={(e) => setCatatanMedis(e.target.value)}
                      placeholder="Contoh: Pasien Stroke, butuh tabung oksigen selama perjalanan, kontrol rutin ginjal"
                      rows={2}
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all resize-none shadow-inner"
                    />
                  </div>
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
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
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
