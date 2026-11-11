/**
 * =============================================================================
 * Smart City Urban Analytics Platform - Advanced Transit Routing Engine
 * File: backend/services/routingService.js
 * 
 * Capabilities:
 *   1. Robust Locality & Candidate Stop Resolution with comprehensive Hyderabad
 *      alias matching (e.g. Dondanpally -> Dontapally, ISB/IBS -> Indian Business School).
 *   2. Dual-Engine Duration Calculation:
 *        - Clean GTFS timetables: Uses exact scheduled departure & arrival times
 *          with source = 'Scheduled Timetable'.
 *        - Uncurated multi-hour vehicle duty blocks (e.g. 400 - 1,500 mins):
 *          Detects uncurated depot schedules and calculates realistic transit durations
 *          based on road distance (with Hyderabad 1.28x circuity factor) and stop density.
 *          Source = 'Estimated Route Duration (Calibrated Transit Speed Model)'.
 *   3. Multi-tier Journey Discovery:
 *        - Tier 1: Direct bus connections
 *        - Tier 2: 1-Transfer connections (Origin -> Interchange -> Destination)
 *        - Tier 3: 2-Transfer connections (Origin -> Hub 1 -> Hub 2 -> Destination)
 *   4. Strict Internal Consistency:
 *        Total Journey Duration = In-Vehicle Duration + Transfer Waiting Time
 *                               = Final Arrival Time - Initial Departure Time.
 *   5. Strict Separation of Concerns:
 *        Scheduled/Estimated duration is kept separate from traffic delay heuristics
 *        and ML passenger demand forecasts.
 * =============================================================================
 */

const pool = require('../db');

// Physical and operational transit constraints
const ROUTING_CONFIG = {
  MIN_TRANSFER_BUFFER_MINS: 5,         // Minimum minutes required to alight and board connecting bus
  MAX_TRANSFER_WAIT_MINS: 90,          // Maximum realistic layover before rejecting connection
  LOCALITY_SEARCH_RADIUS_KM: 2.5,      // Proximity radius to gather candidate stops for locality
  MIN_PLAUSIBLE_SPEED_KMH: 8.0,        // Speeds below 8 km/h on urban runs indicate uncurated duty blocks
  MAX_PLAUSIBLE_SPEED_KMH: 65.0,       // Maximum plausible sustained bus speed in urban Hyderabad
  MAX_PLAUSIBLE_LEG_MINS: 150,         // Maximum plausible single urban bus leg duration (2.5 hours)
  ROUTING_CIRCUITY_FACTOR: 1.28,       // Hyderabad road distance factor over great-circle Haversine
  DWELL_TIME_PER_STOP_MINS: 0.6        // 36 seconds average deceleration, boarding, and acceleration per stop
};

// Common Hyderabad locality aliases, alternate spellings, and landmark abbreviations
const LOCALITY_ALIASES = {
  'dondanpally': ['Dontapally', 'DONTHANPALLY', 'Donthanapally', 'Pilligundla'],
  'dondapally': ['Dontapally', 'DONTHANPALLY'],
  'dontapally': ['Dontapally', 'DONTHANPALLY'],
  'dontanpally': ['Dontapally', 'DONTHANPALLY'],
  'donthanpally': ['Dontapally', 'DONTHANPALLY'],
  'donthanapally': ['Dontapally', 'DONTHANPALLY'],
  'isb': ['Indian Business School', 'Ibs', 'ISB'],
  'ibs': ['Indian Business School', 'Ibs', 'ISB'],
  'cbit': ['Cbit', 'CBIT'],
  'shaikpet': ['Shaikpet', 'Shaikpet Nala', 'Tolichowki'],
  'shaikpet nala': ['Shaikpet Nala', 'Shaikpet'],
  'mehdipatnam': ['Mehdipatnam', 'Mehadipatnam', 'Mehadipatnam Depot'],
  'mehadipatnam': ['Mehdipatnam', 'Mehadipatnam'],
  'secunderabad': ['Secunderabad', 'Secunderabad Bus Station', 'Secunderabad Station'],
  'koti': ['Koti', 'Koti Bus Station', 'Koti Womens College'],
  'dilsukhnagar': ['Dilsukhnagar', 'Dilsukhnagar Bus Station'],
  'charminar': ['Charminar', 'Charminar Bus Station'],
  'afzalgunj': ['Afzalgunj', 'Afzal Gunj'],
  'afzal gunj': ['Afzalgunj', 'Afzal Gunj'],
  'gachibowli': ['Gachibowli', 'Gachibowli X Road'],
  'shankarpally': ['Shankarpally', 'Shankarpally Bus Station'],
  'kondapur': ['Kondapur', 'Kondapur X Road'],
  'hitec city': ['Hitec City', 'Cyber Towers'],
  'madhapur': ['Madhapur', 'Madhapur Police Station'],
  'jubilee hills': ['Jubilee Hills', 'Jubilee Check Post'],
  'banjara hills': ['Banjara Hills', 'Banjara Hills Rd No 1'],
  'ameerpet': ['Ameerpet', 'Ameerpet Metro Station'],
  'kukatpally': ['Kukatpally', 'KPHB Colony'],
  'patancheru': ['Patancheru', 'Patancheru Bus Station'],
  'ecil': ['ECIL', 'ECIL X Roads'],
  'uppal': ['Uppal', 'Uppal Ring Road'],
  'lb nagar': ['LB Nagar', 'L B Nagar'],
  'l.b. nagar': ['LB Nagar', 'L B Nagar'],
  'nampally': ['Nampally', 'Nampally Station'],
  'lakdikapool': ['Lakdikapool', 'Lakdi Ka Pul']
};

/**
 * Great-circle distance between two GPS coordinates using Haversine formula (km).
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371.0;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Parses a GTFS time string (HH:MM:SS or H:MM:SS) into total minutes from service-day midnight.
 * Preserves GTFS hours >= 24 (e.g. '24:15:00' -> 1455 mins, '25:30:00' -> 1530 mins).
 */
function parseGtfsTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parts.length > 2 ? parseInt(parts[2], 10) : 0;
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m + (s >= 30 ? 1 : 0);
}

/**
 * Formats GTFS service-day minutes into user-facing clock time (HH:MM).
 * If hour >= 24, clearly indicates service extends into the next calendar day.
 */
function formatMinutesToClockTime(totalMinutes) {
  if (totalMinutes == null || isNaN(totalMinutes)) return '--:--';
  const days = Math.floor(totalMinutes / 1440);
  const remMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(remMinutes / 60);
  const m = remMinutes % 60;
  const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  if (days >= 1) {
    return `${timeStr} (+${days}d)`;
  }
  return timeStr;
}

/**
 * Evaluates a scheduled transit leg and computes realistic duration.
 * Distinguishes between:
 *   1. Clean, verified scheduled timetables.
 *   2. Uncurated multi-shift duty blocks (e.g. 200 - 1500 mins) -> Calibrated to realistic duration.
 *   3. Physically impossible / corrupt records -> Rejected.
 */
function evaluateLegDuration(depMinutes, arrMinutes, distKm, stopsCount = 0) {
  if (depMinutes == null || arrMinutes == null) {
    return { valid: false, reason: 'Missing timestamp records' };
  }

  const rawDuration = arrMinutes - depMinutes;
  if (rawDuration <= 0) {
    return { valid: false, reason: 'Non-positive duration (arrival <= departure)' };
  }

  // Calculate realistic road distance with Hyderabad transit circuity factor (1.28x)
  const dRoad = distKm != null ? distKm * ROUTING_CONFIG.ROUTING_CIRCUITY_FACTOR : 5.0;

  // Implied commercial speed from raw GTFS timetable
  const rawHours = rawDuration / 60.0;
  const impliedSpeed = dRoad / rawHours;

  // Case 1: Timetable is clean, verified, and physically plausible
  // Speed between 8 km/h and 65 km/h, and single leg does not exceed 150 mins
  if (
    impliedSpeed >= ROUTING_CONFIG.MIN_PLAUSIBLE_SPEED_KMH &&
    impliedSpeed <= ROUTING_CONFIG.MAX_PLAUSIBLE_SPEED_KMH &&
    rawDuration <= ROUTING_CONFIG.MAX_PLAUSIBLE_LEG_MINS
  ) {
    return {
      valid: true,
      durationMins: rawDuration,
      effectiveArrMins: arrMinutes,
      impliedSpeedKmh: Math.round(impliedSpeed * 10) / 10,
      roadDistanceKm: Math.round(dRoad * 10) / 10,
      durationSource: 'Scheduled Timetable',
      isEstimated: false
    };
  }

  // Case 2: Schedule represents an uncurated driver duty block or depot layover
  // (e.g. 446 mins for 25 km, implied speed 3.5 km/h, or rawDuration > 150 mins).
  // We do NOT reject the legitimate transit connection; we compute the calibrated realistic duration!
  // Central urban corridors: 16 km/h; Outer arterial / highway corridors: 24 km/h.
  const baseSpeedKmh = dRoad < 6.0 ? 16.0 : 24.0;
  const runningMins = (dRoad / baseSpeedKmh) * 60.0;
  const dwellMins = Math.max(0, stopsCount) * ROUTING_CONFIG.DWELL_TIME_PER_STOP_MINS;
  const calibratedDuration = Math.max(3, Math.round(runningMins + dwellMins));
  const effectiveArrMins = depMinutes + calibratedDuration;

  return {
    valid: true,
    durationMins: calibratedDuration,
    effectiveArrMins: effectiveArrMins,
    impliedSpeedKmh: baseSpeedKmh,
    roadDistanceKm: Math.round(dRoad * 10) / 10,
    durationSource: 'Estimated Route Duration (Calibrated Transit Model)',
    isEstimated: true,
    note: `Raw schedule (${rawDuration} mins) reflects uncurated multi-hour vehicle duty block; duration calibrated based on road distance (${dRoad.toFixed(1)} km) and stop density.`
  };
}

/**
 * Validates whether a raw GTFS scheduled leg is physically plausible as a single continuous run.
 * Used for data quality audits, unit testing, and filtering uncurated multi-shift duty blocks.
 * Rejects:
 *   - Missing timestamps
 *   - Non-positive durations (arr <= dep)
 *   - Excessively long single runs (> 300 minutes, indicating multi-shift duty block)
 *   - Speeds > 120 km/h (physically impossible for city buses)
 *   - Speeds < 3 km/h (stalled vehicle / depot rest period)
 */
function validateLegPlausibility(depMinutes, arrMinutes, distKm) {
  if (depMinutes == null || arrMinutes == null) {
    return { valid: false, reason: 'Missing timestamp records' };
  }
  const duration = arrMinutes - depMinutes;
  if (duration <= 0) {
    return { valid: false, reason: 'Non-positive duration (arrival <= departure)' };
  }
  // Intra-city single transit run cannot exceed 300 minutes (5 hours)
  if (duration > 300) {
    return {
      valid: false,
      durationMins: duration,
      reason: `Duration (${duration} mins) exceeds plausible single-run limit of 300 mins (multi-shift duty block artifact)`
    };
  }
  const hours = duration / 60.0;
  const speedKmh = distKm != null ? distKm / hours : null;
  if (speedKmh != null) {
    if (speedKmh > 120.0) {
      return {
        valid: false,
        durationMins: duration,
        impliedSpeedKmh: Math.round(speedKmh * 10) / 10,
        reason: `Implausibly high speed (${speedKmh.toFixed(1)} km/h exceeds 120 km/h threshold)`
      };
    }
    if (speedKmh < 3.0) {
      return {
        valid: false,
        durationMins: duration,
        impliedSpeedKmh: Math.round(speedKmh * 10) / 10,
        reason: `Implausibly low speed (${speedKmh.toFixed(1)} km/h under 3 km/h threshold)`
      };
    }
  }
  return {
    valid: true,
    durationMins: duration,
    impliedSpeedKmh: speedKmh != null ? Math.round(speedKmh * 10) / 10 : null
  };
}

/**
 * Resolves candidate stops for an origin or destination input query.
 * Matches exact IDs, aliases (Dondanpally, ISB, etc.), substring on name & desc,
 * and clusters nearby stops within the locality radius to ensure comprehensive routing.
 */
async function resolveCandidateStops(inputStr) {
  if (!inputStr || !inputStr.trim()) return [];
  const query = inputStr.trim();
  const qLower = query.toLowerCase();

  // 1. Direct Stop ID Match
  const [byId] = await pool.query(
    'SELECT stop_id, stop_name, zone_id, stop_lat, stop_lon, stop_desc FROM transit_stops WHERE stop_id = ?',
    [query]
  );
  if (byId.length > 0) {
    const primary = byId[0];
    const [cluster] = await pool.query(
      `SELECT stop_id, stop_name, zone_id, stop_lat, stop_lon, stop_desc
       FROM transit_stops 
       WHERE LOWER(stop_name) = LOWER(?)
          OR (stop_lat IS NOT NULL AND stop_lon IS NOT NULL
              AND ABS(stop_lat - ?) < 0.02 AND ABS(stop_lon - ?) < 0.02)
       LIMIT 15`,
      [primary.stop_name, primary.stop_lat, primary.stop_lon]
    );
    return cluster.length > 0 ? cluster : byId;
  }

  // 2. Check Locality Alias Map (e.g. Dondanpally -> Dontapally, ISB -> Indian Business School)
  let aliasQueries = [query];
  for (const [aliasKey, aliasTargets] of Object.entries(LOCALITY_ALIASES)) {
    if (qLower === aliasKey || qLower.includes(aliasKey) || aliasKey.includes(qLower)) {
      aliasQueries.push(...aliasTargets);
    }
  }
  aliasQueries = Array.from(new Set(aliasQueries));

  // 3. Multi-Pattern Search:
  // Prefer exact & substring matches on stop_name. Search stop_desc only if it starts with the location.
  const nameClauses = [];
  const nameParams = [];
  for (const q of aliasQueries) {
    nameClauses.push('LOWER(stop_name) LIKE ? OR LOWER(stop_desc) LIKE ?');
    nameParams.push(`%${q.toLowerCase()}%`, `${q.toLowerCase()}%`);
  }

  const [matchingStops] = await pool.query(
    `SELECT stop_id, stop_name, zone_id, stop_lat, stop_lon, stop_desc 
     FROM transit_stops 
     WHERE ${nameClauses.join(' OR ')}
     ORDER BY 
       CASE 
         WHEN LOWER(stop_name) = LOWER(?) THEN 1
         WHEN LOWER(stop_name) LIKE ? THEN 2
         ELSE 3
       END,
       LENGTH(stop_name) ASC 
     LIMIT 30`,
    [...nameParams, query.toLowerCase(), `${query.toLowerCase()}%`]
  );

  if (matchingStops.length === 0) return [];

  // Filter and cluster nearby candidate stops within the locality radius
  const primary = matchingStops[0];
  const candidateStops = [];
  const seenIds = new Set();

  for (const s of matchingStops) {
    if (seenIds.has(s.stop_id)) continue;
    const nameLower = s.stop_name.toLowerCase();
    const descLower = (s.stop_desc || '').toLowerCase();

    // Check if the stop actually represents the locality (not a downstream direction pole)
    const nameMatches = aliasQueries.some(q => nameLower.includes(q.toLowerCase()));
    const descStarts = aliasQueries.some(q => descLower.startsWith(q.toLowerCase()));
    if (!nameMatches && !descStarts) continue;

    // Strict physical proximity check against the primary anchor stop
    let isPhysicallyClose = true;
    if (primary.stop_lat && s.stop_lat && primary.stop_lon && s.stop_lon) {
      const dist = haversineDistance(
        parseFloat(primary.stop_lat),
        parseFloat(primary.stop_lon),
        parseFloat(s.stop_lat),
        parseFloat(s.stop_lon)
      );
      if (dist !== null && dist > ROUTING_CONFIG.LOCALITY_SEARCH_RADIUS_KM) {
        isPhysicallyClose = false;
      }
    }

    if (isPhysicallyClose) {
      seenIds.add(s.stop_id);
      candidateStops.push(s);
    }
  }

  return candidateStops.length > 0 ? candidateStops : [primary];
}

/**
 * Traffic delay estimator (heuristic model strictly separated from scheduled duration).
 */
function estimateTrafficDelay(departureMinutes, totalStops) {
  const hour = (Math.floor(departureMinutes / 60)) % 24;
  const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
  const isModerate = (hour >= 11 && hour <= 16) || (hour >= 21 && hour <= 22);

  let delayMins = 0;
  let condition = 'Smooth Flow';

  if (isPeak) {
    delayMins = Math.max(5, Math.round(4 + totalStops * 0.35));
    condition = 'Heavy Peak Congestion';
  } else if (isModerate) {
    delayMins = Math.max(2, Math.round(2 + totalStops * 0.20));
    condition = 'Moderate Traffic';
  } else {
    delayMins = Math.max(0, Math.round(1 + totalStops * 0.08));
    condition = 'Smooth Flow';
  }

  return { delayMins, condition };
}

/**
 * Passenger Crowd Demand Estimator for display.
 */
function estimatePassengerDemand(departureMinutes) {
  const hour = (Math.floor(departureMinutes / 60)) % 24;
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
    return { level: 'High', badge: 'High Demand (Peak Rush)', occupancy: '85-95%' };
  } else if ((hour >= 11 && hour <= 16) || (hour >= 21 && hour <= 22)) {
    return { level: 'Moderate', badge: 'Moderate Demand', occupancy: '50-70%' };
  }
  return { level: 'Low', badge: 'Low Demand (Off-Peak)', occupancy: '25-45%' };
}

/**
 * Discovers DIRECT routes between candidate origin and destination stops.
 */
async function searchDirectRoutes(origStops, destStops) {
  const origIds = origStops.map(s => s.stop_id);
  const destIds = destStops.map(s => s.stop_id);
  if (origIds.length === 0 || destIds.length === 0) return [];

  const [rows] = await pool.query(
    `SELECT 
        r.route_id,
        r.route_long_name,
        t.trip_id,
        t.trip_short_name,
        t.direction_id,
        s1.stop_id AS orig_stop_id,
        s1.stop_name AS orig_stop_name,
        s1.stop_lat AS orig_lat,
        s1.stop_lon AS orig_lon,
        s2.stop_id AS dest_stop_id,
        s2.stop_name AS dest_stop_name,
        s2.stop_lat AS dest_lat,
        s2.stop_lon AS dest_lon,
        st1.departure_time AS orig_departure,
        st2.arrival_time AS dest_arrival,
        st1.stop_sequence AS orig_seq,
        st2.stop_sequence AS dest_seq,
        (st2.stop_sequence - st1.stop_sequence) AS stops_count
     FROM transit_stop_times st1
     JOIN transit_stop_times st2 ON st1.trip_id = st2.trip_id
     JOIN transit_trips t ON st1.trip_id = t.trip_id
     JOIN transit_routes r ON t.route_id = r.route_id
     JOIN transit_stops s1 ON st1.stop_id = s1.stop_id
     JOIN transit_stops s2 ON st2.stop_id = s2.stop_id
     WHERE st1.stop_id IN (?)
       AND st2.stop_id IN (?)
       AND st1.stop_sequence < st2.stop_sequence
     ORDER BY st1.departure_time ASC
     LIMIT 50`,
    [origIds, destIds]
  );

  const directJourneys = [];
  const seenPatterns = new Set();

  for (const row of rows) {
    const depMins = parseGtfsTimeToMinutes(row.orig_departure);
    const arrMins = parseGtfsTimeToMinutes(row.dest_arrival);
    if (depMins == null || arrMins == null) continue;

    const distKm = haversineDistance(
      parseFloat(row.orig_lat), parseFloat(row.orig_lon),
      parseFloat(row.dest_lat), parseFloat(row.dest_lon)
    );

    const legEval = evaluateLegDuration(depMins, arrMins, distKm, row.stops_count);
    if (!legEval.valid) continue;

    const durationMins = legEval.durationMins;
    const effectiveArrMins = legEval.effectiveArrMins;

    const patternKey = `${row.route_id}-${row.orig_departure}-${durationMins}`;
    if (seenPatterns.has(patternKey)) continue;
    seenPatterns.add(patternKey);

    const { delayMins, condition } = estimateTrafficDelay(depMins, row.stops_count);
    const crowd = estimatePassengerDemand(depMins);

    directJourneys.push({
      journey_type: 'direct',
      transfers_count: 0,
      scheduled_duration_mins: durationMins,
      in_vehicle_duration_mins: durationMins,
      transfer_waiting_mins: 0,
      walking_duration_mins: 0,
      expected_delay_mins: delayMins,
      total_estimated_travel_time_mins: durationMins + delayMins,
      traffic_condition: condition,
      crowd_level: crowd.level,
      crowd_badge: crowd.badge,
      departure_time: formatMinutesToClockTime(depMins),
      arrival_time: formatMinutesToClockTime(effectiveArrMins),
      next_departure_time: formatMinutesToClockTime(depMins),
      scheduled_arrival_time: formatMinutesToClockTime(effectiveArrMins),
      formatted_departure: formatMinutesToClockTime(depMins),
      formatted_arrival: formatMinutesToClockTime(effectiveArrMins),
      raw_departure_time: row.orig_departure,
      raw_arrival_time: row.dest_arrival,
      duration_source: legEval.durationSource,
      is_duration_estimated: legEval.isEstimated,
      schedule_note: legEval.note || null,
      route_id: row.route_id,
      route_name: row.route_long_name || `Route ${row.route_id}`,
      trip_id: row.trip_id,
      trip_title: row.trip_short_name,
      stops_count: row.stops_count,
      is_direct: true,
      score: durationMins + delayMins * 1.1,
      legs: [
        {
          leg_number: 1,
          route_id: row.route_id,
          route_name: row.route_long_name || `Route ${row.route_id}`,
          trip_id: row.trip_id,
          trip_title: row.trip_short_name,
          boarding_stop: {
            stop_id: row.orig_stop_id,
            stop_name: row.orig_stop_name,
            stop_lat: parseFloat(row.orig_lat),
            stop_lon: parseFloat(row.orig_lon)
          },
          alighting_stop: {
            stop_id: row.dest_stop_id,
            stop_name: row.dest_stop_name,
            stop_lat: parseFloat(row.dest_lat),
            stop_lon: parseFloat(row.dest_lon)
          },
          departure_time: formatMinutesToClockTime(depMins),
          arrival_time: formatMinutesToClockTime(effectiveArrMins),
          raw_departure_time: row.orig_departure,
          raw_arrival_time: row.dest_arrival,
          duration_mins: durationMins,
          scheduled_duration_mins: durationMins,
          from_stop_name: row.orig_stop_name,
          to_stop_name: row.dest_stop_name,
          route_short_name: row.route_short_name || row.route_long_name || `Route ${row.route_id}`,
          duration_source: legEval.durationSource,
          is_duration_estimated: legEval.isEstimated,
          stops_count: row.stops_count
        }
      ],
      transfers: []
    });
  }

  return directJourneys;
}

/**
 * Discovers 1-TRANSFER journeys connecting Origin -> Interchange -> Destination.
 */
async function searchSingleTransferRoutes(origStops, destStops, existingDirectCount = 0) {
  const origIds = origStops.map(s => s.stop_id);
  const destIds = destStops.map(s => s.stop_id);
  if (origIds.length === 0 || destIds.length === 0) return [];

  // 1. Discover intermediate stops reachable downstream from origin
  const [origReachable] = await pool.query(
    `SELECT DISTINCT st_inter.stop_id
     FROM transit_stop_times st_orig
     JOIN transit_stop_times st_inter ON st_orig.trip_id = st_inter.trip_id
     WHERE st_orig.stop_id IN (?) 
       AND st_inter.stop_sequence > st_orig.stop_sequence`,
    [origIds]
  );

  const reachableIds = origReachable
    .map(r => r.stop_id)
    .filter(id => !origIds.includes(id) && !destIds.includes(id));

  if (reachableIds.length === 0) return [];

  // 2. Intersect with stops that connect downstream to destination
  const [transferStops] = await pool.query(
    `SELECT DISTINCT s.stop_id, s.stop_name, s.stop_lat, s.stop_lon
     FROM transit_stop_times st_dest
     JOIN transit_stop_times st_inter ON st_dest.trip_id = st_inter.trip_id
     JOIN transit_stops s ON st_inter.stop_id = s.stop_id
     WHERE st_dest.stop_id IN (?)
       AND st_inter.stop_sequence < st_dest.stop_sequence
       AND st_inter.stop_id IN (?)
     LIMIT 25`,
    [destIds, reachableIds]
  );

  if (transferStops.length === 0) return [];

  // Prioritize primary Hyderabad transit interchange hubs
  const majorHubKeywords = ['mehdipatnam', 'secunderabad', 'koti', 'lakdikapool', 'nampally', 'dilsukhnagar', 'narsinghi', 'ameerpet', 'afzalgunj', 'cbit', 'gachibowli'];
  transferStops.sort((a, b) => {
    const aName = a.stop_name.toLowerCase();
    const bName = b.stop_name.toLowerCase();
    const aIsMajor = majorHubKeywords.some(k => aName.includes(k)) ? 1 : 0;
    const bIsMajor = majorHubKeywords.some(k => bName.includes(k)) ? 1 : 0;
    return bIsMajor - aIsMajor;
  });

  // If we already have ample direct routes (>= 5), skip heavy transfer discovery
  if (existingDirectCount >= 5) {
    return [];
  }

  const transferJourneys = [];
  const seenJourneys = new Set();

  for (const inter of transferStops.slice(0, 6)) {
    // Leg 1: Origin -> Interchange
    const [leg1Rows] = await pool.query(
      `SELECT 
          r.route_id, r.route_long_name, t.trip_id, t.trip_short_name,
          s1.stop_id AS orig_id, s1.stop_name AS orig_name, s1.stop_lat AS orig_lat, s1.stop_lon AS orig_lon,
          s2.stop_id AS inter_id, s2.stop_name AS inter_name, s2.stop_lat AS inter_lat, s2.stop_lon AS inter_lon,
          st1.departure_time AS orig_dep, st2.arrival_time AS inter_arr,
          st1.stop_sequence AS orig_seq, st2.stop_sequence AS inter_seq,
          (st2.stop_sequence - st1.stop_sequence) AS stops_count
       FROM transit_stop_times st1
       JOIN transit_stop_times st2 ON st1.trip_id = st2.trip_id
       JOIN transit_trips t ON st1.trip_id = t.trip_id
       JOIN transit_routes r ON t.route_id = r.route_id
       JOIN transit_stops s1 ON st1.stop_id = s1.stop_id
       JOIN transit_stops s2 ON st2.stop_id = s2.stop_id
       WHERE st1.stop_id IN (?)
         AND st2.stop_id = ?
         AND st1.stop_sequence < st2.stop_sequence
       ORDER BY st1.departure_time ASC
       LIMIT 25`,
      [origIds, inter.stop_id]
    );

    if (leg1Rows.length === 0) continue;

    // Leg 2: Interchange -> Destination (Fetched ONCE per interchange)
    const [leg2Rows] = await pool.query(
      `SELECT 
          r.route_id, r.route_long_name, t.trip_id, t.trip_short_name,
          s1.stop_id AS inter_id, s1.stop_name AS inter_name, s1.stop_lat AS inter_lat, s1.stop_lon AS inter_lon,
          s2.stop_id AS dest_id, s2.stop_name AS dest_name, s2.stop_lat AS dest_lat, s2.stop_lon AS dest_lon,
          st1.departure_time AS inter_dep, st2.arrival_time AS dest_arr,
          st1.stop_sequence AS inter_seq, st2.stop_sequence AS dest_seq,
          (st2.stop_sequence - st1.stop_sequence) AS stops_count
       FROM transit_stop_times st1
       JOIN transit_stop_times st2 ON st1.trip_id = st2.trip_id
       JOIN transit_trips t ON st1.trip_id = t.trip_id
       JOIN transit_routes r ON t.route_id = r.route_id
       JOIN transit_stops s1 ON st1.stop_id = s1.stop_id
       JOIN transit_stops s2 ON st2.stop_id = s2.stop_id
       WHERE st1.stop_id = ?
         AND st2.stop_id IN (?)
         AND st1.stop_sequence < st2.stop_sequence
       ORDER BY st1.departure_time ASC
       LIMIT 25`,
      [inter.stop_id, destIds]
    );

    if (leg2Rows.length === 0) continue;

    for (const l1 of leg1Rows) {
      const l1Dep = parseGtfsTimeToMinutes(l1.orig_dep);
      const l1Arr = parseGtfsTimeToMinutes(l1.inter_arr);
      if (l1Dep == null || l1Arr == null) continue;

      const d1 = haversineDistance(parseFloat(l1.orig_lat), parseFloat(l1.orig_lon), parseFloat(l1.inter_lat), parseFloat(l1.inter_lon));
      const val1 = evaluateLegDuration(l1Dep, l1Arr, d1, l1.stops_count);
      if (!val1.valid) continue;

      for (const l2 of leg2Rows) {
        if (l1.route_id === l2.route_id || l1.trip_id === l2.trip_id) continue;

        const l2Dep = parseGtfsTimeToMinutes(l2.inter_dep);
        const l2Arr = parseGtfsTimeToMinutes(l2.dest_arr);
        if (l2Dep == null || l2Arr == null) continue;

        const d2 = haversineDistance(parseFloat(l2.inter_lat), parseFloat(l2.inter_lon), parseFloat(l2.dest_lat), parseFloat(l2.dest_lon));
        const val2 = evaluateLegDuration(l2Dep, l2Arr, d2, l2.stops_count);
        if (!val2.valid) continue;

        // Calculate transfer buffer between Leg 1 effective arrival and Leg 2 departure
        let transferWait = l2Dep - val1.effectiveArrMins;

        // Handle overnight transfer or wrap-around
        if (transferWait < 0) {
          transferWait += 1440;
        }

        // Must respect minimum boarding buffer and max realistic layover
        if (transferWait < ROUTING_CONFIG.MIN_TRANSFER_BUFFER_MINS) continue;
        if (transferWait > ROUTING_CONFIG.MAX_TRANSFER_WAIT_MINS) continue;

        const inVehicleMins = val1.durationMins + val2.durationMins;
        const totalDurationMins = inVehicleMins + transferWait;
        const finalArrivalMins = l1Dep + totalDurationMins;

        const journeyKey = `${l1.route_id}->${inter.stop_name}->${l2.route_id}@${l1.orig_dep}`;
        if (seenJourneys.has(journeyKey)) continue;
        seenJourneys.add(journeyKey);

        const totalStops = l1.stops_count + l2.stops_count;
        const { delayMins, condition } = estimateTrafficDelay(l1Dep, totalStops);
        const crowd = estimatePassengerDemand(l1Dep);

        const isAnyEstimated = val1.isEstimated || val2.isEstimated;
        const durationSource = isAnyEstimated
          ? 'Estimated Route Duration (Calibrated Transit Model)'
          : 'Scheduled Timetable';

        transferJourneys.push({
          journey_type: 'transfer',
          transfers_count: 1,
          scheduled_duration_mins: totalDurationMins,
          in_vehicle_duration_mins: inVehicleMins,
          transfer_waiting_mins: transferWait,
          walking_duration_mins: 0,
          expected_delay_mins: delayMins,
          total_estimated_travel_time_mins: totalDurationMins + delayMins,
          traffic_condition: condition,
          crowd_level: crowd.level,
          crowd_badge: crowd.badge,
          departure_time: formatMinutesToClockTime(l1Dep),
          arrival_time: formatMinutesToClockTime(finalArrivalMins),
          next_departure_time: formatMinutesToClockTime(l1Dep),
          scheduled_arrival_time: formatMinutesToClockTime(finalArrivalMins),
          formatted_departure: formatMinutesToClockTime(l1Dep),
          formatted_arrival: formatMinutesToClockTime(finalArrivalMins),
          raw_departure_time: l1.orig_dep,
          raw_arrival_time: l2.dest_arr,
          duration_source: durationSource,
          is_duration_estimated: isAnyEstimated,
          schedule_note: isAnyEstimated ? (val1.note || val2.note) : null,
          route_id: `${l1.route_id} ➔ ${l2.route_id}`,
          route_name: `${l1.route_long_name || l1.route_id} ➔ ${l2.route_long_name || l2.route_id}`,
          trip_id: `${l1.trip_id}_${l2.trip_id}`,
          trip_title: `Transfer via ${inter.stop_name}`,
          stops_count: totalStops,
          is_direct: false,
          score: totalDurationMins + 15 + delayMins * 1.1,
          legs: [
            {
              leg_number: 1,
              route_id: l1.route_id,
              route_name: l1.route_long_name || `Route ${l1.route_id}`,
              trip_id: l1.trip_id,
              trip_title: l1.trip_short_name,
              boarding_stop: {
                stop_id: l1.orig_id,
                stop_name: l1.orig_name,
                stop_lat: parseFloat(l1.orig_lat),
                stop_lon: parseFloat(l1.orig_lon)
              },
              alighting_stop: {
                stop_id: l1.inter_id,
                stop_name: l1.inter_name,
                stop_lat: parseFloat(l1.inter_lat),
                stop_lon: parseFloat(l1.inter_lon)
              },
              departure_time: formatMinutesToClockTime(l1Dep),
              arrival_time: formatMinutesToClockTime(val1.effectiveArrMins),
              raw_departure_time: l1.orig_dep,
              raw_arrival_time: l1.inter_arr,
              duration_mins: val1.durationMins,
              scheduled_duration_mins: val1.durationMins,
              from_stop_name: l1.orig_name,
              to_stop_name: l1.inter_name,
              route_short_name: l1.route_short_name || l1.route_long_name || `Route ${l1.route_id}`,
              duration_source: val1.durationSource,
              is_duration_estimated: val1.isEstimated,
              stops_count: l1.stops_count
            },
            {
              leg_number: 2,
              route_id: l2.route_id,
              route_name: l2.route_long_name || `Route ${l2.route_id}`,
              trip_id: l2.trip_id,
              trip_title: l2.trip_short_name,
              boarding_stop: {
                stop_id: l2.inter_id,
                stop_name: l2.inter_name,
                stop_lat: parseFloat(l2.inter_lat),
                stop_lon: parseFloat(l2.inter_lon)
              },
              alighting_stop: {
                stop_id: l2.dest_id,
                stop_name: l2.dest_name,
                stop_lat: parseFloat(l2.dest_lat),
                stop_lon: parseFloat(l2.dest_lon)
              },
              departure_time: formatMinutesToClockTime(l2Dep),
              arrival_time: formatMinutesToClockTime(finalArrivalMins),
              raw_departure_time: l2.inter_dep,
              raw_arrival_time: l2.dest_arr,
              duration_mins: val2.durationMins,
              scheduled_duration_mins: val2.durationMins,
              from_stop_name: l2.inter_name,
              to_stop_name: l2.dest_name,
              route_short_name: l2.route_short_name || l2.route_long_name || `Route ${l2.route_id}`,
              duration_source: val2.durationSource,
              is_duration_estimated: val2.isEstimated,
              stops_count: l2.stops_count
            }
          ],
          transfers: [
            {
              transfer_index: 1,
              transfer_stop_id: inter.stop_id,
              transfer_stop_name: inter.stop_name,
              waiting_time_mins: transferWait,
              walking_distance_meters: 0,
              alighting_time: formatMinutesToClockTime(val1.effectiveArrMins),
              connecting_departure_time: formatMinutesToClockTime(l2Dep)
            }
          ]
        });
      }
    }
  }

  return transferJourneys;
}

/**
 * Discovers 2-TRANSFER journeys (Origin -> Hub 1 -> Hub 2 -> Destination).
 * Activated when direct or 1-transfer options are limited.
 */
async function searchDoubleTransferRoutes(origStops, destStops) {
  const origIds = origStops.map(s => s.stop_id);
  const destIds = destStops.map(s => s.stop_id);
  if (origIds.length === 0 || destIds.length === 0) return [];

  const keyHubs = ['Mehdipatnam', 'Secunderabad', 'Koti', 'Afzalgunj', 'Lakdikapool', 'Cbit'];
  const [hubStops] = await pool.query(
    `SELECT stop_id, stop_name, stop_lat, stop_lon 
     FROM transit_stops 
     WHERE stop_name IN (?)
     LIMIT 15`,
    [keyHubs]
  );

  if (hubStops.length < 2) return [];

  const doubleTransfers = [];
  const seenPatterns = new Set();

  for (let i = 0; i < hubStops.length; i++) {
    for (let j = 0; j < hubStops.length; j++) {
      if (i === j) continue;
      const hub1 = hubStops[i];
      const hub2 = hubStops[j];

      // Check if leg 1 exists: Origin -> Hub 1
      const [l1] = await pool.query(
        `SELECT r.route_id, r.route_long_name, t.trip_id, t.trip_short_name,
                st1.departure_time as dep, st2.arrival_time as arr,
                s1.stop_name as orig_name, s2.stop_name as h1_name,
                s1.stop_lat as s1_lat, s1.stop_lon as s1_lon, s2.stop_lat as s2_lat, s2.stop_lon as s2_lon,
                (st2.stop_sequence - st1.stop_sequence) as stops
         FROM transit_stop_times st1
         JOIN transit_stop_times st2 ON st1.trip_id = st2.trip_id
         JOIN transit_trips t ON st1.trip_id = t.trip_id
         JOIN transit_routes r ON t.route_id = r.route_id
         JOIN transit_stops s1 ON st1.stop_id = s1.stop_id
         JOIN transit_stops s2 ON st2.stop_id = s2.stop_id
         WHERE st1.stop_id IN (?) AND st2.stop_id = ? AND st1.stop_sequence < st2.stop_sequence
         LIMIT 5`,
        [origIds, hub1.stop_id]
      );
      if (l1.length === 0) continue;

      // Check if leg 2 exists: Hub 1 -> Hub 2
      const [l2] = await pool.query(
        `SELECT r.route_id, r.route_long_name, t.trip_id, t.trip_short_name,
                st1.departure_time as dep, st2.arrival_time as arr,
                s1.stop_name as h1_name, s2.stop_name as h2_name,
                s1.stop_lat as s1_lat, s1.stop_lon as s1_lon, s2.stop_lat as s2_lat, s2.stop_lon as s2_lon,
                (st2.stop_sequence - st1.stop_sequence) as stops
         FROM transit_stop_times st1
         JOIN transit_stop_times st2 ON st1.trip_id = st2.trip_id
         JOIN transit_trips t ON st1.trip_id = t.trip_id
         JOIN transit_routes r ON t.route_id = r.route_id
         JOIN transit_stops s1 ON st1.stop_id = s1.stop_id
         JOIN transit_stops s2 ON st2.stop_id = s2.stop_id
         WHERE st1.stop_id = ? AND st2.stop_id = ? AND st1.stop_sequence < st2.stop_sequence
         LIMIT 5`,
        [hub1.stop_id, hub2.stop_id]
      );
      if (l2.length === 0) continue;

      // Check if leg 3 exists: Hub 2 -> Destination
      const [l3] = await pool.query(
        `SELECT r.route_id, r.route_long_name, t.trip_id, t.trip_short_name,
                st1.departure_time as dep, st2.arrival_time as arr,
                s1.stop_name as h2_name, s2.stop_name as dest_name,
                s1.stop_lat as s1_lat, s1.stop_lon as s1_lon, s2.stop_lat as s2_lat, s2.stop_lon as s2_lon,
                (st2.stop_sequence - st1.stop_sequence) as stops
         FROM transit_stop_times st1
         JOIN transit_stop_times st2 ON st1.trip_id = st2.trip_id
         JOIN transit_trips t ON st1.trip_id = t.trip_id
         JOIN transit_routes r ON t.route_id = r.route_id
         JOIN transit_stops s1 ON st1.stop_id = s1.stop_id
         JOIN transit_stops s2 ON st2.stop_id = s2.stop_id
         WHERE st1.stop_id = ? AND st2.stop_id IN (?) AND st1.stop_sequence < st2.stop_sequence
         LIMIT 5`,
        [hub2.stop_id, destIds]
      );
      if (l3.length === 0) continue;

      // We have candidate legs for 2-transfer
      const leg1 = l1[0];
      const leg2 = l2[0];
      const leg3 = l3[0];

      const d1 = haversineDistance(parseFloat(leg1.s1_lat), parseFloat(leg1.s1_lon), parseFloat(leg1.s2_lat), parseFloat(leg1.s2_lon));
      const d2 = haversineDistance(parseFloat(leg2.s1_lat), parseFloat(leg2.s1_lon), parseFloat(leg2.s2_lat), parseFloat(leg2.s2_lon));
      const d3 = haversineDistance(parseFloat(leg3.s1_lat), parseFloat(leg3.s1_lon), parseFloat(leg3.s2_lat), parseFloat(leg3.s2_lon));

      const v1 = evaluateLegDuration(parseGtfsTimeToMinutes(leg1.dep), parseGtfsTimeToMinutes(leg1.arr), d1, leg1.stops);
      const v2 = evaluateLegDuration(parseGtfsTimeToMinutes(leg2.dep), parseGtfsTimeToMinutes(leg2.arr), d2, leg2.stops);
      const v3 = evaluateLegDuration(parseGtfsTimeToMinutes(leg3.dep), parseGtfsTimeToMinutes(leg3.arr), d3, leg3.stops);

      if (!v1.valid || !v2.valid || !v3.valid) continue;

      const wait1 = 12; // 12 mins nominal transfer buffer at Hub 1
      const wait2 = 12; // 12 mins nominal transfer buffer at Hub 2
      const inVehicle = v1.durationMins + v2.durationMins + v3.durationMins;
      const totalDur = inVehicle + wait1 + wait2;
      const depMins = parseGtfsTimeToMinutes(leg1.dep);
      const arrMins = depMins + totalDur;

      const patternKey = `${leg1.route_id}->${hub1.stop_name}->${leg2.route_id}->${hub2.stop_name}->${leg3.route_id}`;
      if (seenPatterns.has(patternKey)) continue;
      seenPatterns.add(patternKey);

      const totalStops = leg1.stops + leg2.stops + leg3.stops;
      const { delayMins, condition } = estimateTrafficDelay(depMins, totalStops);
      const crowd = estimatePassengerDemand(depMins);

      doubleTransfers.push({
        journey_type: 'transfer',
        transfers_count: 2,
        scheduled_duration_mins: totalDur,
        in_vehicle_duration_mins: inVehicle,
        transfer_waiting_mins: wait1 + wait2,
        walking_duration_mins: 0,
        expected_delay_mins: delayMins,
        total_estimated_travel_time_mins: totalDur + delayMins,
        traffic_condition: condition,
        crowd_level: crowd.level,
        crowd_badge: crowd.badge,
        departure_time: formatMinutesToClockTime(depMins),
        arrival_time: formatMinutesToClockTime(arrMins),
        next_departure_time: formatMinutesToClockTime(depMins),
        scheduled_arrival_time: formatMinutesToClockTime(arrMins),
        formatted_departure: formatMinutesToClockTime(depMins),
        formatted_arrival: formatMinutesToClockTime(arrMins),
        raw_departure_time: leg1.dep,
        raw_arrival_time: leg3.arr,
        duration_source: 'Estimated Route Duration (Calibrated Transit Model)',
        is_duration_estimated: true,
        route_id: `${leg1.route_id} ➔ ${leg2.route_id} ➔ ${leg3.route_id}`,
        route_name: `${leg1.route_id} ➔ ${leg2.route_id} ➔ ${leg3.route_id}`,
        trip_id: `${leg1.trip_id}_${leg2.trip_id}_${leg3.trip_id}`,
        trip_title: `2 Transfers via ${hub1.stop_name} & ${hub2.stop_name}`,
        stops_count: totalStops,
        is_direct: false,
        score: totalDur + 30 + delayMins * 1.1,
        legs: [
          {
            leg_number: 1,
            route_id: leg1.route_id,
            route_name: leg1.route_long_name || `Route ${leg1.route_id}`,
            trip_id: leg1.trip_id,
            trip_title: leg1.trip_short_name,
            boarding_stop: { stop_id: origStops[0].stop_id, stop_name: leg1.orig_name },
            alighting_stop: { stop_id: hub1.stop_id, stop_name: hub1.stop_name },
            departure_time: formatMinutesToClockTime(depMins),
            arrival_time: formatMinutesToClockTime(depMins + v1.durationMins),
            duration_mins: v1.durationMins,
            duration_source: v1.durationSource,
            is_duration_estimated: v1.isEstimated,
            stops_count: leg1.stops
          },
          {
            leg_number: 2,
            route_id: leg2.route_id,
            route_name: leg2.route_long_name || `Route ${leg2.route_id}`,
            trip_id: leg2.trip_id,
            trip_title: leg2.trip_short_name,
            boarding_stop: { stop_id: hub1.stop_id, stop_name: hub1.stop_name },
            alighting_stop: { stop_id: hub2.stop_id, stop_name: hub2.stop_name },
            departure_time: formatMinutesToClockTime(depMins + v1.durationMins + wait1),
            arrival_time: formatMinutesToClockTime(depMins + v1.durationMins + wait1 + v2.durationMins),
            duration_mins: v2.durationMins,
            duration_source: v2.durationSource,
            is_duration_estimated: v2.isEstimated,
            stops_count: leg2.stops
          },
          {
            leg_number: 3,
            route_id: leg3.route_id,
            route_name: leg3.route_long_name || `Route ${leg3.route_id}`,
            trip_id: leg3.trip_id,
            trip_title: leg3.trip_short_name,
            boarding_stop: { stop_id: hub2.stop_id, stop_name: hub2.stop_name },
            alighting_stop: { stop_id: destStops[0].stop_id, stop_name: leg3.dest_name },
            departure_time: formatMinutesToClockTime(depMins + v1.durationMins + wait1 + v2.durationMins + wait2),
            arrival_time: formatMinutesToClockTime(arrMins),
            duration_mins: v3.durationMins,
            duration_source: v3.durationSource,
            is_duration_estimated: v3.isEstimated,
            stops_count: leg3.stops
          }
        ],
        transfers: [
          {
            transfer_index: 1,
            transfer_stop_id: hub1.stop_id,
            transfer_stop_name: hub1.stop_name,
            waiting_time_mins: wait1,
            alighting_time: formatMinutesToClockTime(depMins + v1.durationMins),
            connecting_departure_time: formatMinutesToClockTime(depMins + v1.durationMins + wait1)
          },
          {
            transfer_index: 2,
            transfer_stop_id: hub2.stop_id,
            transfer_stop_name: hub2.stop_name,
            waiting_time_mins: wait2,
            alighting_time: formatMinutesToClockTime(depMins + v1.durationMins + wait1 + v2.durationMins),
            connecting_departure_time: formatMinutesToClockTime(depMins + v1.durationMins + wait1 + v2.durationMins + wait2)
          }
        ]
      });

      if (doubleTransfers.length >= 3) break;
    }
    if (doubleTransfers.length >= 3) break;
  }

  return doubleTransfers;
}

/**
 * Main public entry point: Discovers multi-tier transit routes.
 * Tier 1: Direct routes.
 * Tier 2: 1-Transfer routes.
 * Tier 3: 2-Transfer routes if needed.
 */
async function findTransitJourneys(originInput, destInput, maxOptions = 8) {
  if (!originInput || !destInput) {
    throw new Error('Please specify both origin and destination transit points.');
  }

  const origCandidates = await resolveCandidateStops(originInput);
  const destCandidates = await resolveCandidateStops(destInput);

  if (origCandidates.length === 0) {
    return {
      status: 'NOT_FOUND',
      error: `Origin location '${originInput}' could not be resolved to any known transit stop in Hyderabad.`,
      options: []
    };
  }

  if (destCandidates.length === 0) {
    return {
      status: 'NOT_FOUND',
      error: `Destination location '${destInput}' could not be resolved to any known transit stop in Hyderabad.`,
      options: []
    };
  }

  const primaryOrig = origCandidates[0];
  const primaryDest = destCandidates[0];

  if (primaryOrig.stop_name.toLowerCase() === primaryDest.stop_name.toLowerCase()) {
    return {
      status: 'INVALID_INPUT',
      error: 'Origin and destination resolve to the same stop. Please specify distinct locations.',
      options: []
    };
  }

  const distanceKm = haversineDistance(
    parseFloat(primaryOrig.stop_lat), parseFloat(primaryOrig.stop_lon),
    parseFloat(primaryDest.stop_lat), parseFloat(primaryDest.stop_lon)
  );

  // 1. Search Direct Routes (Tier 1)
  const directRoutes = await searchDirectRoutes(origCandidates, destCandidates);

  // 2. Search 1-Transfer Routes (Tier 2)
  let transferRoutes = [];
  try {
    transferRoutes = await searchSingleTransferRoutes(origCandidates, destCandidates, directRoutes.length);
  } catch (err) {
    console.warn('[Routing Warning] Transfer search encountered error:', err.message);
  }

  // 3. Search 2-Transfer Routes (Tier 3) if fewer than 2 options found
  let doubleTransferRoutes = [];
  if (directRoutes.length + transferRoutes.length < 2) {
    try {
      doubleTransferRoutes = await searchDoubleTransferRoutes(origCandidates, destCandidates);
    } catch (err) {
      console.warn('[Routing Warning] 2-Transfer search encountered error:', err.message);
    }
  }

  // Combine and rank all valid options
  const allOptions = [...directRoutes, ...transferRoutes, ...doubleTransferRoutes];

  // Multi-criteria ranking: Sort by score (duration + transfer penalty + delay)
  allOptions.sort((a, b) => a.score - b.score);

  if (allOptions.length > 0) {
    allOptions[0].is_recommended = true;
  }

  const displayedOptions = allOptions.slice(0, maxOptions);

  return {
    status: 'SUCCESS',
    origin: {
      stop_name: primaryOrig.stop_name,
      zone_id: primaryOrig.zone_id,
      stop_lat: primaryOrig.stop_lat ? parseFloat(primaryOrig.stop_lat) : null,
      stop_lon: primaryOrig.stop_lon ? parseFloat(primaryOrig.stop_lon) : null,
      candidate_stops_count: origCandidates.length
    },
    destination: {
      stop_name: primaryDest.stop_name,
      zone_id: primaryDest.zone_id,
      stop_lat: primaryDest.stop_lat ? parseFloat(primaryDest.stop_lat) : null,
      stop_lon: primaryDest.stop_lon ? parseFloat(primaryDest.stop_lon) : null,
      candidate_stops_count: destCandidates.length
    },
    direct_distance_km: distanceKm ? Math.round(distanceKm * 100) / 100 : null,
    road_distance_km: distanceKm ? Math.round(distanceKm * ROUTING_CONFIG.ROUTING_CIRCUITY_FACTOR * 100) / 100 : null,
    total_routes_found: allOptions.length,
    direct_routes_count: directRoutes.length,
    transfer_routes_count: transferRoutes.length + doubleTransferRoutes.length,
    displayed_options_count: displayedOptions.length,
    options: displayedOptions,
    message: displayedOptions.length === 0
      ? `No valid transit itinerary found connecting '${primaryOrig.stop_name}' to '${primaryDest.stop_name}'. The locations may not have overlapping bus corridors in the current GTFS schedule.`
      : null
  };
}

module.exports = {
  haversineDistance,
  parseGtfsTimeToMinutes,
  formatMinutesToClockTime,
  evaluateLegDuration,
  validateLegPlausibility,
  resolveCandidateStops,
  estimateTrafficDelay,
  estimatePassengerDemand,
  searchDirectRoutes,
  searchSingleTransferRoutes,
  searchDoubleTransferRoutes,
  findTransitJourneys,
  ROUTING_CONFIG,
  LOCALITY_ALIASES
};
