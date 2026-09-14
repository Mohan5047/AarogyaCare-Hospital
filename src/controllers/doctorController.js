const db = require('../config/database');

// Helper to convert 24hr string "09:00" to minutes from midnight
function timeToMinutes(tStr) {
  const [h, m] = tStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper to convert minutes from midnight to "09:00 AM" format
function minutesToTimeStr(totalMinutes) {
  const h24 = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mStr = m < 10 ? '0' + m : m;
  const hStr = h12 < 10 ? '0' + h12 : h12;
  return `${hStr}:${mStr} ${ampm}`;
}

exports.getDepartments = (req, res) => {
  try {
    const departments = db.prepare(`
      SELECT d.*, COUNT(doc.id) as doctor_count
      FROM departments d
      LEFT JOIN doctors doc ON d.id = doc.department_id
      GROUP BY d.id
      ORDER BY d.name ASC
    `).all();

    res.json({ success: true, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDoctors = (req, res) => {
  try {
    const { department_id, search } = req.query;
    let query = `
      SELECT d.*, dept.name as department_name, dept.icon as department_icon
      FROM doctors d
      JOIN departments dept ON d.department_id = dept.id
      WHERE 1=1
    `;
    const params = [];

    if (department_id) {
      query += ' AND d.department_id = ?';
      params.push(department_id);
    }

    if (search) {
      query += ' AND (d.name LIKE ? OR d.specialty LIKE ? OR dept.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY d.rating DESC, d.experience_years DESC';

    const doctors = db.prepare(query).all(...params);
    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDoctorById = (req, res) => {
  try {
    const { id } = req.params;
    const doctor = db.prepare(`
      SELECT d.*, dept.name as department_name, dept.icon as department_icon
      FROM doctors d
      JOIN departments dept ON d.department_id = dept.id
      WHERE d.id = ?
    `).get(id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDoctorSlots = (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date query parameter is required (YYYY-MM-DD)' });
    }

    const doctor = db.prepare('SELECT * FROM doctors WHERE id = ?').get(id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Check if the doctor is available on this day of week
    const targetDate = new Date(date + 'T00:00:00');
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayStr = daysMap[targetDate.getDay()];

    const isAvailableOnDay = doctor.available_days
      .split(',')
      .map(d => d.trim().toLowerCase())
      .includes(currentDayStr.toLowerCase());

    if (!isAvailableOnDay) {
      return res.json({
        success: true,
        data: {
          doctor_id: doctor.id,
          date,
          day_of_week: currentDayStr,
          is_working_day: false,
          message: `${doctor.name} is not available on ${currentDayStr}s. Working days: ${doctor.available_days}`,
          slots: []
        }
      });
    }

    // Generate 30 minute slots from time_start to time_end
    const startMins = timeToMinutes(doctor.time_start);
    const endMins = timeToMinutes(doctor.time_end);
    const generatedSlots = [];

    for (let m = startMins; m + 30 <= endMins; m += 30) {
      generatedSlots.push(minutesToTimeStr(m));
    }

    // Query existing booked slots for this doctor on this date
    const bookedRows = db.prepare(`
      SELECT appointment_time FROM appointments
      WHERE doctor_id = ? AND appointment_date = ? AND status != 'Cancelled'
    `).all(id, date);

    const bookedTimes = new Set(bookedRows.map(r => r.appointment_time));

    const slotDetails = generatedSlots.map(timeStr => ({
      time: timeStr,
      available: !bookedTimes.has(timeStr)
    }));

    res.json({
      success: true,
      data: {
        doctor_id: doctor.id,
        date,
        day_of_week: currentDayStr,
        is_working_day: true,
        slots: slotDetails
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createDoctor = (req, res) => {
  try {
    const {
      name, department_id, specialty, qualification, experience_years,
      fee, available_days, time_start, time_end, email, phone, avatar_url
    } = req.body;

    if (!name || !department_id || !specialty || !qualification || !fee) {
      return res.status(400).json({ success: false, message: 'Missing required doctor fields' });
    }

    const result = db.prepare(`
      INSERT INTO doctors (
        department_id, name, specialty, qualification, experience_years,
        fee, rating, available_days, time_start, time_end, email, phone, avatar_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      department_id,
      name,
      specialty,
      qualification,
      experience_years || 1,
      parseFloat(fee),
      4.8,
      available_days || 'Mon, Tue, Wed, Thu, Fri',
      time_start || '09:00',
      time_end || '17:00',
      email || '',
      phone || '',
      avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'
    );

    res.status(201).json({
      success: true,
      message: 'Doctor added successfully',
      data: { id: result.lastInsertRowid }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
