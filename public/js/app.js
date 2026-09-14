// Global Application State & Utilities

const AppState = {
  activeTab: 'home',
  departments: [],
  doctors: [],
  selectedDoctor: null,
  selectedDate: null,
  selectedSlot: null
};

// Toast notification system
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Navigation Tab Switcher
function switchTab(tabId) {
  AppState.activeTab = tabId;

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update tab panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `tab-${tabId}`);
  });

  // Trigger tab-specific refresh
  if (tabId === 'home') {
    loadHomeStats();
  } else if (tabId === 'doctors') {
    loadDoctorsView();
  } else if (tabId === 'booking') {
    initBookingWizard();
  } else if (tabId === 'admin') {
    loadAdminDashboard();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load quick statistics for home hero
async function loadHomeStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (data.success) {
      const stats = data.data;
      document.getElementById('home-stat-doctors').textContent = stats.totalDoctors || '8+';
      document.getElementById('home-stat-dept').textContent = stats.totalDepartments || '6';
      document.getElementById('home-stat-appts').textContent = stats.totalAppointments || '0';
      document.getElementById('home-stat-rating').textContent = '4.9 ★';
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// Indian States (28) and Union Territories (8) Data
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const INDIAN_UTS = [
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi (NCT)", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

function selectStateAndBook(stateName) {
  switchTab('booking');
  setTimeout(() => {
    const select = document.getElementById('patient-state');
    if (select) {
      select.value = stateName;
      if (typeof onStateChange === 'function') onStateChange(stateName);
    }
    showToast(`Selected ${stateName} - District GH Network`, 'info');
  }, 100);
}

function loadHomeStates() {
  const statesContainer = document.getElementById('home-states-pills');
  const utsContainer = document.getElementById('home-uts-pills');

  if (statesContainer) {
    statesContainer.innerHTML = INDIAN_STATES.map(st => `
      <button class="filter-pill" onclick="selectStateAndBook('${st}')">
        📍 ${st}
      </button>
    `).join('');
  }

  if (utsContainer) {
    utsContainer.innerHTML = INDIAN_UTS.map(ut => `
      <button class="filter-pill" onclick="selectStateAndBook('${ut}')">
        🏛️ ${ut}
      </button>
    `).join('');
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Setup navigation listeners
  document.querySelectorAll('[data-tab]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = el.dataset.tab;
      if (tab) switchTab(tab);
      // Close mobile menu if open
      const navLinks = document.getElementById('nav-links');
      if (navLinks) navLinks.classList.remove('open');
    });
  });

  // Mobile menu toggle
  const toggleBtn = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Load initial home stats & all Indian states
  loadHomeStats();
  loadHomeStates();

  // Splash Screen Transition: Display logo & name, then smoothly reveal home page
  const splash = document.getElementById('splash-screen');
  if (splash) {
    setTimeout(() => {
      splash.classList.add('hidden');
    }, 1800);
  }
});
