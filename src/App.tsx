import React, { useState, useEffect } from 'react';
import { subscribePatients, subscribeTrips, subscribeExpenses, seedDefaultUsersIfEmpty } from './dbService';
import { Patient, Trip, Expense, AppUser } from './types';

// Components
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import PatientManager from './components/PatientManager';
import TripManager from './components/TripManager';
import ExpenseManager from './components/ExpenseManager';
import UserManager from './components/UserManager';

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
  Phone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'dashboard' | 'patients' | 'trips' | 'expenses' | 'users';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Firestore States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // 1. Listen to Authentication State (from localStorage)
  useEffect(() => {
    const initAuth = async () => {
      // Seed default accounts in background so it does not block the application boot
      seedDefaultUsersIfEmpty().catch((err) => {
        console.error('Error seeding users:', err);
      });

      const savedUserStr = localStorage.getItem('laskar_peduli_user');
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr) as AppUser;
          setCurrentUser(savedUser);
        } catch (e) {
          console.error('Failed to parse saved user:', e);
          localStorage.removeItem('laskar_peduli_user');
        }
      }
      setAuthChecking(false);
    };

    initAuth();
  }, []);

  // 2. Real-time Database Subscriptions
  useEffect(() => {
    if (!currentUser) return;

    const unsubPatients = subscribePatients((data) => setPatients(data));
    const unsubTrips = subscribeTrips((data) => setTrips(data));
    const unsubExpenses = subscribeExpenses((data) => setExpenses(data));

    return () => {
      unsubPatients();
      unsubTrips();
      unsubExpenses();
    };
  }, [currentUser]);

  // Defensive routing check for staff (disabled to allow staff to access expenses)
  useEffect(() => {
    // Staff now has access to log expenses!
  }, [activeTab, currentUser]);

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      localStorage.removeItem('laskar_peduli_user');
      setCurrentUser(null);
      setActiveTab('dashboard');
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

  if (!currentUser) {
    return <Auth onSuccess={(user) => {
      setCurrentUser(user);
      localStorage.setItem('laskar_peduli_user', JSON.stringify(user));
    }} />;
  }

  // Sidebar navigation menu items
  const menuItems = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
    { id: 'patients', label: 'Database Pengguna', icon: Users },
    { id: 'trips', label: 'Log Perjalanan', icon: Compass },
    { id: 'expenses', label: 'Log Pengeluaran', icon: DollarSign },
  ];

  if (currentUser.role === 'admin') {
    menuItems.push({ id: 'users', label: 'Manajemen Pengguna', icon: Shield });
  }

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
          <div className="h-12 w-12 flex items-center justify-center overflow-hidden">
            <img 
              src="https://lh3.googleusercontent.com/d/1Rx-hqsNyhgquLdyfEWRmdIelfquZMbef" 
              alt="LPS" 
              className="h-full w-full object-contain mix-blend-multiply"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-bold text-slate-900 font-display text-sm tracking-tight">
            Laskar Peduli Sesama
          </span>
        </div>
        {currentUser.role !== 'staff' ? (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 hover:bg-white/50 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Staff Lapangan
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-colors"
              title="Keluar"
            >
              <LogOut className="h-4 w-4 shrink-0" />
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${
          mobileMenuOpen && currentUser.role !== 'staff' ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static transition-transform duration-300 ease-in-out z-30 w-64 bg-white/40 backdrop-blur-2xl border-r border-white/40 flex flex-col justify-between shadow-lg md:shadow-none h-full relative`}
      >
        <div className="flex flex-col flex-grow">
          {/* Brand Logo */}
          <div className="px-5 py-6 border-b border-white/30 flex items-center gap-1.5">
            <div className="h-20 w-20 flex items-center justify-center overflow-hidden shrink-0">
              <img 
                src="https://lh3.googleusercontent.com/d/1Rx-hqsNyhgquLdyfEWRmdIelfquZMbef" 
                alt="Logo Laskar Peduli Sesama" 
                className="h-full w-full object-contain mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 font-display text-[13px] leading-tight tracking-tight">
                LASKAR PEDULI SESAMA
              </h2>
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-0.5 block">
                AMBULANCE GRATIS
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
              {currentUser.name ? currentUser.name.charAt(0) : <UserIcon className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate leading-none">
                {currentUser.name}
              </p>
              {currentUser.telepon && (
                <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1 mt-1">
                  <Phone className="h-2.5 w-2.5 text-slate-400" />
                  <span>{currentUser.telepon}</span>
                </p>
              )}
              <span className="text-[9px] font-semibold text-slate-500 truncate block mt-1 flex items-center gap-0.5">
                <Shield className="h-2.5 w-2.5 text-red-500" />
                <span>
                  {currentUser.role === 'admin' 
                    ? 'Administrator' 
                    : currentUser.role === 'manajer' || currentUser.role === 'manager' 
                    ? 'Manajer' 
                    : 'Staff Lapangan'}
                </span>
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
      <main className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10 overflow-hidden ${currentUser.role === 'staff' ? 'pb-24 md:pb-8' : ''}`}>
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
                userRole={currentUser.role}
              />
            )}
            {activeTab === 'patients' && <PatientManager patients={patients} />}
            {activeTab === 'trips' && (
              <TripManager trips={trips} patients={patients} userRole={currentUser.role} />
            )}
            {activeTab === 'expenses' && currentUser.role !== 'staff' && (
              <ExpenseManager expenses={expenses} trips={trips} />
            )}
            {activeTab === 'users' && currentUser.role === 'admin' && (
              <UserManager currentUser={currentUser} />
            )}
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

      {/* Bottom Navigation for Mobile (Staff only) */}
      {currentUser.role === 'staff' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200/60 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-6 py-2 flex justify-around items-center z-40 pb-safe">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabType);
                }}
                className={`flex flex-col items-center gap-1 py-1 transition-all ${
                  isActive ? 'text-red-600 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-red-600' : 'text-slate-400'}`} />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
