const db = require('../config/database');

exports.getStats = (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const totalAppts = db.prepare('SELECT COUNT(*) as count FROM appointments').get().count;
    const todayAppts = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?').get(today).count;
    const confirmedAppts = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'Confirmed'").get().count;
    const completedAppts = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'Completed'").get().count;
    const cancelledAppts = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'Cancelled'").get().count;

    const totalDoctors = db.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
    const totalDepartments = db.prepare('SELECT COUNT(*) as count FROM departments').get().count;

    // Total estimated revenue from completed or confirmed appointments
    const revenueRow = db.prepare(`
      SELECT SUM(d.fee) as total_revenue
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.status IN ('Confirmed', 'Completed')
    `).get();

    const totalRevenue = revenueRow.total_revenue || 0;

    // Department breakdown
    const departmentBreakdown = db.prepare(`
      SELECT dept.name, COUNT(a.id) as appointment_count
      FROM departments dept
      LEFT JOIN doctors doc ON dept.id = doc.department_id
      LEFT JOIN appointments a ON doc.id = a.doctor_id
      GROUP BY dept.id
      ORDER BY appointment_count DESC
    `).all();

    res.json({
      success: true,
      data: {
        totalAppointments: totalAppts,
        todayAppointments: todayAppts,
        confirmedAppointments: confirmedAppts,
        completedAppointments: completedAppts,
        cancelledAppointments: cancelledAppts,
        totalDoctors,
        totalDepartments,
        totalRevenue,
        departmentBreakdown
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
