"""
Update Smart City Final Project Report DOCX
File: update_report_docx.py
Updates tables, live ML daemon architecture, reference journeys, and test results in
final_submission/Smart_City_Urban_Analytics_Final_Report.docx
"""

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

doc_path = r"C:\Users\dell\Desktop\smart-city-urban-analytics\final_submission\Smart_City_Urban_Analytics_Final_Report.docx"
doc = docx.Document(doc_path)

print(f"Loaded document with {len(doc.paragraphs)} paragraphs and {len(doc.tables)} tables.")

# 1. Update Table 18: Reference Journey Verification
t18 = doc.tables[17]
# Clear existing data rows (keep header)
while len(t18.rows) > 1:
    tr = t18.rows[-1]._tr
    t18._tbl.remove(tr)

ref_journeys = [
    ("SC-01", "Mehdipatnam", "Dondanpally", "Direct", "Route 505 (21 stops)", "86 mins", "+3 mins", "89 mins (Calibrated Transit Model)"),
    ("SC-02", "Mehdipatnam", "ISB", "Direct", "Route 505 (22 stops)", "89 mins", "+3 mins", "92 mins (Calibrated Transit Model)"),
    ("SC-03", "Shaikpet", "ISB", "1-Transfer", "65M/123 ➔ 505 (Transfer: Mehdipatnam, 6m wait)", "80 mins", "+5 mins", "85 mins (Calibrated Transit Model)"),
    ("SC-04", "Charminar", "Afzalgunj", "Direct", "Route 9Y/F (6 stops)", "12 mins", "+1 mins", "13 mins (Calibrated Transit Model)"),
    ("SC-05", "Secunderabad", "Mehdipatnam", "Direct", "Route AC (7 stops)", "27 mins", "+2 mins", "29 mins (Calibrated Transit Model)"),
    ("SC-06", "Koti", "Dilsukhnagar", "Direct", "Route 443 (3 stops)", "8 mins", "+1 mins", "9 mins (Scheduled Timetable)")
]

for row_data in ref_journeys:
    row = t18.add_row()
    for col_idx, text in enumerate(row_data):
        cell = row.cells[col_idx]
        cell.text = text
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = "Times New Roman"
            run.font.size = Pt(9.5)

print("Updated Table 18 with 6 verified reference journeys.")

# 2. Update Table 19: Four-Module ML Model Summary
t19 = doc.tables[18]
while len(t19.rows) > 1:
    tr = t19.rows[-1]._tr
    t19._tbl.remove(tr)

model_metrics = [
    ("Transport", "total_rides (Daily Boardings)", "Random Forest Regressor (100 Trees)", "1,857 Days", "0.6413", "105,570.74", "135,231.47", "14.32%"),
    ("Traffic", "Vehicles (Hourly Junction Count)", "Gradient Boosting Regressor", "9,624 Hours", "0.9684", "2.9341 veh", "4.8412 veh", "17.33%"),
    ("Weather", "tempC (Ambient Temperature)", "Linear Regression Pipeline", "19,287 Hours", "0.9894", "0.4051 °C", "0.5365 °C", "1.51%"),
    ("Air Quality", "AQI (Composite 1-Hr Ahead)", "Support Vector Regression (RBF)", "5,251 Hours", "0.7742", "20.8899 pts", "27.2995 pts", "32.13%*")
]

for row_data in model_metrics:
    row = t19.add_row()
    for col_idx, text in enumerate(row_data):
        cell = row.cells[col_idx]
        cell.text = text
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = "Times New Roman"
            run.font.size = Pt(9.5)

print("Updated Table 19 with verified model performance metrics.")

# 3. Update Table 15: REST API Endpoints (add live ML endpoints)
t15 = doc.tables[14]
new_api_rows = [
    ("GET", "/api/transport/forecast", "No", "?horizon_days=7", "7-day rolling live Random Forest passenger demand projections"),
    ("POST", "/api/transport/predict-demand", "No", "{day_of_week, lag_1, lag_7}", "Single-day live ML ridership demand forecast"),
    ("POST", "/api/traffic/predict-junction", "No", "{junction, hour, weather}", "Live Gradient Boosting junction vehicle count (veh/hr) and LOS"),
    ("POST", "/api/traffic/predict", "No", "{corridorId, hour, incident}", "Hybrid: ML junction prediction + analytical corridor delay simulation"),
    ("POST", "/api/weather/predict-temperature", "No", "{hour, month, humidity, pressure}", "Live Linear Regression ambient temp and apparent feels-like heat index"),
    ("POST", "/api/air-quality/predict", "No", "{pm25, pm10, no2, so2, co, o3}", "Live SVR 1-hour ahead predicted AQI, category, and CPCB baseline"),
    ("GET", "/api/ml/health", "No", "None", "Health status of Python ML persistent memory daemon and loaded models")
]

for row_data in new_api_rows:
    row = t15.add_row()
    for col_idx, text in enumerate(row_data):
        cell = row.cells[col_idx]
        cell.text = text
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = "Times New Roman"
            run.font.size = Pt(9.5)

print("Updated Table 15 with 7 live ML REST API endpoints.")

# Save modified document
doc.save(doc_path)
print(f"Document saved successfully to: {doc_path}")
