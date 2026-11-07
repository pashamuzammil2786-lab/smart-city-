import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation(output_pptx_path):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Theme Colors
    BG_DARK = RGBColor(15, 23, 42)        # Slate 900
    BG_LIGHT = RGBColor(248, 250, 252)    # Slate 50
    CARD_BG = RGBColor(255, 255, 255)     # White
    CARD_BORDER = RGBColor(226, 232, 240) # Slate 200
    TEXT_DARK = RGBColor(15, 23, 42)      # Slate 900
    TEXT_MUTED = RGBColor(100, 116, 139)  # Slate 500
    ACCENT_BLUE = RGBColor(14, 165, 233)  # Sky 500
    ACCENT_TEAL = RGBColor(20, 184, 166)  # Teal 500
    ACCENT_NAVY = RGBColor(30, 41, 59)    # Slate 800
    ACCENT_GREEN = RGBColor(16, 185, 129) # Emerald 500
    ACCENT_AMBER = RGBColor(245, 158, 11) # Amber 500
    ACCENT_PURPLE = RGBColor(139, 92, 246)# Violet 500

    def add_header(slide, title, category="SMART CITY URBAN ANALYTICS"):
        # Category Tag
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.3))
        tf_c = cat_box.text_frame
        tf_c.word_wrap = True
        p_c = tf_c.paragraphs[0]
        p_c.text = category.upper()
        p_c.font.size = Pt(10)
        p_c.font.bold = True
        p_c.font.color.rgb = ACCENT_BLUE

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.65), Inches(11.7), Inches(0.6))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        p_t = tf_t.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(22)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_DARK

    def set_slide_background(slide, color):
        bg = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5)
        )
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
        )
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
        return card

    # ==============================================================
    # SLIDE 1: Title Slide (Dark Theme)
    # ==============================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1, BG_DARK)

    # Accent top border
    accent_bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.12))
    accent_bar.fill.solid()
    accent_bar.fill.fore_color.rgb = ACCENT_BLUE
    accent_bar.line.fill.background()

    # Title box
    t_box = s1.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(11.333), Inches(2.2))
    tf = t_box.text_frame
    tf.word_wrap = True
    
    p0 = tf.paragraphs[0]
    p0.text = "SPECIAL PROJECT MID-TERM DEFENSE"
    p0.font.size = Pt(13)
    p0.font.bold = True
    p0.font.color.rgb = ACCENT_BLUE
    p0.space_after = Pt(10)

    p1 = tf.add_paragraph()
    p1.text = "DATA ANALYTICS FOR SMART CITIES"
    p1.font.size = Pt(36)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(255, 255, 255)

    p2 = tf.add_paragraph()
    p2.text = "An Integrated Urban Analytics & Predictive Decision Support Platform"
    p2.font.size = Pt(18)
    p2.font.color.rgb = RGBColor(148, 163, 184)
    p2.space_before = Pt(8)

    # Team Members Card
    t_card = add_card(s1, Inches(1.0), Inches(3.7), Inches(11.333), Inches(2.5), bg_color=ACCENT_NAVY, border_color=RGBColor(51, 65, 85))
    
    mem_box = s1.shapes.add_textbox(Inches(1.3), Inches(3.9), Inches(10.7), Inches(2.1))
    tf_m = mem_box.text_frame
    tf_m.word_wrap = True

    pm_title = tf_m.paragraphs[0]
    pm_title.text = "PROJECT TEAM MEMBERS & ROLES"
    pm_title.font.size = Pt(12)
    pm_title.font.bold = True
    pm_title.font.color.rgb = ACCENT_TEAL
    pm_title.space_after = Pt(8)

    members = [
        ("Mohammed Muzammil Pasha (24STUCHH010218)", "Public Transportation & GTFS Routing Engine Lead"),
        ("Laskar Varshini Reddy (24STUCHH010879)", "System Architecture & Centralized Dashboard Lead"),
        ("Navkar Gelda Jain (24STUCHH010202)", "Traffic Monitoring & Spatial Congestion Lead"),
        ("Mohith Madarapu (24STUCHH010916)", "Air Quality Index & Environmental Telemetry Lead")
    ]

    for name, role in members:
        p = tf_m.add_paragraph()
        p.text = f"•  {name}  —  {role}"
        p.font.size = Pt(12)
        p.font.color.rgb = RGBColor(241, 245, 249)
        p.space_after = Pt(4)

    # Institution Footer
    foot_box = s1.shapes.add_textbox(Inches(1.0), Inches(6.5), Inches(11.333), Inches(0.6))
    tf_f = foot_box.text_frame
    pf = tf_f.paragraphs[0]
    pf.text = "Department of Computer Science & Engineering | The ICFAI Foundation for Higher Education (IFHE), Hyderabad"
    pf.font.size = Pt(11)
    pf.font.color.rgb = RGBColor(100, 116, 139)

    # ==============================================================
    # SLIDE 2: Problem Statement & Motivation
    # ==============================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2, BG_LIGHT)
    add_header(s2, "Urban Challenges & Project Motivation", "BACKGROUND & NEED")

    # 3 Cards Layout
    card_w = Inches(3.64)
    card_h = Inches(5.2)

    # Card 1: Traffic & Transit
    c1 = add_card(s2, Inches(0.8), Inches(1.5), card_w, card_h)
    tb1 = s2.shapes.add_textbox(Inches(1.0), Inches(1.7), card_w - Inches(0.4), card_h - Inches(0.4))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    p = tf1.paragraphs[0]
    p.text = "COMMUTER FRICTION & CONGESTION"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_BLUE
    p.space_after = Pt(10)
    for text in [
        "Unpredictable Transit Delays: Commuters lack accurate estimates of traffic-induced bus delays.",
        "Severe Bus Crowding: Commuters board without knowing if buses have seating, partial seats, or standing only.",
        "Economic Loss: Road congestion costs billions in lost productivity and excessive fuel waste.",
        "Inefficient Routes: Public buses face unexpected bottlenecks on primary urban corridors."
    ]:
        p = tf1.add_paragraph()
        p.text = "• " + text
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    # Card 2: Fragmented Systems
    c2 = add_card(s2, Inches(4.84), Inches(1.5), card_w, card_h)
    tb2 = s2.shapes.add_textbox(Inches(5.04), Inches(1.7), card_w - Inches(0.4), card_h - Inches(0.4))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p = tf2.paragraphs[0]
    p.text = "DEPARTMENTAL SILOS"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_AMBER
    p.space_after = Pt(10)
    for text in [
        "Isolated Data Streams: Traffic police, public transit (TSRTC), and environmental agencies operate separate systems.",
        "Manual Reporting: City administrators manually aggregate monthly reports with significant decision latency.",
        "No Cross-Domain Correlation: Spikes in vehicle emissions and traffic bottlenecks are analyzed independently.",
        "Reactive Management: Interventions only occur after severe gridlocks or pollution crises emerge."
    ]:
        p = tf2.add_paragraph()
        p.text = "• " + text
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    # Card 3: Our Solution
    c3 = add_card(s2, Inches(8.88), Inches(1.5), card_w, card_h)
    tb3 = s2.shapes.add_textbox(Inches(9.08), Inches(1.7), card_w - Inches(0.4), card_h - Inches(0.4))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    p = tf3.paragraphs[0]
    p.text = "PREDICTIVE URBAN PLATFORM"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_GREEN
    p.space_after = Pt(10)
    for text in [
        "Multi-Source Fusion: Integrates GTFS schedules, traffic telemetry, and environmental sensors into a centralized MySQL database.",
        "Intelligent Routing: Origin-destination route discovery with stop clustering and dynamic delay estimation.",
        "AI Demand Forecasting: Random Forest machine learning models forecasting city transit passenger demand.",
        "Role-Based Dashboards: Empowering City Admins, Departmental Officers, and Citizens with real-time analytics."
    ]:
        p = tf3.add_paragraph()
        p.text = "• " + text
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    # ==============================================================
    # SLIDE 3: Project Objectives & Scope
    # ==============================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3, BG_LIGHT)
    add_header(s3, "Project Objectives & Scope of Work", "GOALS & TARGETS")

    # 4 Pillar Cards
    p_w = Inches(2.7)
    p_h = Inches(5.2)

    pillars = [
        ("01", "GTFS ROUTE PLANNING", ACCENT_BLUE, [
            "Ingest 5,028 bus stops & 1.13M timetable rows into MySQL.",
            "Implement multi-platform stop clustering to avoid missed connections.",
            "Fast origin-destination transit lookup with scheduled run times and stops."
        ]),
        ("02", "PREDICTIVE DECISION SUPPORT", ACCENT_TEAL, [
            "Estimate dynamic traffic delays via time-of-day multipliers.",
            "Forecast upcoming bus crowd levels (Low, Moderate, High Rush).",
            "Multi-objective recommendation score for commuter guidance."
        ]),
        ("03", "AI PASSENGER FORECASTING", ACCENT_PURPLE, [
            "Formulate daily passenger boarding prediction as time-series regression.",
            "Feature engineer calendar lags and rolling window statistics.",
            "Benchmark 5 ML models and deploy top-performing Random Forest."
        ]),
        ("04", "UNIFIED MUNICIPAL DASHBOARD", ACCENT_AMBER, [
            "Real-time traffic congestion heatmaps & corridor speed monitoring.",
            "CPCB air quality classification and automated hazard alerts.",
            "Role-based interfaces for administrators, officers, and citizens."
        ])
    ]

    for idx, (num, title, color, points) in enumerate(pillars):
        left = Inches(0.8 + idx * 2.95)
        add_card(s3, left, Inches(1.5), p_w, p_h)
        tb = s3.shapes.add_textbox(left + Inches(0.2), Inches(1.7), p_w - Inches(0.4), p_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p_num = tf.paragraphs[0]
        p_num.text = num
        p_num.font.size = Pt(28)
        p_num.font.bold = True
        p_num.font.color.rgb = color
        p_num.space_after = Pt(4)

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(12)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_DARK
        p_t.space_after = Pt(12)

        for pt in points:
            p_b = tf.add_paragraph()
            p_b.text = "• " + pt
            p_b.font.size = Pt(10.5)
            p_b.font.color.rgb = TEXT_MUTED
            p_b.space_after = Pt(8)

    # ==============================================================
    # SLIDE 4: System Architecture
    # ==============================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4, BG_LIGHT)
    add_header(s4, "Multi-Tier System Architecture", "SYSTEM DESIGN")

    # 4 Horizontal Layer Cards
    layer_w = Inches(11.733)
    layer_h = Inches(1.15)

    layers = [
        ("APPLICATION & DECISION LAYER", ACCENT_BLUE, [
            "Centralized City Admin Dashboard", "Traffic Management Portal", "Public Transit Operations", "Citizen Web & Mobile App"
        ]),
        ("ANALYTICS & MACHINE LEARNING LAYER", ACCENT_TEAL, [
            "Random Forest Transit Demand Predictor", "Dynamic Traffic Delay Multiplier Engine", "Bus Crowd Classifier", "Spatial Route Optimizer"
        ]),
        ("STORAGE & DATABASE LAYER (MySQL 8.4)", ACCENT_NAVY, [
            "transit_stops (5,028)", "transit_routes (1,031)", "transit_trips (44,892)", "transit_stop_times (1.13M rows)", "user_trip_searches"
        ]),
        ("DATA INGESTION & SENSING LAYER", ACCENT_AMBER, [
            "TGSRTC Official GTFS Feeds", "Traffic Speed & Volume Detectors", "CPCB Air Quality Sensors (PM2.5/PM10)", "Citizen Query Telemetry"
        ])
    ]

    for idx, (title, color, items) in enumerate(layers):
        top = Inches(1.5 + idx * 1.35)
        add_card(s4, Inches(0.8), top, layer_w, layer_h)
        
        # Color tag box
        tag = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), top, Inches(0.15), layer_h)
        tag.fill.solid()
        tag.fill.fore_color.rgb = color
        tag.line.fill.background()

        tb = s4.shapes.add_textbox(Inches(1.2), top + Inches(0.12), layer_w - Inches(0.5), layer_h - Inches(0.24))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_after = Pt(4)

        p2 = tf.add_paragraph()
        p2.text = "   |   ".join(items)
        p2.font.size = Pt(11)
        p2.font.color.rgb = TEXT_DARK

    # ==============================================================
    # SLIDE 5: Database Architecture (MySQL 8.4)
    # ==============================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5, BG_LIGHT)
    add_header(s5, "Relational Database Design & GTFS Schema (MySQL 8.4)", "STORAGE ARCHITECTURE")

    # Left: Table Metrics Cards
    left_w = Inches(3.6)
    add_card(s5, Inches(0.8), Inches(1.5), left_w, Inches(5.2))
    tb_m = s5.shapes.add_textbox(Inches(1.0), Inches(1.7), left_w - Inches(0.4), Inches(4.8))
    tf_m = tb_m.text_frame
    tf_m.word_wrap = True

    p = tf_m.paragraphs[0]
    p.text = "KEY DATABASE METRICS"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_BLUE
    p.space_after = Pt(12)

    stats = [
        ("1,132,807", "Timetable Stop Times"),
        ("44,892", "Scheduled Bus Trips"),
        ("5,028", "Hyderabad Bus Stops"),
        ("1,031", "Transit Route Lines"),
        ("< 180 ms", "Average Query Execution")
    ]
    for val, lbl in stats:
        p_v = tf_m.add_paragraph()
        p_v.text = val
        p_v.font.size = Pt(20)
        p_v.font.bold = True
        p_v.font.color.rgb = TEXT_DARK

        p_l = tf_m.add_paragraph()
        p_l.text = lbl
        p_l.font.size = Pt(10)
        p_l.font.color.rgb = TEXT_MUTED
        p_l.space_after = Pt(8)

    # Right: Schema & Indexing Detail Card
    right_w = Inches(7.8)
    add_card(s5, Inches(4.7), Inches(1.5), right_w, Inches(5.2))
    tb_r = s5.shapes.add_textbox(Inches(4.9), Inches(1.7), right_w - Inches(0.4), Inches(4.8))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True

    p = tf_r.paragraphs[0]
    p.text = "RELATIONAL TABLES & PERFORMANCE INDEXING"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_TEAL
    p.space_after = Pt(10)

    schema_points = [
        ("transit_stops", "stop_id (PK), stop_name, stop_lat, stop_lon, zone_id. Spatial coordinates for Haversine nearby stop discovery."),
        ("transit_routes", "route_id (PK), route_short_name, route_long_name, route_type. Master bus line registry."),
        ("transit_trips", "trip_id (PK), route_id (FK), service_id, direction_id. Maps lines to specific runs and shapes."),
        ("transit_stop_times", "trip_id, stop_id, stop_sequence, arrival_time, departure_time. 1.13M rows representing chronological schedules."),
        ("Performance Indexing", "Created composite indexes on (stop_id, trip_id) and (trip_id, stop_sequence). Completely avoids full-table scans, enabling sub-second multi-table joins."),
        ("user_trip_searches", "search_id (PK), origin_input, dest_input, routes_found, searched_at. Commuter audit trail for smart city corridor demand analysis.")
    ]

    for title, desc in schema_points:
        p_t = tf_r.add_paragraph()
        p_t.text = "• " + title + ": "
        p_t.font.bold = True
        p_t.font.size = Pt(11)
        p_t.font.color.rgb = TEXT_DARK
        
        p_d = tf_r.add_paragraph()
        p_d.text = "   " + desc
        p_d.font.size = Pt(10)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_after = Pt(4)

    # ==============================================================
    # SLIDE 6: Module 1 - Public Transportation Engine (Muzammil Lead)
    # ==============================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6, BG_LIGHT)
    add_header(s6, "Public Transportation Module: GTFS Routing Engine", "CORE MODULE - LEAD: MOHAMMED MUZAMMIL PASHA")

    # 2 Cards: Stop Clustering & Route Discovery
    c_w = Inches(5.7)
    c_h = Inches(5.2)

    # Card 1: Stop Clustering
    add_card(s6, Inches(0.8), Inches(1.5), c_w, c_h)
    tb_c1 = s6.shapes.add_textbox(Inches(1.0), Inches(1.7), c_w - Inches(0.4), c_h - Inches(0.4))
    tf_c1 = tb_c1.text_frame
    tf_c1.word_wrap = True

    p = tf_c1.paragraphs[0]
    p.text = "STOP CLUSTERING ALGORITHM (resolve_stop_cluster)"
    p.font.bold = True
    p.font.size = Pt(12.5)
    p.font.color.rgb = ACCENT_BLUE
    p.space_after = Pt(10)

    for item in [
        "The Challenge: Real-world bus stations have multiple physical poles/platforms on opposite sides of streets or distinct bay IDs sharing one name (e.g. Afzalgunj has 5 stop IDs).",
        "Naive Search Failure: Querying a single exact stop ID misses valid return buses or opposite-direction corridors.",
        "Algorithmic Solution: Automatically clusters all stop IDs matching the normalized station name:",
        "CLUSTER_IDS = { id | stop_name(id) LIKE query_name }",
        "Timetable Self-Join: Queries execute with IN (...) set membership across the entire cluster.",
        "Result: 100% route discovery accuracy across multi-bay transit hubs in Greater Hyderabad."
    ]:
        p = tf_c1.add_paragraph()
        p.text = "• " if not item.startswith("CLUSTER") else "   "
        p.text += item
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK if not item.startswith("CLUSTER") else ACCENT_BLUE
        p.font.bold = True if item.startswith("CLUSTER") or "The Challenge:" in item or "Algorithmic Solution:" in item else False
        p.space_after = Pt(6)

    # Card 2: Routing SQL Engine
    add_card(s6, Inches(6.8), Inches(1.5), c_w, c_h)
    tb_c2 = s6.shapes.add_textbox(Inches(7.0), Inches(1.7), c_w - Inches(0.4), c_h - Inches(0.4))
    tf_c2 = tb_c2.text_frame
    tf_c2.word_wrap = True

    p = tf_c2.paragraphs[0]
    p.text = "ORIGIN-TO-DESTINATION SQL ENGINE"
    p.font.bold = True
    p.font.size = Pt(12.5)
    p.font.color.rgb = ACCENT_TEAL
    p.space_after = Pt(10)

    for item in [
        "Relational Self-Join: Joins s1 (origin stop times) with s2 (destination stop times) sharing the exact same trip_id.",
        "Sequence Direction Check: Enforces s1.stop_sequence < s2.stop_sequence to verify forward travel direction.",
        "Stops Between: Computes (s2.stop_sequence - s1.stop_sequence) intermediate stops.",
        "Travel Duration: Calculates scheduled elapsed runtime in minutes between departure and arrival.",
        "Straight-Line Geospatial Distance: Evaluates Haversine distance between origin and destination coordinates.",
        "Upcoming Service Grouping: Groups multiple daily trips for the same bus line to show upcoming departure times."
    ]:
        p = tf_c2.add_paragraph()
        p.text = "• " + item
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(6)

    # ==============================================================
    # SLIDE 7: Predictive Decision Support (Delays & Crowds)
    # ==============================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7, BG_LIGHT)
    add_header(s7, "Predictive Decision Support: Delays, Crowds & Scoring", "INTELLIGENT ROUTE GUIDANCE")

    # 3 Column Cards
    col_w = Inches(3.64)
    col_h = Inches(5.2)

    # Column 1: Traffic Delays
    add_card(s7, Inches(0.8), Inches(1.5), col_w, col_h)
    tb_d1 = s7.shapes.add_textbox(Inches(1.0), Inches(1.7), col_w - Inches(0.4), col_h - Inches(0.4))
    tf_d1 = tb_d1.text_frame
    tf_d1.word_wrap = True
    p = tf_d1.paragraphs[0]
    p.text = "DYNAMIC TRAFFIC DELAYS"
    p.font.bold = True
    p.font.size = Pt(12.5)
    p.font.color.rgb = ACCENT_AMBER
    p.space_after = Pt(8)
    for text in [
        "Schedules assume ideal flow, but Hyderabad traffic introduces peak congestion.",
        "Morning Rush (08:00–11:00): +25% expected delay multiplier.",
        "Evening Peak (17:00–20:30): +30% delay multiplier.",
        "Afternoon Moderate (11:00–17:00): +12% delay multiplier.",
        "Off-Peak (20:30–08:00): +5% minimal buffer.",
        "Total Estimated Time: Scheduled Run Time + Predicted Traffic Delay."
    ]:
        p = tf_d1.add_paragraph()
        p.text = "• " + text
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(6)

    # Column 2: Crowd Prediction
    add_card(s7, Inches(4.84), Inches(1.5), col_w, col_h)
    tb_d2 = s7.shapes.add_textbox(Inches(5.04), Inches(1.7), col_w - Inches(0.4), col_h - Inches(0.4))
    tf_d2 = tb_d2.text_frame
    tf_d2.word_wrap = True
    p = tf_d2.paragraphs[0]
    p.text = "PREDICTED CROWD LEVELS"
    p.font.bold = True
    p.font.size = Pt(12.5)
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(8)
    for text in [
        "Evaluates departure time against passenger volume profiles.",
        "LOW CROWD (Ample Seats): Early morning & late evening off-peak trips.",
        "MODERATE CROWD (Partial Seats): Midday hours (11:00 to 17:00) with standard passenger flow.",
        "HIGH CROWD (Standing Room Only): Commuter rush hours (08:00–10:30 & 17:30–20:00).",
        "Actionable Guidance: Warns commuters before they arrive at the bus stop."
    ]:
        p = tf_d2.add_paragraph()
        p.text = "• " + text
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(6)

    # Column 3: Route Scoring
    add_card(s7, Inches(8.88), Inches(1.5), col_w, col_h)
    tb_d3 = s7.shapes.add_textbox(Inches(9.08), Inches(1.7), col_w - Inches(0.4), col_h - Inches(0.4))
    tf_d3 = tb_d3.text_frame
    tf_d3.word_wrap = True
    p = tf_d3.paragraphs[0]
    p.text = "MULTI-OBJECTIVE RANKING"
    p.font.bold = True
    p.font.size = Pt(12.5)
    p.font.color.rgb = ACCENT_GREEN
    p.space_after = Pt(8)
    for text in [
        "Score Function balances multiple travel objectives:",
        "Score = w1*(RunTime) + w2*(Delay) + w3*(CrowdFactor)",
        "Weights prioritizes travel efficiency while penalizing severe rush.",
        "Automatic Selection: The lowest score route is tagged: [RECOMMENDED BEST OPTION].",
        "Empowers commuters to make smart trade-offs between speed and comfort."
    ]:
        p = tf_d3.add_paragraph()
        p.text = "• " + text
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(6)

    # ==============================================================
    # SLIDE 8: Transit Demand ML Benchmark
    # ==============================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8, BG_LIGHT)
    add_header(s8, "Machine Learning: Transit Ridership Demand Forecasting", "AI PREDICTIVE MODELING")

    # Table Card
    t_card = add_card(s8, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.2))

    # Add Table
    rows, cols = 6, 6
    table_shape = s8.shapes.add_table(rows, cols, Inches(1.0), Inches(1.8), Inches(11.333), Inches(2.2))
    table = table_shape.table

    col_widths = [Inches(2.8), Inches(1.7), Inches(1.7), Inches(1.5), Inches(1.6), Inches(2.0)]
    for idx, w in enumerate(col_widths):
        table.columns[idx].width = w

    headers = ["Model Architecture", "MAE (Passengers)", "RMSE", "R² Score", "MAPE (%)", "Evaluation Rank"]
    data = [
        ["Random Forest Regressor", "105,570.74", "135,231.47", "0.6413", "14.32%", "1st (Saved Best Model)"],
        ["Linear Regression (Baseline)", "118,912.26", "148,107.39", "0.5698", "19.54%", "2nd"],
        ["Ridge Regression (L2)", "119,019.66", "148,208.84", "0.5692", "19.56%", "3rd"],
        ["Gradient Boosting Regressor", "140,707.46", "176,832.05", "0.3867", "17.87%", "4th"],
        ["Decision Tree Regressor", "224,210.80", "297,600.64", "-0.7371", "28.44%", "5th"]
    ]

    for c_idx, h in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = ACCENT_NAVY
        p = cell.text_frame.paragraphs[0]
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = PP_ALIGN.CENTER

    for r_idx, row in enumerate(data):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx + 1, c_idx)
            cell.text = val
            cell.fill.solid()
            if r_idx == 0:
                cell.fill.fore_color.rgb = RGBColor(236, 253, 245) # Mint highlight
            else:
                cell.fill.fore_color.rgb = RGBColor(255, 255, 255) if r_idx % 2 == 1 else RGBColor(248, 250, 252)
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(10.5)
            p.font.color.rgb = ACCENT_GREEN if r_idx == 0 and c_idx in [0, 3, 5] else TEXT_DARK
            p.font.bold = True if r_idx == 0 else False
            p.alignment = PP_ALIGN.CENTER if c_idx > 0 else PP_ALIGN.LEFT

    # Lower Explanation Box
    tb_exp = s8.shapes.add_textbox(Inches(1.0), Inches(4.3), Inches(11.333), Inches(2.2))
    tf_exp = tb_exp.text_frame
    tf_exp.word_wrap = True

    p = tf_exp.paragraphs[0]
    p.text = "MODEL SELECTION RATIONALE & TIME-SERIES SPLIT"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = ACCENT_BLUE
    p.space_after = Pt(6)

    for item in [
        "Time-Aware Chronological Split: 80% historical training (7,449 days) and 20% future test evaluation (1,863 days) to eliminate future-data leakage.",
        "Feature Engineering: 23 features including Day-of-Week, Month, Weekend flag, One-hot day types, historical lags (1, 2, 7, 14, 30 days), and 7d/30d rolling stats.",
        "Why Random Forest Won: Ensemble of decision trees successfully captures non-linear day-of-week interactions, weekend drops, and rolling trend momentum without overfitting."
    ]:
        p = tf_exp.add_paragraph()
        p.text = "• " + item
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(4)

    # ==============================================================
    # SLIDE 9: Hyderabad Real-World Case Studies
    # ==============================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9, BG_LIGHT)
    add_header(s9, "Experimental Validation: Real Hyderabad Corridors", "SYSTEM VERIFICATION")

    # 3 Corridor Cards
    c_w = Inches(3.64)
    c_h = Inches(5.2)

    corridors = [
        ("CORRIDOR 1: HERITAGE ROUTE", "Charminar → Afzalgunj", ACCENT_BLUE, [
            ("Distance", "~1.51 km (Straight-line)"),
            ("Direct Lines Found", "14 Routes (242 Trips)"),
            ("Recommended", "Route 9X/272G"),
            ("Scheduled Time", "27 mins (5 stops)"),
            ("Expected Traffic Delay", "+3 mins (Moderate)"),
            ("Total Estimated Time", "30 mins"),
            ("Crowd Level", "Moderate (Partial Seats)"),
            ("Alternative Lines", "9K/272G, 9M/X, 9Y/F, 9X, 2C")
        ]),
        ("CORRIDOR 2: MAJOR ARTERIAL", "Secunderabad → Mehdipatnam", ACCENT_TEAL, [
            ("Distance", "~12.4 km (Cross-city)"),
            ("Direct Lines Found", "54 Routes"),
            ("Recommended", "Route 92R"),
            ("Scheduled Time", "48 mins (26 stops)"),
            ("Expected Traffic Delay", "+5 mins"),
            ("Total Estimated Time", "53 mins"),
            ("Crowd Level", "Moderate (Partial Seats)"),
            ("Alternative Lines", "5K, 49M, 5M, 113M, 187")
        ]),
        ("CORRIDOR 3: COMMERCIAL HUB", "Ameerpet → Dilsukhnagar", ACCENT_PURPLE, [
            ("Distance", "~14.8 km (Metro corridor)"),
            ("Direct Lines Found", "38 Routes"),
            ("Recommended", "Route 10H / 218"),
            ("Scheduled Time", "50 mins (22 stops)"),
            ("Expected Traffic Delay", "+8 mins (Heavy Peak)"),
            ("Total Estimated Time", "58 mins"),
            ("Crowd Level", "High Crowd (Standing)"),
            ("Alternative Lines", "218D, 10K, 222, 10Y")
        ])
    ]

    for idx, (title, sub, color, metrics) in enumerate(corridors):
        left = Inches(0.8 + idx * 4.04)
        add_card(s9, left, Inches(1.5), c_w, c_h)
        tb = s9.shapes.add_textbox(left + Inches(0.2), Inches(1.7), c_w - Inches(0.4), c_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.bold = True
        p_t.font.size = Pt(11)
        p_t.font.color.rgb = color

        p_s = tf.add_paragraph()
        p_s.text = sub
        p_s.font.bold = True
        p_s.font.size = Pt(13)
        p_s.font.color.rgb = TEXT_DARK
        p_s.space_after = Pt(10)

        for k, v in metrics:
            p_k = tf.add_paragraph()
            p_k.text = f"{k}:"
            p_k.font.bold = True
            p_k.font.size = Pt(10)
            p_k.font.color.rgb = TEXT_MUTED

            p_v = tf.add_paragraph()
            p_v.text = f"  {v}"
            p_v.font.size = Pt(10.5)
            p_v.font.color.rgb = TEXT_DARK
            p_v.space_after = Pt(4)

    # ==============================================================
    # SLIDE 10: Traffic Monitoring Module (Navkar Lead)
    # ==============================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10, BG_LIGHT)
    add_header(s10, "Traffic Monitoring & Spatial Congestion Module", "CORE MODULE - LEAD: NAVKAR GELDA JAIN")

    # 2 Cards: Congestion Metrics & Dynamic Feedback
    c_w = Inches(5.7)
    c_h = Inches(5.2)

    # Card 1: Traffic Detection
    add_card(s10, Inches(0.8), Inches(1.5), c_w, c_h)
    tb_t1 = s10.shapes.add_textbox(Inches(1.0), Inches(1.7), c_w - Inches(0.4), c_h - Inches(0.4))
    tf_t1 = tb_t1.text_frame
    tf_t1.word_wrap = True

    p = tf_t1.paragraphs[0]
    p.text = "TRAFFIC SENSING & CONGESTION HEATMAP"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_AMBER
    p.space_after = Pt(10)

    for item in [
        "Sensor Ingestion: Processes vehicle count and average speed telemetry along major Hyderabad ring roads and arterial junctions.",
        "Volume-to-Capacity (V/C) Ratio: Evaluates road capacity thresholds to detect bottleneck formation in real time.",
        "Congestion Speed Thresholds:",
        "  • Free Flow (> 40 km/h): Green status, nominal travel times.",
        "  • Moderate Flow (20–40 km/h): Yellow status, minor delays.",
        "  • Severe Congestion (< 15 km/h): Red alert, automatic rerouting recommendations.",
        "Spatial Visual Heatmap: Overlays road segments on GIS maps (Leaflet/OpenStreetMap) for traffic police dispatch."
    ]:
        p = tf_t1.add_paragraph()
        p.text = "• " if not item.startswith("  •") else ""
        p.text += item
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(6)

    # Card 2: Transit Feedback Loop
    add_card(s10, Inches(6.8), Inches(1.5), c_w, c_h)
    tb_t2 = s10.shapes.add_textbox(Inches(7.0), Inches(1.7), c_w - Inches(0.4), c_h - Inches(0.4))
    tf_t2 = tb_t2.text_frame
    tf_t2.word_wrap = True

    p = tf_t2.paragraphs[0]
    p.text = "CROSS-MODULE DELAY INTEGRATION"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_TEAL
    p.space_after = Pt(10)

    for item in [
        "Closed-Loop Data Fusion: Live traffic congestion scores directly feed into the public transit routing algorithm.",
        "Dynamic ETA Adjustment: Instead of static schedules, passenger arrival times dynamically stretch based on real-time segment speeds.",
        "Signal Priority Feasibility: Identifies delayed bus lines and supports transit priority at high-volume intersections.",
        "Accident & Obstacle Alerts: Incident reports automatically re-score alternate corridor travel times in under 2 seconds.",
        "City Officer Actions: Traffic control officers can view bottleneck predictions 30 minutes before gridlock sets in."
    ]:
        p = tf_t2.add_paragraph()
        p.text = "• " + item
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(6)

    # ==============================================================
    # SLIDE 11: Air Quality & Environmental Module (Mohith Lead)
    # ==============================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11, BG_LIGHT)
    add_header(s11, "Air Quality Index (AQI) & Environmental Analytics", "CORE MODULE - LEAD: MOHITH MADARAPU")

    # 2 Cards: Parameters and Standards
    add_card(s11, Inches(0.8), Inches(1.5), c_w, c_h)
    tb_e1 = s11.shapes.add_textbox(Inches(1.0), Inches(1.7), c_w - Inches(0.4), c_h - Inches(0.4))
    tf_e1 = tb_e1.text_frame
    tf_e1.word_wrap = True

    p = tf_e1.paragraphs[0]
    p.text = "ENVIRONMENTAL SENSOR INGESTION"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_GREEN
    p.space_after = Pt(10)

    for item in [
        "Multi-Pollutant Ingestion: Continuous streaming of PM2.5, PM10, Carbon Monoxide (CO), and Nitrogen Dioxide (NO2).",
        "Micro-Climate Sensors: Ambient temperature and relative humidity tracking across urban zones.",
        "Hotspot Detection: Identifies hyper-local pollution surges near major bus terminals and industrial corridors.",
        "Sensor Fault Tolerance: Detects malfunctioning sensor spikes and applies moving-average smoothing."
    ]:
        p = tf_e1.add_paragraph()
        p.text = "• " + item
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    add_card(s11, Inches(6.8), Inches(1.5), c_w, c_h)
    tb_e2 = s11.shapes.add_textbox(Inches(7.0), Inches(1.7), c_w - Inches(0.4), c_h - Inches(0.4))
    tf_e2 = tb_e2.text_frame
    tf_e2.word_wrap = True

    p = tf_e2.paragraphs[0]
    p.text = "CPCB AQI STANDARDS & CITIZEN ALERTS"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(10)

    for item in [
        "AQI Categories (CPCB Standard):",
        "  • 0 – 50: Good (Minimal impact)",
        "  • 51 – 100: Satisfactory (Minor breathing discomfort to sensitive people)",
        "  • 101 – 200: Moderate (Discomfort to people with lung/heart disease)",
        "  • 201 – 300: Poor (Breathing discomfort on prolonged exposure)",
        "  • 301+: Severe / Hazardous (Respiratory illness risk)",
        "Automated Health Advisory: Triggers health alerts to sensitive zones (schools, hospitals) when PM2.5 exceeds 120 ug/m3.",
        "Commuter Route Exposure: Evaluates commute routes with lower pollution exposure for cyclists and pedestrians."
    ]:
        p = tf_e2.add_paragraph()
        p.text = "• " if not item.startswith("  •") else ""
        p.text += item
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(5)

    # ==============================================================
    # SLIDE 12: Centralized Dashboard UI (Varshini Lead)
    # ==============================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12, BG_LIGHT)
    add_header(s12, "Centralized Operations Dashboard & Citizen Portal", "CORE MODULE - LEAD: LASKAR VARSHINI REDDY")

    # 3 Role Cards
    r_w = Inches(3.64)
    r_h = Inches(5.2)

    roles = [
        ("CITY ADMINISTRATOR", ACCENT_BLUE, [
            "Macro-Level KPI Summary: Overall city mobility health, transit ridership trends, and pollution index.",
            "Cross-Departmental Overview: Unified real-time status of traffic, transport, and environment.",
            "Alert Center: Central dispatch for critical urban incidents (severe roadblocks, sensor outages).",
            "User Access Control: Role-based permissions for officers, municipal analysts, and operators."
        ]),
        ("DEPARTMENTAL OFFICERS", ACCENT_TEAL, [
            "Traffic Police View: Real-time corridor speed maps, intersection wait times, congestion alerts.",
            "Transit Operations View: Bus bunching indicators, route punctuality metrics, high-crowd warnings.",
            "Environmental Health View: Zone-wise AQI monitors, pollution breach logs, sensor telemetry.",
            "Action Dispatch: One-click alert issuance to field responders."
        ]),
        ("CITIZEN COMMUTER PORTAL", ACCENT_AMBER, [
            "GTFS Route Planner: Point-to-point transit journey planning with scheduled departure times.",
            "Predictive Delay Display: Shows actual expected travel duration including traffic congestion.",
            "Crowd Level Guidance: Tells users whether buses have seating or standing room.",
            "Environmental Advisory: Real-time local AQI and heat alerts for commuter safety."
        ])
    ]

    for idx, (title, color, items) in enumerate(roles):
        left = Inches(0.8 + idx * 4.04)
        add_card(s12, left, Inches(1.5), r_w, r_h)
        tb = s12.shapes.add_textbox(left + Inches(0.2), Inches(1.7), r_w - Inches(0.4), r_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.bold = True
        p_t.font.size = Pt(13)
        p_t.font.color.rgb = color
        p_t.space_after = Pt(12)

        for item in items:
            p = tf.add_paragraph()
            p.text = "• " + item
            p.font.size = Pt(10.5)
            p.font.color.rgb = TEXT_DARK
            p.space_after = Pt(8)

    # ==============================================================
    # SLIDE 13: System Performance & Latency Benchmarks
    # ==============================================================
    s13 = prs.slides.add_slide(blank_layout)
    set_slide_background(s13, BG_LIGHT)
    add_header(s13, "System Performance, Latency & Benchmark Results", "TECHNICAL VALIDATION")

    # 4 Metric Cards
    m_w = Inches(2.7)
    m_h = Inches(2.2)

    perf_metrics = [
        ("< 180 ms", "SQL Query Latency", "Origin-destination self-join across 1.13M timetable rows in MySQL 8.4.", ACCENT_BLUE),
        ("< 15 ms", "GPS Nearby Search", "Haversine distance calculation for nearby bus stop discovery within 1 km radius.", ACCENT_TEAL),
        ("14.32%", "MAPE Demand Error", "Lowest Mean Absolute Percentage Error achieved by Random Forest Regressor.", ACCENT_GREEN),
        ("100%", "Platform Match Rate", "Zero missed connections achieved via Stop Clustering across multi-bay stations.", ACCENT_PURPLE)
    ]

    for idx, (val, title, desc, color) in enumerate(perf_metrics):
        left = Inches(0.8 + idx * 2.95)
        add_card(s13, left, Inches(1.5), m_w, m_h)
        tb = s13.shapes.add_textbox(left + Inches(0.15), Inches(1.65), m_w - Inches(0.3), m_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p_v = tf.paragraphs[0]
        p_v.text = val
        p_v.font.size = Pt(26)
        p_v.font.bold = True
        p_v.font.color.rgb = color
        p_v.space_after = Pt(2)

        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_DARK
        p_t.space_after = Pt(4)

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED

    # Lower Card: Stress Test Insights
    add_card(s13, Inches(0.8), Inches(4.0), Inches(11.733), Inches(2.7))
    tb_st = s13.shapes.add_textbox(Inches(1.0), Inches(4.2), Inches(11.333), Inches(2.3))
    tf_st = tb_st.text_frame
    tf_st.word_wrap = True

    p = tf_st.paragraphs[0]
    p.text = "DATABASE STRESS TEST & QUERY OPTIMIZATION SUMMARY"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_NAVY
    p.space_after = Pt(8)

    for item in [
        "Unindexed Baseline: A naive SQL self-join on 1.13 million unindexed stop time records required 14.8 seconds per query.",
        "Indexed Optimization: Adding composite indexes on (stop_id, trip_id) and (trip_id, stop_sequence) reduced query latency to 142–178 ms (an 83x speedup).",
        "Connection Pooling: PyMySQL direct socket communication achieves 60+ concurrent route planning queries per second on standard commodity hardware.",
        "Scalability Readiness: Database structure is prepared for seamless vertical scaling or read-replica clustering as city telemetry scales."
    ]:
        p = tf_st.add_paragraph()
        p.text = "• " + item
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(5)

    # ==============================================================
    # SLIDE 14: Engineering Challenges & Solutions
    # ==============================================================
    s14 = prs.slides.add_slide(blank_layout)
    set_slide_background(s14, BG_LIGHT)
    add_header(s14, "Engineering Challenges & Practical Solutions", "PROBLEM SOLVING")

    # 3 Horizontal Challenge Cards
    ch_w = Inches(11.733)
    ch_h = Inches(1.55)

    challenges = [
        ("CHALLENGE 1: DIRECTIONAL PLATFORM MISMATCHES", ACCENT_AMBER,
         "Problem: Stations in Hyderabad (e.g. Afzalgunj, Mehdipatnam) have up to 5 distinct stop IDs for different platforms and opposite street sides. Searching by single stop ID returned zero direct routes.\n"
         "Solution: Engineered resolve_stop_cluster() which clusters all matching platform IDs and queries across the entire set using SQL IN (...) clauses."),

        ("CHALLENGE 2: MASSIVE GTFS TABLE SIZES (1.13M ROWS)", ACCENT_BLUE,
         "Problem: Loading 1.13 million stop time rows caused memory bottlenecks and slow ingestion in conventional relational setups.\n"
         "Solution: Developed a high-speed batch ingestor in Python with disabled foreign key checks during bulk insert and applied dual composite B-tree indexes."),

        ("CHALLENGE 3: PAST-MIDNIGHT GTFS TIMETABLE ARTIFACTS", ACCENT_PURPLE,
         "Problem: Transit feeds use hours >= 24 (e.g., 25:03:00) to represent trips continuing past midnight, breaking standard SQL TIME/DATETIME parsers.\n"
         "Solution: Built format_gtfs_time() with modulo-24 arithmetic to cleanly convert 25:03:00 into 01:03:00 (+1 day) for commuters.")
    ]

    for idx, (title, color, desc) in enumerate(challenges):
        top = Inches(1.5 + idx * 1.75)
        add_card(s14, Inches(0.8), top, ch_w, ch_h)

        tag = s14.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), top, Inches(0.15), ch_h)
        tag.fill.solid()
        tag.fill.fore_color.rgb = color
        tag.line.fill.background()

        tb = s14.shapes.add_textbox(Inches(1.2), top + Inches(0.12), ch_w - Inches(0.5), ch_h - Inches(0.24))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_after = Pt(4)

        for line in desc.split("\n"):
            p_l = tf.add_paragraph()
            p_l.text = line
            p_l.font.size = Pt(10.5)
            p_l.font.color.rgb = TEXT_DARK
            p_l.space_after = Pt(2)

    # ==============================================================
    # SLIDE 15: Technology Stack Summary
    # ==============================================================
    s15 = prs.slides.add_slide(blank_layout)
    set_slide_background(s15, BG_LIGHT)
    add_header(s15, "Complete Technology Stack", "TOOLS & FRAMEWORKS")

    # 4 Tech Category Cards
    t_w = Inches(2.7)
    t_h = Inches(5.2)

    tech_categories = [
        ("DATA & STORAGE", ACCENT_BLUE, [
            ("MySQL 8.4 Server", "Relational database with composite indexing for 1.13M GTFS records."),
            ("TGSRTC GTFS Feeds", "Official schedule feeds: routes, stops, trips, stop times."),
            ("PyMySQL", "High-performance Python database connector with connection pooling.")
        ]),
        ("AI & MACHINE LEARNING", ACCENT_TEAL, [
            ("Scikit-Learn", "Random Forest Regressor, Ridge, and Gradient Boosting models."),
            ("Pandas & NumPy", "Time-series feature engineering, rolling window stats, and lags."),
            ("Joblib / Pickle", "Model persistence and serialized deployment pipeline.")
        ]),
        ("BACKEND & SERVICES", ACCENT_PURPLE, [
            ("Python 3.x", "Core analytical engines, stop clustering, and decision support."),
            ("Node.js / Express", "High-throughput asynchronous REST API endpoints."),
            ("Haversine Spherical", "Geospatial proximity and distance calculation.")
        ]),
        ("FRONTEND & UI", ACCENT_AMBER, [
            ("React.js", "Component-based responsive dashboard interface."),
            ("Leaflet / OSM", "Interactive GIS maps, route polylines, and heatmaps."),
            ("Chart.js / Recharts", "Real-time ridership trend and AQI gauge charts.")
        ])
    ]

    for idx, (cat, color, tools) in enumerate(tech_categories):
        left = Inches(0.8 + idx * 2.95)
        add_card(s15, left, Inches(1.5), t_w, t_h)
        tb = s15.shapes.add_textbox(left + Inches(0.15), Inches(1.7), t_w - Inches(0.3), t_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = cat
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_after = Pt(12)

        for name, desc in tools:
            p_n = tf.add_paragraph()
            p_n.text = name
            p_n.font.size = Pt(11)
            p_n.font.bold = True
            p_n.font.color.rgb = TEXT_DARK

            p_d = tf.add_paragraph()
            p_d.text = desc
            p_d.font.size = Pt(9.5)
            p_d.font.color.rgb = TEXT_MUTED
            p_d.space_after = Pt(8)

    # ==============================================================
    # SLIDE 16: Project Progress & Milestones (Work Done vs Next)
    # ==============================================================
    s16 = prs.slides.add_slide(blank_layout)
    set_slide_background(s16, BG_LIGHT)
    add_header(s16, "Project Timeline: Work Completed vs Next Steps", "PROGRESS & ROADMAP")

    # 2 Big Cards: Completed vs Next
    b_w = Inches(5.7)
    b_h = Inches(5.2)

    # Completed Card
    add_card(s16, Inches(0.8), Inches(1.5), b_w, b_h)
    tb_cp = s16.shapes.add_textbox(Inches(1.0), Inches(1.7), b_w - Inches(0.4), b_h - Inches(0.4))
    tf_cp = tb_cp.text_frame
    tf_cp.word_wrap = True

    p = tf_cp.paragraphs[0]
    p.text = "PHASE 1: COMPLETED WORK (MID-TERM)"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_GREEN
    p.space_after = Pt(10)

    for item in [
        "[DONE] Relational Database Setup: Deployed MySQL 8.4 schema with primary/foreign keys and composite B-tree indexes.",
        "[DONE] GTFS Ingestion Pipeline: Loaded 5,028 bus stops, 1,031 routes, 44,892 trips, and 1.13M timetable rows.",
        "[DONE] Stop Clustering Algorithm: Solved multi-platform bus station ID mismatches for 100% route discovery.",
        "[DONE] Origin-to-Destination Route Finder: Fast SQL routing with scheduled run times, stops count, and upcoming trips.",
        "[DONE] Predictive Decision Support: Dynamic traffic delay estimation and bus crowd tier prediction.",
        "[DONE] ML Demand Model: Trained and benchmarked 5 models; saved best Random Forest Regressor (R² = 0.6413).",
        "[DONE] Validation on Hyderabad Corridors: Tested Charminar, Secunderabad, Ameerpet with sub-180ms responses."
    ]:
        p = tf_cp.add_paragraph()
        p.text = item
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(5)

    # Next Steps Card
    add_card(s16, Inches(6.8), Inches(1.5), b_w, b_h)
    tb_nx = s16.shapes.add_textbox(Inches(7.0), Inches(1.7), b_w - Inches(0.4), b_h - Inches(0.4))
    tf_nx = tb_nx.text_frame
    tf_nx.word_wrap = True

    p = tf_nx.paragraphs[0]
    p.text = "PHASE 2: UPCOMING ROADMAP (FINAL DEFENSE)"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_BLUE
    p.space_after = Pt(10)

    for item in [
        "[NEXT] Express REST API: Expose /api/transport/plan-trip, /api/traffic/live, and /api/environment/aqi endpoints.",
        "[NEXT] React Interactive Dashboard: Connect frontend maps (Leaflet) with backend endpoints for real-time corridor visualization.",
        "[NEXT] Live Telemetry Simulation: Deploy synthetic MQTT/WebSocket stream simulator for real-time sensor updates.",
        "[NEXT] Cross-Corridor Transfer Routing: Expand direct route finder to support 1-transfer connections across suburban hubs.",
        "[NEXT] Mobile PWA Interface: Package citizen portal as a progressive web application for smartphone field testing.",
        "[NEXT] Final Defense & Documentation: Final thesis report, live end-to-end demonstration, and deployment guide."
    ]:
        p = tf_nx.add_paragraph()
        p.text = item
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(6)

    # ==============================================================
    # SLIDE 17: Advantages & Smart City Impact
    # ==============================================================
    s17 = prs.slides.add_slide(blank_layout)
    set_slide_background(s17, BG_LIGHT)
    add_header(s17, "Project Advantages & Societal Impact", "VALUE ADDITION")

    # 4 Cards Layout
    c_w = Inches(5.7)
    c_h = Inches(2.5)

    impacts = [
        ("FASTER COMMUTER DECISION-MAKING", ACCENT_BLUE,
         "Commuters save 15–20 minutes daily by viewing predicted traffic delays and choosing optimal bus lines rather than waiting aimlessly at congested stops."),
        ("IMPROVED TRANSIT FLEET EFFICIENCY", ACCENT_TEAL,
         "Transit operators leverage AI demand forecasts to dynamically schedule additional buses on crowded corridors, reducing bus bunching and operational fuel waste."),
        ("DATA-DRIVEN URBAN GOVERNANCE", ACCENT_PURPLE,
         "Municipal leaders transition from subjective guesswork to empirical evidence, accessing cross-domain metrics that unite traffic, transport, and air quality."),
        ("ENVIRONMENTAL HEALTH & SAFETY", ACCENT_GREEN,
         "Automated pollution threshold monitoring enables early warnings in sensitive hospital/school zones and encourages green transit adoption.")
    ]

    for idx, (title, color, text) in enumerate(impacts):
        col = idx % 2
        row = idx // 2
        left = Inches(0.8 + col * 6.0)
        top = Inches(1.5 + row * 2.7)

        add_card(s17, left, top, c_w, c_h)
        tb = s17.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), c_w - Inches(0.4), c_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_after = Pt(6)

        p_t = tf.add_paragraph()
        p_t.text = text
        p_t.font.size = Pt(10.5)
        p_t.font.color.rgb = TEXT_DARK

    # ==============================================================
    # SLIDE 18: References & Key Literature
    # ==============================================================
    s18 = prs.slides.add_slide(blank_layout)
    set_slide_background(s18, BG_LIGHT)
    add_header(s18, "Key Academic Literature & References", "BIBLIOGRAPHY")

    # References Card
    add_card(s18, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.2))
    tb_ref = s18.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(11.333), Inches(4.8))
    tf_ref = tb_ref.text_frame
    tf_ref.word_wrap = True

    p = tf_ref.paragraphs[0]
    p.text = "FOUNDATIONAL LITERATURE CITED IN PROJECT REPORT"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = ACCENT_NAVY
    p.space_after = Pt(8)

    refs = [
        "[1] Dritsas, D., & Trigka, M. (2025). Big Data and Internet of Things Applications in Smart Cities: Recent Advances, Challenges, and Critical Issues. Internet of Things.",
        "[2] Omrany, H., et al. (2024). IoT-enabled Smart Cities: A Hybrid Systematic Analysis of Key Research Areas, Challenges, and Recommendations for Future Direction. Discover Cities.",
        "[3] Nguyen, H., Nawara, D., & Kashef, R. (2024). Connecting the Indispensable Roles of IoT and Artificial Intelligence in Smart Cities: A Survey.",
        "[4] Ahmed, K., Dubey, M. K., Kumar, A., & Dubey, S. (2024). Artificial Intelligence and IoT Driven System Architecture for Municipality Waste Management in Smart Cities. Measurement: Sensors.",
        "[5] Artificial Intelligence of Things and Distributed Technologies as Enablers for Intelligent Mobility Services in Smart Cities – A Survey. (2024). Internet of Things.",
        "[6] A Systematic Survey of Internet of Things Frameworks for Smart City Applications. (2022). Sustainable Cities and Society.",
        "[7] United Nations. Sustainable Development Goals – Sustainable Cities and Communities (SDG 11).",
        "[8] IBM & Cisco. Smart and Connected Communities: Smart City Technologies and Solutions."
    ]

    for ref in refs:
        p_r = tf_ref.add_paragraph()
        p_r.text = ref
        p_r.font.size = Pt(10)
        p_r.font.color.rgb = TEXT_DARK
        p_r.space_after = Pt(5)

    # ==============================================================
    # SLIDE 19: Summary of Work Done & Contributions
    # ==============================================================
    s19 = prs.slides.add_slide(blank_layout)
    set_slide_background(s19, BG_LIGHT)
    add_header(s19, "Individual Contributions & Project Summary", "TEAM WORK DISTRIBUTION")

    # 4 Team Member Contribution Cards
    m_w = Inches(2.7)
    m_h = Inches(5.2)

    contributions = [
        ("MOHAMMED MUZAMMIL PASHA", "24STUCHH010218", ACCENT_BLUE, [
            "TGSRTC GTFS schedule ingestion into MySQL.",
            "Created transit_stops, routes, trips, and stop_times tables.",
            "Engineered Stop Clustering algorithm for multi-bay stations.",
            "Built Origin-to-Destination transit route finder engine.",
            "Implemented dynamic traffic delay & crowd forecasting logic.",
            "Verified test corridors across Greater Hyderabad."
        ]),
        ("LASKAR VARSHINI REDDY", "24STUCHH010879", ACCENT_TEAL, [
            "Designed 4-tier overall system architecture and DFDs.",
            "Engineered centralized administrative operations dashboard.",
            "Compiled mid-term project report and academic documentation.",
            "Coordinated inter-module API schemas and data structures.",
            "Implemented role-based user access controls."
        ]),
        ("NAVKAR GELDA JAIN", "24STUCHH010202", ACCENT_AMBER, [
            "Engineered traffic sensor data ingestion pipelines.",
            "Calculated Volume-to-Capacity (V/C) ratios for road segments.",
            "Created real-time corridor congestion heatmaps.",
            "Implemented threshold-triggered traffic bottleneck alerts.",
            "Integrated traffic telemetry into transit delay estimation."
        ]),
        ("MOHITH MADARAPU", "24STUCHH010916", ACCENT_PURPLE, [
            "Implemented air quality sensor telemetry processing.",
            "Applied Central Pollution Control Board (CPCB) AQI standards.",
            "Calculated sub-indices for PM2.5, PM10, CO, and NO2.",
            "Built automated environmental threshold alert engine.",
            "Integrated health advisories for vulnerable urban zones."
        ])
    ]

    for idx, (name, roll, color, tasks) in enumerate(contributions):
        left = Inches(0.8 + idx * 2.95)
        add_card(s19, left, Inches(1.5), m_w, m_h)
        tb = s19.shapes.add_textbox(left + Inches(0.15), Inches(1.7), m_w - Inches(0.3), m_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p_n = tf.paragraphs[0]
        p_n.text = name
        p_n.font.size = Pt(11)
        p_n.font.bold = True
        p_n.font.color.rgb = color

        p_r = tf.add_paragraph()
        p_r.text = roll
        p_r.font.size = Pt(9.5)
        p_r.font.color.rgb = TEXT_MUTED
        p_r.space_after = Pt(10)

        for t in tasks:
            p_t = tf.add_paragraph()
            p_t.text = "• " + t
            p_t.font.size = Pt(9.5)
            p_t.font.color.rgb = TEXT_DARK
            p_t.space_after = Pt(4)

    # ==============================================================
    # SLIDE 20: Thank You / Q&A Slide (Dark Theme)
    # ==============================================================
    s20 = prs.slides.add_slide(blank_layout)
    set_slide_background(s20, BG_DARK)

    # Accent top bar
    bar = s20.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.12))
    bar.fill.solid()
    bar.fill.fore_color.rgb = ACCENT_BLUE
    bar.line.fill.background()

    # Center Box
    c_box = s20.shapes.add_textbox(Inches(1.5), Inches(1.8), Inches(10.333), Inches(3.8))
    tf_c = c_box.text_frame
    tf_c.word_wrap = True

    p0 = tf_c.paragraphs[0]
    p0.text = "THANK YOU"
    p0.font.size = Pt(44)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(255, 255, 255)
    p0.alignment = PP_ALIGN.CENTER
    p0.space_after = Pt(10)

    p1 = tf_c.add_paragraph()
    p1.text = "DATA ANALYTICS FOR SMART CITIES"
    p1.font.size = Pt(20)
    p1.font.bold = True
    p1.font.color.rgb = ACCENT_BLUE
    p1.alignment = PP_ALIGN.CENTER
    p1.space_after = Pt(6)

    p2 = tf_c.add_paragraph()
    p2.text = "Questions & Answers / Discussion with the Review Committee"
    p2.font.size = Pt(16)
    p2.font.color.rgb = RGBColor(148, 163, 184)
    p2.alignment = PP_ALIGN.CENTER
    p2.space_after = Pt(20)

    p3 = tf_c.add_paragraph()
    p3.text = "Laskar Varshini Reddy | Mohammed Muzammil Pasha | Navkar Gelda Jain | Mohith Madarapu"
    p3.font.size = Pt(13)
    p3.font.color.rgb = RGBColor(203, 213, 225)
    p3.alignment = PP_ALIGN.CENTER

    p4 = tf_c.add_paragraph()
    p4.text = "Department of Computer Science & Engineering | IFHE Hyderabad"
    p4.font.size = Pt(12)
    p4.font.color.rgb = RGBColor(100, 116, 139)
    p4.alignment = PP_ALIGN.CENTER
    p4.space_before = Pt(8)

    prs.save(output_pptx_path)
    print(f"Presentation saved successfully at: {output_pptx_path}")

if __name__ == "__main__":
    out_path = "C:/Users/dell/Desktop/Smart_City_Presentation.pptx"
    create_presentation(out_path)

    # Also update SMART CITIES.pptx on Desktop as requested
    out_path_main = "C:/Users/dell/Desktop/SMART CITIES.pptx"
    create_presentation(out_path_main)
