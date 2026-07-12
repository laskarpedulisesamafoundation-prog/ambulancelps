import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Patient, Trip, Expense, AppUser } from './types';

// Collection references
const patientsCol = collection(db, 'patients');
const tripsCol = collection(db, 'trips');
const expensesCol = collection(db, 'expenses');
const appUsersCol = collection(db, 'app_users');

// ==========================================
// PATIENT (PENGGUNA) SERVICES
// ==========================================

export function subscribePatients(callback: (patients: Patient[]) => void) {
  const q = query(patientsCol, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Patient[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Patient);
      });
      callback(list);
    },
    (error) => {
      console.error('Error subscribing to patients:', error);
    }
  );
}

// Helper to remove undefined values recursively so Firestore doesn't throw errors
function cleanUndefined<T extends object>(obj: T): T {
  const clean: any = {};
  Object.keys(obj).forEach((key) => {
    const val = (obj as any)[key];
    if (val !== undefined) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        clean[key] = cleanUndefined(val);
      } else {
        clean[key] = val;
      }
    }
  });
  return clean as T;
}

export async function addPatient(patient: Omit<Patient, 'id' | 'createdAt'>) {
  const newId = doc(patientsCol).id;
  const data: Patient = {
    ...patient,
    id: newId,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'patients', newId), cleanUndefined(data));
  return data;
}

export async function updatePatient(id: string, updates: Partial<Omit<Patient, 'id' | 'createdAt'>>) {
  const ref = doc(db, 'patients', id);
  await updateDoc(ref, cleanUndefined(updates));
}

export async function deletePatient(id: string) {
  const ref = doc(db, 'patients', id);
  await deleteDoc(ref);
}

// ==========================================
// TRIP (PERJALANAN) SERVICES
// ==========================================

export function subscribeTrips(callback: (trips: Trip[]) => void) {
  const q = query(tripsCol, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Trip[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Trip);
      });
      callback(list);
    },
    (error) => {
      console.error('Error subscribing to trips:', error);
    }
  );
}

export async function addTrip(trip: Omit<Trip, 'id' | 'createdAt'>) {
  const newId = doc(tripsCol).id;
  const data: Trip = {
    ...trip,
    id: newId,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'trips', newId), cleanUndefined(data));
  return data;
}

export async function updateTrip(id: string, updates: Partial<Omit<Trip, 'id' | 'createdAt'>>) {
  const ref = doc(db, 'trips', id);
  await updateDoc(ref, cleanUndefined(updates));
}

export async function deleteTrip(id: string) {
  const ref = doc(db, 'trips', id);
  await deleteDoc(ref);
}

// ==========================================
// EXPENSE (PENGELUARAN) SERVICES
// ==========================================

export function subscribeExpenses(callback: (expenses: Expense[]) => void) {
  const q = query(expensesCol, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Expense[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Expense);
      });
      callback(list);
    },
    (error) => {
      console.error('Error subscribing to expenses:', error);
    }
  );
}

export async function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>) {
  const newId = doc(expensesCol).id;
  const data: Expense = {
    ...expense,
    id: newId,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'expenses', newId), cleanUndefined(data));
  return data;
}

export async function updateExpense(id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) {
  const ref = doc(db, 'expenses', id);
  await updateDoc(ref, cleanUndefined(updates));
}

export async function deleteExpense(id: string) {
  const ref = doc(db, 'expenses', id);
  await deleteDoc(ref);
}

// ==========================================
// APP USER (PENGGUNA SYSTEM) SERVICES
// ==========================================

export function subscribeAppUsers(callback: (users: AppUser[]) => void) {
  const q = query(appUsersCol, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AppUser[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AppUser);
      });
      callback(list);
    },
    (error) => {
      console.error('Error subscribing to app_users:', error);
    }
  );
}

export async function addAppUser(user: Omit<AppUser, 'id' | 'createdAt'>) {
  const newId = doc(appUsersCol).id;
  const data: AppUser = {
    ...user,
    id: newId,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'app_users', newId), cleanUndefined(data));
  return data;
}

export async function updateAppUser(id: string, updates: Partial<Omit<AppUser, 'id' | 'createdAt'>>) {
  const ref = doc(db, 'app_users', id);
  await updateDoc(ref, cleanUndefined(updates));
}

export async function deleteAppUser(id: string) {
  const ref = doc(db, 'app_users', id);
  await deleteDoc(ref);
}

// Seed default accounts if none exist (admin / admin123, staff / staff123)
export async function seedDefaultUsersIfEmpty() {
  try {
    const snapshot = await getDocs(appUsersCol);
    if (snapshot.empty) {
      console.log('No app users found in Firestore. Seeding default Admin and Staff accounts...');
      await addAppUser({
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'Administrator'
      });
      await addAppUser({
        username: 'staff',
        password: 'staff123',
        role: 'staff',
        name: 'Staff Lapangan'
      });
    }
  } catch (err) {
    console.error('Error seeding default users:', err);
  }
}

// Clear all demo data (patients, trips, expenses) from Firestore
export async function clearDemoData() {
  // Clear patients
  const patientsSnap = await getDocs(patientsCol);
  for (const docSnap of patientsSnap.docs) {
    await deleteDoc(doc(db, 'patients', docSnap.id));
  }

  // Clear trips
  const tripsSnap = await getDocs(tripsCol);
  for (const docSnap of tripsSnap.docs) {
    await deleteDoc(doc(db, 'trips', docSnap.id));
  }

  // Clear expenses
  const expensesSnap = await getDocs(expensesCol);
  for (const docSnap of expensesSnap.docs) {
    await deleteDoc(doc(db, 'expenses', docSnap.id));
  }
}


