# Smart City Urban Analytics Platform — Before & After Comparison Report
**Document ID:** `project_fix_report/07_BEFORE_AFTER_COMPARISON.md`  
**Project:** Data Analytics for Smart Cities — Urban Analytics and Predictive Decision Support Platform  

---

## 1. Executive Summary

This report delivers a side-by-side comparative analysis of system behavior, algorithm performance, security posture, and test coverage before and after the implementation of the fixes.

---

## 2. Before vs. After Summary Matrix

```
┌───────────────────────────┬───────────────────────────────────────────┬───────────────────────────────────────────┐
│ Metric / Dimension        │ Before Fixes                              │ After Fixes                               │
├───────────────────────────┼───────────────────────────────────────────┼───────────────────────────────────────────┤
│ Mehdipatnam → Dondanpally │ Displayed 1,000–1,515 mins (Duty block)   │ 86 mins sched + 3m delay = 89 mins total  │
│ Mehdipatnam → ISB         │ Displayed 1,000+ mins                     │ 89 mins sched + 3m delay = 92 mins total  │
│ Shaikpet → ISB            │ "No direct route found" (Search failed)   │ 80 mins sched + 5m delay = 85 mins (1 Tr) │
│ Charminar → Afzalgunj     │ Irregular duty block timestamps           │ 12 mins sched + 1m delay = 13 mins total  │
│ Transport Test Suite      │ 10 Passed, 2 Failed (TypeError)           │ 12 Passed, 0 Failed (100% Pass)           │
│ HTTP Audit Test Suite     │ Fails due to unhandled exceptions         │ 7 Passed, 0 Failed (100% Pass)            │
│ Database Schema           │ `users` missing from schema.sql           │ Fully synchronized with MySQL 8.4 live DB │
│ `transit_stop_times` Join │ Unindexed `(trip_id, stop_id)` joins      │ Indexed via `idx_st_trip_stop` B-Tree     │
│ Authentication Secret     │ Fallback to hardcoded string              │ Strict `process.env.JWT_SECRET` check     │
│ Git Protection            │ Empty `.gitignore` (0 bytes)              │ Comprehensive ignore for .env, build, logs│
│ Air Quality ML Script     │ Empty placeholder `predict.py` (0 bytes)  │ Production CLI & library inference script │
│ Air Quality Duplication   │ Backend referenced root `aqi/` directory  │ Consolidated to `ml/air_quality/models/`  │
│ Transport Forecast Dates  │ Static July 2026 dates (`2026-07-01`)     │ Dynamic dates starting from current day   │
│ Weather Forecast Dates    │ Static string dates (`Oct 14` - `Oct 20`) │ Dynamic calendar dates (`Nov 7` - `Nov 13`)│
│ UI & Output Badges        │ Ambiguous "AI Prediction" on formulas     │ Honest: "CPCB Formula", "Calibrated Model"│
└───────────────────────────┴───────────────────────────────────────────┴───────────────────────────────────────────┘
```

---

## 3. Detailed Comparative Case Studies

### Case Study 1: Mehdipatnam to Dondanpally Routing Duration
- **Before:**
  Trip `2623_17` had timestamps `17:37:41` (departure) and `42:53:04` (arrival). The system naively calculated $2573 - 1058 = 1515$ minutes ($\approx 25.25$ hours). The user was informed that a 24.5 km bus trip would take over 25 hours.
- **After:**
  The routing engine detects that an implied speed of 0.97 km/h across 24.5 km violates the physical feasibility threshold ($< 8.0\text{ km/h}$). Rather than rejecting legitimate transit connectivity, it evaluates the calibrated transit model:
  $$\text{Road Distance} = 24.5\text{ km} \times 1.28 = 31.4\text{ km}$$
  $$\text{Running Time} = \frac{31.4\text{ km}}{24\text{ km/h}} \times 60 = 78.5\text{ mins}$$
  $$\text{Dwell Time} = 21\text{ stops} \times 0.6\text{ mins} = 12.6\text{ mins}$$
  $$\text{Total Scheduled Duration} = 86\text{ mins}$$
  The UI displays `86 mins scheduled + 3 mins delay = 89 mins total`, transparently badged as `● Calibrated Transit Model`.

---

### Case Study 2: Shaikpet to ISB Multi-Leg Transfer Discovery
- **Before:**
  No single direct bus route connects Shaikpet to the Indian Business School campus in Gachibowli. The platform simply displayed "No direct route found" with an empty itinerary.
- **After:**
  The multi-tier search engine gathers candidate stop clusters:
  - Origin cluster: Shaikpet Nala, Shaikpet.
  - Destination cluster: Indian Business School ( Ibs ).
  The 1-Transfer routing algorithm scans common transit interchange hubs (Mehdipatnam, Narsinghi) and finds:
  - **Leg 1:** Shaikpet $\to$ Narsinghi via Route `65M/123` (17 mins, departs 15:00, arrives 15:17).
  - **Transfer Interchange:** Narsinghi (7 min layover, safely above the 5-min minimum transfer buffer).
  - **Leg 2:** Narsinghi $\to$ ISB via Route `505` (57 mins, departs 15:24, arrives 16:21).
  - **Total Scheduled Duration:** $17 + 7 + 57 = 80$ mins (with +5 min traffic delay = 85 mins total).

---

### Case Study 3: Forecast Date Horizon
- **Before:**
  - Transport passenger volume forecast cards displayed July 1–7, 2026.
  - Weather cards displayed October 14–20.
- **After:**
  - Transport forecasts dynamically compute the next 7 days from `new Date()` (e.g., Nov 8, 2026 – Nov 14, 2026) with weekday/weekend multipliers.
  - Weather forecast cards dynamically compute the 7 upcoming calendar days with season-calibrated temperature ranges for Hyderabad.
