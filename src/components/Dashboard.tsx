import React from 'react';
import { Patient, Trip, Expense } from '../types';
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

interface DashboardProps {
  patients: Patient[];
  trips: Trip[];
  expenses: Expense[];
  onNavigate: (tab: 'patients' | 'trips' | 'expenses') => void;
}

export default function Dashboard({ patients, trips, expenses, onNavigate }: DashboardProps) {
  // 1. Calculate general stats
  const totalPatients = patients.length;
  const activeTripsCount = trips.filter((t) => t.status === 'dalam_perjalanan').length;

  const totalKm = trips
    .filter((t) => t.status === 'selesai' && t.kmSesudah)
    .reduce((acc, curr) => acc + ((curr.kmSesudah || 0) - curr.kmSebelum), 0);

  const totalExpenseAmount = expenses.reduce((acc, curr) => acc + curr.jumlah, 0);

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

  expenses.forEach((e) => {
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
  trips
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
    ...patients.map((p) => ({
      type: 'patient',
      title: `Pengguna baru terdaftar: ${p.nama}`,
      date: p.createdAt,
      color: 'bg-blue-50 text-blue-600',
    })),
    ...trips.map((t) => ({
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
    ...expenses.map((e) => ({
      type: 'expense',
      title: `Log pengeluaran ${e.keterangan} (${formatIDR(e.jumlah)})`,
      date: e.createdAt,
      color: 'bg-red-50 text-red-600',
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/10 text-red-700 border border-red-200/30 rounded-full text-xs font-semibold">
            <HeartHandshake className="h-3.5 w-3.5 text-red-600" />
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

      {/* Main stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center justify-between cursor-pointer"
          onClick={() => onNavigate('patients')}
        >
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database Pengguna</div>
            <div className="text-2xl font-black text-slate-800 mt-1 font-display">{totalPatients} Jiwa</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              <span>Terbuka & Terdaftar</span>
            </div>
          </div>
          <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl shadow-sm">
            <Users className="h-6 w-6" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center justify-between cursor-pointer"
          onClick={() => onNavigate('trips')}
        >
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perjalanan Aktif</div>
            <div className="text-2xl font-black text-slate-800 mt-1 font-display">
              {activeTripsCount} Operasional
            </div>
            <div className="text-[11px] text-amber-600 font-bold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
              <span>Di Jalan Raya</span>
            </div>
          </div>
          <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
            <Truck className="h-6 w-6" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center justify-between cursor-pointer"
          onClick={() => onNavigate('trips')}
        >
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Jarak Tempuh</div>
            <div className="text-2xl font-black text-slate-800 mt-1 font-display">
              {totalKm.toLocaleString('id-ID')} KM
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>Berdasarkan Odometer</span>
            </div>
          </div>
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
            <Compass className="h-6 w-6" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-xl shadow-slate-200/50 flex items-center justify-between cursor-pointer"
          onClick={() => onNavigate('expenses')}
        >
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dana Operasional</div>
            <div className="text-2xl font-black text-red-600 mt-1 font-display">
              {formatIDR(totalExpenseAmount)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-slate-700">bensin, tol & perawatan</span>
            </div>
          </div>
          <div className="p-4 bg-red-100 text-red-600 rounded-2xl shadow-sm">
            <DollarSign className="h-6 w-6" />
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
