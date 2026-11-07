const routingService = require('../services/routingService');
const pool = require('../db');

async function dumpResponses() {
  const pairs = [
    ['Mehdipatnam', 'Dondanpally'],
    ['Mehdipatnam', 'ISB'],
    ['Shaikpet', 'ISB'],
    ['Charminar', 'Afzalgunj'],
    ['Secunderabad', 'Mehdipatnam'],
    ['Koti', 'Dilsukhnagar']
  ];

  console.log('='.repeat(80));
  console.log('EXACT API JSON METRICS DUMP FOR REFERENCE JOURNEYS');
  console.log('='.repeat(80));

  for (const [orig, dest] of pairs) {
    const res = await routingService.findTransitJourneys(orig, dest, 1);
    const opt = res.options[0];
    console.log(`\n>>> [${orig} ➔ ${dest}] Status: ${res.status}`);
    console.log(JSON.stringify({
      route_name: opt.route_name,
      journey_type: opt.journey_type,
      transfers_count: opt.transfers_count,
      departure_time: opt.departure_time,
      arrival_time: opt.arrival_time,
      scheduled_duration_mins: opt.scheduled_duration_mins,
      in_vehicle_duration_mins: opt.in_vehicle_duration_mins,
      transfer_waiting_mins: opt.transfer_waiting_mins,
      expected_delay_mins: opt.expected_delay_mins,
      total_estimated_travel_time_mins: opt.total_estimated_travel_time_mins,
      duration_source: opt.duration_source,
      crowd_badge: opt.crowd_badge,
      legs: opt.legs.map(l => ({
        leg_number: l.leg_number,
        from: l.boarding_stop.stop_name,
        to: l.alighting_stop.stop_name,
        route: l.route_name,
        departure: l.departure_time,
        arrival: l.arrival_time,
        duration_mins: l.duration_mins,
        duration_source: l.duration_source
      }))
    }, null, 2));
  }

  process.exit(0);
}

dumpResponses().catch(e => {
  console.error(e);
  process.exit(1);
});
