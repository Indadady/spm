import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously, type Auth } from "firebase/auth";
import { collection, getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/** 기존 만족도 설문(tourmaker-survey)과 같은 프로젝트·경로를 씁니다. */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDgEdSvSoByc3W2jR9LA7Ww6_QR_XmT0go",
  authDomain: "tourmaker-survey.firebaseapp.com",
  projectId: "tourmaker-survey",
  storageBucket: "tourmaker-survey.firebasestorage.app",
  messagingSenderId: "261580642469",
  appId: "1:261580642469:web:25b37070c76ab57aa2d54c",
  measurementId: "G-1XNBKXBZ0P",
};

export const SURVEY_APP_ID = "tourmaker-survey-gform";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export function getFirebase() {
  if (typeof window === "undefined") {
    return { app: null, auth: null, db: null, storage: null };
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
  return { app, auth, db, storage };
}

export async function ensureAnonAuth() {
  const { auth } = getFirebase();
  if (!auth) throw new Error("브라우저에서만 연결됩니다.");
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser;
}

export function payeeResponsesCol(payoutId: string) {
  const { db } = getFirebase();
  if (!db) throw new Error("Firestore가 없습니다.");
  return collection(
    db,
    "artifacts",
    SURVEY_APP_ID,
    "public",
    "data",
    `responses_spm_${payoutId}`
  );
}
