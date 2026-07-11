import React, { useState } from 'react';
import { Expense, Trip } from '../types';
import { addExpense, updateExpense, deleteExpense } from '../dbService';
import {
  Search,
  Plus,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  Trash2,
  Edit,
  X,
  CreditCard,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExpenseManagerProps {
  expenses: Expense[];
  trips: Trip[];
}

export default function ExpenseManager({ expenses, trips }: ExpenseManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form states
  const [tripId, setTripId] = useState('');
  const [kategori, setKategori] = useState<'bensin' | 'tol' | 'makan' | 'servis_ambulance' | 'lainnya'>('bensin');
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [keterangan, setKeterangan] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper for Indonesia currency format
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const filteredExpenses = expenses.filter((exp) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      exp.keterangan.toLowerCase().includes(term) ||
      (exp.namaPasien && exp.namaPasien.toLowerCase().includes(term)) ||
      exp.kategori.toLowerCase().includes(term);

    const matchCategory = categoryFilter === 'semua' || exp.kategori === categoryFilter;

    return matchSearch && matchCategory;
  });

  const totalAmount = filteredExpenses.reduce((acc, curr) => acc + curr.jumlah, 0);

  const openAddModal = () => {
    setEditingExpense(null);
    setTripId('');
    setKategori('bensin');
    setJumlah('');
    setKeterangan('');
    setTanggal(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setTripId(exp.tripId || '');
    setKategori(exp.kategori);
    setJumlah(exp.jumlah);
    setKeterangan(exp.keterangan);
    setTanggal(exp.tanggal);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kategori || jumlah === '' || !keterangan || !tanggal) {
      alert('Mohon lengkapi field wajib!');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find matching trip for passenger name cache
      let namaPasien = '';
      if (tripId) {
        const foundTrip = trips.find((t) => t.id === tripId);
        if (foundTrip) {
          namaPasien = foundTrip.namaPasien;
        }
      }

      const payload = {
        tripId: tripId || undefined,
        namaPasien: namaPasien || undefined,
        kategori,
        jumlah: Number(jumlah),
        keterangan,
        tanggal,
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
      } else {
        await addExpense(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pengeluaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, description: string) => {
    if (confirm(`Hapus permanen pengeluaran "${description}"?`)) {
      try {
        await deleteExpense(id);
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus data.');
      }
    }
  };

  const categoryLabels: Record<string, { label: string; color: string; bg: string }> = {
    bensin: { label: 'Bahan Bakar (Bensin)', color: 'text-amber-700', bg: 'bg-amber-500/10 border-amber-200/30' },
    tol: { label: 'Biaya Jalan Tol', color: 'text-blue-700', bg: 'bg-blue-500/10 border-blue-200/30' },
    makan: { label: 'Konsumsi Crew/Supir', color: 'text-emerald-700', bg: 'bg-emerald-500/10 border-emerald-200/30' },
    servis_ambulance: { label: 'Servis / Perawatan Ambulance', color: 'text-red-700', bg: 'bg-red-500/10 border-red-200/30' },
    lainnya: { label: 'Lain-lain', color: 'text-slate-700', bg: 'bg-slate-500/10 border-slate-200/30' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">Log Pengeluaran Operasional</h1>
          <p className="text-sm text-slate-500">
            Catat dan pantau pengeluaran biaya ambulance seperti bensin, tol, makan tim, dan perawatan mesin.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-200 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Input Pengeluaran</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/50 backdrop-blur-xl p-5 rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Sesuai Filter</div>
            <div className="text-2xl font-black text-slate-800 mt-1 font-display">
              {formatIDR(totalAmount)}
            </div>
          </div>
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-xl p-5 rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Khusus Bensin</div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {formatIDR(expenses.filter((e) => e.kategori === 'bensin').reduce((a, c) => a + c.jumlah, 0))}
            </div>
          </div>
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <Tag className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-xl p-5 rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Servis & Perawatan</div>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {formatIDR(expenses.filter((e) => e.kategori === 'servis_ambulance').reduce((a, c) => a + c.jumlah, 0))}
            </div>
          </div>
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="bg-white/50 backdrop-blur-xl p-4 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Cari berdasarkan keterangan, nama pasien..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white/80 border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setCategoryFilter('semua')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 transition-all border ${
              categoryFilter === 'semua'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                : 'bg-white/40 text-slate-600 border-white/50 hover:bg-white/80'
            }`}
          >
            Semua Kategori
          </button>
          {Object.entries(categoryLabels).map(([cat, info]) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 transition-all border ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                  : 'bg-white/40 text-slate-600 border-white/50 hover:bg-white/80'
              }`}
            >
              {info.label.split(' ')[0]} {/* short category label */}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table/List */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl p-12 text-center text-slate-500 shadow-xl shadow-slate-200/40">
          <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-3 animate-spin-slow" />
          <p className="font-semibold text-slate-800">Tidak ada data pengeluaran ditemukan</p>
          <p className="text-sm text-slate-400 mt-1">Gunakan tombol "Input Pengeluaran" untuk memasukkan catatan biaya baru.</p>
        </div>
      ) : (
        <div className="bg-white/50 backdrop-blur-xl border border-white/50 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/30 border-b border-white/30 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Keterangan & Tanggal</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Koneksi Perjalanan (Pasien)</th>
                  <th className="px-6 py-4 text-right">Jumlah (Rupiah)</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/25 text-sm">
                {filteredExpenses.map((exp) => {
                  const catInfo = categoryLabels[exp.kategori] || categoryLabels['lainnya'];
                  return (
                    <tr key={exp.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{exp.keterangan}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{exp.tanggal}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${catInfo.bg} ${catInfo.color}`}
                        >
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {exp.tripId ? (
                          <div className="text-slate-700 font-medium">
                            {exp.namaPasien || 'Detail Perjalanan'}
                            <div className="text-[10px] text-red-500 font-semibold uppercase mt-0.5 tracking-wider">
                              Tautan Perjalanan Active
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Pengeluaran Umum (Tidak Ditautkan)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 text-base">
                        {formatIDR(exp.jumlah)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEditModal(exp)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp.id, exp.keterangan)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Hapus"
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
                  {editingExpense ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-white/50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Kategori Pengeluaran <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner font-bold text-slate-800"
                    >
                      <option value="bensin">Bahan Bakar (Bensin)</option>
                      <option value="tol">Biaya Jalan Tol</option>
                      <option value="makan">Konsumsi Crew/Supir</option>
                      <option value="servis_ambulance">Servis / Perawatan Ambulance</option>
                      <option value="lainnya">Lain-lain / Operasional Lain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Jumlah Biaya (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={jumlah}
                      onChange={(e) => setJumlah(e.target.value !== '' ? Number(e.target.value) : '')}
                      placeholder="Contoh: 150000"
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all font-mono font-bold shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Tanggal Pembayaran <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all font-semibold text-slate-800 shadow-inner"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Tautkan ke Log Perjalanan <span className="text-slate-400">(Opsional)</span>
                    </label>
                    <select
                      value={tripId}
                      onChange={(e) => setTripId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner text-slate-800"
                    >
                      <option value="">-- Tidak Ditautkan / Pengeluaran Umum --</option>
                      {trips.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.namaPasien} - {t.tujuan} ({t.tanggal})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Keterangan Detail Pengeluaran <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      placeholder="Contoh: Isi Pertalite 15 Liter untuk perjalanan membawa Bpk Joko ke RSUD"
                      rows={2.5}
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
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
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
