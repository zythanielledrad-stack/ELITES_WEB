
// =========================
// CREATE MODAL
// =========================
const modal = document.createElement("div");
modal.id = "tipModal";
modal.innerHTML = `
  <div class="modal-content">
    <span id="closeModal" class="close-btn">&times;</span>

    <h2>Support / Tip</h2>

    <p>Send via GCash:</p>
    <h3>09939958854</h3>

    <img src="qr.png" class="qr" />

    <p>Thank you ❤️</p>
  </div>
`;

document.body.appendChild(modal);

// =========================
// ADD STYLES
// =========================
const style = document.createElement("style");
style.textContent = `
  #tipModal {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }

  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 12px;
    width: 300px;
    text-align: center;
    position: relative;
  }

  .close-btn {
    position: absolute;
    right: 10px;
    top: 5px;
    font-size: 22px;
    cursor: pointer;
  }

  .qr {
    width: 180px;
    margin-top: 10px;
  }

  #tipBtn {
    padding: 10px 14px;
    border: none;
    background: #ff4d6d;
    color: white;
    border-radius: 8px;
    cursor: pointer;
  }
`;
document.head.appendChild(style);

// =========================
// LOGIC
// =========================
const modalEl = document.getElementById("tipModal");
const closeBtn = modal.querySelector("#closeModal");
const tipBtn = document.getElementById("tipBtn");

function openModal() {
  modalEl.style.display = "flex";
}

function closeModal() {
  modalEl.style.display = "none";
}

// OPEN (button click)
tipBtn.addEventListener("click", openModal);

// CLOSE
closeBtn.addEventListener("click", closeModal);

// CLICK OUTSIDE
window.addEventListener("click", (e) => {
  if (e.target === modalEl) {
    closeModal();
  }
});