/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order } from '../types';
import { isFirebaseConfigured, db } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

// Custom error handling helper for Firebase Firestore
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null, // Since we are using form client-side access, auth can be anonymous or null
      email: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const LOCAL_STORAGE_KEY = 'siparis_formu_orders';

// Helper to load fallback local state
function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Local storage read error:', e);
    return [];
  }
}

// Helper to save fallback local state
function saveLocalOrders(orders: Order[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Local storage write error:', e);
  }
}

export async function saveOrder(order: Order): Promise<void> {
  if (isFirebaseConfigured && db) {
    // Import Firestore primitives dynamically to ensure non-blocking loading
    const { doc, setDoc } = await import('firebase/firestore');
    const path = `orders/${order.id}`;
    try {
      await setDoc(doc(db, 'orders', order.id), {
        ...order,
        createdAt: order.createdAt // Keep as ISO string or convert to Timestamp
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  } else {
    // Local memory state
    const current = getLocalOrders();
    // Exclude existing copy if any
    const filtered = current.filter(o => o.id !== order.id);
    filtered.unshift(order); // Add to beginning (newest first)
    saveLocalOrders(filtered);
  }
}

export async function getOrders(): Promise<Order[]> {
  if (isFirebaseConfigured && db) {
    const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
    const path = 'orders';
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: Order[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as Order);
      });
      return list;
    } catch (e) {
      // Fallback to local on connection failures
      console.warn("Firestore fetch failed, falling back to local storage:", e);
      return getLocalOrders();
    }
  } else {
    return getLocalOrders();
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  if (isFirebaseConfigured && db) {
    const { doc, updateDoc } = await import('firebase/firestore');
    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  } else {
    const orders = getLocalOrders();
    const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
    saveLocalOrders(updated);
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const path = `orders/${orderId}`;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  } else {
    const orders = getLocalOrders();
    const filtered = orders.filter(o => o.id !== orderId);
    saveLocalOrders(filtered);
  }
}
