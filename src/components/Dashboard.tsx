import React, { useState } from 'react';
import { Patient, Trip } from '../types';
import { addTrip } from '../dbService';
import {
  Compass,
  MapPin,
  Calendar,
  User,
  Gauge,
  CheckCircle,
  FileText,
  AlertCircle,
  HeartHandshake,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  patients: Patient[];
  trips: Trip[];
  onNavigate: (tab: 'patients' | 'trips' | 'expenses') => void;
}

export default function Dashboard({ patients, onNavigate }: DashboardProps) {
  // Form states
  const [patientId, setPatientId] = useState('');
  const [namaPasien, setNamaPasien] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [supir, setSupir] = useState('');
  const [pendamping, setPendamping] = useState('');
  const [kmSebelum, setKmSebelum] = useState<number | ''>('');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<any | null>(null);

  // Auto-fill patient name from dropdown
  const handlePatientSelect = (id: string) => {
    setPatientId(id);
    if (id === 'custom') {
      setNamaPasien('');
    } else {
      const selected = patients.find((p) => p.id === id);
      if (selected) {
        setNamaPasien(selected.nama);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!namaPasien || !tujuan || !tanggal || !supir || kmSebelum === '') {
      setErrorMsg('Mohon lengkapi semua kolom wajib yang bertanda bintang (*)!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientId: patientId === 'custom' || patientId === '' ? '' : patientId,
        namaPasien,
        tujuan,
        tanggal,
        supir,
        pendamping,
        kmSebelum: Number(kmSebelum),
        status: 'dalam_perjalanan' as const,
        catatan,
      };

      const savedData = await addTrip(payload);
      setSuccessData(savedData);
      
      // Reset form states
      setPatientId('');
      setNamaPasien('');
      setTujuan('');
      setTanggal(new Date().toISOString().split('T')[0]);
      setSupir('');
      setPendamping('');
      setKmSebelum('');
      setCatatan('');
    } catch (err: any) {
      console.error('Error saving trip:', err);
      setErrorMsg('Gagal menyimpan data perjalanan ke server. Coba periksa koneksi internet Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="text-center space-y-2 px-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/10 text-red-700 border border-red-200/30 rounded-full text-xs font-semibold">
          <HeartHandshake className="h-3.5 w-3.5 text-red-600" />
          <span>Yayasan Laskar Peduli Sesama</span>
        </div>
        <h1 className="text-2xl font-black font-display text-slate-900 tracking-tight">
          Catat Keberangkatan Ambulance
        </h1>
        <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
          Isi form keberangkatan di bawah setiap kali armada ambulance gratis memulai operasional penjemputan pasien.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {successData ? (
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-2xl shadow-emerald-100 relative overflow-hidden"
          >
            {/* Ambient background accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="text-center space-y-3 mb-6">
              <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-full shadow-inner animate-bounce">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-black text-slate-800 font-display">
                Keberangkatan Berhasil Dicatat!
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Data telah disinkronisasikan ke sistem cloud secara real-time.
              </p>
            </div>

            {/* Summary details */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs text-slate-700">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Pasien</span>
                <span className="font-extrabold text-slate-800">{successData.namaPasien}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Tujuan</span>
                <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">{successData.tujuan}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Odometer Berangkat</span>
                <span className="font-mono font-bold text-slate-800">{successData.kmSebelum.toLocaleString('id-ID')} km</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Supir / Driver</span>
                <span className="font-semibold text-slate-800">{successData.supir}</span>
              </div>
              {successData.pendamping && (
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Pendamping</span>
                  <span className="font-semibold text-slate-800">{successData.pendamping}</span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Status</span>
                <span className="font-bold text-amber-600 uppercase text-[10px] tracking-wider animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  Dalam Perjalanan
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => setSuccessData(null)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
              >
                <span>Catat Keberangkatan Baru</span>
              </button>
              <button
                onClick={() => onNavigate('trips')}
                className="w-full py-3 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1"
              >
                <span>Lihat Semua Log Perjalanan</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="trip-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="bg-white/80 backdrop-blur-2xl border border-white/60 p-5 sm:p-6 rounded-3xl shadow-2xl shadow-slate-200/60 space-y-5"
          >
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200/50 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Select Patient Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                Pilih dari Database Pengguna <span className="text-slate-400 font-medium">(Opsional)</span>
              </label>
              <select
                value={patientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-blue-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all font-semibold text-slate-700"
              >
                <option value="">-- Ketik Nama Pasien Manual --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.alamat.substring(0, 30)}...)
                  </option>
                ))}
                <option value="custom">-- Tulis Manual (Pasien Baru/Luar Kota) --</option>
              </select>
            </div>

            {/* Manual Patient Name */}
            {(patientId === 'custom' || patientId === '') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                  Nama Pasien / Penerima Manfaat <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                  <input
                    type="text"
                    required
                    value={namaPasien}
                    onChange={(e) => setNamaPasien(e.target.value)}
                    placeholder="Masukkan nama lengkap pasien"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all font-semibold text-slate-800 placeholder-slate-400"
                  />
                </div>
              </motion.div>
            )}

            {/* Date & Odometer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                  Tanggal Berangkat <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                  Odometer Awal (KM) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Gauge className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                  <input
                    type="number"
                    required
                    value={kmSebelum}
                    onChange={(e) => setKmSebelum(e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="Contoh: 124500"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all font-mono font-bold text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Driver & Companion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                  Nama Supir / Driver <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                  <input
                    type="text"
                    required
                    value={supir}
                    onChange={(e) => setSupir(e.target.value)}
                    placeholder="Nama supir yang bertugas"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all font-semibold text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                  Nama Pendamping <span className="text-slate-400 font-medium">(Opsional)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                  <input
                    type="text"
                    value={pendamping}
                    onChange={(e) => setPendamping(e.target.value)}
                    placeholder="Keluarga atau staff pendamping"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all font-semibold text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                Alamat / Fasilitas Kesehatan Tujuan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                <input
                  type="text"
                  required
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  placeholder="Contoh: RSUD Dr. Soetomo (Unit Cuci Darah)"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all font-semibold text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                Catatan Perjalanan / Kebutuhan Khusus <span className="text-slate-400 font-medium">(Opsional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 text-slate-400 h-4.5 w-4.5" />
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Kebutuhan khusus pasien, tabung oksigen, faskes transit, dll."
                  rows={2}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all font-semibold text-slate-800 placeholder-slate-400 resize-none"
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Compass className="h-4.5 w-4.5 animate-spin-slow" />
                <span>{isSubmitting ? 'Menyimpan Keberangkatan...' : 'Mulai & Catat Keberangkatan'}</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
