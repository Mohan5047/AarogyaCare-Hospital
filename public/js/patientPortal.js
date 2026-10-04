// Patient Portal: Appointment Lookup, Timeline Tracking & Self-Service Cancellation

window.lastLookupAppointments = [];

async function searchAppointments(e) {
  if (e) e.preventDefault();

  const input = document.getElementById('lookup-query-input');
  const term = input.value.trim();

  if (!term) {
    showToast('Please enter your Reference ID or Registered Phone Number', 'error');
    return;
  }

  const resultsContainer = document.getElementById('lookup-results-container');
  resultsContainer.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-muted);">Searching your hospital records...</div>';

  try {
    const res = await fetch(`/api/appointments/lookup?query=${encodeURIComponent(term)}`);
    const data = await res.json();

    if (!data.success || !data.data || data.data.length === 0) {
      window.lastLookupAppointments = [];
      resultsContainer.innerHTML = `
        <div style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 2.5rem; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <h3 style="font-weight: 700; color: var(--text-main);">No Appointments Found</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.3rem;">
            We could not find any active or past appointments matching "<strong>${term}</strong>".
            Please double-check your Reference ID or 10-Digit Mobile Number.
          </p>
        </div>
      `;
      return;
    }

    window.lastLookupAppointments = data.data;

    resultsContainer.innerHTML = `
      <div style="margin-bottom: 1rem; font-weight: 700; color: var(--primary-dark); font-size: 0.92rem; display: flex; justify-content: space-between; align-items: center;">
        <span>Found ${data.data.length} appointment(s) for "${term}"</span>
        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Real-time District GH Records</span>
      </div>
      <div class="results-grid">
        ${data.data.map(appt => renderPatientApptCard(appt)).join('')}
      </div>
    `;

  } catch (err) {
    resultsContainer.innerHTML = '<div style="text-align: center; color: var(--danger); padding: 2rem;">Error retrieving appointment details.</div>';
  }
}

function renderPatientApptCard(appt) {
  let statusClass = 'status-confirmed';
  if (appt.status === 'Completed') statusClass = 'status-completed';
  if (appt.status === 'Cancelled') statusClass = 'status-cancelled';
  if (appt.status === 'Pending') statusClass = 'status-pending';

  const canCancel = appt.status !== 'Cancelled' && appt.status !== 'Completed';

  // Timeline step statuses
  const isCancelled = appt.status === 'Cancelled';
  const isCompleted = appt.status === 'Completed';
  const isConfirmed = appt.status === 'Confirmed';

  return `
    <div class="appointment-card" id="appt-card-${appt.id}">
      <div style="flex: 1; min-width: 260px;">
        <div class="appt-ref">${appt.reference_no}</div>
        <h3 style="font-size: 1.18rem; font-weight: 800; color: var(--primary-dark); margin-bottom: 0.25rem;">
          ${appt.doctor_name}
        </h3>
        <p style="color: var(--primary); font-size: 0.85rem; font-weight: 700; margin-bottom: 0.75rem;">
          ${appt.department_name} • ${appt.specialty}
        </p>
        <div style="font-size: 0.86rem; color: var(--text-muted); display: grid; gap: 0.3rem;">
          <div>👤 <strong>Patient:</strong> ${appt.patient_name} (${appt.patient_age}y, ${appt.patient_gender})</div>
          <div>📍 <strong>State / Region:</strong> <span style="color: var(--primary-dark); font-weight: 700;">${appt.patient_state || 'Delhi (NCT)'}</span></div>
          <div>📞 <strong>Contact:</strong> ${appt.patient_phone}</div>
          <div>📋 <strong>Symptoms / Reason:</strong> ${appt.symptoms || 'General Checkup'}</div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.85rem;">
        <div style="text-align: right;">
          <div style="font-size: 1.05rem; font-weight: 800; color: var(--primary-dark);">
            📅 ${appt.appointment_date}
          </div>
          <div style="font-size: 0.92rem; font-weight: 700; color: var(--secondary);">
            ⏰ ${appt.appointment_time}
          </div>
        </div>

        <span class="status-badge ${statusClass}">
          ● ${appt.status}
        </span>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end;">
          <button
            class="btn-hero-outline"
            style="padding: 0.4rem 0.85rem; font-size: 0.82rem; color: var(--primary-dark); border-color: var(--border); background: white;"
            onclick="viewAppointmentSlip(${appt.id})"
            title="View or print official receipt"
          >
            🖨️ View Slip
          </button>

          ${canCancel ? `
            <button class="btn-cancel-appt" onclick="cancelPatientAppointment(${appt.id}, '${appt.reference_no}')">
              Cancel
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Visual Consultation Progress Timeline -->
      <div class="tracking-timeline">
        <div class="timeline-step completed">
          <div class="timeline-circle">✓</div>
          <div class="step-text">Slot Booked</div>
        </div>

        <div class="timeline-step ${isCancelled ? '' : 'completed'}">
          <div class="timeline-circle">${isCancelled ? '✕' : '✓'}</div>
          <div class="step-text">${isCancelled ? 'Cancelled' : 'GH Confirmed'}</div>
        </div>

        <div class="timeline-step ${isCompleted ? 'completed' : (isConfirmed ? 'active' : '')}">
          <div class="timeline-circle">${isCompleted ? '✓' : (isConfirmed ? '🩺' : '○')}</div>
          <div class="step-text">${isCompleted ? 'OPD Consulted' : (isConfirmed ? 'Ready for Doctor' : 'Awaiting Visit')}</div>
        </div>

        <div class="timeline-step ${isCompleted ? 'completed' : ''}">
          <div class="timeline-circle">${isCompleted ? '✓' : '○'}</div>
          <div class="step-text">${isCompleted ? 'Prescribed & Closed' : 'Completed'}</div>
        </div>
      </div>
    </div>
  `;
}

// View existing consultation slip modal
function viewAppointmentSlip(id) {
  const appt = (window.lastLookupAppointments || []).find(a => a.id === id);
  if (appt && typeof showConfirmationModal === 'function') {
    showConfirmationModal(appt);
  } else {
    showToast('Could not load appointment slip details', 'error');
  }
}

async function cancelPatientAppointment(id, refNo) {
  if (!confirm(`Are you sure you want to cancel appointment ${refNo}?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (data.success) {
      showToast('Appointment successfully cancelled.', 'success');
      // Re-trigger search to reflect updated status
      searchAppointments();
    } else {
      showToast(data.message || 'Failed to cancel appointment', 'error');
    }
  } catch (err) {
    showToast('Network error while cancelling appointment', 'error');
  }
}
