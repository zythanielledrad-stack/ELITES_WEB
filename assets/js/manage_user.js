
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  query,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const db = window.db;

// ================= ELEMENTS =================
const studentNumber = document.getElementById("studentNumber");
const studentName = document.getElementById("studentName");
const studentYear = document.getElementById("studentYear");
const studentCourse = document.getElementById("studentCourse");
const studentsTable = document.getElementById("studentsTable");
const requestsTable =
  document.getElementById("requestsTable");

// ================= STATE =================
let editId = null;

// ================= SAVE / UPDATE =================
window.saveUser = async function () {

  const number =
    studentNumber.value.trim();

  const name =
    studentName.value
    .trim()
    .toUpperCase();

  const year =
    studentYear.value.trim();

  const course =
    studentCourse.value.trim();

  // ================= VALIDATION =================
  if (!number || !name || !year || !course) {

    alert("❌ Please fill all fields");
    return;

  }

  // ================= NAME FORMAT =================
const namePattern =
/^[A-Z]+(?:\s[A-Z]+)*,\s[A-Z]+(?:\s[A-Z]+)*(?:\s[A-Z]+)*(?:\s(JR\.|SR\.|III))?$/;

  if (!namePattern.test(name)) {

    alert(
      "❌ Invalid name format.\n\nExample:\nDELA CRUZ, JUAN T. JR"
    );

    return;
  }

  try {

    // ================= CHECK DUPLICATES =================

    const snap =
      await getDocs(collection(db, "students"));

    let duplicateNumber = false;
    let duplicateName = false;

    snap.forEach((docSnap) => {

      const data = docSnap.data();

      // Ignore current editing document
      if (docSnap.id === editId) return;

      if (
        data.studentNumber === number
      ) {
        duplicateNumber = true;
      }

      if (
        (data.name || "").toUpperCase() === name
      ) {
        duplicateName = true;
      }

    });

    // ================= DUPLICATE ALERTS =================

    if (duplicateNumber) {

      alert(
        "❌ Student number already exists."
      );

      return;
    }

    if (duplicateName) {

      alert(
        "❌ Student already exists."
      );

      return;
    }

    // ================= UPDATE =================

    if (editId) {

      await updateDoc(
        doc(db, "students", editId),
        {

          studentNumber: number,
          name,
          year,
          course,

          updatedAt:
            new Date()

        }
      );

      alert("✅ Student updated!");

      editId = null;

    }

    // ================= ADD =================

    else {

      await addDoc(
        collection(db, "students"),
        {

          studentNumber: number,
          name,
          year,
          course,

          createdAt:
            new Date()

        }
      );

      alert("✅ Student added!");
    }

    // ================= RESET =================

    studentNumber.value = "";
    studentName.value = "";
    studentYear.value = "";
    studentCourse.value = "";

  }

  catch (err) {

    console.error(err);

    alert(
      "❌ Error: " + err.message
    );

  }

};

// ================= REALTIME LIST =================
const q =
  collection(db, "students");

onSnapshot(q, (snap) => {

  console.log("📡 Students loaded:", snap.size);

  // ✅ TOTAL STUDENTS FIX
  const totalStudentsEl = document.getElementById("totalStudents");
  if (totalStudentsEl) {
    totalStudentsEl.textContent = snap.size;
  }

  if (snap.empty) {
    studentsTable.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:#94a3b8;">
          No students found
        </td>
      </tr>
    `;
    return;
  }

  studentsTable.innerHTML = snap.docs.map((d) => {
    const data = d.data();
    const date = data.createdAt?.toDate?.().toLocaleDateString() || "Now";

    return `
<tr>

  <td class="group-checkbox-cell" style="display:none;">
    <input type="checkbox"
      class="student-check"
      value="${d.id}">
  </td>


  <td>${data.studentNumber || ""}</td>
  <td>${data.name || ""}</td>
  <td>${data.year || ""}</td>
  <td>${data.course || ""}</td>
  <td>${date}</td>

<td>
  <div style="
    display:flex;
    gap:8px;
  ">

    <button
      class="edit-btn"
      data-id="${d.id}"
      data-number="${data.studentNumber || ""}"
      data-name="${data.name || ""}"
      data-year="${data.year || ""}"
      data-course="${data.course || ""}"

      style="
        background:#3b82f6;
        color:white;
        border:none;
        padding:8px 14px;
        border-radius:8px;
        cursor:pointer;
        font-weight:600;
      ">
      ✏️ Edit
    </button>

    <button
      class="delete-btn"
      data-id="${d.id}"

      style="
        background:#ef4444;
        color:white;
        border:none;
        padding:8px 14px;
        border-radius:8px;
        cursor:pointer;
        font-weight:600;
      ">
      🗑 Delete
    </button>

  </div>
</td>

</tr>
`;
  }).join("");
});

// ================= CLICK HANDLER =================
document.addEventListener("click", (e) => {

  const editBtn = e.target.closest(".edit-btn");
  const deleteBtn = e.target.closest(".delete-btn");

  // ================= EDIT =================
  if (editBtn) {
    editId = editBtn.getAttribute("data-id");

    studentNumber.value = editBtn.getAttribute("data-number") || "";
    studentName.value = editBtn.getAttribute("data-name") || "";
    studentYear.value = editBtn.getAttribute("data-year") || "";
    studentCourse.value = editBtn.getAttribute("data-course") || "";

    console.log("✏️ Editing:", editId);

    studentNumber.focus();
    return;
  }

  // ================= DELETE =================
  if (deleteBtn) {
    const id = deleteBtn.getAttribute("data-id");

    if (!confirm("Delete this student?")) return;

    deleteDoc(doc(db, "students", id))
      .then(() => alert("✅ Deleted"))
      .catch(err => alert("❌ Delete failed: " + err.message));
  }
});


// ================= GROUP UPDATE =================
window.updateSelectedStudents = async function () {

  const enabled =
    document.getElementById("enableGroupEdit").checked;

  if (!enabled) {
    alert("Group Edit is OFF");
    return;
  }

  const year =
    document.getElementById("groupYear").value;

  const section =
    document.getElementById("groupSection")
    .value
    .trim();

  if (!year || !section) {
    alert("Please select year and section");
    return;
  }

  const checkedStudents =
    document.querySelectorAll(".student-check:checked");

  if (checkedStudents.length === 0) {
    alert("Select students first");
    return;
  }

  try {

    for (const student of checkedStudents) {

      await updateDoc(
        doc(db, "students", student.value),
        {
          year: year,
          course: section,
          updatedAt: new Date()
        }
      );
    }

    alert("✅ Group update successful");

    document.getElementById("groupYear").value = "";
    document.getElementById("groupSection").value = "";
    document.getElementById("enableGroupEdit").checked = false;

  } catch (err) {

    console.error(err);
    alert("❌ " + err.message);

  }
};


// ================= TOGGLE GROUP EDIT =================
window.toggleGroupEdit = function () {

  const enabled =
    document.getElementById("enableGroupEdit").checked;

  const container =
    document.getElementById("groupEditContainer");

  const header =
    document.getElementById("selectHeader");

  const checkboxCells =
    document.querySelectorAll(".group-checkbox-cell");

  // SHOW/HIDE GROUP PANEL
  container.style.display =
    enabled ? "block" : "none";

  // SHOW/HIDE TABLE CHECKBOX COLUMN
  header.style.display =
    enabled ? "table-cell" : "none";

  checkboxCells.forEach(cell => {
    cell.style.display =
      enabled ? "table-cell" : "none";
  });

};


// ================= GET FILTERED STUDENTS =================
async function getFilteredStudents() {

  const snap = await getDocs(collection(db, "students"));

  const year =
    document.getElementById("exportYear").value;

  const section =
    document.getElementById("exportSection")
    .value
    .trim()
    .toLowerCase();

  let students = snap.docs.map(doc => doc.data());

  // FILTER YEAR
  if (year) {
    students = students.filter(s => s.year === year);
  }

  // FILTER SECTION
  if (section) {
    students = students.filter(s =>
      (s.course || "")
      .toLowerCase()
      .includes(section)
    );
  }

  // SORT ALPHABETICALLY BY NAME
students.sort((a, b) =>
  (a.name || "").localeCompare(b.name || "")
);

  return students;
}

// ================= EXPORT EXCEL =================
window.exportStudentsExcel = async function () {

  try {

    const students = await getFilteredStudents();

    if (students.length === 0) {
      alert("No students found");
      return;
    }

    // Get selected filters
    const exportYear = document.getElementById('exportYear').value;
    const exportSection = document.getElementById('exportSection').value.trim();
    
    // Determine section name (priority: manual input > dropdown selection > "All")
    const sectionName = exportSection || exportYear || "All";
    
    // Clean section name for filename (remove spaces, special chars)
    const cleanSectionName = sectionName.replace(/[^a-zA-Z0-9]/g, "_");

    const data = students.map(s => ({
      StudentNumber: s.studentNumber || "",
      Name: s.name || "",
      Year: s.year || "",
      Section: s.course || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Add header row manually to show Section name
    const headerRow = ["Student Number", "Name", "Year", "Course"];
    XLSX.utils.sheet_add_aoa(worksheet, [headerRow], { origin: "A1" });

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sectionName // Sheet name = section
    );

    // Export with section name in filename
    XLSX.writeFile(workbook, `students_${cleanSectionName}.xlsx`);

  } catch (err) {

    console.error(err);
    alert("❌ Export failed");

  }
};

// ================= EXPORT PDF =================
window.exportStudentsPDF = async function () {

  try {

    const students = await getFilteredStudents();

    if (students.length === 0) {
      alert("No students found");
      return;
    }

    const { jsPDF } = window.jspdf;

    const docPDF = new jsPDF();

    // Get selected filters
    const exportYear = document.getElementById('exportYear').value;
    const exportSection = document.getElementById('exportSection').value.trim();
    
    // Determine section name
    const sectionName = exportSection || exportYear || "All Students";
    
    // Clean section name for filename
    const cleanSectionName = sectionName.replace(/[^a-zA-Z0-9]/g, "_");

    const tableData = students.map(s => [
      s.studentNumber || "",
      s.name || "",
      s.year || "",
      s.course || ""
    ]);

    // Header shows the section name
    docPDF.text(
      `Student List - ${sectionName}`,
      14,
      15
    );

    docPDF.autoTable({
      startY: 25,

      head: [[
        "Student Number",
        "Name",
        "Year",
        "Course"
      ]],

      body: tableData,
      
      // Optional: Style the header
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold'
      }
    });

    // Export with section name in filename
    docPDF.save(`students_${cleanSectionName}.pdf`);

  } catch (err) {

    console.error(err);
    alert("❌ PDF export failed");

  }
};

/*======IMPORT  EXCEL=====*/

function importStudents() {
  const fileInput = document.getElementById("excelStudentsFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("❌ Please select an Excel file first!");
    return;
  }

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const header = rows[0].map(h => h.toString().toLowerCase());

      const getIndex = (key) =>
        header.findIndex(h => h.includes(key));

      const idxNumber = getIndex("studentnumber");
      const idxName = getIndex("name");
      const idxYear = getIndex("year");
      const idxCourse = getIndex("course");

      let count = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        if (!row[idxNumber] || !row[idxName]) continue;

        await addDoc(collection(db, "students"), {
          studentNumber: row[idxNumber],
          name: row[idxName],
          year: row[idxYear] || "",
          course: row[idxCourse] || "",
          createdAt: new Date()
        });

        count++;
      }

      alert(`✅ Imported ${count} students successfully!`);

    } catch (err) {
      console.error(err);
      alert("❌ Import failed: " + err.message);
    }
  };

  reader.readAsArrayBuffer(file);
}

// make global
window.importStudents = importStudents;


// ================= LOAD REQUESTS =================

onSnapshot(
  collection(db, "student_requests"),

  (snap) => {

    if (snap.empty) {

      requestsTable.innerHTML = `

        <tr>

          <td
            colspan="6"
            style="
              text-align:center;
              padding:20px;
              color:#94a3b8;
            "
          >

            No pending requests

          </td>

        </tr>

      `;

      return;
    }

    requestsTable.innerHTML =
      snap.docs.map((d) => {

      const data =
        d.data();

const rawDate =
  data.createdAt ||
  data.approvedAt;

const date =
  rawDate
  ? rawDate.toDate().toLocaleDateString()
  : "Now";

      return `

<tr>

  <td>
    ${data.studentNumber || ""}
  </td>

  <td>
    ${data.name || ""}
  </td>

  <td>
    ${data.year || ""}
  </td>

  <td>
    ${data.course || ""}
  </td>

  <td>
    ${date}
  </td>

  <td>

    <div
      style="
        display:flex;
        gap:8px;
      "
    >

      <button

        class="approve-btn"

        data-id="${d.id}"

        data-number="${data.studentNumber}"

        data-name="${data.name}"

        data-year="${data.year}"

        data-course="${data.course}"

        style="
          background:#16a34a;
          color:white;
          border:none;
          padding:8px 14px;
          border-radius:8px;
          cursor:pointer;
          font-weight:600;
        "
      >

        ✅ Approve

      </button>

      <button

        class="reject-btn"

        data-id="${d.id}"

        style="
          background:#ef4444;
          color:white;
          border:none;
          padding:8px 14px;
          border-radius:8px;
          cursor:pointer;
          font-weight:600;
        "
      >

        ❌ Reject

      </button>

    </div>

  </td>

</tr>

`;

    }).join("");

});

// ================= CLICK EVENTS =================

document.addEventListener(
  "click",

  async (e) => {

    // ================= APPROVE =================

    const approveBtn =
      e.target.closest(".approve-btn");

    if (approveBtn) {

      try {

        const id =
          approveBtn.getAttribute("data-id");

const studentData = {

  studentNumber:
    approveBtn.getAttribute("data-number"),

  name:
    approveBtn.getAttribute("data-name"),

  year:
    approveBtn.getAttribute("data-year"),

  course:
    approveBtn.getAttribute("data-course"),

  createdAt:
    new Date(),

  approvedAt:
    new Date()

};

        // ================= SAVE TO STUDENTS =================

        await addDoc(
          collection(db, "students"),
          studentData
        );

        // ================= REMOVE REQUEST =================

        await deleteDoc(
          doc(db, "student_requests", id)
        );

        alert(
          "✅ Student approved"
        );

      }

      catch (err) {

        console.error(err);

        alert(
          "❌ " + err.message
        );

      }

    }

    // ================= REJECT =================

    const rejectBtn =
      e.target.closest(".reject-btn");

    if (rejectBtn) {

      const id =
        rejectBtn.getAttribute("data-id");

      if (
        !confirm(
          "Reject this request?"
        )
      ) return;

      try {

        await deleteDoc(
          doc(db, "student_requests", id)
        );

        alert(
          "✅ Request rejected"
        );

      }

      catch (err) {

        console.error(err);

        alert(
          "❌ " + err.message
        );

      }

    }

});
