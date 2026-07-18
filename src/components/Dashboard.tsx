import React, { useState } from 'react';
import { Patient, Trip, Expense, Booking } from '../types';
import { addTrip, addExpense, updateBooking } from '../dbService';
import {
  HeartHandshake,
  Truck,
  Compass,
  DollarSign,
  Plus,
  Users,
  Activity,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Calendar,
  Phone,
  Tag,
  FileText,
  Trash2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'motion/react';

function StaffDashboard({ patients, bookings = [] }: { patients: Patient[]; bookings?: Booking[] }) {
  const [patientId, setPatientId] = useState('');
  const [namaPasien, setNamaPasien] = useState('');
  const [telepon, setTelepon] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jamBerangkat, setJamBerangkat] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const [supir, setSupir] = useState('');
  const [pendamping, setPendamping] = useState('');
  const [kmSebelum, setKmSebelum] = useState<any>('');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // Selected Booking state for autofill
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const handleSelectBooking = (b: Booking) => {
    setSelectedBookingId(b.id || null);
    setStaffTab('perjalanan');
    
    if (b.patientId) {
      setPatientId(b.patientId);
    } else {
      setPatientId('custom');
    }
    setNamaPasien(b.namaPasien);
    setTelepon(b.telepon || '');
    setTujuan(b.tujuan);
    setTanggal(b.tanggalPerjalanan);
    setJamBerangkat(b.jamJemput);
    
    const pickupDetail = `Alamat Penjemputan: ${b.alamatPenjemputan}`;
    const orderDetail = b.namaPemesan ? `Pemesan: ${b.namaPemesan} (${b.hubunganPasien || '-'})` : '';
    const noteDetail = b.keterangan ? `Catatan Booking: ${b.keterangan}` : '';
    const combinedNotes = [pickupDetail, orderDetail, noteDetail].filter(Boolean).join('\n');
    setCatatan(combinedNotes);
  };

  const handleClearSelectedBooking = () => {
    setSelectedBookingId(null);
    setPatientId('');
    setNamaPasien('');
    setTelepon('');
    setTujuan('');
    setTanggal(new Date().toISOString().split('T')[0]);
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setJamBerangkat(`${hours}:${minutes}`);
    setCatatan('');
  };

  // Active tab inside Staff Dashboard:
  // 'perjalanan' (ambulance trip registration + optional expenses list with Add/Remove)
  // 'mandiri' (standalone expenses registration without patient/trip + optional expenses list with Add/Remove)
  const [staffTab, setStaffTab] = useState<'perjalanan' | 'mandiri'>('perjalanan');

  // Dynamic expenses for trip-associated form
  const [tripExpenses, setTripExpenses] = useState<Array<{ kategori: 'bensin' | 'tol' | 'makan' | 'servis_ambulance' | 'lainnya'; jumlah: any; keterangan: string }>>([]);

  // Standalone expenses states
  const [standaloneTanggal, setStandaloneTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [standaloneExpenses, setStandaloneExpenses] = useState<Array<{ kategori: 'bensin' | 'tol' | 'makan' | 'servis_ambulance' | 'lainnya'; jumlah: any; keterangan: string }>>([
    { kategori: 'bensin', jumlah: '', keterangan: '' }
  ]);

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

  const handleAddTripExpense = () => {
    setTripExpenses([...tripExpenses, { kategori: 'bensin', jumlah: '', keterangan: '' }]);
  };

  const handleRemoveTripExpense = (index: number) => {
    setTripExpenses(tripExpenses.filter((_, i) => i !== index));
  };

  const handleTripExpenseChange = (index: number, field: string, value: any) => {
    const updated = [...tripExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setTripExpenses(updated);
  };

  const handleAddStandaloneExpense = () => {
    setStandaloneExpenses([...standaloneExpenses, { kategori: 'bensin', jumlah: '', keterangan: '' }]);
  };

  const handleRemoveStandaloneExpense = (index: number) => {
    setStandaloneExpenses(standaloneExpenses.filter((_, i) => i !== index));
  };

  const handleStandaloneExpenseChange = (index: number, field: string, value: any) => {
    const updated = [...standaloneExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setStandaloneExpenses(updated);
  };

  const handleSubmitTrip = async (e: React.FormEvent) => {
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
        status: 'dalam_perjalanan' as const,
        catatan,
        jamBerangkat,
      };

      const createdTrip = await addTrip(payload);

      // If a booking is selected, update its status to 'selesai'
      if (selectedBookingId) {
        await updateBooking(selectedBookingId, { status: 'selesai' });
        setSelectedBookingId(null);
      }

      // Save trip-associated expenses
      let savedCount = 0;
      for (const exp of tripExpenses) {
        if (exp.jumlah !== '' && Number(exp.jumlah) > 0) {
          await addExpense({
            tripId: createdTrip.id,
            namaPasien: payload.namaPasien,
            kategori: exp.kategori,
            jumlah: Number(exp.jumlah),
            keterangan: exp.keterangan || `Pengeluaran ${exp.kategori} untuk perjalanan ke ${payload.tujuan}`,
            tanggal: payload.tanggal,
          });
          savedCount++;
        }
      }

      setSuccessData({
        type: 'perjalanan',
        namaPasien: payload.namaPasien,
        tujuan: payload.tujuan,
        supir: payload.supir,
        kmSebelum: payload.kmSebelum,
        expenseCount: savedCount,
      });
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat keberangkatan ambulance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitStandalone = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter to valid expenses (having positive amounts)
    const validExpenses = standaloneExpenses.filter((exp) => exp.jumlah !== '' && Number(exp.jumlah) > 0);
    if (validExpenses.length === 0) {
      alert('Mohon masukkan minimal satu pengeluaran dengan nominal di atas Rp 0!');
      return;
    }

    // Validate descriptions for standalone
    const hasEmptyDesc = validExpenses.some(exp => !exp.keterangan || exp.keterangan.trim() === '');
    if (hasEmptyDesc) {
      alert('Mohon isi keterangan detail untuk setiap pengeluaran!');
      return;
    }

    setIsSubmitting(true);
    try {
      for (const exp of validExpenses) {
        await addExpense({
          kategori: exp.kategori,
          jumlah: Number(exp.jumlah),
          keterangan: exp.keterangan,
          tanggal: standaloneTanggal,
          namaPasien: 'Operasional Mandiri', // standalone indicator
        });
      }

      setSuccessData({
        type: 'mandiri',
        tanggal: standaloneTanggal,
        expenseCount: validExpenses.length,
        totalAmount: validExpenses.reduce((sum, item) => sum + Number(item.jumlah), 0),
      });
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pengeluaran mandiri.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setPatientId('');
    setNamaPasien('');
    setTelepon('');
    setTujuan('');
    setTanggal(new Date().toISOString().split('T')[0]);
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setJamBerangkat(`${hours}:${minutes}`);
    setSupir('');
    setPendamping('');
    setKmSebelum('');
    setCatatan('');
    setTripExpenses([]);
    setStandaloneExpenses([{ kategori: 'bensin', jumlah: '', keterangan: '' }]);
    setStandaloneTanggal(new Date().toISOString().split('T')[0]);
    setSelectedBookingId(null);
    setSuccessData(null);
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  if (successData) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mt-4 p-6 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle className="h-10 w-10" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800 font-display">
            {successData.type === 'perjalanan' ? 'Keberangkatan Berhasil Dicatat!' : 'Pengeluaran Berhasil Dicatat!'}
          </h2>
          <p className="text-xs text-slate-400">
            {successData.type === 'perjalanan'
              ? 'Ambulance sedang aktif dalam operasional perjalanan.'
              : 'Data pengeluaran operasional mandiri telah disimpan ke sistem.'}
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3 border border-slate-100 text-sm">
          {successData.type === 'perjalanan' ? (
            <>
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Pasien</span>
                <span className="font-bold text-slate-700">{successData.namaPasien}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Tujuan</span>
                <span className="font-bold text-slate-700 text-right max-w-[200px] truncate">{successData.tujuan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Supir / Driver</span>
                <span className="font-bold text-slate-700">{successData.supir}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Odometer Awal</span>
                <span className="font-mono font-bold text-slate-700">{Number(successData.kmSebelum).toLocaleString('id-ID')} KM</span>
              </div>
              {successData.expenseCount > 0 && (
                <div className="flex justify-between border-t border-slate-100 pt-2 mt-1">
                  <span className="text-slate-400 text-xs">Pengeluaran Dicatat</span>
                  <span className="font-bold text-emerald-600">{successData.expenseCount} Item</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Tanggal Log</span>
                <span className="font-bold text-slate-700">{successData.tanggal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Jumlah Pengeluaran</span>
                <span className="font-bold text-slate-700">{successData.expenseCount} Item</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 mt-1">
                <span className="text-slate-400 text-xs">Total Nominal</span>
                <span className="font-mono font-bold text-red-600">{formatIDR(successData.totalAmount)}</span>
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleReset}
          className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-red-100"
        >
          {successData.type === 'perjalanan' ? 'Catat Keberangkatan Lain' : 'Catat Pengeluaran Lain'}
        </button>
      </div>
    );
  }

  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  const todayBookings = bookings.filter(
    (b) => b.tanggalPerjalanan === todayStr && (b.status === 'menunggu' || b.status === 'disetujui')
  );

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Jadwal Pengantaran Hari Ini */}
      {todayBookings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider font-display flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Jadwal Pengantaran Hari Ini
            </h2>
            <span className="text-xs bg-indigo-50 text-indigo-600 font-extrabold px-2.5 py-1 rounded-full border border-indigo-100">
              {todayBookings.length} Pesanan
            </span>
          </div>

          <div className="space-y-2.5">
            {todayBookings.map((b) => {
              const isSelected = selectedBookingId === b.id;
              return (
                <motion.div
                  key={b.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectBooking(b)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-300 shadow-md shadow-indigo-100/50'
                      : 'bg-white border-slate-100 hover:border-slate-200 shadow-md shadow-slate-100/40'
                  }`}
                >
                  {/* Accent decor line */}
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-indigo-500" />

                  <div className="pl-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 leading-none">
                        {b.namaPasien}
                      </h3>
                      <div className="flex items-center gap-2">
                        {b.telepon && (
                          <a
                            href={`tel:${b.telepon}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                            title="Hubungi Pasien"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-md leading-none">
                          {b.jamJemput} WIB
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 space-y-1 text-xs text-slate-500">
                      <div className="flex items-start gap-1.5">
                        <span className="font-semibold text-slate-400 min-w-[50px] text-[10px] uppercase mt-0.5">Jemput:</span>
                        <span className="text-slate-600 font-medium line-clamp-1">{b.alamatPenjemputan}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="font-semibold text-slate-400 min-w-[50px] text-[10px] uppercase mt-0.5">Tujuan:</span>
                        <span className="text-slate-700 font-bold line-clamp-1">{b.tujuan}</span>
                      </div>
                      {b.namaPemesan && (
                        <div className="flex items-center gap-1.5 text-[10px] text-indigo-500 font-semibold mt-1">
                          <span>Pemesan: {b.namaPemesan} {b.hubunganPasien ? `(${b.hubunganPasien})` : ''}</span>
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <div className="mt-3 flex items-center justify-between bg-indigo-100/50 -mx-4 -mb-4 px-4 py-2 border-t border-indigo-200/40">
                        <span className="text-[10px] font-bold text-indigo-700">✓ Booking Terpilih</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearSelectedBooking();
                          }}
                          className="text-[10px] font-extrabold text-red-600 hover:text-red-700 px-2 py-1 bg-white border border-red-200/50 rounded-lg shadow-sm"
                        >
                          Batal Pilih
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Header card with dual tabs */}
      <div className="bg-red-600 text-white p-5 rounded-3xl shadow-lg shadow-red-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display leading-none">Operasional Relawan LPS</h1>
            <p className="text-[10px] text-red-100 font-medium mt-1">Sistem Pelaporan Ambulans & Pengeluaran</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setStaffTab('perjalanan')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              staffTab === 'perjalanan'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-white hover:text-red-100'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Perjalanan</span>
          </button>
          <button
            type="button"
            onClick={() => setStaffTab('mandiri')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              staffTab === 'mandiri'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-white hover:text-red-100'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Pengeluaran Mandiri</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-5">
        {staffTab === 'perjalanan' ? (
          <form onSubmit={handleSubmitTrip} className="space-y-4">
            {selectedBookingId && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3.5 mb-2 flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-indigo-800">Mengisi Data Booking Aktif</p>
                    <button
                      type="button"
                      onClick={handleClearSelectedBooking}
                      className="text-[10px] font-black text-red-600 hover:text-red-700 underline"
                    >
                      Batal Pilih
                    </button>
                  </div>
                  <p className="text-[10px] text-indigo-600 leading-normal">
                    Formulir telah diisi otomatis. Silakan lengkapi odometer awal, supir, dan pengeluaran tambahan jika ada.
                  </p>
                </div>
              </div>
            )}
            {/* Choose Patient dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                Pilih dari Database Pengguna <span className="text-slate-400 lowercase font-normal">(opsional)</span>
              </label>
              <select
                value={patientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 focus:border-red-500 focus:bg-white rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner font-medium text-slate-700"
              >
                <option value="">-- Pilih Pengguna Terdaftar --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.alamat.substring(0, 20)}...)
                  </option>
                ))}
                <option value="custom">-- Ketik Nama Manual --</option>
              </select>
            </div>

            {/* Manual Patient Name if custom or empty */}
            {(patientId === 'custom' || patientId === '') && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                  Nama Pasien / Pengguna <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaPasien}
                  onChange={(e) => setNamaPasien(e.target.value)}
                  placeholder="Contoh: Ibu Rahma"
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 focus:border-red-500 focus:bg-white rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner text-slate-800"
                />
              </div>
            )}

            {/* Patient Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                Nomor Telepon Pasien / Pengguna {patientId === 'custom' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                required={patientId === 'custom'}
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 focus:border-red-500 focus:bg-white rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner text-slate-800"
              />
            </div>

            {/* Tanggal Perjalanan */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                Tanggal Perjalanan <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 focus:border-red-500 focus:bg-white rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner text-slate-800"
              />
            </div>

            {/* Jam Berangkat / Jemput Pasien */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                Jam Berangkat / Jemput Pasien <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={jamBerangkat}
                onChange={(e) => setJamBerangkat(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 focus:border-red-500 focus:bg-white rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner text-slate-800"
              />
            </div>

            {/* Odometer Berangkat */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                Odometer Berangkat (KM) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={kmSebelum}
                onChange={(e) => setKmSebelum(e.target.value !== '' ? Number(e.target.value) : '')}
                placeholder="Contoh: 124500"
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 focus:border-red-500 focus:bg-white rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner font-mono text-slate-800"
              />
            </div>

            {/* Nama Supir */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                Nama Supir <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={supir}
                onChange={(e) => setSupir(e.target.value)}
                placeholder="Supir bertugas"
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 focus:border-red-500 focus:bg-white rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner text-slate-800"
              />
            </div>

            {/* Nama Pendamping */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                Nama Pendamping <span className="text-slate-400 lowercase font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={pendamping}
                onChange={(e) => setPendamping(e.target.value)}
                placeholder="Keluarga atau Staff Medis"
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 focus:border-red-500 focus:bg-white rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner text-slate-800"
              />
            </div>

            {/* RS / Klinik / Alamat Tujuan */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                Rumah Sakit / Klinik / Alamat Tujuan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={tujuan}
                onChange={(e) => setTujuan(e.target.value)}
                placeholder="Contoh: RSUD Dr. Soetomo"
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 focus:border-red-500 focus:bg-white rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner text-slate-800"
              />
            </div>

            {/* Catatan Perjalanan */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                Catatan Khusus <span className="text-slate-400 lowercase font-normal">(opsional)</span>
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Perlu tabung oksigen tambahan"
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 focus:border-red-500 focus:bg-white rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner text-slate-800"
              />
            </div>

            {/* Dynamic Associated Expenses List with "Tambah +" */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Catat Pengeluaran (Opsional)</h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddTripExpense}
                  className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                >
                  <Plus className="h-3 w-3" />
                  <span>Tambah +</span>
                </button>
              </div>

              {tripExpenses.length === 0 ? (
                <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-medium">Belum ada pengeluaran tambahan.</p>
                  <button
                    type="button"
                    onClick={handleAddTripExpense}
                    className="text-xs text-red-500 hover:text-red-600 font-bold mt-1 inline-flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Klik untuk menambahkan
                  </button>
                </div>
              ) : (
                <div className="space-y-4 bg-slate-50/50 rounded-2xl p-3 border border-slate-100">
                  {tripExpenses.map((exp, index) => (
                    <div key={index} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm relative space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pengeluaran #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTripExpense(index)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-slate-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Kategori</label>
                          <select
                            value={exp.kategori}
                            onChange={(e) => handleTripExpenseChange(index, 'kategori', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500/10 text-slate-700 font-semibold"
                          >
                            <option value="bensin">Bensin / Solar</option>
                            <option value="tol">Jalan Tol</option>
                            <option value="makan">Makan / Konsumsi</option>
                            <option value="servis_ambulance">Servis Ambulans</option>
                            <option value="lainnya">Lain-lain</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Nominal (Rp)</label>
                          <input
                            type="number"
                            required
                            placeholder="150000"
                            value={exp.jumlah}
                            onChange={(e) => handleTripExpenseChange(index, 'jumlah', e.target.value !== '' ? Number(e.target.value) : '')}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500/10 text-slate-800 font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Keterangan</label>
                        <input
                          type="text"
                          placeholder="cth: Isi Pertalite 15 liter"
                          value={exp.keterangan}
                          onChange={(e) => handleTripExpenseChange(index, 'keterangan', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500/10 text-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button for Trip */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2 ${
                isSubmitting ? 'opacity-85 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Truck className="h-5 w-5" />
                  <span>Berangkatkan Ambulance</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Standalone Expenses form (no patient name required!) */
          <form onSubmit={handleSubmitStandalone} className="space-y-4">
            {/* Tanggal Pengeluaran */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                Tanggal Pengeluaran <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={standaloneTanggal}
                onChange={(e) => setStandaloneTanggal(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 focus:border-red-500 focus:bg-white rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner text-slate-800"
              />
            </div>

            {/* Dynamic List of Standalone Expenses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Daftar Pengeluaran Mandiri</h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddStandaloneExpense}
                  className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                >
                  <Plus className="h-3 w-3" />
                  <span>Tambah +</span>
                </button>
              </div>

              <div className="space-y-4 bg-slate-50/50 rounded-2xl p-3 border border-slate-100">
                {standaloneExpenses.map((exp, index) => (
                  <div key={index} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm relative space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pengeluaran #{index + 1}</span>
                      {standaloneExpenses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStandaloneExpense(index)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-slate-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Kategori <span className="text-red-500">*</span></label>
                        <select
                          value={exp.kategori}
                          onChange={(e) => handleStandaloneExpenseChange(index, 'kategori', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500/10 text-slate-700 font-semibold"
                        >
                          <option value="bensin">Bensin / Solar</option>
                          <option value="tol">Jalan Tol</option>
                          <option value="makan">Makan / Konsumsi</option>
                          <option value="servis_ambulance">Servis Ambulans</option>
                          <option value="lainnya">Lain-lain</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Nominal (Rp) <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          required
                          placeholder="150000"
                          value={exp.jumlah}
                          onChange={(e) => handleStandaloneExpenseChange(index, 'jumlah', e.target.value !== '' ? Number(e.target.value) : '')}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500/10 text-slate-800 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Keterangan <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="cth: Pembelian bensin Pertalite di luar perjalanan pasien"
                        value={exp.keterangan}
                        onChange={(e) => handleStandaloneExpenseChange(index, 'keterangan', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500/10 text-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button for Standalone */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2 ${
                isSubmitting ? 'opacity-85 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <DollarSign className="h-5 w-5" />
                  <span>Catat Pengeluaran Mandiri</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

interface DashboardProps {
  patients: Patient[];
  trips: Trip[];
  expenses: Expense[];
  bookings?: Booking[];
  onNavigate: (tab: 'patients' | 'bookings' | 'trips' | 'expenses') => void;
  userRole?: string;
}

export default function Dashboard({ patients, trips, expenses, bookings = [], onNavigate, userRole }: DashboardProps) {
  if (userRole === 'staff') {
    return <StaffDashboard patients={patients} bookings={bookings} />;
  }

  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Filter collections based on selectedPeriod (specifically for manager and other non-staff roles)
  const filteredPatients = selectedPeriod === 'all' 
    ? patients 
    : patients.filter(p => p.createdAt && p.createdAt.substring(0, 7) === selectedPeriod);

  const filteredTrips = selectedPeriod === 'all'
    ? trips
    : trips.filter(t => t.tanggal && t.tanggal.substring(0, 7) === selectedPeriod);

  const filteredExpenses = selectedPeriod === 'all'
    ? expenses
    : expenses.filter(e => e.tanggal && e.tanggal.substring(0, 7) === selectedPeriod);

  const filteredBookings = selectedPeriod === 'all'
    ? bookings
    : bookings.filter(b => b.tanggalPerjalanan && b.tanggalPerjalanan.substring(0, 7) === selectedPeriod);

  // 1. Calculate general stats
  const totalPatients = filteredPatients.length;
  const activeTripsCount = filteredTrips.filter((t) => t.status === 'dalam_perjalanan').length;
  const bookingsPendingCount = filteredBookings.filter((b) => b.status === 'menunggu').length;

  const totalKm = filteredTrips
    .filter((t) => t.status === 'selesai' && t.kmSesudah)
    .reduce((acc, curr) => acc + ((curr.kmSesudah || 0) - curr.kmSebelum), 0);

  const totalExpenseAmount = filteredExpenses.reduce((acc, curr) => acc + curr.jumlah, 0);

  // Helper for IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // 2. Prepare charts data: Expense by Category
  const expenseCategories = {
    bensin: { label: 'Bensin', value: 0, color: '#f59e0b' },
    tol: { label: 'Tol', value: 0, color: '#3b82f6' },
    makan: { label: 'Crew/Makan', value: 0, color: '#10b981' },
    servis_ambulance: { label: 'Servis', value: 0, color: '#ef4444' },
    lainnya: { label: 'Lainnya', value: 0, color: '#64748b' },
  };

  filteredExpenses.forEach((e) => {
    if (expenseCategories[e.kategori]) {
      expenseCategories[e.kategori].value += e.jumlah;
    } else {
      expenseCategories.lainnya.value += e.jumlah;
    }
  });

  const pieData = Object.entries(expenseCategories)
    .map(([key, item]) => ({
      name: item.label,
      value: item.value,
      color: item.color,
    }))
    .filter((d) => d.value > 0);

  // 3. Prepare charts data: Recent trips distance or volume by date
  // Let's summarize distance for completed trips by date (grouped)
  const distanceByDateMap: Record<string, number> = {};
  filteredTrips
    .filter((t) => t.status === 'selesai' && t.kmSesudah)
    .forEach((t) => {
      const dist = (t.kmSesudah || 0) - t.kmSebelum;
      distanceByDateMap[t.tanggal] = (distanceByDateMap[t.tanggal] || 0) + dist;
    });

  const distanceChartData = Object.entries(distanceByDateMap)
    .map(([date, value]) => ({
      date: date.substring(5), // MM-DD for cleaner X axis
      jarak: value,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7); // Last 7 days with entries

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#64748b'];

  // 4. Combine recent activities
  const recentActivities = [
    ...filteredPatients.map((p) => ({
      type: 'patient',
      title: `Pengguna baru terdaftar: ${p.nama}`,
      date: p.createdAt,
      color: 'bg-blue-50 text-blue-600',
    })),
    ...filteredTrips.map((t) => ({
      type: 'trip',
      title:
        t.status === 'dalam_perjalanan'
          ? `Ambulance berangkat membawa ${t.namaPasien} ke ${t.tujuan}`
          : t.status === 'selesai'
          ? `Selesai mengantar ${t.namaPasien} (+${(t.kmSesudah || 0) - t.kmSebelum} km)`
          : `Perjalanan ${t.namaPasien} dibatalkan`,
      date: t.createdAt,
      color:
        t.status === 'dalam_perjalanan'
          ? 'bg-amber-50 text-amber-600'
          : t.status === 'selesai'
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-slate-100 text-slate-500',
    })),
    ...filteredExpenses.map((e) => ({
      type: 'expense',
      title: `Log pengeluaran ${e.keterangan} (${formatIDR(e.jumlah)})`,
      date: e.createdAt,
      color: 'bg-red-50 text-red-600',
    })),
    ...bookings.map((b) => ({
      type: 'pesanan',
      title: `Booking Ambulance: ${b.namaPasien} ke ${b.tujuan} (${b.tanggalPerjalanan})`,
      date: b.createdAt,
      color: 'bg-indigo-50 text-indigo-600',
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white/40 backdrop-blur-xl text-slate-800 border border-white/50 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 translate-y-12 w-48 h-48 bg-emerald-200/20 rounded-full blur-2xl"></div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/10 text-red-700 border border-red-200/30 rounded-full text-xs font-semibold">
            <img 
              src="https://lh3.googleusercontent.com/d/1Rx-hqsNyhgquLdyfEWRmdIelfquZMbef" 
              alt="LPS Logo" 
              className="h-7 w-7 object-contain mix-blend-multiply"
              referrerPolicy="no-referrer"
            />
            <span>Laskar Peduli Sesama - Penggerak Kebaikan</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight text-slate-900 leading-tight">
            Ambulance Gratis <span className="text-red-600">Untuk Sesama</span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl font-medium">
            Selamat bekerja tim relawan! Melalui sistem ini, semua aktivitas penjemputan, odometer ambulance, dan pengeluaran dicatat secara aman dan transparan.
          </p>
          <div className="pt-3 flex gap-3">
            <button
              onClick={() => onNavigate('trips')}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-200"
            >
              Catat Keberangkatan
            </button>
            <button
              onClick={() => onNavigate('expenses')}
              className="px-4 py-2 bg-white/60 hover:bg-white/80 text-slate-700 border border-white/50 font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              Log Pengeluaran
            </button>
          </div>
        </div>
      </div>

      {/* Periode Laporan (Hanya untuk Role Manajer / Manager dan Admin) */}
      {(userRole === 'manajer' || userRole === 'manager' || userRole === 'admin') && (
        <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl p-5 shadow-xl shadow-slate-200/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl border border-red-100">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-display">Periode Laporan Bulanan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Saring semua data operasional, jarak tempuh, dan pengeluaran</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Pilih Bulan & Tahun (2026):</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full sm:w-48 px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-all text-slate-700 shadow-sm"
            >
              <option value="all">Semua (Seluruh Periode)</option>
              <option value="2026-01">Januari 2026</option>
              <option value="2026-02">Februari 2026</option>
              <option value="2026-03">Maret 2026</option>
              <option value="2026-04">April 2026</option>
              <option value="2026-05">Mei 2026</option>
              <option value="2026-06">Juni 2026</option>
              <option value="2026-07">Juli 2026</option>
              <option value="2026-08">Agustus 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-10">Oktober 2026</option>
              <option value="2026-11">November 2026</option>
              <option value="2026-12">Desember 2026</option>
            </select>
          </div>
        </div>
      )}

      {/* Main stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center justify-between cursor-pointer"
          onClick={() => onNavigate('patients')}
        >
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database Pengguna</div>
            <div className="text-xl font-black text-slate-800 mt-1 font-display">{totalPatients} Jiwa</div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              <span>Terbuka & Terdaftar</span>
            </div>
          </div>
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm">
            <Users className="h-5 w-5" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center justify-between cursor-pointer"
          onClick={() => onNavigate('bookings')}
        >
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Antrean Pesanan</div>
            <div className="text-xl font-black text-slate-800 mt-1 font-display">{bookingsPendingCount} Booking</div>
            <div className="text-[10px] text-indigo-600 font-bold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              <span>Menunggu Jemput</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm">
            <Calendar className="h-5 w-5" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center justify-between cursor-pointer"
          onClick={() => onNavigate('trips')}
        >
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perjalanan Aktif</div>
            <div className="text-xl font-black text-slate-800 mt-1 font-display">
              {activeTripsCount} Armada
            </div>
            <div className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
              <span>Di Jalan Raya</span>
            </div>
          </div>
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
            <Truck className="h-5 w-5" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center justify-between cursor-pointer"
          onClick={() => onNavigate('trips')}
        >
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Jarak Tempuh</div>
            <div className="text-xl font-black text-slate-800 mt-1 font-display">
              {totalKm.toLocaleString('id-ID')} KM
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>Odometer Selesai</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
            <Compass className="h-5 w-5" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center justify-between cursor-pointer"
          onClick={() => onNavigate('expenses')}
        >
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dana Operasional</div>
            <div className="text-xl font-black text-red-600 mt-1 font-display">
              {formatIDR(totalExpenseAmount)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-slate-700">Operasional Bulan Ini</span>
            </div>
          </div>
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm">
            <DollarSign className="h-5 w-5" />
          </div>
        </motion.div>
      </div>

      {/* Analytics & Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses Pie Chart */}
        <div className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 lg:col-span-1">
          <h3 className="text-base font-bold text-slate-900 font-display mb-4">
            Penggunaan Dana Operasional
          </h3>
          {pieData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
              <span>Belum ada pengeluaran dicatat</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatIDR(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
                  <span className="text-base font-bold text-slate-800">{formatIDR(totalExpenseAmount)}</span>
                </div>
              </div>

              {/* Legends with percentages */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {pieData.map((entry, i) => {
                  const pct = ((entry.value / totalExpenseAmount) * 100).toFixed(1);
                  return (
                    <div key={i} className="flex items-center gap-1.5 p-1 rounded hover:bg-white/30">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                      <span className="text-slate-600 truncate">{entry.name}</span>
                      <span className="font-bold text-slate-400 ml-auto">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Distance/Trips chart */}
        <div className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 lg:col-span-2">
          <h3 className="text-base font-bold text-slate-900 font-display mb-4">
            Rasio Jarak Tempuh Harian (Odometer KM)
          </h3>
          {distanceChartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Activity className="h-8 w-8 text-slate-300 mb-2 animate-pulse" />
              <span>Belum ada riwayat KM tempuh dari perjalanan selesai</span>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distanceChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(value: number) => [`${value} km`, 'Jarak']} />
                  <Bar dataKey="jarak" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities & Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Activity Log */}
        <div className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 md:col-span-2">
          <h3 className="text-base font-bold text-slate-900 font-display mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-600" />
            <span>Riwayat Aktivitas Terkini</span>
          </h3>

          {recentActivities.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Belum ada aktivitas dicatat di sistem.</div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((act, i) => (
                <div key={i} className="flex gap-3 items-start text-xs text-slate-600">
                  <div className={`p-1.5 rounded-lg shrink-0 ${act.color} font-mono font-bold text-[10px]`}>
                    {act.type.toUpperCase()}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-slate-800 line-clamp-1">{act.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(act.date).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Alert Info / Tips */}
        <div className="bg-amber-50/40 backdrop-blur-xl border border-amber-200/40 p-5 rounded-3xl shadow-xl shadow-amber-100/10 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm font-display">
              <AlertCircle className="h-5 w-5 text-amber-600 animate-pulse" />
              <span>Instruksi Tanggap Darurat</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Tim relawan diimbau untuk selalu memeriksa ketersediaan bensin dan fungsionalitas tabung oksigen di dalam armada ambulance sebelum memulai keberangkatan.
            </p>
            <div className="border-t border-amber-200/30 pt-3 text-xs text-slate-500 space-y-1">
              <p>• Telepon Ambulans LPS: <strong className="text-red-600 font-mono">081-333-222-111</strong></p>
              <p>• Selalu catat KM sebelum memutar kunci mesin!</p>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-200/30 mt-4 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Laskar Peduli Sesama © 2026
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
