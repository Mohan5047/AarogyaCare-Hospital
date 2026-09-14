const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

router.post('/appointments', appointmentController.createAppointment);
router.get('/appointments', appointmentController.getAppointments);
router.get('/appointments/lookup', appointmentController.lookupAppointment);
router.patch('/appointments/:id/status', appointmentController.updateAppointmentStatus);
router.delete('/appointments/:id', appointmentController.cancelAppointment);

module.exports = router;
