const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

// Departments
router.get('/departments', doctorController.getDepartments);

// Doctors
router.get('/doctors', doctorController.getDoctors);
router.get('/doctors/:id', doctorController.getDoctorById);
router.get('/doctors/:id/slots', doctorController.getDoctorSlots);
router.post('/doctors', doctorController.createDoctor);

module.exports = router;
