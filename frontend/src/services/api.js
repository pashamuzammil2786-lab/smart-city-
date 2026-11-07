const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('smart_city_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Authentication
  async signup(name, email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user profile');
    return data;
  },

  // Transport APIs
  async getStops(q = '') {
    const res = await fetch(`${API_BASE_URL}/transport/stops?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch stops');
    return data;
  },

  async getNearbyStops(lat, lon, radius = 2.0) {
    const res = await fetch(`${API_BASE_URL}/transport/nearby-stops?lat=${lat}&lon=${lon}&radius=${radius}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch nearby stops');
    return data;
  },

  async getRoutes(origin, destination) {
    const res = await fetch(
      `${API_BASE_URL}/transport/routes?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to find routes');
    return data;
  },

  async getRouteStops(trip_id, route_id) {
    const query = trip_id ? `trip_id=${encodeURIComponent(trip_id)}` : `route_id=${encodeURIComponent(route_id)}`;
    const res = await fetch(`${API_BASE_URL}/transport/route-stops?${query}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch route stops');
    return data;
  },

  async getForecast(num_days = 7) {
    const res = await fetch(`${API_BASE_URL}/transport/forecast?num_days=${num_days}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch forecast');
    return data;
  },

  async predictTransportDemand(payload = {}) {
    const res = await fetch(`${API_BASE_URL}/transport/predict-demand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to predict transport demand');
    return data;
  },

  async getMLMetrics() {
    const res = await fetch(`${API_BASE_URL}/transport/ml-metrics`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch ML metrics');
    return data;
  },

  async getModelComparison() {
    const res = await fetch(`${API_BASE_URL}/transport/model-comparison`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch model comparison');
    return data;
  },

  async getActualVsPredicted() {
    const res = await fetch(`${API_BASE_URL}/transport/actual-vs-predicted`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch actual vs predicted data');
    return data;
  },

  // Air Quality (AQI) APIs
  async getAQICurrent() {
    const res = await fetch(`${API_BASE_URL}/air-quality/current`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch current AQI');
    return data;
  },

  async getAQIStations() {
    const res = await fetch(`${API_BASE_URL}/air-quality/stations`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch AQI stations');
    return data;
  },

  async getAQIHistory() {
    const res = await fetch(`${API_BASE_URL}/air-quality/history`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch AQI history');
    return data;
  },

  async getAQIForecast() {
    const res = await fetch(`${API_BASE_URL}/air-quality/forecast`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch AQI forecast');
    return data;
  },

  async getAQIMLMetrics() {
    const res = await fetch(`${API_BASE_URL}/air-quality/ml-metrics`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch AQI ML metrics');
    return data;
  },

  async predictAQI(payload) {
    const res = await fetch(`${API_BASE_URL}/air-quality/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to predict AQI');
    return data;
  },

  // Traffic APIs
  async getTrafficOverview() {
    const res = await fetch(`${API_BASE_URL}/traffic/overview`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch traffic overview');
    return data;
  },

  async getTrafficCorridors() {
    const res = await fetch(`${API_BASE_URL}/traffic/corridors`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch traffic corridors');
    return data;
  },

  async getTrafficHistory() {
    const res = await fetch(`${API_BASE_URL}/traffic/history`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch traffic history');
    return data;
  },

  async getTrafficMLMetrics() {
    const res = await fetch(`${API_BASE_URL}/traffic/ml-metrics`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch traffic ML metrics');
    return data;
  },

  async predictTraffic(payload) {
    const res = await fetch(`${API_BASE_URL}/traffic/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to predict traffic');
    return data;
  },

  async predictTrafficJunction(payload) {
    const res = await fetch(`${API_BASE_URL}/traffic/predict-junction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to predict traffic junction flow');
    return data;
  },

  // Weather APIs
  async getWeatherOverview() {
    const res = await fetch(`${API_BASE_URL}/weather/overview`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch weather overview');
    return data;
  },

  async getWeatherMicroclimates() {
    const res = await fetch(`${API_BASE_URL}/weather/microclimates`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch weather microclimates');
    return data;
  },

  async getWeatherForecast() {
    const res = await fetch(`${API_BASE_URL}/weather/forecast`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch weather forecast');
    return data;
  },

  async getWeatherMLMetrics() {
    const res = await fetch(`${API_BASE_URL}/weather/ml-metrics`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch weather ML metrics');
    return data;
  },

  async simulateWeather(payload) {
    const res = await fetch(`${API_BASE_URL}/weather/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to simulate microclimate cooling');
    return data;
  },

  async predictWeatherTemperature(payload) {
    const res = await fetch(`${API_BASE_URL}/weather/predict-temperature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to predict weather temperature');
    return data;
  },

  async getMLHealth() {
    const res = await fetch(`${API_BASE_URL}/ml/health`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch ML health');
    return data;
  },

  // Research & Model Performance Audit API
  async getModelPerformance() {
    const res = await fetch(`${API_BASE_URL}/model-performance`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch model performance audit');
    return data;
  }
};
