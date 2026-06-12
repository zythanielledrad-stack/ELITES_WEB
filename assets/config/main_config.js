// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyAmzy_8B2h_sTtAKE2dVgfl2K-OXd5TVZg",
  authDomain: "voting-890f2.firebaseapp.com",
  projectId: "voting-890f2"
};

/* ================= INITIALIZE ================= */
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ================= EXPORT ================= */
export { db };