
const API_URL = "https://script.google.com/macros/s/AKfycbx45XFqg_XK98AmqQSLmiTRIxgkYsZ2tkyN2EoddjVz2r69f9KDqPSMK6ScqIA-ymesFw/exec";

let birthdayData = [];
let filteredData = [];
let lastHash = "";

document.addEventListener("DOMContentLoaded", () => {
    loadBirthdays();

    // 🔥 REAL TIME SYNC (5 seconds)
    setInterval(loadBirthdays, 5000);

    const searchInput = document.getElementById("search");

    if (searchInput) {
        searchInput.addEventListener("input", debounce(handleSearch, 300));
    }
});

// =====================
// LOAD DATA
// =====================
async function loadBirthdays() {
    try {
        showLoading(true);

        const response = await fetch(API_URL);
        const result = await response.json();

        if (!result || !result.success) {
            throw new Error("API failed");
        }

        const newData = (result.upcoming || []).map(normalizeData);

        // 🔥 create hash to detect changes
        const newHash = JSON.stringify(newData);

        // 🚀 ONLY rerender if changed
        if (newHash !== lastHash) {
            lastHash = newHash;

            birthdayData = newData;
            filteredData = [...birthdayData];

            renderDashboard(filteredData);
        }

    } catch (err) {
        console.error(err);
        showError("Failed to sync data");
    } finally {
        showLoading(false);
    }
}

// =====================
// NORMALIZE DATA
// =====================
function normalizeData(p = {}) {
    return {
        name: safe(p.name),
        birthday: safe(p.birthdate || p.birthday),
        daysRemaining: Number(p.daysRemaining ?? 0),
        image: safe(p.image),
        status: safe(p.status),
        source: safe(p.source || "UNKNOWN")
    };
}

// =====================
// DASHBOARD
// =====================
function renderDashboard(data = []) {
    const todayContainer = document.getElementById("todayBirthdays");
    const upcomingContainer = document.getElementById("upcomingTable");

    if (!todayContainer || !upcomingContainer) return;

    todayContainer.innerHTML = "";
    upcomingContainer.innerHTML = "";

    // FIXED: real birthday match (month/day)
    const now = new Date();
    const todayMonth = now.getMonth();
    const todayDay = now.getDate();

    const today = data.filter(p => {
        if (!p.birthday) return false;

        const d = new Date(p.birthday);
        if (isNaN(d)) return false;

        return d.getMonth() === todayMonth && d.getDate() === todayDay;
    });

    const upcoming = data
        .filter(p => Number(p.daysRemaining) > 0)
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

    updateStats(today, upcoming);

    renderToday(todayContainer, today);
    renderUpcoming(upcomingContainer, upcoming);
}

// =====================
// STATS
// =====================
function updateStats(today = [], upcoming = []) {

    const todayCount = document.getElementById("todayCount");
    const upcomingCount = document.getElementById("upcomingCount");
    const nextBirthday = document.getElementById("nextBirthday");

    const oldCount = document.getElementById("oldCount");
    const newCount = document.getElementById("newCount");
    const totalCount = document.getElementById("totalCount");

    const totalOld = birthdayData.filter(
        p => String(p.source).toUpperCase() === "OLD"
    ).length;

    const totalNew = birthdayData.filter(
        p => String(p.source).toUpperCase() === "NEW"
    ).length;

    if (todayCount) {
        todayCount.textContent = today.length;
    }

    if (upcomingCount) {
        upcomingCount.textContent = upcoming.length;
    }

    if (oldCount) {
        oldCount.textContent = totalOld;
    }

    if (newCount) {
        newCount.textContent = totalNew;
    }

    if (totalCount) {
        totalCount.textContent = birthdayData.length;
    }

    if (nextBirthday) {
        nextBirthday.textContent =
            upcoming.length
                ? `${upcoming[0].daysRemaining} Days`
                : "-";
    }
}

// =====================
// TODAY SECTION
// =====================
function renderToday(container, today = []) {
    if (!today.length) {
        container.innerHTML = `<p class="empty">No birthdays today</p>`;
        return;
    }

    

    container.innerHTML = today.map(person => {
        const img = convertDriveLink(person.image);

        return `
        <div class="birthday-card">
            <img
    src="${img}"
    onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect width=%22150%22 height=%22150%22 fill=%22%23222%22/%3E%3Ctext x=%2275%22 y=%2275%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E';">

            <h3>${escapeHTML(person.name)}</h3>
            <p>${escapeHTML(formatDate(person.birthday))}</p>

            <small>${person.source === "NEW" ? "🟢 NEW" : "⚪ OLD"}</small>

            <h4>🎉 Happy Birthday!</h4>
        </div>
        `;
    }).join("");

}

// =====================
// UPCOMING TABLE
// =====================
function renderUpcoming(container, upcoming = []) {

    if (!upcoming.length) {
        container.innerHTML = `<tr><td colspan="5">No upcoming birthdays</td></tr>`;
        return;
    }

    container.innerHTML = upcoming.map(person => {

        const status = String(person.status || "").trim().toUpperCase();
        const source = String(person.source || "").trim().toUpperCase();

        let statusBadge = "";

        if (status === "POSTED") {
            statusBadge = `<span class="status posted">POSTED</span>`;
        } else if (status === "SCHEDULED") {
            statusBadge = `<span class="status scheduled">SCHEDULED</span>`;
        } else {
            statusBadge = `<span class="status not-posted">NOT POSTED</span>`;
        }

        let sourceBadge = source === "NEW"
            ? `<span class="status new">NEW</span>`
            : `<span class="status old">OLD</span>`;

        const safeName = escapeHTML(person.name);
        const imageUrl = convertDriveLink(person.image);

        const button = `
        <div class="actions">

            <button onclick="viewImage('${imageUrl}')">👁 View</button>

            <button onclick="downloadImage('${imageUrl}', '${safeName}')">
                ⬇ Download
            </button>

            ${
                status === "POSTED"
                ? `<button disabled>POSTED ✓</button>`
                : `<button onclick="markPosted('${safeName}')">Mark Posted</button>`
            }

        </div>
        `;

        return `
<tr>
    <td>${safeName}</td>
    <td>${formatDate(person.birthday)}</td>
    <td>${person.daysRemaining}</td>
    <td>${statusBadge} ${sourceBadge}</td>
    <td>${button}</td>
</tr>
`;
    }).join("");
}

// =====================
// SEARCH
// =====================
function handleSearch(e) {
    const keyword = e.target.value.toLowerCase().trim();

    filteredData = !keyword
        ? birthdayData
        : birthdayData.filter(p =>
            (p.name || "").toLowerCase().includes(keyword)
        );

    renderDashboard(filteredData);
}

// =====================
// DRIVE IMAGE FIX
// =====================

// =====================
// ACTIONS
// =====================
function viewImage(url) {

    const modal = document.getElementById("imageModal");
    const img = document.getElementById("modalImage");

    if (!url) {
        alert("No image available.");
        return;
    }

    img.src = url;
    modal.style.display = "flex";
}

function closeImageModal() {

    const modal = document.getElementById("imageModal");
    const img = document.getElementById("modalImage");

    modal.style.display = "none";
    img.src = "";
}

function closeModal(e) {
    if (e.target.id === "imageModal") {
        closeImageModal();
    }
}

function downloadImage(url, name) {

    if (!url) {
        alert("No image available.");
        return;
    }

    const link = document.createElement("a");

    link.href = url;
    link.target = "_blank";
    link.download =
        `${(name || "birthday")
            .replace(/[<>:"/\\|?*]/g, "")
            .trim()}.jpg`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
}
// =====================
// GOOGLE DRIVE IMAGE FIX
// =====================
function convertDriveLink(url) {

    if (!url) {
        return "";
    }

    const match =
        url.match(/\/d\/([^/]+)/) ||
        url.match(/id=([^&]+)/) ||
        url.match(/\/file\/d\/([^/]+)/);

    if (match && match[1]) {

        const fileId = match[1];

        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }

    return url;
}
// =====================
// MARK POSTED
// =====================
async function markPosted(name) {
    if (!name) return;

    const url = `${API_URL}?action=markPosted&name=${encodeURIComponent(name)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        console.log("SERVER RESPONSE:", data);

        if (!data.success) {
            alert("Not found in sheet");
            return;
        }

        const person = birthdayData.find(
            p => p.name.toLowerCase() === name.toLowerCase()
        );

        if (person) person.status = "POSTED";

        renderDashboard(filteredData);

        alert("POSTED SUCCESS");

    } catch (err) {
        console.error(err);
        alert("Request failed");
    }
}

// =====================
// UTILITIES
// =====================
function safe(v) {
    return (v === null || v === undefined) ? "" : String(v);
}

function escapeHTML(str = "") {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function debounce(fn, delay) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
}

function showLoading(state) {
    const el = document.getElementById("loading");
    if (el) el.style.display = state ? "block" : "none";
}

function showError(msg) {
    const el = document.getElementById("error");
    if (el) el.textContent = msg;
}

function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return isNaN(d) ? date : d.toLocaleDateString();
}


document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {
        closeImageModal();
    }

});

