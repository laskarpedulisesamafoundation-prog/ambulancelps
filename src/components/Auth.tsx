import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { seedDefaultUsersIfEmpty, subscribeAppUsers } from '../dbService';
import { AppUser } from '../types';
import { KeyRound, User, HeartHandshake, ShieldAlert, CheckCircle2, Shield, Users, UserCheck } from 'lucide-react';
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
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Seed default credentials on load and subscribe to user list
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const init = async () => {
      await seedDefaultUsersIfEmpty();
      unsubscribe = subscribeAppUsers((usersList) => {
        // Sort users so admin is first, then manager/manajer, then staff
        const sorted = [...usersList].sort((a, b) => {
          const roleOrder = { admin: 1, manager: 2, manajer: 2, staff: 3 };
          const roleA = roleOrder[a.role as keyof typeof roleOrder] || 4;
          const roleB = roleOrder[b.role as keyof typeof roleOrder] || 4;
          return roleA - roleB;
        });
        setUsers(sorted);
      });
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
    <div className="min-h-screen flex items-start justify-center bg-[#f0f4f8] relative z-10 overflow-hidden px-4 pt-6 pb-12 sm:px-6 lg:px-8 font-sans">
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
        className="max-w-md w-full space-y-4 bg-white/50 backdrop-blur-xl border border-white/50 p-6 sm:p-8 rounded-3xl shadow-2xl shadow-slate-200/50 relative z-10 mt-2 sm:mt-6"
      >
        <div>
          <div className="flex justify-center">
            <div className="h-72 w-72 flex items-center justify-center overflow-hidden">
              <img 
                src="https://lh3.googleusercontent.com/d/1Rx-hqsNyhgquLdyfEWRmdIelfquZMbef" 
                alt="Logo Laskar Peduli Sesama" 
                className="h-full w-full object-contain mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <h2 className="-mt-3 text-center text-3xl font-extrabold font-display tracking-tight text-slate-900 leading-tight">
            LASKAR PEDULI<br /><span className="text-red-600">SESAMA</span>
          </h2>
          <p className="mt-0.5 text-center text-xs uppercase tracking-widest text-slate-500 font-semibold max-w-xs mx-auto">
            Ambulance Fleet Database
          </p>
        </div>

        <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>
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
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setSelectedUserId(null);
                  }}
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
                  id="password-input"
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

        {/* Quick-Select Profile Section as replacement for Default Akses Sistem */}
        {users.length > 0 && (
          <div className="space-y-2.5 bg-slate-100/40 border border-slate-200/35 p-3.5 rounded-2xl">
            <p className="block text-[11px] font-extrabold text-slate-500 uppercase px-1 flex items-center justify-between">
              <span>Pilih Profil Akses</span>
              <span className="text-[10px] text-slate-400 normal-case font-bold">Pilih lalu ketik password</span>
            </p>
            <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-0.5">
              {users.map((u) => {
                const isSelected = username.trim().toLowerCase() === u.username.toLowerCase();
                
                // Style colors based on roles
                let roleBadgeColor = "bg-blue-50 text-blue-700 border-blue-200/55";
                let avatarBg = "bg-blue-600/10 text-blue-700 border-blue-200/55";
                if (u.role === 'admin') {
                  roleBadgeColor = "bg-red-50 text-red-700 border-red-200/55";
                  avatarBg = "bg-red-600/10 text-red-700 border-red-200/55";
                } else if (u.role === 'manajer' || u.role === 'manager') {
                  roleBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200/55";
                  avatarBg = "bg-emerald-600/10 text-emerald-700 border-emerald-200/55";
                }

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setUsername(u.username);
                      setSelectedUserId(u.id);
                      // Safely focus the password input
                      setTimeout(() => {
                        const pwdInput = document.getElementById('password-input');
                        if (pwdInput) {
                          pwdInput.focus();
                        }
                      }, 50);
                    }}
                    className={`flex flex-col items-center justify-between p-2 rounded-2xl border text-center transition-all cursor-pointer relative ${
                      isSelected 
                        ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-400/20 scale-[1.03]' 
                        : 'bg-white/70 hover:bg-white border-slate-200/60 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5">
                        <UserCheck className="h-3 w-3 text-blue-600" />
                      </div>
                    )}
                    
                    <div className={`h-8 w-8 rounded-full border flex items-center justify-center font-extrabold text-[11px] mb-1 shadow-inner ${avatarBg}`}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <span className="text-[10px] font-extrabold text-slate-800 line-clamp-1 leading-none mb-1 w-full">
                      {u.name}
                    </span>
                    
                    <span className={`text-[8px] font-extrabold px-1 py-0.5 rounded-full border leading-none shrink-0 ${roleBadgeColor}`}>
                      {u.role === 'admin' ? 'Admin' : u.role === 'manajer' || u.role === 'manager' ? 'Manajer' : 'Staff'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center text-[10px] text-slate-400 font-medium">
          Sistem Keamanan Terintegrasi & Terkoneksi Real-time Firestore Cloud
        </div>
      </motion.div>
    </div>
  );
}
