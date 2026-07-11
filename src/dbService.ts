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
import { Patient, Trip, Expense } from './types';

// Collection references
const patientsCol = collection(db, 'patients');
const tripsCol = collection(db, 'trips');
const expensesCol = collection(db, 'expenses');

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

export async function addPatient(patient: Omit<Patient, 'id' | 'createdAt'>) {
  const newId = doc(patientsCol).id;
  const data: Patient = {
    ...patient,
    id: newId,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'patients', newId), data);
  return data;
}

export async function updatePatient(id: string, updates: Partial<Omit<Patient, 'id' | 'createdAt'>>) {
  const ref = doc(db, 'patients', id);
  await updateDoc(ref, updates);
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
  await setDoc(doc(db, 'trips', newId), data);
  return data;
}

export async function updateTrip(id: string, updates: Partial<Omit<Trip, 'id' | 'createdAt'>>) {
  const ref = doc(db, 'trips', id);
  await updateDoc(ref, updates);
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
  await setDoc(doc(db, 'expenses', newId), data);
  return data;
}

export async function updateExpense(id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) {
  const ref = doc(db, 'expenses', id);
  await updateDoc(ref, updates);
}

export async function deleteExpense(id: string) {
  const ref = doc(db, 'expenses', id);
  await deleteDoc(ref);
}
