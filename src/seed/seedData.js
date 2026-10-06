const db = require('../config/database');

function seedData() {
  const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get();
  if (deptCount.count > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial Indian hospital data (AarogyaCare Multispeciality Hospital)...');

  const departments = [
    { name: 'Cardiology', icon: 'heart-pulse', description: 'Advanced cardiovascular care, angiography, ECG & hypertension management by AIIMS certified cardiologists.' },
    { name: 'Neurology', icon: 'brain', description: 'Comprehensive neurological care, migraine therapy, stroke care, and spine disorder management.' },
    { name: 'Pediatrics', icon: 'baby', description: 'Complete neonatal & pediatric care, immunization schedules, and childhood wellness clinics.' },
    { name: 'Orthopedics', icon: 'bone', description: 'Joint replacement, trauma care, sports injury rehabilitation, and arthritis management.' },
    { name: 'Dermatology', icon: 'sparkles', description: 'Clinical dermatology, acne treatment, skin allergy testing, and advanced laser therapies.' },
    { name: 'General Medicine', icon: 'stethoscope', description: 'Primary consultations, diabetes & lifestyle disease management, and preventative health checkups.' },
    { name: 'Ophthalmology', icon: 'eye', description: 'Comprehensive vision tests, cataract screening, diabetic retinopathy care, and eye surgery.' },
    { name: 'Dentistry', icon: 'smile', description: 'Root canal treatment, dental implants, teeth cleaning, and orthodontic care.' }
  ];

  const insertDept = db.prepare('INSERT INTO departments (name, icon, description) VALUES (?, ?, ?)');
  for (const dept of departments) {
    insertDept.run(dept.name, dept.icon, dept.description);
  }

  const deptRows = db.prepare('SELECT id, name FROM departments').all();
  const deptMap = {};
  deptRows.forEach(d => { deptMap[d.name] = d.id; });

  const doctors = [
    {
      name: 'Dr. Rajesh Sharma',
      department_id: deptMap['Cardiology'],
      specialty: 'Senior Interventional Cardiologist',
      qualification: 'MBBS, MD, DM (Cardiology) - AIIMS New Delhi',
      experience_years: 17,
      fee: 850,
      rating: 4.9,
      available_days: 'Mon, Tue, Wed, Thu, Fri',
      time_start: '09:00',
      time_end: '16:00',
      email: 'dr.rajesh.sharma@aarogyacare.in',
      phone: '+91 98230 11223',
      avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'
    },
    {
      name: 'Dr. Ananya Sen',
      department_id: deptMap['Cardiology'],
      specialty: 'Consultant Clinical Cardiologist',
      qualification: 'MBBS, MD, DNB (Cardiology) - CMC Vellore',
      experience_years: 11,
      fee: 750,
      rating: 4.8,
      available_days: 'Tue, Wed, Thu, Fri, Sat',
      time_start: '10:00',
      time_end: '17:00',
      email: 'dr.ananya.sen@aarogyacare.in',
      phone: '+91 98450 22334',
      avatar_url: 'https://images.unsplash.com/photo-1594824813576-a4c33c393847?auto=format&fit=crop&q=80&w=300'
    },
    {
      name: 'Dr. Vikramaditya Rao',
      department_id: deptMap['Neurology'],
      specialty: 'Chief Neurologist & Spine Specialist',
      qualification: 'MBBS, MD, MCh (Neuro) - NIMHANS Bengaluru',
      experience_years: 19,
      fee: 1200,
      rating: 4.9,
      available_days: 'Mon, Tue, Wed, Thu',
      time_start: '09:30',
      time_end: '15:30',
      email: 'dr.vikram.rao@aarogyacare.in',
      phone: '+91 98110 33445',
      avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300'
    },
    {
      name: 'Dr. Priya Nair',
      department_id: deptMap['Pediatrics'],
      specialty: 'Senior Pediatrician & Child Specialist',
      qualification: 'MBBS, MD (Pediatrics), DCH - PGIMER Chandigarh',
      experience_years: 13,
      fee: 600,
      rating: 4.9,
      available_days: 'Mon, Tue, Wed, Thu, Fri, Sat',
      time_start: '08:30',
      time_end: '15:30',
      email: 'dr.priya.nair@aarogyacare.in',
      phone: '+91 97310 44556',
      avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'
    },
    {
      name: 'Dr. Suresh Kulkarni',
      department_id: deptMap['Orthopedics'],
      specialty: 'Joint Replacement & Arthroscopy Surgeon',
      qualification: 'MBBS, MS (Orthopedics), DNB - KEM Hospital Mumbai',
      experience_years: 15,
      fee: 800,
      rating: 4.8,
      available_days: 'Mon, Tue, Thu, Fri, Sat',
      time_start: '10:00',
      time_end: '18:00',
      email: 'dr.suresh.kulkarni@aarogyacare.in',
      phone: '+91 99200 55667',
      avatar_url: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=300'
    },
    {
      name: 'Dr. Meera Nambiar',
      department_id: deptMap['Dermatology'],
      specialty: 'Consultant Dermatologist & Trichologist',
      qualification: 'MBBS, MD (Dermatology) - Madras Medical College',
      experience_years: 9,
      fee: 650,
      rating: 4.8,
      available_days: 'Tue, Wed, Thu, Fri, Sat',
      time_start: '09:30',
      time_end: '16:30',
      email: 'dr.meera.nambiar@aarogyacare.in',
      phone: '+91 98840 66778',
      avatar_url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=300'
    },
    {
      name: 'Dr. Amitav Banerjee',
      department_id: deptMap['General Medicine'],
      specialty: 'Senior Physician & Diabetologist',
      qualification: 'MBBS, MD (Internal Medicine) - Medical College Kolkata',
      experience_years: 18,
      fee: 500,
      rating: 4.9,
      available_days: 'Mon, Tue, Wed, Thu, Fri, Sat',
      time_start: '08:00',
      time_end: '16:00',
      email: 'dr.amitav.banerjee@aarogyacare.in',
      phone: '+91 98300 77889',
      avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300'
    },
    {
      name: 'Dr. Sunita Reddy',
      department_id: deptMap['Ophthalmology'],
      specialty: 'Consultant Eye Surgeon & Cataract Specialist',
      qualification: 'MBBS, MS (Ophthalmology) - Sankara Nethralaya Chennai',
      experience_years: 12,
      fee: 700,
      rating: 4.8,
      available_days: 'Mon, Tue, Wed, Thu, Fri',
      time_start: '09:00',
      time_end: '16:00',
      email: 'dr.sunita.reddy@aarogyacare.in',
      phone: '+91 94400 88990',
      avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'
    },
    {
      name: 'Dr. Rohan Verma',
      department_id: deptMap['Dentistry'],
      specialty: 'Dental Surgeon & Orthodontist',
      qualification: 'BDS, MDS (Orthodontics) - Manipal Dental College',
      experience_years: 8,
      fee: 550,
      rating: 4.8,
      available_days: 'Mon, Tue, Wed, Thu, Fri, Sat',
      time_start: '09:00',
      time_end: '17:00',
      email: 'dr.rohan.verma@aarogyacare.in',
      phone: '+91 98190 99001',
      avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'
    }
  ];

  const insertDoctor = db.prepare(`
    INSERT INTO doctors (
      department_id, name, specialty, qualification, experience_years, fee, rating,
      available_days, time_start, time_end, email, phone, avatar_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const doc of doctors) {
    insertDoctor.run(
      doc.department_id, doc.name, doc.specialty, doc.qualification, doc.experience_years,
      doc.fee, doc.rating, doc.available_days, doc.time_start, doc.time_end, doc.email,
      doc.phone, doc.avatar_url
    );
  }

  // Seed realistic sample appointments with Indian patient names and details
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const sampleAppointments = [
    {
      reference_no: 'APT-2026-1001',
      doctor_id: 1,
      patient_name: 'Arun Kumar',
      patient_age: 48,
      patient_gender: 'Male',
      patient_phone: '9876543210',
      patient_email: 'arun.kumar@gmail.com',
      patient_state: 'Maharashtra',
      appointment_date: today,
      appointment_time: '09:30 AM',
      symptoms: 'Mild chest tightness after climbing stairs and routine cardiac review.',
      status: 'Confirmed'
    },
    {
      reference_no: 'APT-2026-1002',
      doctor_id: 3,
      patient_name: 'Pooja Iyer',
      patient_age: 32,
      patient_gender: 'Female',
      patient_phone: '9876543211',
      patient_email: 'pooja.iyer@yahoo.co.in',
      patient_state: 'Tamil Nadu',
      appointment_date: today,
      appointment_time: '10:30 AM',
      symptoms: 'Recurrent severe migraines and sensitivity to bright lights.',
      status: 'Confirmed'
    },
    {
      reference_no: 'APT-2026-1003',
      doctor_id: 4,
      patient_name: 'Aarav Patel (Child)',
      patient_age: 5,
      patient_gender: 'Male',
      patient_phone: '9876543212',
      patient_email: 'sunil.patel@gmail.com',
      patient_state: 'Gujarat',
      appointment_date: today,
      appointment_time: '11:00 AM',
      symptoms: 'Mild fever, dry cough, and 5-year developmental vaccination check.',
      status: 'Confirmed'
    },
    {
      reference_no: 'APT-2026-1004',
      doctor_id: 5,
      patient_name: 'Lakshmi Narayan',
      patient_age: 56,
      patient_gender: 'Female',
      patient_phone: '9876543213',
      patient_email: 'lakshmi.n@outlook.com',
      patient_state: 'Karnataka',
      appointment_date: yesterday,
      appointment_time: '02:00 PM',
      symptoms: 'Knee joint pain and stiffness when walking.',
      status: 'Completed'
    },
    {
      reference_no: 'APT-2026-1005',
      doctor_id: 6,
      patient_name: 'Rohan Deshmukh',
      patient_age: 27,
      patient_gender: 'Male',
      patient_phone: '9876543214',
      patient_email: 'rohan.deshmukh@gmail.com',
      patient_state: 'Delhi (NCT)',
      appointment_date: tomorrow,
      appointment_time: '10:00 AM',
      symptoms: 'Persistent skin allergy and rashes on arms.',
      status: 'Confirmed'
    }
  ];

  const insertAppt = db.prepare(`
    INSERT INTO appointments (
      reference_no, doctor_id, patient_name, patient_age, patient_gender,
      patient_phone, patient_email, patient_state, appointment_date, appointment_time, symptoms, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const appt of sampleAppointments) {
    insertAppt.run(
      appt.reference_no, appt.doctor_id, appt.patient_name, appt.patient_age,
      appt.patient_gender, appt.patient_phone, appt.patient_email, appt.patient_state,
      appt.appointment_date, appt.appointment_time, appt.symptoms, appt.status
    );
  }

  console.log('Indian hospital sample data successfully seeded.');
}

module.exports = seedData;
