// init.js - Admin Initialization Modal

// Add CSS styles immediately
const style = document.createElement('style');
style.textContent = `
  #initModal {
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    z-index: 999999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: opacity 0.5s ease, visibility 0.5s ease;
  }
  
  #initModal.hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
  
  .init-spinner {
    width: 80px;
    height: 80px;
    border: 6px solid rgba(59,130,246,0.2);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .init-text {
    color: #f1f5f9;
    font-size: 24px;
    font-weight: 600;
    margin-top: 30px;
    text-align: center;
  }
  
  .init-subtext {
    color: #64748b;
    font-size: 14px;
    margin-top: 12px;
  }
  
  .init-progress-bg {
    width: 280px;
    height: 6px;
    background: rgba(59,130,246,0.2);
    border-radius: 10px;
    margin-top: 25px;
    overflow: hidden;
  }
  
  .init-progress-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #3b82f6, #10b981);
    border-radius: 10px;
    transition: width 0.3s ease;
  }
  
  .init-steps {
    margin-top: 30px;
    text-align: left;
    width: 280px;
  }
  
  .init-step {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    color: #64748b;
    font-size: 14px;
  }
  
  .init-step.active {
    color: #3b82f6;
  }
  
  .init-step.done {
    color: #10b981;
  }
  
  .init-step-icon {
    width: 20px;
    text-align: center;
  }
`;
document.head.appendChild(style);

// Add modal HTML
const modal = document.createElement('div');
modal.id = 'initModal';
modal.innerHTML = `
  <div class="init-spinner"></div>
  <div class="init-text">Initializing Dashboard...</div>
  <div class="init-subtext">Please wait while we set up your dashboard</div>
  
  <div class="init-progress-bg">
    <div class="init-progress-fill" id="initProgressFill"></div>
  </div>
  
  <div class="init-steps">
    <div class="init-step" id="step1">
      <span class="init-step-icon">○</span>
      <span>Connecting to database</span>
    </div>
    <div class="init-step" id="step2">
      <span class="init-step-icon">○</span>
      <span>Loading dashboard data</span>
    </div>
    <div class="init-step" id="step3">
      <span class="init-step-icon">○</span>
      <span>Setting up real-time sync</span>
    </div>
    <div class="init-step" id="step4">
      <span class="init-step-icon">○</span>
      <span>Verifying permissions</span>
    </div>
  </div>
`;
document.body.insertBefore(modal, document.body.firstChild);

// Functions - attach to window immediately
function updateInitStep(stepNum, status) {
  const step = document.getElementById('step' + stepNum);
  if (!step) return;
  
  const icon = step.querySelector('.init-step-icon');
  step.classList.remove('active', 'done');
  
  if (status === 'active') {
    step.classList.add('active');
    icon.textContent = '◐';
  } else if (status === 'done') {
    step.classList.add('done');
    icon.textContent = '✓';
  } else {
    icon.textContent = '○';
  }
}

function setInitProgress(percent) {
  const fill = document.getElementById('initProgressFill');
  if (fill) fill.style.width = percent + '%';
}

function hideInitModal() {
  const modal = document.getElementById('initModal');
  if (modal) modal.classList.add('hidden');
}

function showInitModal() {
  const modal = document.getElementById('initModal');
  if (modal) {
    modal.classList.remove('hidden');
    setInitProgress(0);
    updateInitStep(1, '');
    updateInitStep(2, '');
    updateInitStep(3, '');
    updateInitStep(4, '');
  }
}

async function runAdminInit(callback) {
  showInitModal();
  
  // Step 1
  updateInitStep(1, 'active');
  setInitProgress(10);
  await new Promise(r => setTimeout(r, 1000));
  updateInitStep(1, 'done');
  
  // Step 2
  updateInitStep(2, 'active');
  setInitProgress(30);
  await new Promise(r => setTimeout(r, 1000));
  updateInitStep(2, 'done');
  
  // Step 3
  updateInitStep(3, 'active');
  setInitProgress(60);
  if (callback) await callback();
  await new Promise(r => setTimeout(r, 1000));
  updateInitStep(3, 'done');
  
  // Step 4
  updateInitStep(4, 'active');
  setInitProgress(80);
  await new Promise(r => setTimeout(r, 1000));
  updateInitStep(4, 'done');
  
  // Complete
  setInitProgress(100);
  setTimeout(hideInitModal, 1000);
}

// Make functions globally available
window.updateInitStep = updateInitStep;
window.setInitProgress = setInitProgress;
window.hideInitModal = hideInitModal;
window.showInitModal = showInitModal;
window.runAdminInit = runAdminInit;

console.log('Init modal loaded!');