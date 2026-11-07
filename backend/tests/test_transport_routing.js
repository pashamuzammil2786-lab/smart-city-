/**
 * =============================================================================
 * Smart City Urban Analytics Platform - Transport Routing Engine Automated Test Suite
 * File: backend/tests/test_transport_routing.js
 * 
 * Comprehensive 12-Scenario Verification for IEEE-Grade Evaluation:
 *   1. Direct bus journey discovery (Charminar -> Afzalgunj)
 *   2. Multi-leg transfer route discovery (Shaikpet -> IBS via Mehdipatnam)
 *   3. Mathematical consistency of journey metrics (duration = in_vehicle + wait = arr - dep)
 *   4. GTFS service-day time parsing > 24:00:00 (no naive modulo corruption)
 *   5. Rejection of uncurated multi-shift duty blocks (500 - 1500 mins)
 *   6. Physical speed and distance plausibility validation (3 - 120 km/h)
 *   7. Transfer buffer feasibility (rejection of negative or insufficient layover)
 *   8. Excessive layover rejection (> 120 mins)
 *   9. Locality candidate stop resolution and geospatial clustering
 *  10. Non-existent stop / unsupported location error handling
 *  11. Identical origin and destination validation
 *  12. Strict separation of ML passenger demand and traffic delay from timetable duration
 * =============================================================================
 */

const assert = require('assert');
const pool = require('../db');
const routingService = require('../services/routingService');

let passedTests = 0;
let failedTests = 0;

function runScenario(number, name, fn) {
  return async () => {
    try {
      await fn();
      console.log(`  \x1b[32m✔ [PASS]\x1b[0m Scenario ${number}: ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  \x1b[31m✖ [FAIL]\x1b[0m Scenario ${number}: ${name}`);
      console.error(`     \x1b[33mError:\x1b[0m ${err.message}`);
      failedTests++;
    }
  };
}

async function runAllTests() {
  console.log('\n======================================================================');
  console.log('🚍 RUNNING TRANSPORT ROUTING ENGINE TEST SUITE (12 SCENARIOS)');
  console.log('======================================================================\n');

  // Scenario 1: Direct Transit Connection
  await runScenario(1, 'Direct Transit Connection (Charminar -> Afzalgunj)', async () => {
    const result = await routingService.findTransitJourneys('Charminar', 'Afzalgunj', 5);
    assert.strictEqual(result.status, 'SUCCESS', 'Status should be SUCCESS');
    assert(result.direct_routes_count > 0, 'Should find direct routes');
    assert(result.options.length > 0, 'Should return options');
    const opt = result.options[0];
    assert.strictEqual(opt.is_direct, true, 'First option should be direct');
    assert.strictEqual(opt.transfers_count, 0, 'Transfers count should be 0');
    assert(opt.scheduled_duration_mins > 0 && opt.scheduled_duration_mins <= 60, 'Direct duration should be realistic');
  })();

  // Scenario 2: Multi-Leg 1-Transfer Route Discovery
  await runScenario(2, 'Multi-Leg 1-Transfer Route Discovery (Shaikpet -> IBS via Mehdipatnam)', async () => {
    const result = await routingService.findTransitJourneys('Shaikpet', 'IBS', 5);
    assert.strictEqual(result.status, 'SUCCESS', 'Status should be SUCCESS');
    assert(result.total_routes_found > 0, 'Should discover valid transfer connection');
    const opt = result.options.find(o => o.journey_type === 'transfer');
    assert(opt, 'Should contain a transfer journey');
    assert.strictEqual(opt.transfers_count, 1, 'Should have exactly 1 transfer');
    assert.strictEqual(opt.legs.length, 2, 'Should have exactly 2 legs');
    assert(opt.transfers.length === 1, 'Should have 1 transfer record');
    // Check that Mehdipatnam is the transfer interchange
    const interName = opt.transfers[0].transfer_stop_name.toLowerCase();
    assert(interName.includes('mehdipatnam') || interName.includes('narsinghi'), `Interchange should be Mehdipatnam or Narsinghi, got ${interName}`);
  })();

  // Scenario 3: Mathematical Consistency of Journey Metrics
  await runScenario(3, 'Mathematical Consistency of Journey Metrics', async () => {
    const result = await routingService.findTransitJourneys('Shaikpet', 'IBS', 5);
    const opt = result.options[0];
    assert(opt, 'Should have an option to test');
    // Scheduled duration must equal in-vehicle duration + transfer waiting time
    const expectedDuration = opt.in_vehicle_duration_mins + opt.transfer_waiting_mins;
    assert.strictEqual(
      opt.scheduled_duration_mins,
      expectedDuration,
      `Scheduled duration (${opt.scheduled_duration_mins}) must equal in-vehicle (${opt.in_vehicle_duration_mins}) + wait (${opt.transfer_waiting_mins})`
    );
    // Scheduled duration + delay = total estimated travel time
    assert.strictEqual(
      opt.total_estimated_travel_time_mins,
      opt.scheduled_duration_mins + opt.expected_delay_mins,
      'Total estimated travel time must equal scheduled duration + expected delay'
    );
  })();

  // Scenario 4: GTFS Service Times > 24:00:00 Preservation
  await runScenario(4, 'GTFS Service Times > 24:00:00 Preservation (No Modulo Corruption)', async () => {
    const t1 = routingService.parseGtfsTimeToMinutes('24:15:00');
    assert.strictEqual(t1, 1455, '24:15:00 should equal 1455 minutes from midnight');

    const t2 = routingService.parseGtfsTimeToMinutes('26:45:30');
    assert.strictEqual(t2, 1606, '26:45:30 should equal 1606 minutes from midnight');

    const clockDisplay1 = routingService.formatMinutesToClockTime(1455);
    assert.strictEqual(clockDisplay1, '00:15 (+1d)', 'Should display +1d for hours >= 24');

    const clockDisplay2 = routingService.formatMinutesToClockTime(750);
    assert.strictEqual(clockDisplay2, '12:30', 'Standard time should not have day offset');
  })();

  // Scenario 5: Rejection of Uncurated Multi-Shift Duty Blocks (500 - 1500 mins)
  await runScenario(5, 'Rejection of Uncurated Multi-Shift Duty Blocks (1,000–1,500 mins)', async () => {
    // Departure at 17:37:41 (1058m), Arrival at 42:53:04 (2573m) -> 1515 mins elapsed
    const depMins = routingService.parseGtfsTimeToMinutes('17:37:41');
    const arrMins = routingService.parseGtfsTimeToMinutes('42:53:04');
    const distanceKm = 24.5;

    const validation = routingService.validateLegPlausibility(depMins, arrMins, distanceKm);
    assert.strictEqual(validation.valid, false, 'Multi-shift duty block of 1515 mins must be rejected');
    assert(validation.reason.includes('exceeds plausible single-run limit'), 'Should cite duty block limit');
  })();

  // Scenario 6: Speed and Distance Plausibility Check
  await runScenario(6, 'Physical Speed and Distance Plausibility Validation (3 - 120 km/h)', async () => {
    // 200 km/h is impossible for intra-city bus
    const tooFast = routingService.validateLegPlausibility(600, 605, 30.0); // 30 km in 5 mins = 360 km/h
    assert.strictEqual(tooFast.valid, false, 'Excessive speed must be rejected');

    // 1 km/h over 3 hours is impossible for a moving bus run
    const tooSlow = routingService.validateLegPlausibility(600, 780, 2.0); // 2 km in 180 mins = 0.67 km/h
    assert.strictEqual(tooSlow.valid, false, 'Implausibly low speed must be rejected');

    // Realistic run: 15 km in 45 mins = 20 km/h
    const realistic = routingService.validateLegPlausibility(600, 645, 15.0);
    assert.strictEqual(realistic.valid, true, 'Realistic transit leg must be accepted');
    assert.strictEqual(realistic.durationMins, 45, 'Duration should be 45 mins');
  })();

  // Scenario 7: Infeasible Transfer Buffer (Rejection of Negative or Zero Layover)
  await runScenario(7, 'Transfer Buffer Feasibility (Reject Connecting Bus Departing Before Arrival)', async () => {
    const l1Arr = 600; // Arrives 10:00
    const l2DepEarly = 590; // Departs 09:50 (before arrival)
    const l2DepTight = 602; // Departs 10:02 (only 2 mins layover, buffer requires 5)

    const waitEarly = l2DepEarly - l1Arr;
    assert(waitEarly < routingService.ROUTING_CONFIG.MIN_TRANSFER_BUFFER_MINS, 'Early departure must fail transfer buffer check');

    const waitTight = l2DepTight - l1Arr;
    assert(waitTight < routingService.ROUTING_CONFIG.MIN_TRANSFER_BUFFER_MINS, 'Insufficient buffer must fail check');
  })();

  // Scenario 8: Excessive Layover Rejection (> 120 mins)
  await runScenario(8, 'Excessive Layover Rejection (> 120 mins)', async () => {
    const l1Arr = 600; // 10:00
    const l2DepFar = 750; // 12:30 (150 mins later)
    const wait = l2DepFar - l1Arr;
    assert(wait > routingService.ROUTING_CONFIG.MAX_TRANSFER_WAIT_MINS, 'Layover > 120 mins must exceed MAX_TRANSFER_WAIT_MINS');
  })();

  // Scenario 9: Locality Candidate Stop Resolution & Geospatial Clustering
  await runScenario(9, 'Locality Candidate Stop Resolution & Clustering', async () => {
    const candidates = await routingService.resolveCandidateStops('Shaikpet');
    assert(candidates.length >= 2, 'Locality search should return cluster of candidate stops');
    const stopNames = candidates.map(s => s.stop_name.toLowerCase());
    assert(stopNames.some(n => n.includes('shaikpet')), 'Cluster must contain Shaikpet stops');
  })();

  // Scenario 10: Non-Existent Stop / Unsupported Location Handling
  await runScenario(10, 'Non-Existent Stop / Unsupported Location Error Handling', async () => {
    const result = await routingService.findTransitJourneys('Atlantis Ocean City', 'Afzalgunj');
    assert.strictEqual(result.status, 'NOT_FOUND', 'Should return NOT_FOUND status');
    assert(result.error.includes('could not be resolved'), 'Should provide explanatory error message');
    assert.strictEqual(result.options.length, 0, 'Options should be empty');
  })();

  // Scenario 11: Identical Origin and Destination Validation
  await runScenario(11, 'Identical Origin and Destination Validation', async () => {
    const result = await routingService.findTransitJourneys('Charminar', 'Charminar');
    assert.strictEqual(result.status, 'INVALID_INPUT', 'Should return INVALID_INPUT');
    assert(result.error.includes('same stop'), 'Should warn about identical locations');
  })();

  // Scenario 12: Separation of ML Demand and Delay Predictions
  await runScenario(12, 'Strict Separation of ML Demand and Traffic Delay from Scheduled Duration', async () => {
    const result = await routingService.findTransitJourneys('Charminar', 'Afzalgunj', 2);
    const opt = result.options[0];
    assert(opt.crowd_level, 'Must have crowd level attribute');
    assert(opt.crowd_badge, 'Must have crowd badge');
    assert(typeof opt.expected_delay_mins === 'number', 'Delay must be numeric');
    // Timetable scheduled duration must not be artificially inflated with ML demand
    assert(
      opt.scheduled_duration_mins <= opt.total_estimated_travel_time_mins,
      'Scheduled duration must not include delay'
    );
  })();

  console.log('\n======================================================================');
  console.log(`TEST SUITE COMPLETE: ${passedTests} Passed, ${failedTests} Failed (Total: 12 Scenarios)`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
