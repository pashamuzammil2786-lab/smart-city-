const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { router: authRoutes } = require('./routes/auth');
const transportRoutes = require('./routes/transport');
const weatherRoutes = require('./routes/weather');
const trafficRoutes = require('./routes/traffic');
const airQualityRoutes = require('./routes/airQuality');
const mlInferenceService = require('./services/mlInferenceService');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map(s => s.trim()), credentials: true } : {}));
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

// ML Inference Engine Health API
app.get('/api/ml/health', async (req, res) => {
  try {
    const health = await mlInferenceService.checkHealth();
    res.json({
      success: true,
      service: 'Smart City Unified ML Decision Support',
      daemon_status: health.status || 'offline',
      models_status: health.models_loaded || {
        transport: 'available (via CLI)',
        traffic: 'available (via CLI)',
        weather: 'available (via CLI)',
        air_quality: 'available (via CLI)'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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

let mlDaemonProcess = null;

function ensureMLDaemon() {
  mlInferenceService.checkHealth().then(status => {
    if (status.status === 'healthy') {
      console.log('🤖 ML Inference Daemon is active on http://127.0.0.1:5001');
    } else {
      console.log('⚡ Launching persistent Python ML Inference Daemon on http://127.0.0.1:5001...');
      const pyCmd = process.platform === 'win32' ? 'python' : 'python3';
      const scriptPath = path.join(__dirname, '..', 'ml', 'unified_inference_service.py');
      try {
        mlDaemonProcess = spawn(pyCmd, [scriptPath, '--serve', '--port', '5001'], {
          cwd: path.join(__dirname, '..'),
          windowsHide: true,
          stdio: 'ignore'
        });
        mlDaemonProcess.unref();
        setTimeout(() => {
          mlInferenceService.checkHealth().then(h => {
            if (h.status === 'healthy') {
              console.log('✅ Python ML Inference Daemon ready (all 4 models loaded into memory)');
            }
          }).catch(() => {});
        }, 3000);
      } catch (err) {
        console.warn('Could not auto-spawn Python ML daemon:', err.message);
      }
    }
  }).catch(() => {});
}

process.on('exit', () => {
  if (mlDaemonProcess) {
    try { mlDaemonProcess.kill(); } catch (e) {}
  }
});

// Start Server
app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log(`🚀 Smart City Backend API listening on http://localhost:${PORT}`);
  console.log(`📡 Transport API: http://localhost:${PORT}/api/transport`);
  console.log(`📡 ML Engine:    http://localhost:${PORT}/api/ml/health`);
  console.log(`🔐 Auth API:      http://localhost:${PORT}/api/auth`);
  console.log('='.repeat(70));
  ensureMLDaemon();
});
