// Admin & Doctor Management Dashboard

let adminFilters = {
  search: '',
  status: '',
  date: ''
};

async function loadAdminDashboard() {
  await Promise.all([
    loadAdminStats(),
    loadAdminAppointments()
  ]);
}

// Fetch KPI metrics
async function loadAdminStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (data.success) {
      const s = data.data;
      document.getElementById('adm-total-appts').textContent = s.totalAppointments || 0;
      document.getElementById('adm-today-appts').textContent = s.todayAppointments || 0;
      document.getElementById('adm-confirmed-appts').textContent = s.confirmedAppointments || 0;
      document.getElementById('adm-completed-appts').textContent = s.completedAppointments || 0;
      document.getElementById('adm-revenue').textContent = `₹${(s.totalRevenue || 0).toLocaleString('en-IN')}`;
    }
  } catch (err) {
    console.error('Failed to load admin stats:', err);
  }
}

// Fetch and render appointments list
async function loadAdminAppointments() {
  const tbody = document.getElementById('admin-table-body');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading appointment records...</td></tr>';

  try {
    const params = new URLSearchParams();
    if (adminFilters.search) params.append('search', adminFilters.search);
    if (adminFilters.status) params.append('status', adminFilters.status);
    if (adminFilters.date) params.append('date', adminFilters.date);

    const res = await fetch(`/api/appointments?${params.toString()}`);
    const data = await res.json();

    if (!data.success || !data.data || data.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No appointment records matching criteria.</td></tr>';
      return;
    }

    tbody.innerHTML = data.data.map(appt => {
      let statusColor = '#065f46';
      let statusBg = '#d1fae5';
      if (appt.status === 'Completed') { statusColor = '#0369a1'; statusBg = '#e0f2fe'; }
      if (appt.status === 'Cancelled') { statusColor = '#991b1b'; statusBg = '#fee2e2'; }

      return `
        <tr>
          <td>
            <strong style="font-family: monospace; color: var(--primary);">${appt.reference_no}</strong><br>
            <small style="color: var(--text-light);">${appt.created_at ? appt.created_at.split(' ')[0] : ''}</small>
          </td>
          <td>
            <strong>${appt.patient_name}</strong> (${appt.patient_age}y, ${appt.patient_gender})<br>
            <small style="color: var(--text-muted);">${appt.patient_phone} • <span style="color: var(--primary-dark); font-weight: 600;">${appt.patient_state || 'India'}</span></small>
          </td>
          <td>
            <strong>${appt.doctor_name}</strong><br>
            <small style="color: var(--primary-dark); font-weight: 600;">${appt.department_name}</small>
          </td>
          <td>
            <div>📅 ${appt.appointment_date}</div>
            <div style="font-size: 0.82rem; color: var(--secondary); font-weight: 600;">⏰ ${appt.appointment_time}</div>
          </td>
          <td>
            <strong>₹${appt.fee}</strong>
          </td>
          <td>
            <select
              class="status-select"
              style="background: ${statusBg}; color: ${statusColor}; border-color: ${statusColor};"
              onchange="changeAppointmentStatus(${appt.id}, this.value)"
            >
              <option value="Confirmed" ${appt.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Completed" ${appt.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Cancelled" ${appt.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>
            <button
              class="btn-cancel-appt"
              style="padding: 0.25rem 0.6rem; font-size: 0.78rem;"
              onclick="adminCancelAppointment(${appt.id})"
              ${appt.status === 'Cancelled' ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}
            >
              Cancel
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 2rem;">Error fetching appointments.</td></tr>';
  }
}

// Change status via dropdown
async function changeAppointmentStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();
    if (data.success) {
      showToast(`Status updated to ${newStatus}`, 'success');
      loadAdminStats();
      loadAdminAppointments();
    } else {
      showToast(data.message || 'Failed to update status', 'error');
    }
  } catch (err) {
    showToast('Network error while updating status', 'error');
  }
}

// Cancel appointment from admin
async function adminCancelAppointment(id) {
  if (!confirm('Are you sure you want to cancel this appointment?')) return;

  try {
    const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Appointment cancelled successfully', 'success');
      loadAdminStats();
      loadAdminAppointments();
    }
  } catch (err) {
    showToast('Failed to cancel appointment', 'error');
  }
}

// Admin filter handlers
function onAdminSearchInput(val) {
  adminFilters.search = val.trim();
  loadAdminAppointments();
}

function onAdminStatusFilter(val) {
  adminFilters.status = val;
  loadAdminAppointments();
}

function onAdminDateFilter(val) {
  adminFilters.date = val;
  loadAdminAppointments();
}

function clearAdminFilters() {
  document.getElementById('admin-search-input').value = '';
  document.getElementById('admin-status-filter').value = '';
  document.getElementById('admin-date-filter').value = '';
  adminFilters = { search: '', status: '', date: '' };
  loadAdminAppointments();
}

// Export / Print current appointments roster to CSV
function exportAdminTable() {
  const tbody = document.getElementById('admin-table-body');
  if (!tbody || tbody.innerText.includes('No appointment records')) {
    showToast('No appointment records to export', 'error');
    return;
  }

  try {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length === 0) {
      showToast('No records available to export', 'error');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Reference No,Patient Name,Phone,State,Doctor,Department,Date,Time,Fee (INR),Status\n';

    rows.forEach(r => {
      const cols = r.querySelectorAll('td');
      if (cols.length >= 6) {
        const ref = cols[0].querySelector('strong')?.textContent || '';
        const patientFull = cols[1].querySelector('strong')?.textContent || '';
        const contactState = cols[1].querySelector('small')?.textContent || '';
        const docName = cols[2].querySelector('strong')?.textContent || '';
        const dept = cols[2].querySelector('small')?.textContent || '';
        const date = cols[3].querySelector('div:first-child')?.textContent?.replace('📅', '').trim() || '';
        const time = cols[3].querySelector('div:last-child')?.textContent?.replace('⏰', '').trim() || '';
        const fee = cols[4].querySelector('strong')?.textContent?.replace('₹', '').trim() || '';
        const status = cols[5].querySelector('select')?.value || '';

        csvContent += `"${ref}","${patientFull}","${contactState}","${docName}","${dept}","${date}","${time}","${fee}","${status}"\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AarogyaCare_GH_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Appointment roster exported to CSV successfully', 'success');
  } catch (err) {
    showToast('Failed to export roster', 'error');
  }
}

// Modal: Add New Doctor
function openAddDoctorModal() {
  // Populate departments select
  const select = document.getElementById('new-doc-dept');
  if (select && AppState.departments.length > 0) {
    select.innerHTML = '<option value="">-- Select Department --</option>';
    AppState.departments.forEach(d => {
      select.innerHTML += `<option value="${d.id}">${d.name}</option>`;
    });
  }
  document.getElementById('add-doctor-modal').classList.add('active');
}

function closeAddDoctorModal() {
  document.getElementById('add-doctor-modal').classList.remove('active');
  document.getElementById('add-doctor-form').reset();
}

async function submitNewDoctor(e) {
  e.preventDefault();

  const name = document.getElementById('new-doc-name').value.trim();
  const department_id = document.getElementById('new-doc-dept').value;
  const specialty = document.getElementById('new-doc-specialty').value.trim();
  const qualification = document.getElementById('new-doc-qual').value.trim();
  const experience_years = parseInt(document.getElementById('new-doc-exp').value, 10);
  const fee = parseFloat(document.getElementById('new-doc-fee').value);
  const available_days = document.getElementById('new-doc-days').value.trim();
  const time_start = document.getElementById('new-doc-start').value;
  const time_end = document.getElementById('new-doc-end').value;
  const email = document.getElementById('new-doc-email').value.trim();
  const phone = document.getElementById('new-doc-phone').value.trim();

  if (!name || !department_id || !specialty || !qualification || !fee) {
    showToast('Please fill out all required doctor fields', 'error');
    return;
  }

  const payload = {
    name,
    department_id: parseInt(department_id, 10),
    specialty,
    qualification,
    experience_years: experience_years || 5,
    fee,
    available_days: available_days || 'Mon, Tue, Wed, Thu, Fri',
    time_start: time_start || '09:00',
    time_end: time_end || '17:00',
    email,
    phone
  };

  try {
    const res = await fetch('/api/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      showToast('New Doctor successfully added!', 'success');
      closeAddDoctorModal();
      loadAdminStats();
      loadDoctorsView();
    } else {
      showToast(data.message || 'Failed to add doctor', 'error');
    }
  } catch (err) {
    showToast('Network error while saving doctor', 'error');
  }
}
