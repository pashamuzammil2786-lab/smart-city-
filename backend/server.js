const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { router: authRoutes } = require('./routes/auth');
const transportRoutes = require('./routes/transport');
const weatherRoutes = require('./routes/weather');
const trafficRoutes = require('./routes/traffic');
const airQualityRoutes = require('./routes/airQuality');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/air-quality', airQualityRoutes);
app.use('/api/aqi', airQualityRoutes);

// Model Performance & Reproducible Audit API
app.get('/api/model-performance', (req, res) => {
  try {
    const auditFilePath = path.join(__dirname, 'data', 'ml_performance_audit.json');
    if (require('fs').existsSync(auditFilePath)) {
      const data = JSON.parse(require('fs').readFileSync(auditFilePath, 'utf8'));
      return res.json(data);
    }
    res.status(404).json({ error: 'Audit data not yet generated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read audit results: ' + err.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    system: 'Smart City Urban Analytics Platform API',
    database: 'MySQL (smart_city_db)'
  });
});

// Root fallback
app.get('/', (req, res) => {
  res.send('Smart City Urban Analytics Backend API Server is Running.');
});

// Start Server
app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log(`🚀 Smart City Backend API listening on http://localhost:${PORT}`);
  console.log(`📡 Transport API: http://localhost:${PORT}/api/transport`);
  console.log(`🔐 Auth API:      http://localhost:${PORT}/api/auth`);
  console.log('='.repeat(70));
});
