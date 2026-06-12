import {
  db,
  collection,
  addDoc,
  deleteDoc,
  doc,
  setDoc
} from "../config/quickpantry_config.js";

/* ================= APPROVE ================= */
window.approveFile = async function (id, data) {

  try {

    // MOVE TO PUBLIC
    await addDoc(collection(db, "quick_pantry"), {
      ...data,
      status: "approved",
      createdAt: Date.now()
    });

    // DELETE FROM PENDING
    await deleteDoc(doc(db, "pending_uploads", id));

    // LOG
    await addDoc(collection(db, "upload_logs"), {
      action: "approved",
      fileTitle: data.title,
      studentName: data.uploaderName,
      studentNumber: data.uploadedBy,
      admin: "teacher",
      timestamp: Date.now()
    });

    alert("Approved ✔");

  } catch (err) {
    console.error(err);
  }
};

/* ================= REJECT ================= */
window.rejectFile = async function (id, data) {

  try {

    await deleteDoc(doc(db, "pending_uploads", id));

    await addDoc(collection(db, "upload_logs"), {
      action: "rejected",
      fileTitle: data.title,
      studentName: data.uploaderName,
      studentNumber: data.uploadedBy,
      admin: "teacher",
      timestamp: Date.now()
    });

    alert("Rejected ❌");

  } catch (err) {
    console.error(err);
  }
};

/* ================= CLEAR LOGS ================= */
window.clearLogs = async function () {

  const snap = await getDocs(collection(db, "upload_logs"));

  snap.forEach(async (d) => {
    await deleteDoc(doc(db, "upload_logs", d.id));
  });

  alert("Logs cleared");
};