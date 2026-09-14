const db = require('../config/database');

function generateReferenceNo() {
  const year = new Date().getFullYear();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `APT-${year}-${randNum}`;
}

exports.createAppointment = (req, res) => {
  try {
    const {
      doctor_id,
      patient_name,
      patient_age,
      patient_gender,
      patient_phone,
      patient_email,
      appointment_date,
      appointment_time,
      symptoms
    } = req.body;

    // Validate required fields
    if (
      !doctor_id ||
      !patient_name ||
      !patient_age ||
      !patient_gender ||
      !patient_phone ||
      !patient_email ||
      !appointment_date ||
      !appointment_time
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields including doctor, patient info, date, and time slot.'
      });
    }

    // Verify doctor exists
    const doctor = db.prepare(`
      SELECT d.*, dept.name as department_name
      FROM doctors d
      JOIN departments dept ON d.department_id = dept.id
      WHERE d.id = ?
    `).get(doctor_id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Selected doctor not found' });
    }

    // Check for double-booking collision
    const existing = db.prepare(`
      SELECT id FROM appointments
      WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'Cancelled'
    `).get(doctor_id, appointment_date, appointment_time);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `The slot ${appointment_time} on ${appointment_date} with ${doctor.name} is already booked. Please choose an alternative slot.`
      });
    }

    // Generate unique reference number
    let reference_no = generateReferenceNo();
    // Safety check in the rare case of reference collision
    while (db.prepare('SELECT id FROM appointments WHERE reference_no = ?').get(reference_no)) {
      reference_no = generateReferenceNo();
    }

    const patient_state = (req.body.patient_state || 'Delhi').trim();

    const insertResult = db.prepare(`
      INSERT INTO appointments (
        reference_no, doctor_id, patient_name, patient_age, patient_gender,
        patient_phone, patient_email, patient_state, appointment_date, appointment_time, symptoms, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
    `).run(
      reference_no,
      doctor_id,
      patient_name.trim(),
      parseInt(patient_age, 10),
      patient_gender,
      patient_phone.trim(),
      patient_email.trim(),
      patient_state,
      appointment_date,
      appointment_time,
      symptoms ? symptoms.trim() : 'Routine Checkup'
    );

    const createdAppointment = db.prepare(`
      SELECT a.*, d.name as doctor_name, d.specialty, d.fee, d.avatar_url, dept.name as department_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN departments dept ON d.department_id = dept.id
      WHERE a.id = ?
    `).get(insertResult.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: createdAppointment
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAppointments = (req, res) => {
  try {
    const { doctor_id, date, status, search } = req.query;

    let query = `
      SELECT a.*, d.name as doctor_name, d.specialty, d.fee, dept.name as department_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN departments dept ON d.department_id = dept.id
      WHERE 1=1
    `;
    const params = [];

    if (doctor_id) {
      query += ' AND a.doctor_id = ?';
      params.push(doctor_id);
    }

    if (date) {
      query += ' AND a.appointment_date = ?';
      params.push(date);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (search) {
      query += ` AND (
        a.patient_name LIKE ? OR
        a.patient_phone LIKE ? OR
        a.reference_no LIKE ? OR
        d.name LIKE ?
      )`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const appointments = db.prepare(query).all(...params);
    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.lookupAppointment = (req, res) => {
  try {
    const { query: searchTerm } = req.query;

    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a reference number or phone number' });
    }

    const cleanTerm = searchTerm.trim();

    const appointments = db.prepare(`
      SELECT a.*, d.name as doctor_name, d.specialty, d.fee, d.phone as doctor_phone, dept.name as department_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN departments dept ON d.department_id = dept.id
      WHERE a.reference_no = ? OR a.patient_phone = ? OR a.patient_email = ?
      ORDER BY a.appointment_date DESC, a.appointment_time ASC
    `).all(cleanTerm, cleanTerm, cleanTerm);

    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAppointmentStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const existing = db.prepare('SELECT id FROM appointments WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);

    const updated = db.prepare(`
      SELECT a.*, d.name as doctor_name, dept.name as department_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN departments dept ON d.department_id = dept.id
      WHERE a.id = ?
    `).get(id);

    res.json({
      success: true,
      message: `Appointment status updated to ${status}`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelAppointment = (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id, status FROM appointments WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    db.prepare("UPDATE appointments SET status = 'Cancelled' WHERE id = ?").run(id);

    res.json({
      success: true,
      message: 'Appointment has been cancelled successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
