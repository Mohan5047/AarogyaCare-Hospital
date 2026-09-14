const express = require('express');
const cors = require('cors');
const path = require('path');
const seedData = require('./src/seed/seedData');

// Initialize database schema and default records
try {
  seedData();
} catch (err) {
  console.error('Database initialization error:', err);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
const doctorRoutes = require('./src/routes/doctorRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const statsRoutes = require('./src/routes/statsRoutes');

app.use('/api', doctorRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', statsRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: 'Hospital Appointment Booking System'
  });
});

// Explicit root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback for Single Page Application
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server with 0.0.0.0 binding for standalone cloud deployments (Render/Railway/Docker/Local)
if (!process.env.VERCEL) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
  ======================================================
  🏥 AarogyaCare GH Appointment Booking System is Live!
  ------------------------------------------------------
  🌐 Application URL : http://localhost:${PORT}
  📡 API Base URL    : http://localhost:${PORT}/api
  📊 Health Check    : http://localhost:${PORT}/api/health
  ======================================================
    `);
  });

  // Graceful shutdown handling for container and PaaS environments
  process.on('SIGTERM', () => {
    console.log('SIGTERM received: closing HTTP server...');
    server.close(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received: closing HTTP server...');
    server.close(() => process.exit(0));
  });
}

module.exports = app;

