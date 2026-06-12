import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const db = window.db;

// ================= CLOUDINARY CONFIG =================
const CLOUD_NAME = "dou3k8w8r";
const UPLOAD_PRESET = "QuickResources";

// ================= ELEMENTS =================
const pantryTitle = document.getElementById("pantryTitle");
const pantryCategory = document.getElementById("pantryCategory");
const pantryDescription = document.getElementById("pantryDescription");
const pantryFile = document.getElementById("pantryFile");
const pantryList = document.getElementById("pantryList");

const totalFilesEl = document.getElementById("totalFiles");

// ================= CLOUDINARY UPLOAD =================
async function uploadFile(file) {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();

  let previewUrl = data.secure_url;

  // PDF fix
  if (file.type.includes("pdf")) {
    previewUrl = data.secure_url.replace(
      "/raw/upload/",
      "/raw/upload/fl_attachment:false/"
    );
  }

  // Office files
  else if (
    file.name.endsWith(".doc") ||
    file.name.endsWith(".docx") ||
    file.name.endsWith(".ppt") ||
    file.name.endsWith(".pptx") ||
    file.name.endsWith(".xls") ||
    file.name.endsWith(".xlsx")
  ) {
    previewUrl =
      `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(data.secure_url)}`;
  }

  return {
    url: data.secure_url,
    previewUrl,
    public_id: data.public_id,
    type: file.type
  };
}

// ================= UPLOAD PANTRY FILE =================
window.uploadPantryFile = async function () {
  const title = pantryTitle.value.trim();
  const category = pantryCategory.value;
  const description = pantryDescription.value.trim();
  const file = pantryFile.files[0];

  if (!title || !file) {
    alert("❌ Title and file are required!");
    return;
  }

  try {
    const btn = document.querySelector("#quick-pantry button.primary");
    btn.disabled = true;
    btn.innerText = "Uploading...";

    const uploaded = await uploadFile(file);

    await addDoc(collection(db, "quick_pantry"), {
      title,
      category,
      description,
      fileUrl: uploaded.url,
      previewUrl: uploaded.previewUrl,
      fileType: file.type,
      fileName: file.name,
      createdAt: new Date()
    });

    alert("✅ File uploaded successfully!");

    pantryTitle.value = "";
    pantryDescription.value = "";
    pantryFile.value = "";

  } catch (err) {
    alert("❌ Upload failed: " + err.message);
  } finally {
    const btn = document.querySelector("#quick-pantry button.primary");
    btn.disabled = false;
    btn.innerText = "🚀 Upload File";
  }
};

// ================= REALTIME LIST =================
onSnapshot(collection(db, "quick_pantry"), (snap) => {

  if (totalFilesEl) totalFilesEl.textContent = snap.size;

  if (snap.empty) {
    pantryList.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748b;">
        📂 No files uploaded yet
      </div>
    `;
    return;
  }

  pantryList.innerHTML = snap.docs.map((d) => {
    const data = d.data();

    return `
      <div class="card-grid-item">
        <h4>📄 ${data.title}</h4>
        <p style="color:#3b82f6;">📁 ${data.category}</p>
        <p style="color:#94a3b8;">📎 ${data.fileName || "Unknown"}</p>
        <p style="color:#94a3b8;">${data.description || ""}</p>

        <a href="${data.fileUrl}" target="_blank"
           style="color:#10b981;font-weight:600;">
           📥 Open / Download
        </a>

        <button style="background:#ef4444"
          class="primary"
          onclick="deletePantry('${d.id}')">
          🗑 Delete
        </button>
      </div>
    `;
  }).join("");
});

// ================= DELETE =================
window.deletePantry = async function (id) {
  if (!confirm("Delete this file?")) return;

  await deleteDoc(doc(db, "quick_pantry", id));
  alert("✅ Deleted!");
};

/* ================= KICK STUDENT ================= */
window.kickStudent = async function () {
  const studentNumber = document
    .getElementById("kickStudentNumber")
    .value.trim();

  if (!studentNumber) return alert("Enter student number");

  if (!confirm(`Kick ${studentNumber}?`)) return;

  await setDoc(doc(db, "active_session", studentNumber), {
    forceLogout: true,
    loggedIn: false,
    timestamp: Date.now()
  });

  alert(`✅ ${studentNumber} kicked`);
};

/* ================= FORCE LOGOUT ALL ================= */
window.forceLogoutAll = async function () {
  if (!confirm("Logout ALL users?")) return;

  try {
    const snap = await getDocs(collection(db, "active_session"));

    const updates = snap.docs.map((d) =>
      updateDoc(doc(db, "active_session", d.id), {
        forceLogout: true,
        loggedIn: false,
        updatedAt: Date.now()
      })
    );

    await Promise.all(updates);

    alert("✅ All users logged out");
  } catch (err) {
    alert("❌ Failed: " + err.message);
  }
};

/* ================= STUDENT LAST OPEN ================= */

import {
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

let allViewLogs = [];

/* ================= LOAD LOGS ================= */

function loadStudentLastOpenDashboard() {

  const q = query(
    collection(db, "file_views"),
    orderBy("viewedAt", "desc")
  );

  onSnapshot(q, (snap) => {

    allViewLogs = [];

    snap.forEach((docu) => {

      allViewLogs.push(docu.data());

    });

    renderViewLogs(allViewLogs);

  });

}

/* ================= RENDER ================= */

function renderViewLogs(data) {

  const body =
    document.getElementById("viewLogsTable");

  if (!body) return;

  if (data.length === 0) {

    body.innerHTML = `
      <tr>
        <td colspan="6"
          style="
            text-align:center;
            padding:30px;
            color:#94a3b8;
          ">
          No logs found
        </td>
      </tr>
    `;

    return;

  }

  body.innerHTML = data.map(log => {

    const date = log.viewedAt
      ? new Date(log.viewedAt).toLocaleString()
      : "Unknown";

    return `
      <tr>

        <td>${log.studentName || "Unknown"}</td>

        <td>${log.studentNumber || "N/A"}</td>

        <td>${log.fileTitle || "Untitled"}</td>

        <td>
          <span class="device-pill">
            ${log.category || "Unknown"}
          </span>
        </td>

        <td>${date}</td>

        <td>
          <span class="device-pill">
            ${detectDevice(log.device)}
          </span>
        </td>

      </tr>
    `;

  }).join("");

}

/* ================= FILTER ================= */

window.filterViewLogs = function () {

  const keyword =
    document.getElementById("viewSearch")
    .value
    .toLowerCase()
    .trim();

  const filtered = allViewLogs.filter(log => {

    return (
      (log.studentName || "")
        .toLowerCase()
        .includes(keyword)

      ||

      (log.studentNumber || "")
        .toLowerCase()
        .includes(keyword)

      ||

      (log.fileTitle || "")
        .toLowerCase()
        .includes(keyword)
    );

  });

  renderViewLogs(filtered);

};

/* ================= DEVICE DETECTION ================= */

function detectDevice(userAgent = "") {

  const ua = userAgent.toLowerCase();

  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("windows")) return "Windows PC";
  if (ua.includes("mac")) return "Mac";

  return "Unknown Device";

}

/* ================= INIT ================= */

loadStudentLastOpenDashboard();

window.clearViewLogs = async () => {

  const confirmDelete = confirm(
    "⚠️ Are you sure you want to clear all student history logs?"
  );

  if (!confirmDelete) return;

  try {

    const snap = await getDocs(collection(db, "file_views"));

    const promises = snap.docs.map(docItem =>
      deleteDoc(doc(db, "file_views", docItem.id))
    );

    await Promise.all(promises);

    alert("✅ History cleared successfully!");

  } catch (err) {

    console.error(err);

    alert("❌ Failed to clear history!");

  }

};