import {
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
  addDoc
}
from "../config/quickpantry_config.js";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";


// ================= CLOUDINARY CONFIG =================
const CLOUD_NAME = "dou3k8w8r";
const UPLOAD_PRESET = "quickpantry_uploads"; // 🔴 REQUIRED

/* ================= STATE ================= */

let currentStudent = null;
let isLoggedOut = false;

let recaptchaCache = true;
let recaptchaLoadedAt = 0;

/* ================= FORCE LOGOUT ================= */

function forceLogout(reason = "Admin logout") {
  if (isLoggedOut) return;
  isLoggedOut = true;

  alert("⚠️ You have been logged out.\n" + reason);

  localStorage.removeItem("student");
  window.location.href = "quickpantry.html";
}

/* ================= RECAPTCHA STATE (TOGGLE SYSTEM) ================= */

async function isRecaptchaEnabled() {

  try {
    const now = Date.now();

    // cache 30s
    if (recaptchaCache !== null && now - recaptchaLoadedAt < 30000) {
      return recaptchaCache;
    }

    const snap = await getDoc(doc(db, "settings", "security"));

    const enabled = snap.exists()
      ? snap.data().recaptchaEnabled !== false
      : true;

    recaptchaCache = enabled;
    recaptchaLoadedAt = now;

    return enabled;

  } catch (err) {
    console.error("reCAPTCHA load failed:", err);
    return true;
  }
}

/* ================= LIVE RECAPTCHA LISTENER ================= */

onSnapshot(doc(db, "settings", "security"), (snap) => {

  const enabled = snap.exists()
    ? snap.data().recaptchaEnabled !== false
    : true;

  recaptchaCache = enabled;
  recaptchaLoadedAt = Date.now();

  const box = document.getElementById("captchaBox");
  if (box) box.style.display = enabled ? "block" : "none";

  console.log("🔐 CAPTCHA STATE:", enabled);
});

/* ================= LOGIN (FIXED ONLY) ================= */

window.loginStudent = async function () {

  const studentNumber =
    document.getElementById("studentNumber").value.trim();

  if (!studentNumber) {
    alert("Enter student number");
    return;
  }

  try {

    /* ================= CAPTCHA CHECK ================= */

    const recaptchaEnabled = await isRecaptchaEnabled();

    if (recaptchaEnabled) {

      if (typeof grecaptcha === "undefined") {
        alert("reCAPTCHA not loaded");
        return;
      }

      if (!grecaptcha.getResponse()) {
        alert("Please complete reCAPTCHA");
        return;
      }
    }

    showLoader();

    /* ================= FETCH STUDENT ================= */

    const q = query(
      collection(db, "students"),
      where("studentNumber", "==", studentNumber)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      hideLoader();
      if (typeof grecaptcha !== "undefined") grecaptcha.reset();
      alert("Student not found");
      return;
    }

    const student = snap.docs[0].data();
    currentStudent = student;

    /* ================= TRANSPARENCY ACCESS (UNCHANGED) ================= */

    localStorage.setItem("student", JSON.stringify(student));

    localStorage.setItem(
      "quickpantry_logged_in",
      "true"
    );

    localStorage.setItem(
      "student_number",
      currentStudent.studentNumber
    );

    /* ================= SESSION ================= */

    await setDoc(
      doc(db, "active_session", currentStudent.studentNumber),
      {
        studentNumber: currentStudent.studentNumber,
        loggedIn: true,
        forceLogout: false,
        updatedAt: Date.now()
      }
    );

    loadStudent(currentStudent);

    setTimeout(() => {
      hideLoader();
      showDisclaimer();
    }, 500);

  } catch (err) {

    hideLoader();

    if (typeof grecaptcha !== "undefined") {
      grecaptcha.reset();
    }

    console.error(err);
    alert("Login error");
  }
};

/* ================= LOAD STUDENT (UNCHANGED) ================= */

function loadStudent(s) {

  document.getElementById("loginPage").style.display = "none";
  document.getElementById("portalPage").style.display = "block";

  document.getElementById("studentInfo").innerHTML = `
    <b>${s.name}</b><br>
    ${s.studentNumber}<br>
    ${s.year} - ${s.section || s.course}
  `;

  listenSession(s.studentNumber);
  listenGlobalForceLogout();
  loadFiles();        // ✅ untouched
  createWatermark();  // ✅ untouched (if you already defined it)

  checkForceLogoutNow(s.studentNumber);
}

/* ================= EVERYTHING BELOW IS YOUR ORIGINAL SYSTEM (NOT REMOVED) ================= */

/* ================= FORCE CHECK ON LOAD ================= */
async function checkForceLogoutNow(studentNumber) {
  const snap = await getDoc(doc(db, "settings", "forceLogout"));
  const data = snap.data();

  if (!data?.enabled) return;

  if (
    data.targetStudent === "ALL" ||
    data.targetStudent === studentNumber
  ) {
    forceLogout("Triggered on load");
  }
}

/* ================= GLOBAL FORCE LOGOUT ================= */
function listenGlobalForceLogout() {
  const ref = doc(db, "settings", "forceLogout");

  onSnapshot(ref, (snap) => {
    const data = snap.data();
    if (!data?.enabled) return;

    const saved = JSON.parse(localStorage.getItem("student"));
    if (!saved) return;

    if (
      data.targetStudent === "ALL" ||
      data.targetStudent === saved.studentNumber
    ) {
      forceLogout("Admin forced logout");
    }
  });
}
/* ================= SESSION LISTENER ================= */
function listenSession(studentNumber) {
  const ref = doc(db, "active_session", studentNumber);

  onSnapshot(ref, (snap) => {
    const data = snap.data();
    if (!data) return;

    if (data.forceLogout === true || data.loggedIn === false) {
      forceLogout("Session revoked");
    }
  });
}


/* ================= FILES ================= */
let selectedCategory = "all";
let searchText = "";

// priority order (MODULE FIRST)
const categoryPriority = {
  module: 1,
  reviewer: 2,
  notes: 3,
  activity: 4
};

function loadFiles() {
  const q = query(collection(db, "quick_pantry"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {
    const list = document.getElementById("fileList");

    let dataList = snap.docs.map(d => d.data());

    // ================= FILTER BY CATEGORY =================
    if (selectedCategory !== "all") {
      dataList = dataList.filter(d => d.category === selectedCategory);
    }

    // ================= SEARCH FILTER =================
    if (searchText.trim() !== "") {
      const search = searchText.toLowerCase();

      dataList = dataList.filter(d =>
        (d.title || "").toLowerCase().includes(search)
      );
    }

    // ================= AUTO SORT (MODULE FIRST) =================
    dataList.sort((a, b) => {
      const aPriority = categoryPriority[a.category] || 99;
      const bPriority = categoryPriority[b.category] || 99;

      return aPriority - bPriority;
    });

    // ================= RENDER =================
    list.innerHTML = dataList.map(data => `
      <div class="file-card">
        <div class="badge">${data.category}</div>
        <h4>${data.title}</h4>
        <p>${data.description || ""}</p>

        <button onclick='openPreview(${JSON.stringify(data)})'>
          Preview
        </button>
      </div>
    `).join("");
  });
}

/* ================= FILE VIEW LOGGER (FIXED) ================= */
async function logFileView(fileData) {

  try {

    const student =
      JSON.parse(localStorage.getItem("student"));

    if (!student) return;

    const studentNumber =
      student.studentNumber;

    const uniqueId =
      `${studentNumber}_${Date.now()}`;

    await setDoc(
      doc(db, "file_views", uniqueId),
      {
        studentName: student.name || "Unknown",
        studentNumber,

        fileTitle:
          fileData.title || "Untitled",

        fileUrl:
          fileData.fileUrl || "",

        category:
          fileData.category || "unknown",

        viewedAt: Date.now(),

        device: navigator.userAgent
      }
    );

    console.log("📊 View logged");

  } catch (err) {

    console.error(
      "Logging failed:",
      err
    );

  }

}



/* ================= PREVIEW ================= */
/* ================= PREVIEW ================= */
window.openPreview = async function (data) {

  const modal =
    document.getElementById("modal");

  const frame =
    document.getElementById("frame");

  const title =
    document.getElementById("title");

  modal.style.display = "flex";

  title.textContent =
    data.title || "Preview";

  frame.src = "";

  let url = data.fileUrl || "";

  try {

    /* ================= BLOCK THIRD PARTY EDIT / DOWNLOAD ================= */

    // GOOGLE DOCS
    if (url.includes("docs.google.com")) {

      // FORCE PREVIEW ONLY
      url = url
        .replace("/edit", "/preview")
        .replace("/view", "/preview");

      frame.src = url;

    }

    // PDF FILES
    else if (url.toLowerCase().includes(".pdf")) {

      // DIRECT PDF ONLY
      frame.src = url + "#toolbar=0&navpanes=0&scrollbar=0";

    }

    /* ================= OFFICE FILES ================= */
else if (

  url.includes(".doc") ||
  url.includes(".docx") ||
  url.includes(".ppt") ||
  url.includes(".pptx") ||
  url.includes(".xls") ||
  url.includes(".xlsx")

) {

  // VIEW ONLY MODE
  frame.src =
    "https://view.officeapps.live.com/op/embed.aspx?src=" +
    encodeURIComponent(url);

}

    // IMAGE FILES
    else if (

      url.includes(".jpg") ||
      url.includes(".jpeg") ||
      url.includes(".png") ||
      url.includes(".webp")

    ) {

      frame.src = url;

    }

    // DEFAULT
    else {

      frame.src = url;

    }

    /* ================= LOADED ================= */

    frame.onload = async () => {

      console.log("✅ File loaded");

      await logFileView(data);

    };

    /* ================= ERROR ================= */

    frame.onerror = () => {

      console.error("❌ Preview failed");

      alert(
        "Preview failed.\nThe file may not allow embedding."
      );

    };

    createWatermark();

    enableViewerLock();

  } catch (err) {

    console.error(err);

    alert("Error opening file.");

  }

};

/* ================= CLOSE ================= */

window.closePreview = function () {

  const modal =
    document.getElementById("modal");

  const frame =
    document.getElementById("frame");

  modal.style.display = "none";

  frame.src = "";

};

let viewerLockEnabled = false;

window.enableViewerLock = function () {

  // PREVENT MULTIPLE LISTENERS
  if (viewerLockEnabled) return;

  viewerLockEnabled = true;

  /* ================= RIGHT CLICK ================= */

  document.addEventListener(
    "contextmenu",
    function (e) {

      e.preventDefault();
      e.stopPropagation();

      return false;

    },
    true
  );

  /* ================= KEYBOARD BLOCKER ================= */

  document.addEventListener(
    "keydown",
    function (e) {

      const key =
        e.key.toLowerCase();

      // BLOCK CTRL KEYS
      if (

        e.ctrlKey && (

          key === "c" || // copy
          key === "s" || // save
          key === "p" || // print
          key === "u" || // source
          key === "a" || // select all
          key === "x" || // cut
          key === "v" || // paste
          key === "i" || // devtools
          key === "j" || // console
          key === "k"

        )

      ) {

        e.preventDefault();
        e.stopImmediatePropagation();

        return false;

      }

      // BLOCK CTRL + SHIFT
      if (

        e.ctrlKey &&
        e.shiftKey && (

          key === "i" ||
          key === "j" ||
          key === "c"

        )

      ) {

        e.preventDefault();
        e.stopImmediatePropagation();

        return false;

      }

      // BLOCK F12
      if (

        e.key === "F12"

      ) {

        e.preventDefault();
        e.stopImmediatePropagation();

        return false;

      }

      // BLOCK PRINTSCREEN
      if (

        e.key === "PrintScreen"

      ) {

        navigator.clipboard.writeText("");

        e.preventDefault();

        alert(
          "Screenshots are disabled."
        );

        return false;

      }

    },
    true
  );

  /* ================= COPY BLOCK ================= */

  document.addEventListener(
    "copy",
    function (e) {

      e.preventDefault();

      navigator.clipboard.writeText("");

      return false;

    },
    true
  );

  /* ================= CUT BLOCK ================= */

  document.addEventListener(
    "cut",
    function (e) {

      e.preventDefault();

      return false;

    },
    true
  );

  /* ================= PASTE BLOCK ================= */

  document.addEventListener(
    "paste",
    function (e) {

      e.preventDefault();

      return false;

    },
    true
  );

  /* ================= DRAG BLOCK ================= */

  document.addEventListener(
    "dragstart",
    function (e) {

      e.preventDefault();

      return false;

    },
    true
  );

  /* ================= SELECT BLOCK ================= */

  document.body.style.userSelect =
    "none";

  document.body.style.webkitUserSelect =
    "none";

  document.body.style.msUserSelect =
    "none";

  /* ================= MOBILE HOLD MENU ================= */

  document.body.style.webkitTouchCallout =
    "none";

  /* ================= IMAGE PROTECTION ================= */

  document.querySelectorAll("img")
    .forEach(img => {

      img.draggable = false;

      img.oncontextmenu = () => false;

    });

  console.log(
    "🔒 Viewer lock enabled"
  );

};

/* ================= WATERMARK (UNCHANGED) ================= */
function createWatermark() {
  const wm = document.getElementById("wm");
  wm.innerHTML = "";

  const text = currentStudent?.studentNumber || "UNKNOWN";

  for (let i = 0; i < 40; i++) {
    const s = document.createElement("span");
    s.textContent = text;

    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.color = "   rgba(36, 34, 34, 0.7)";

    wm.appendChild(s);
  }
}



/* ================= LOGOUT ================= */

window.logoutStudent = async function () {

  const s =
    JSON.parse(localStorage.getItem("student"));

  try {

    if (s?.studentNumber) {

      await setDoc(
        doc(db, "active_session", s.studentNumber),
        {
          studentNumber: s.studentNumber,
          loggedIn: false,
          forceLogout: true,
          updatedAt: Date.now()
        }
      );

    }

  } catch (err) {

    console.error("Logout error:", err);

  }

  /* ================= CLEAR ACCESS ================= */

  localStorage.removeItem("student");

  localStorage.removeItem(
    "quickpantry_logged_in"
  );

  localStorage.removeItem(
    "student_number"
  );

  /* ================= REDIRECT ================= */

  window.location.href =
    "/pages/quickpantry/quickpantry.html";

};

// ================= UPLOAD PROGRESS =================
let uploadXhr = null;

function updateProgress(percent) {
  document.getElementById("progressBar").style.width = percent + "%";
  document.getElementById("progressText").innerText = percent + "%";
}

// ================= OPEN UPLOAD MODAL PROGRESS =================
function showUploadModal() {
  const modal = document.getElementById("uploadModal");
  if (modal) modal.style.display = "flex";
}

// ================= CLOUDINARY UPLOAD (FIXED + PROGRESS) =================
window.uploadFile = async function () {

  const file = document.getElementById("fileInput").files[0];
  const title = document.getElementById("fileTitle").value;
  const description = document.getElementById("fileDescription").value;
  const category = document.getElementById("fileCategory").value;

  const student = JSON.parse(localStorage.getItem("student"));

  if (!file || !title) {
    alert("Missing file or title");
    return;
  }

  try {

    showLoader();
    updateProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", `pending/${category}`);

    uploadXhr = new XMLHttpRequest();

    uploadXhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`
    );

    // ================= PROGRESS TRACKING =================
    uploadXhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        updateProgress(percent);
      }
    };

    // ================= SUCCESS =================
    uploadXhr.onload = async function () {

      const res = JSON.parse(uploadXhr.responseText);

      if (!res.secure_url) {
        throw new Error("Upload failed");
      }

      await addDoc(collection(db, "pending_uploads"), {
        title,
        description,
        category,

        fileUrl: res.secure_url,
        filePublicId: res.public_id,

        uploadedBy: student?.studentNumber || "unknown",
        uploaderName: student?.name || "unknown",

        status: "pending",
        createdAt: Date.now()
      });

      updateProgress(100);
      hideLoader();

      alert("Upload complete! Waiting for approval.");

/* CLEAR FORM */
document.getElementById("fileTitle").value = "";
document.getElementById("fileDescription").value = "";
document.getElementById("fileCategory").value = "module";
document.getElementById("fileInput").value = "";

/* RESET PROGRESS */
updateProgress(0);

/* OPTIONAL: CLOSE MODAL */
closeUploadModal();

    };

    // ================= ERROR =================
    uploadXhr.onerror = function () {
      hideLoader();
      alert("Upload failed (network error)");
    };

    uploadXhr.send(formData);

  } catch (err) {
    hideLoader();
    console.error(err);
    alert("Upload failed");
  }
};


/* ================= UI HELPERS ================= */

function showLoader() {
  document.getElementById("loginLoader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loginLoader").style.display = "none";
}

function showDisclaimer() {
  document.getElementById("disclaimerModal").style.display = "flex";
}

window.acceptDisclaimer = function () {
  const modal = document.getElementById("disclaimerModal");
  const portal = document.getElementById("portalPage");

  if (modal) modal.style.display = "none";
  if (portal) portal.style.pointerEvents = "auto";
};


window.filterFiles = function (category) {
  selectedCategory = category;
  loadFiles();
};

window.applyFilters = function () {
  searchText = document.getElementById("searchInput").value;
  loadFiles();
};


/* ================= REFRESH SESSION ================= */

window.refreshSession = async function () {

  try {

    const savedStudent =
      JSON.parse(localStorage.getItem("student"));

    if (!savedStudent) {
      alert("No active session found");
      return;
    }

    showLoader();

    // UPDATE FIREBASE SESSION
    await setDoc(
      doc(db, "active_session", savedStudent.studentNumber),
      {
        studentNumber: savedStudent.studentNumber,
        loggedIn: true,
        forceLogout: false,
        updatedAt: Date.now()
      }
    );

    // REFRESH LOCAL STORAGE
    localStorage.setItem(
      "student",
      JSON.stringify(savedStudent)
    );

    localStorage.setItem(
      "quickpantry_logged_in",
      "true"
    );

    localStorage.setItem(
      "student_number",
      savedStudent.studentNumber
    );

    hideLoader();

    alert("✅ Session refreshed!");

  } catch (err) {

    hideLoader();

    console.error(err);

    alert("Failed to refresh session");

  }

};