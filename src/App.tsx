import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { subscribePatients, subscribeTrips, subscribeExpenses } from './dbService';
import { Patient, Trip, Expense } from './types';

// Components
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import PatientManager from './components/PatientManager';
import TripManager from './components/TripManager';
import ExpenseManager from './components/ExpenseManager';

// Icons
import {
  HeartHandshake,
  LayoutDashboard,
  Users,
  Compass,
  DollarSign,
  LogOut,
  User as UserIcon,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'dashboard' | 'patients' | 'trips' | 'expenses';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Firestore States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // 1. Listen to Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecking(false);
    });
    return unsubscribe;
  }, []);

  // 2. Real-time Database Subscriptions
  useEffect(() => {
    if (!user) return;

    const unsubPatients = subscribePatients((data) => setPatients(data));
    const unsubTrips = subscribeTrips((data) => setTrips(data));
    const unsubExpenses = subscribeExpenses((data) => setExpenses(data));

    return () => {
      unsubPatients();
      unsubTrips();
      unsubExpenses();
    };
  }, [user]);

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      await signOut(auth);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-slate-500 text-sm">
          <div className="h-10 w-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-semibold font-display text-slate-700 animate-pulse">
            Memuat Sistem Laskar Peduli Sesama...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={() => {}} />;
  }

  // Sidebar navigation menu items
  const menuItems = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
    { id: 'patients', label: 'Database Pengguna', icon: Users },
    { id: 'trips', label: 'Log Perjalanan', icon: Compass },
    { id: 'expenses', label: 'Log Pengeluaran', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col md:flex-row relative z-10 overflow-x-hidden font-sans">
      {/* Background Mesh Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Mobile Top Bar */}
      <div className="bg-white/60 backdrop-blur-md border-b border-white/40 px-4 py-3 flex md:hidden items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-600 rounded-lg text-white shadow-md shadow-red-200">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <span className="font-bold text-slate-900 font-display text-sm tracking-tight">
            Laskar Peduli Sesama
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-600 hover:bg-white/50 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static transition-transform duration-300 ease-in-out z-30 w-64 bg-white/40 backdrop-blur-2xl border-r border-white/40 flex flex-col justify-between shadow-lg md:shadow-none h-full relative`}
      >
        <div className="flex flex-col flex-grow">
          {/* Brand Logo */}
          <div className="px-6 py-6 border-b border-white/30 flex items-center gap-3">
            <div className="h-10 w-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-200">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 font-display text-sm leading-none tracking-tight">
                LASKAR PEDULI
              </h2>
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1 block">
                SESAMA AMBULANCE
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabType);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-white/60 backdrop-blur-md text-blue-700 border border-white/50 shadow-sm shadow-blue-100'
                      : 'text-slate-600 hover:bg-white/30 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.id === 'trips' && trips.filter((t) => t.status === 'dalam_perjalanan').length > 0 && (
                    <span className="ml-auto bg-amber-500 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                      {trips.filter((t) => t.status === 'dalam_perjalanan').length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile & logout */}
        <div className="p-4 border-t border-white/30 bg-white/20 backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-8 w-8 bg-white/60 text-slate-700 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-inner border border-white/50">
              {user.email ? user.email.charAt(0) : <UserIcon className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate leading-none">
                {user.email ? user.email.split('@')[0] : 'Demo Staff'}
              </p>
              <span className="text-[9px] font-semibold text-slate-500 truncate block mt-0.5 flex items-center gap-0.5">
                <Shield className="h-2.5 w-2.5 text-red-500" />
                <span>Petugas Lapangan</span>
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-red-700 hover:bg-red-50/50 transition-all border border-transparent hover:border-red-100"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Keluar dari Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard
                patients={patients}
                trips={trips}
                expenses={expenses}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'patients' && <PatientManager patients={patients} />}
            {activeTab === 'trips' && <TripManager trips={trips} patients={patients} />}
            {activeTab === 'expenses' && <ExpenseManager expenses={expenses} trips={trips} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 md:hidden"
        ></div>
      )}
    </div>
  );
}
