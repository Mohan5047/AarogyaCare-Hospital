// Appointment Booking Wizard Logic

let bookingData = {
  departmentId: '',
  doctorId: null,
  doctorObj: null,
  date: '',
  timeSlot: '',
  fee: 0
};

// Initialize Booking View
async function initBookingWizard() {
  await loadDepartmentsDropdown();
  setupDatePicker();
  updateBookingStepper();
}

// Update 3-step visual stepper
function updateBookingStepper() {
  const step1 = document.getElementById('step-ind-1');
  const step2 = document.getElementById('step-ind-2');
  const step3 = document.getElementById('step-ind-3');

  if (!step1 || !step2 || !step3) return;

  step1.className = 'stepper-step';
  step2.className = 'stepper-step';
  step3.className = 'stepper-step';

  if (!bookingData.doctorId) {
    step1.classList.add('active');
  } else if (!bookingData.timeSlot) {
    step1.classList.add('completed');
    step2.classList.add('active');
  } else {
    step1.classList.add('completed');
    step2.classList.add('completed');
    step3.classList.add('active');
  }
}

// Load Departments into dropdown
async function loadDepartmentsDropdown() {
  try {
    const res = await fetch('/api/departments');
    const data = await res.json();
    if (data.success) {
      AppState.departments = data.data;
      const deptSelect = document.getElementById('book-dept-select');
      if (deptSelect) {
        deptSelect.innerHTML = '<option value="">-- Choose Medical Department --</option>';
        data.data.forEach(d => {
          deptSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`;
        });
      }
    }
  } catch (err) {
    showToast('Failed to load departments', 'error');
  }
}

// Setup Date Picker to restrict to today and next 30 days
function setupDatePicker() {
  const dateInput = document.getElementById('book-date-input');
  if (!dateInput) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const minDate = `${yyyy}-${mm}-${dd}`;

  // Max date is 30 days from now
  const maxDateObj = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const maxYear = maxDateObj.getFullYear();
  const maxMm = String(maxDateObj.getMonth() + 1).padStart(2, '0');
  const maxDd = String(maxDateObj.getDate()).padStart(2, '0');
  const maxDate = `${maxYear}-${maxMm}-${maxDd}`;

  dateInput.min = minDate;
  dateInput.max = maxDate;
}

// On Department selection changed
async function onDepartmentChange(deptId) {
  bookingData.departmentId = deptId;
  bookingData.doctorId = null;
  bookingData.doctorObj = null;
  bookingData.timeSlot = '';

  const docSelect = document.getElementById('book-doc-select');
  docSelect.innerHTML = '<option value="">-- Choose Specialist / Doctor --</option>';
  docSelect.disabled = !deptId;

  // Clear slots
  const slotsBox = document.getElementById('slots-container');
  if (slotsBox) slotsBox.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 1rem;">Select doctor and date to view slots</div>';

  updateSummaryCard();
  updateBookingStepper();

  if (!deptId) return;

  try {
    const res = await fetch(`/api/doctors?department_id=${deptId}`);
    const data = await res.json();
    if (data.success) {
      if (data.data.length === 0) {
        docSelect.innerHTML = '<option value="">No doctors available in this department</option>';
        return;
      }
      data.data.forEach(doc => {
        docSelect.innerHTML += `<option value="${doc.id}">${doc.name} (${doc.specialty}) - ₹${doc.fee}</option>`;
      });
    }
  } catch (err) {
    showToast('Failed to load doctors', 'error');
  }
}

// On Doctor selection changed
async function onDoctorChange(doctorId) {
  if (!doctorId) {
    bookingData.doctorId = null;
    bookingData.doctorObj = null;
    updateSummaryCard();
    updateBookingStepper();
    return;
  }

  try {
    const res = await fetch(`/api/doctors/${doctorId}`);
    const data = await res.json();
    if (data.success) {
      bookingData.doctorId = doctorId;
      bookingData.doctorObj = data.data;
      bookingData.fee = data.data.fee;

      updateSummaryCard();
      updateBookingStepper();

      // If date is already chosen, reload slots
      const dateInput = document.getElementById('book-date-input');
      if (dateInput && dateInput.value) {
        loadDoctorSlots(doctorId, dateInput.value);
      }
    }
  } catch (err) {
    showToast('Failed to fetch doctor details', 'error');
  }
}

// On Date selection changed
function onDateChange(dateStr) {
  bookingData.date = dateStr;
  bookingData.timeSlot = '';
  updateSummaryCard();
  updateBookingStepper();

  if (bookingData.doctorId && dateStr) {
    loadDoctorSlots(bookingData.doctorId, dateStr);
  }
}

// Load Doctor Slots from API
async function loadDoctorSlots(doctorId, dateStr) {
  const container = document.getElementById('slots-container');
  container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 1rem; color: var(--text-muted);">Checking slot availability...</div>';

  try {
    const res = await fetch(`/api/doctors/${doctorId}/slots?date=${dateStr}`);
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 1rem;">${data.message}</div>`;
      return;
    }

    const { is_working_day, message, slots } = data.data;

    if (!is_working_day) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--warning); padding: 1rem; background: var(--warning-light); border-radius: 8px;">
          📅 <strong>Doctor Not Available Today</strong><br>
          <small>${message}</small>
        </div>
      `;
      return;
    }

    if (!slots || slots.length === 0) {
      container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 1rem;">No appointment slots generated.</div>';
      return;
    }

    container.innerHTML = '';
    slots.forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `slot-btn ${slot.time === bookingData.timeSlot ? 'selected' : ''}`;
      btn.textContent = slot.time;
      btn.disabled = !slot.available;
      if (!slot.available) {
        btn.title = 'Slot already booked';
      }

      btn.addEventListener('click', () => {
        document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        bookingData.timeSlot = slot.time;
        updateSummaryCard();
        updateBookingStepper();
      });

      container.appendChild(btn);
    });

  } catch (err) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--danger);">Failed to load slots</div>';
  }
}

// On State selection changed
function onStateChange(stateVal) {
  bookingData.patientState = stateVal;
  const stateEl = document.getElementById('sum-state');
  if (stateEl) {
    stateEl.textContent = stateVal || 'Delhi (NCT)';
  }
}

// Update summary card sidebar
function updateSummaryCard() {
  const docNameEl = document.getElementById('sum-doc-name');
  const deptNameEl = document.getElementById('sum-dept-name');
  const dateEl = document.getElementById('sum-date');
  const slotEl = document.getElementById('sum-slot');
  const stateEl = document.getElementById('sum-state');
  const feeEl = document.getElementById('sum-fee');
  const submitBtn = document.getElementById('btn-confirm-booking');

  if (bookingData.doctorObj) {
    docNameEl.textContent = bookingData.doctorObj.name;
    deptNameEl.textContent = bookingData.doctorObj.department_name;
    feeEl.textContent = `₹${bookingData.doctorObj.fee}`;
  } else {
    docNameEl.textContent = 'Not selected';
    deptNameEl.textContent = 'Not selected';
    feeEl.textContent = '₹0';
  }

  dateEl.textContent = bookingData.date || 'Not selected';
  slotEl.textContent = bookingData.timeSlot || 'Not selected';

  const stateSelect = document.getElementById('patient-state');
  if (stateEl && stateSelect) {
    stateEl.textContent = stateSelect.value || 'Delhi (NCT)';
  }

  // Check if can submit
  const isValid = bookingData.doctorId && bookingData.date && bookingData.timeSlot;
  if (submitBtn) {
    submitBtn.disabled = !isValid;
  }
}

// Submit Booking Form
async function submitBooking(e) {
  e.preventDefault();

  const patient_name = document.getElementById('patient-name').value.trim();
  const patient_age = document.getElementById('patient-age').value.trim();
  const patient_gender = document.getElementById('patient-gender').value;
  const patient_phone = document.getElementById('patient-phone').value.trim();
  const patient_email = document.getElementById('patient-email').value.trim();
  const patient_state = document.getElementById('patient-state')?.value || 'Delhi (NCT)';
  const symptoms = document.getElementById('patient-symptoms').value.trim();

  if (!bookingData.doctorId || !bookingData.date || !bookingData.timeSlot) {
    showToast('Please select a doctor, date, and available time slot.', 'error');
    return;
  }

  if (!patient_name || !patient_age || !patient_gender || !patient_phone || !patient_email) {
    showToast('Please fill out all required patient details.', 'error');
    return;
  }

  const payload = {
    doctor_id: bookingData.doctorId,
    patient_name,
    patient_age: parseInt(patient_age, 10),
    patient_gender,
    patient_phone,
    patient_email,
    patient_state,
    appointment_date: bookingData.date,
    appointment_time: bookingData.timeSlot,
    symptoms: symptoms || 'General consultation'
  };

  const submitBtn = document.getElementById('btn-confirm-booking');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ Confirming Booking...';

  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.message || 'Failed to book appointment', 'error');
      // If conflict, refresh slots
      if (res.status === 409) {
        loadDoctorSlots(bookingData.doctorId, bookingData.date);
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Confirm & Book Appointment';
      return;
    }

    // Success! Show confirmation receipt modal
    showToast('Appointment booked successfully!', 'success');
    showConfirmationModal(data.data);

    // Reset form
    document.getElementById('booking-form').reset();
    bookingData.doctorId = null;
    bookingData.doctorObj = null;
    bookingData.timeSlot = '';
    bookingData.date = '';
    document.getElementById('book-doc-select').disabled = true;
    updateSummaryCard();
    updateBookingStepper();

  } catch (err) {
    showToast('Network error while booking appointment', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Confirm & Book Appointment';
  }
}

// Show Confirmation Modal with receipt
function showConfirmationModal(appointment) {
  const modal = document.getElementById('confirmation-modal');
  if (!modal) return;

  document.getElementById('receipt-token').textContent = appointment.reference_no;
  document.getElementById('receipt-patient').textContent = `${appointment.patient_name} (${appointment.patient_age}y, ${appointment.patient_gender})`;
  const stateEl = document.getElementById('receipt-state');
  if (stateEl) stateEl.textContent = appointment.patient_state || 'Delhi (NCT)';
  document.getElementById('receipt-contact').textContent = `${appointment.patient_phone} | ${appointment.patient_email}`;
  document.getElementById('receipt-doctor').textContent = appointment.doctor_name;
  document.getElementById('receipt-specialty').textContent = appointment.specialty;

  const roomEl = document.getElementById('receipt-room');
  if (roomEl) {
    roomEl.textContent = `Block A - Room 10${appointment.doctor_id || 1}`;
  }

  document.getElementById('receipt-date-time').textContent = `${appointment.appointment_date} at ${appointment.appointment_time}`;
  document.getElementById('receipt-symptoms').textContent = appointment.symptoms || 'General Consultation';
  document.getElementById('receipt-fee').textContent = `₹${appointment.fee}`;
  document.getElementById('receipt-status').textContent = appointment.status;

  modal.classList.add('active');
}

function closeConfirmationModal() {
  const modal = document.getElementById('confirmation-modal');
  if (modal) modal.classList.remove('active');
}

// Quick book action from Doctor Card
function startBookingWithDoctor(doctorId, deptId) {
  switchTab('booking');
  setTimeout(async () => {
    const deptSelect = document.getElementById('book-dept-select');
    if (deptSelect) {
      deptSelect.value = deptId;
      await onDepartmentChange(deptId);

      const docSelect = document.getElementById('book-doc-select');
      if (docSelect) {
        docSelect.value = doctorId;
        await onDoctorChange(doctorId);
      }
    }
  }, 100);
}

// Render Doctor cards
function renderDoctorCards(doctorsList) {
  const grid = document.getElementById('doctors-grid');
  if (!grid) return;

  if (!doctorsList || doctorsList.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted); background: white; border-radius: 12px; border: 1px dashed var(--border);">No specialists match your search criteria. Try a different term or department.</div>';
    return;
  }

  grid.innerHTML = doctorsList.map(doc => `
    <div class="doctor-card">
      <div class="doctor-header">
        <div class="doctor-avatar-wrap">
          <img
            src="${doc.avatar_url}"
            alt="${doc.name}"
            class="doctor-avatar"
            onerror="this.src='https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'"
          >
          <div class="doc-status-dot" title="Available for OPD"></div>
        </div>
        <div class="doctor-meta">
          <h3>${doc.name}</h3>
          <span class="doctor-specialty">${doc.specialty}</span>
          <div>
            <span class="doc-badge-verified">✓ GH Council Verified</span>
          </div>
        </div>
      </div>
      <div class="doctor-body">
        <div class="doc-info-row">
          <span>🎓</span>
          <span><strong>Degree:</strong> ${doc.qualification}</span>
        </div>
        <div class="doc-info-row">
          <span>⏱️</span>
          <span><strong>Experience:</strong> ${doc.experience_years} Years Active Practice</span>
        </div>
        <div class="doc-info-row">
          <span>📅</span>
          <span><strong>OPD Days:</strong> ${doc.available_days}</span>
        </div>
        <div class="doc-info-row">
          <span>⏰</span>
          <span><strong>Timings:</strong> ${doc.time_start} - ${doc.time_end}</span>
        </div>
        <div>
          <span class="doc-room-tag">🏛️ OPD Block A • Room 10${doc.id}</span>
        </div>
      </div>
      <div class="doctor-footer">
        <div class="doc-fee">₹${doc.fee} <span>/ visit</span></div>
        <button class="btn-book-doc" onclick="startBookingWithDoctor(${doc.id}, ${doc.department_id})">Book Visit</button>
      </div>
    </div>
  `).join('');
}

// Live real-time doctor search filter
function filterDoctorsBySearch(term) {
  const cleanTerm = (term || '').toLowerCase().trim();
  if (!cleanTerm) {
    renderDoctorCards(AppState.currentDoctorsList || AppState.allDoctors || []);
    return;
  }

  const source = AppState.currentDoctorsList || AppState.allDoctors || [];
  const filtered = source.filter(doc =>
    (doc.name && doc.name.toLowerCase().includes(cleanTerm)) ||
    (doc.specialty && doc.specialty.toLowerCase().includes(cleanTerm)) ||
    (doc.qualification && doc.qualification.toLowerCase().includes(cleanTerm)) ||
    (doc.department_name && doc.department_name.toLowerCase().includes(cleanTerm))
  );

  renderDoctorCards(filtered);
}

// Load Doctors Directory View
async function loadDoctorsView(filterDeptId = null) {
  try {
    const [deptRes, docRes] = await Promise.all([
      fetch('/api/departments'),
      fetch(filterDeptId ? `/api/doctors?department_id=${filterDeptId}` : '/api/doctors')
    ]);

    const deptData = await deptRes.json();
    const docData = await docRes.json();

    // Reset search input if exists
    const searchInput = document.getElementById('doctor-search-input');
    if (searchInput) searchInput.value = '';

    // Render department pills
    const pillsContainer = document.getElementById('doctors-dept-pills');
    if (pillsContainer && deptData.success) {
      pillsContainer.innerHTML = `
        <button class="filter-pill ${!filterDeptId ? 'active' : ''}" onclick="loadDoctorsView(null)">All Departments</button>
      `;
      deptData.data.forEach(d => {
        pillsContainer.innerHTML += `
          <button class="filter-pill ${filterDeptId == d.id ? 'active' : ''}" onclick="loadDoctorsView(${d.id})">${d.name}</button>
        `;
      });
    }

    if (docData.success) {
      if (!filterDeptId) AppState.allDoctors = docData.data;
      AppState.currentDoctorsList = docData.data;
      renderDoctorCards(docData.data);
    }
  } catch (err) {
    showToast('Failed to load doctors list', 'error');
  }
}
