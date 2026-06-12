import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  addDoc
}
from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import {
  getStorage
}
from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

/* ================= FIREBASE ================= */

const app = initializeApp({
  apiKey: "AIzaSyAmzy_8B2h_sTtAKE2dVgfl2K-OXd5TVZg",
  authDomain: "voting-890f2.firebaseapp.com",
  projectId: "voting-890f2",
  storageBucket: "voting-890f2.firebasestorage.app"
});

/* ================= SERVICES ================= */

const db =
  getFirestore(app);

const storage =
  getStorage(app);

/* ================= EXPORT ================= */

export {
  app,
  db,
  storage,

  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  addDoc,
  updateDoc
};

