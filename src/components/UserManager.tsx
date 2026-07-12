import React, { useState, useEffect } from 'react';
import { subscribeAppUsers, addAppUser, updateAppUser, deleteAppUser, clearDemoData } from '../dbService';
import { AppUser } from '../types';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  X,
  Key,
  CheckCircle2,
  AlertTriangle,
  User,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserManagerProps {
  currentUser: AppUser;
}

export default function UserManager({ currentUser }: UserManagerProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff' | 'manajer' | 'manager'>('staff');
  const [showPassword, setShowPassword] = useState(false);

  // Status message states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clearingDb, setClearingDb] = useState(false);

  const handleClearDemoData = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua data pasien, perjalanan, dan pengeluaran secara permanen?\n\nTindakan ini tidak dapat dibatalkan.')) {
      setClearingDb(true);
      try {
        await clearDemoData();
        alert('Semua data demo berhasil dihapus secara permanen.');
      } catch (err: any) {
        console.error(err);
        alert('Gagal membersihkan data: ' + err.message);
      } finally {
        setClearingDb(false);
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeAppUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('staff');
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: AppUser) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password || '');
    setRole(user.role);
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !username.trim()) {
      setError('Nama dan Username wajib diisi.');
      return;
    }

    if (!editingUser && !password.trim()) {
      setError('Sandi wajib diisi untuk pengguna baru.');
      return;
    }

    // Check if username already exists
    const cleanedUsername = username.trim().toLowerCase();
    const usernameExists = users.some(
      (u) => u.username.toLowerCase() === cleanedUsername && u.id !== editingUser?.id
    );

    if (usernameExists) {
      setError('Username sudah digunakan oleh pengguna lain.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await updateAppUser(editingUser.id, {
          name: name.trim(),
          username: cleanedUsername,
          password: password.trim(),
          role,
        });
        setSuccess('Data pengguna berhasil diperbarui!');
      } else {
        await addAppUser({
          name: name.trim(),
          username: cleanedUsername,
          password: password.trim(),
          role,
        });
        setSuccess('Pengguna baru berhasil ditambahkan!');
      }

      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError('Gagal menyimpan data: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: AppUser) => {
    if (user.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang digunakan.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${user.name}" (${user.username})?`)) {
      try {
        await deleteAppUser(user.id);
      } catch (err: any) {
        console.error(err);
        alert('Gagal menghapus pengguna: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-xl shadow-slate-200/40">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-600" />
            Manajemen Pengguna
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola akun administrator dan staff petugas lapangan yang memiliki akses ke sistem database.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-blue-200 duration-150 shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500 font-semibold mt-3">Memuat daftar pengguna...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl p-12 text-center text-slate-500 shadow-xl shadow-slate-200/40">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-800">Tidak ada akun pengguna ditemukan</p>
          <p className="text-sm text-slate-400 mt-1">Gunakan tombol "Tambah Akun Baru" di atas untuk menambahkan akun baru.</p>
        </div>
      ) : (
        <div className="bg-white/50 backdrop-blur-xl border border-white/50 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/30 border-b border-white/30 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Nama Pengguna</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Sandi</th>
                  <th className="px-6 py-4">Level Akses (Role)</th>
                  <th className="px-6 py-4">Dibuat Pada</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/25 text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border shadow-inner ${
                          user.role === 'admin' 
                            ? 'bg-red-500/10 text-red-700 border-red-200/30' 
                            : user.role === 'manajer' || user.role === 'manager'
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200/30'
                            : 'bg-blue-500/10 text-blue-700 border-blue-200/30'
                        }`}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {user.name}
                            {user.id === currentUser.id && (
                              <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Anda
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      @{user.username}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                      {user.password ? '•'.repeat(Math.min(user.password.length, 12)) : '(Kosong)'}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-700 border border-red-200/30 px-2.5 py-1 rounded-full text-xs font-bold">
                          <Shield className="h-3 w-3" />
                          Administrator
                        </span>
                      ) : user.role === 'manajer' || user.role === 'manager' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 border border-emerald-200/30 px-2.5 py-1 rounded-full text-xs font-bold">
                          <Users className="h-3 w-3" />
                          Manajer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-700 border border-blue-200/30 px-2.5 py-1 rounded-full text-xs font-bold">
                          <User className="h-3 w-3" />
                          Staff Lapangan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          title="Edit Akun"
                          className="p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all border border-transparent hover:border-blue-100"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={user.id === currentUser.id}
                          title="Hapus Akun"
                          className="p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all border border-transparent hover:border-red-100 disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Database Maintenance Section */}
      <div className="bg-red-50/40 backdrop-blur-xl border border-red-200/40 rounded-3xl p-6 shadow-xl shadow-red-100/10 space-y-4">
        <div className="flex items-center gap-2.5 text-red-800">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="font-bold text-base font-display">Pemeliharaan Database (Hapus Data Demo)</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl font-medium">
          Gunakan fitur ini untuk membersihkan semua data contoh atau simulasi (Pasien, Log Perjalanan, dan Pengeluaran) dari database Firebase Anda secara permanen. Akun sistem Anda dan relawan lainnya tidak akan terhapus. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div>
          <button
            onClick={handleClearDemoData}
            disabled={clearingDb}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-100 transition-all flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>{clearingDb ? 'Membersihkan...' : 'Hapus Semua Data Demo Secara Permanen'}</span>
          </button>
        </div>
      </div>

      {/* Modal User Edit/Add */}
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
                  {editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-white/50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50/75 backdrop-blur-md text-red-700 text-xs rounded-xl border border-red-200/50 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-emerald-50/75 backdrop-blur-md text-emerald-700 text-xs rounded-xl border border-emerald-200/50 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Nama Lengkap Pengguna <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Muhammad Yusuf"
                      className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all font-semibold text-slate-800 shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                        Username Akses <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">
                          @
                        </span>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, ''))}
                          placeholder="yusuf_laskar"
                          className="w-full pl-7 pr-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all font-semibold text-slate-800 shadow-inner"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                        Level Akses (Role) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'admin' | 'staff' | 'manajer' | 'manager')}
                        className="w-full px-3 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-inner font-bold text-slate-800"
                      >
                        <option value="staff">Staff Lapangan</option>
                        <option value="manajer">Manajer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase px-1 mb-1">
                      Sandi Masuk (Password) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingUser}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={editingUser ? 'Isi hanya jika ingin mengubah sandi' : 'Contoh: yusuf123'}
                        className="w-full pl-3 pr-10 py-2.5 bg-white/80 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all font-semibold text-slate-800 shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
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
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Akun'}
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
