import React, { useState } from 'react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { KeyRound, Mail, UserPlus, HeartHandshake, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onSuccess: () => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMsg('Pendaftaran berhasil! Mengalihkan...');
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email atau password salah.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email sudah terdaftar.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password harus minimal 6 karakter.');
      } else if (err.code === 'auth/admin-restricted-operation' || err.message?.includes('admin-restricted-operation')) {
        setError('Pendaftaran & login manual dibatasi oleh setelan Firebase (admin-restricted-operation). Silakan masuk menggunakan tombol "Masuk dengan Google" di bawah.');
      } else {
        setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError('Gagal masuk dengan Google: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInAnonymously(auth);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/admin-restricted-operation' || err.message?.includes('admin-restricted-operation')) {
        setError('Akses cepat Demo dibatasi oleh setelan Firebase (admin-restricted-operation). Silakan gunakan tombol "Masuk dengan Google" di bawah.');
      } else {
        setError('Gagal masuk ke akun demo: ' + err.message);
      }
    } finally {
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
            <div className="h-16 w-16 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
              <HeartHandshake className="h-9 w-9" />
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
            <div className="p-3 bg-red-50/75 backdrop-blur-md text-red-700 text-xs rounded-xl border border-red-200/50 flex items-start gap-2">
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
                Alamat Email Staff
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-white/80 border border-white/50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
                  placeholder="nama@laskarpedulisesama.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                Kata Sandi (min. 6 karakter)
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
                  className="block w-full pl-10 pr-3 py-3 bg-white/80 border border-white/50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
          >
            {loading ? 'Memproses...' : isSignUp ? 'Daftar Akun Baru' : 'Masuk ke Sistem'}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-3">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/30"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold">Atau</span>
            <div className="flex-grow border-t border-white/30"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-white/60 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-md shadow-slate-200/50"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          <button
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-white/50 rounded-xl text-sm font-semibold text-slate-700 bg-white/60 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all shadow-sm"
          >
            Akses Cepat Demo (Tanpa Pendaftaran)
          </button>

          <div className="text-center mt-2">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccessMsg('');
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold focus:outline-none transition-colors"
            >
              {isSignUp
                ? 'Sudah punya akun? Masuk disini'
                : 'Belum punya akun? Hubungi Admin atau Daftar Baru'}
            </button>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 font-medium">
          Sistem Keamanan Terenkripsi & Terkoneksi Real-time Firestore Cloud
        </div>
      </motion.div>
    </div>
  );
}
