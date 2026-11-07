import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck,
  Cpu,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  Calendar,
  Layers,
  Database,
  RefreshCw,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar
} from 'recharts';

export default function ModelPerformance() {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState('transport');

  useEffect(() => {
    loadAuditData();
  }, []);

  async function loadAuditData() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getModelPerformance();
      setAuditData(data);
    } catch (err) {
      console.error('Failed to load ML audit data:', err);
      setError('Unable to fetch ML model performance audit report. Please ensure the backend is active.');
    } finally {
      setLoading(false);
    }
  }

  const selectedModule = auditData?.modules?.find((m) => m.module_id === selectedModuleId);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* 1. Header & Research Audit Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #233554', paddingBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.25rem 0.75rem', borderRadius: '9999px', color: '#34D399', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <ShieldCheck size={14} />
            <span>ACADEMIC & RESEARCH AUDIT PORTAL • VERIFIED REPRODUCIBLE EVALUATION</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            Smart City ML Model Performance Audit
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.92rem', margin: 0, maxWidth: '850px', lineHeight: 1.5 }}>
            Rigorous, reproducible test evaluation across all four urban analytics modules. Evaluated on strictly held-out chronological test sets without random shuffling to prevent data leakage.
          </p>
        </div>

        <button
          onClick={loadAuditData}
          disabled={loading}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh Audit</span>
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '1rem', color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading && !auditData && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94A3B8' }}>
          <div className="spin" style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #38BDF8', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '1rem' }} />
          <div>Loading verified model metrics and test series...</div>
        </div>
      )}

      {auditData && (
        <>
          {/* 2. Four Module Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {auditData.modules.map((m) => {
              const isSelected = m.module_id === selectedModuleId;
              const r2Val = m.metrics.r2;
              const r2Color = r2Val > 0.9 ? '#10B981' : r2Val > 0.6 ? '#38BDF8' : '#F59E0B';

              return (
                <div
                  key={m.module_id}
                  onClick={() => setSelectedModuleId(m.module_id)}
                  style={{
                    background: isSelected ? 'rgba(37, 99, 235, 0.12)' : '#111C35',
                    border: `2px solid ${isSelected ? '#3B82F6' : '#233554'}`,
                    borderRadius: '12px',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 16px rgba(59, 130, 246, 0.25)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {m.module_name}
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                      R² = {r2Val.toFixed(4)}
                    </span>
                  </div>

                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.35rem' }}>
                    {m.model_name}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.75rem' }}>
                    Target: <strong style={{ color: '#E2E8F0' }}>{m.target_variable}</strong> ({m.target_unit})
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', background: '#0B132B', padding: '0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B' }}>MAE</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F1F5F9' }}>
                        {m.metrics.mae > 1000 ? `${(m.metrics.mae / 1000).toFixed(1)}k` : m.metrics.mae.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B' }}>RMSE</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F1F5F9' }}>
                        {m.metrics.rmse > 1000 ? `${(m.metrics.rmse / 1000).toFixed(1)}k` : m.metrics.rmse.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B' }}>MAPE</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: m.metrics.mape !== null ? '#FCD34D' : '#64748B' }}>
                        {m.metrics.mape !== null ? `${m.metrics.mape}%` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B' }}>
                    <span>Test Set: {m.test_samples.toLocaleString()} samples</span>
                    <span style={{ color: isSelected ? '#38BDF8' : 'transparent', fontWeight: 700 }}>Active View →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Detailed View for the Selected Module */}
          {selectedModule && (
            <div style={{ background: '#111C35', border: '1px solid #233554', borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #1E293B', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Module Deep Dive • {selectedModule.module_name}
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {selectedModule.model_name}
                  </h2>
                  <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: '0.35rem 0 0 0', maxWidth: '750px' }}>
                    {selectedModule.prediction_scope}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <div style={{ background: '#0B132B', border: '1px solid #1E293B', padding: '0.5rem 0.85rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748B' }}>R² SCORE</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10B981' }}>{selectedModule.metrics.r2.toFixed(4)}</div>
                  </div>
                  <div style={{ background: '#0B132B', border: '1px solid #1E293B', padding: '0.5rem 0.85rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748B' }}>MAE ({selectedModule.target_unit})</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#38BDF8' }}>
                      {selectedModule.metrics.mae > 1000 ? selectedModule.metrics.mae.toLocaleString() : selectedModule.metrics.mae.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ background: '#0B132B', border: '1px solid #1E293B', padding: '0.5rem 0.85rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748B' }}>RMSE ({selectedModule.target_unit})</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#F8FAFC' }}>
                      {selectedModule.metrics.rmse > 1000 ? selectedModule.metrics.rmse.toLocaleString() : selectedModule.metrics.rmse.toFixed(2)}
                    </div>
                  </div>
                  {selectedModule.metrics.mape !== null && (
                    <div style={{ background: '#0B132B', border: '1px solid #1E293B', padding: '0.5rem 0.85rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>MAPE</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FCD34D' }}>{selectedModule.metrics.mape}%</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notice Banner for Target Clarity */}
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '10px', padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#CBD5E1' }}>
                <Info size={20} color="#38BDF8" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Target Variable Clarification:</strong> The {selectedModule.module_name} ML model predicts{' '}
                  <strong style={{ color: '#38BDF8' }}>{selectedModule.target_display_name}</strong>. {selectedModule.module_id === 'transport' && 'It forecasts aggregated corridor passenger demand volume; it does NOT estimate bus timetable journey durations or traffic delays.'}
                </span>
              </div>

              {/* 4. Interactive Visualizations: Actual vs Predicted & Error Distribution */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.25rem' }}>
                {/* Visual A: Actual vs Predicted Time-Series Sample */}
                <div style={{ background: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#F1F5F9' }}>
                      Actual vs Predicted Trajectory (Held-out Test Series)
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Chronological evaluation sample</span>
                  </div>

                  <div style={{ height: '240px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedModule.timeseries_sample} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="index" stroke="#64748B" fontSize={11} label={{ value: 'Test Step Index', position: 'insideBottom', offset: -2, fill: '#64748B', fontSize: 10 }} />
                        <YAxis stroke="#64748B" fontSize={11} />
                        <Tooltip
                          contentStyle={{ background: '#0F182E', border: '1px solid #233554', borderRadius: '8px', fontSize: '0.8rem' }}
                          formatter={(value, name) => [`${value} ${selectedModule.target_unit}`, name === 'actual' ? 'Ground Truth (Actual)' : 'Model Prediction']}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '8px' }} />
                        <Line type="monotone" dataKey="actual" name="Actual Ground Truth" stroke="#10B981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="predicted" name="Model Prediction" stroke="#38BDF8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Visual B: Prediction Residual / Error Distribution Histogram */}
                <div style={{ background: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#F1F5F9' }}>
                      Residual Error Distribution (y_pred - y_true)
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Mean: {selectedModule.metrics.error_mean}</span>
                  </div>

                  <div style={{ height: '240px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={selectedModule.metrics.error_distribution} margin={{ top: 10, right: 10, left: 0, bottom: 15 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="label" stroke="#64748B" fontSize={9} angle={-25} textAnchor="end" interval={1} />
                        <YAxis stroke="#64748B" fontSize={11} />
                        <Tooltip
                          contentStyle={{ background: '#0F182E', border: '1px solid #233554', borderRadius: '8px', fontSize: '0.8rem' }}
                          formatter={(count) => [`${count} samples`, 'Frequency Count']}
                        />
                        <Bar dataKey="count" name="Sample Count" fill="#818CF8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 5. Dataset, Features & Methodology Specifications */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                <div style={{ background: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '1.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 700, color: '#E2E8F0', fontSize: '0.92rem' }}>
                    <Database size={16} color="#38BDF8" />
                    <span>Dataset & Evaluation Protocol</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94A3B8', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <li><strong>Dataset:</strong> {selectedModule.dataset_name}</li>
                    <li><strong>Total Recorded Samples:</strong> {selectedModule.dataset_total_samples.toLocaleString()}</li>
                    <li><strong>Training Partition:</strong> {selectedModule.train_samples.toLocaleString()} samples (80% historical)</li>
                    <li><strong>Held-Out Test Partition:</strong> {selectedModule.test_samples.toLocaleString()} samples (20% recent chronological)</li>
                    <li><strong>Split Protocol:</strong> Strict chronological cutoff (zero random shuffle / zero leakage).</li>
                  </ul>
                </div>

                <div style={{ background: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '1.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 700, color: '#E2E8F0', fontSize: '0.92rem' }}>
                    <AlertTriangle size={16} color="#F59E0B" />
                    <span>Known Limitations & Boundary Conditions</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94A3B8', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {selectedModule.known_limitations.map((lim, i) => (
                      <li key={i}>{lim}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Feature Columns Tag Cloud */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1', marginBottom: '0.5rem' }}>
                  Engineered Feature Set ({selectedModule.features_count} variables):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {selectedModule.features.map((f) => (
                    <span
                      key={f}
                      style={{
                        background: '#0B132B',
                        border: '1px solid #233554',
                        color: '#93C5FD',
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontFamily: 'monospace'
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
