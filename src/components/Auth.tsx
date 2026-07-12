import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { seedDefaultUsersIfEmpty } from '../dbService';
import { AppUser } from '../types';
import { KeyRound, User, HeartHandshake, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onSuccess: (user: AppUser) => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Seed default credentials on load
  useEffect(() => {
    seedDefaultUsersIfEmpty();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const cleanedUsername = username.trim().toLowerCase();
    const enteredPassword = password.trim();

    if (!cleanedUsername || !enteredPassword) {
      setError('Harap masukkan Username dan Kata Sandi.');
      setLoading(false);
      return;
    }

    try {
      // Query firestore for this user
      const usersCol = collection(db, 'app_users');
      const q = query(usersCol, where('username', '==', cleanedUsername));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Username tidak ditemukan.');
        setLoading(false);
        return;
      }

      let matchedUser: AppUser | null = null;
      querySnapshot.forEach((docSnap) => {
        const u = { id: docSnap.id, ...docSnap.data() } as AppUser;
        if (u.password === enteredPassword) {
          matchedUser = u;
        }
      });

      if (!matchedUser) {
        setError('Kata sandi yang Anda masukkan salah.');
        setLoading(false);
        return;
      }

      // Login success
      setSuccessMsg(`Berhasil masuk! Selamat datang, ${(matchedUser as AppUser).name}.`);
      setTimeout(() => {
        onSuccess(matchedUser as AppUser);
      }, 1000);
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan koneksi database: ' + (err.message || 'Silakan coba lagi.'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] relative z-10 overflow-hidden px-4 py-12 sm:px-6 lg:px-8 font-sans">
      {/* Background Mesh Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full space-y-8 bg-white/50 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-2xl shadow-slate-200/50 relative z-10"
      >
        <div>
          <div className="flex justify-center">
            <div className="h-32 w-32 flex items-center justify-center overflow-hidden">
              <img 
                src="https://lh3.googleusercontent.com/d/1Rx-hqsNyhgquLdyfEWRmdIelfquZMbef" 
                alt="Logo Laskar Peduli Sesama" 
                className="h-full w-full object-contain mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold font-display tracking-tight text-slate-900 leading-tight">
            LASKAR PEDULI<br /><span className="text-red-600">SESAMA</span>
          </h2>
          <p className="mt-2 text-center text-xs uppercase tracking-widest text-slate-500 font-semibold max-w-xs mx-auto">
            Ambulance Fleet Database
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50/75 backdrop-blur-md text-red-700 text-xs rounded-xl border border-red-200/50 flex items-start gap-2 animate-bounce-short">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50/75 backdrop-blur-md text-emerald-700 text-xs rounded-xl border border-emerald-200/50 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                Username Akses
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-white/80 border border-white/50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner font-semibold text-slate-800"
                  placeholder="Contoh: admin atau staff"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-white/80 border border-white/50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner font-semibold text-slate-800"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
          </button>
        </form>

        {/* Informative Helper Panel */}
        <div className="bg-blue-500/5 border border-blue-200/30 rounded-2xl p-4 space-y-2 text-xs text-slate-600 text-center">
          <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Default Akses Sistem</p>
          <div className="flex justify-around text-[11px] gap-2">
            <div>
              <p className="font-bold text-red-600">Admin Account</p>
              <p className="font-semibold text-slate-500">User: <code className="bg-slate-100 px-1 rounded font-mono">admin</code></p>
              <p className="font-semibold text-slate-500">Sandi: <code className="bg-slate-100 px-1 rounded font-mono">admin123</code></p>
            </div>
            <div className="border-r border-slate-200"></div>
            <div>
              <p className="font-bold text-blue-600">Staff Account</p>
              <p className="font-semibold text-slate-500">User: <code className="bg-slate-100 px-1 rounded font-mono">staff</code></p>
              <p className="font-semibold text-slate-500">Sandi: <code className="bg-slate-100 px-1 rounded font-mono">staff123</code></p>
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 font-medium">
          Sistem Keamanan Terintegrasi & Terkoneksi Real-time Firestore Cloud
        </div>
      </motion.div>
    </div>
  );
}
