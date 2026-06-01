/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Defensive check to see if the Firebase credentials are populated
export const isFirebaseConfigured = !!(
  firebaseConfig &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey &&
  firebaseConfig.projectId !== ""
);

let appInstance;
let dbInstance = null;
let authInstance = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId || undefined);
    authInstance = getAuth(appInstance);
  } catch (error) {
    console.error("Firebase initialization failed, working in local mode:", error);
  }
}

export const db = dbInstance;
export const auth = authInstance;
