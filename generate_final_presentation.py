import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck(output_path):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Professional Color Palette
    BG_DARK = RGBColor(15, 23, 42)          # Slate 900
    BG_LIGHT = RGBColor(248, 250, 252)      # Slate 50
    CARD_BG = RGBColor(255, 255, 255)       # Pure White
    CARD_BORDER = RGBColor(226, 232, 240)   # Slate 200
    CARD_BG_MUTED = RGBColor(241, 245, 249) # Slate 100
    
    TEXT_DARK = RGBColor(15, 23, 42)        # Slate 900
    TEXT_MUTED = RGBColor(100, 116, 139)    # Slate 500
    TEXT_LIGHT = RGBColor(241, 245, 249)    # Slate 100
    
    ACCENT_BLUE = RGBColor(2, 132, 199)     # Sky 600
    ACCENT_CYAN = RGBColor(6, 182, 212)     # Cyan 500
    ACCENT_TEAL = RGBColor(13, 148, 136)    # Teal 600
    ACCENT_NAVY = RGBColor(30, 41, 59)      # Slate 800
    ACCENT_GREEN = RGBColor(5, 150, 105)    # Emerald 600
    ACCENT_AMBER = RGBColor(217, 119, 6)    # Amber 600
    ACCENT_PURPLE = RGBColor(124, 58, 237)  # Violet 600
    ACCENT_RED = RGBColor(225, 29, 72)      # Rose 600

    def set_bg(slide, color):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_header(slide, title, category="SMART CITY URBAN ANALYTICS", dark_mode=False):
        # Category Tag
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.28))
        tf_c = cat_box.text_frame
        tf_c.word_wrap = True
        tf_c.margin_left = tf_c.margin_top = tf_c.margin_right = tf_c.margin_bottom = 0
        p_c = tf_c.paragraphs[0]
        p_c.text = category.upper()
        p_c.font.size = Pt(9.5)
        p_c.font.bold = True
        p_c.font.color.rgb = ACCENT_CYAN if dark_mode else ACCENT_BLUE

        # Slide Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.68), Inches(11.7), Inches(0.55))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(21)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_LIGHT if dark_mode else TEXT_DARK

    def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
        return card

    def add_badge(slide, left, top, width, height, text, bg_color, text_color=RGBColor(255, 255, 255)):
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        badge.fill.solid()
        badge.fill.fore_color.rgb = bg_color
        badge.line.fill.background()
        tf = badge.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = text
        p.font.size = Pt(8.5)
        p.font.bold = True
        p.font.color.rgb = text_color
        p.alignment = PP_ALIGN.CENTER
        return badge

    # ==============================================================
    # SLIDE 1: Title Slide (Dark Theme)
    # ==============================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_bg(s1, BG_DARK)

    # Accent Top Line
    top_bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.12))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = ACCENT_BLUE
    top_bar.line.fill.background()

    # Title Container
    t_box = s1.shapes.add_textbox(Inches(1.0), Inches(1.1), Inches(11.333), Inches(2.2))
    tf1 = t_box.text_frame
    tf1.word_wrap = True
    
    p = tf1.paragraphs[0]
    p.text = "B.TECH COMPUTER SCIENCE & ENGINEERING — SPECIAL PROJECT"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.space_after = Pt(8)

    p = tf1.add_paragraph()
    p.text = "DATA ANALYTICS FOR SMART CITIES"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)

    p = tf1.add_paragraph()
    p.text = "An Integrated Urban Analytics & Predictive Decision Support Platform"
    p.font.size = Pt(18)
    p.font.color.rgb = RGBColor(148, 163, 184)
    p.space_before = Pt(6)

    # Team Card
    add_card(s1, Inches(1.0), Inches(3.6), Inches(11.333), Inches(2.6), bg_color=ACCENT_NAVY, border_color=RGBColor(51, 65, 85))
    tb_m = s1.shapes.add_textbox(Inches(1.3), Inches(3.8), Inches(10.733), Inches(2.2))
    tf_m = tb_m.text_frame
    tf_m.word_wrap = True

    p = tf_m.paragraphs[0]
    p.text = "PROJECT TEAM MEMBERS & DOMAIN LEADERSHIP"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.space_after = Pt(10)

    team_data = [
        ("Mohammed Muzammil Pasha", "Public Transportation & GTFS Routing Engine Lead | Transport ML & Predictive Analytics"),
        ("Laskar Varshini Reddy", "System Architecture & Centralized Dashboard Lead"),
        ("Navkar Gelda Jain", "Traffic Monitoring & Spatial Congestion Lead"),
        ("Mohith Madarapu", "Air Quality Index & Environmental Telemetry Lead")
    ]
    for name, role in team_data:
        p = tf_m.add_paragraph()
        p.text = f"•  {name}  —  {role}"
        p.font.size = Pt(11)
        p.font.color.rgb = RGBColor(241, 245, 249)
        p.space_after = Pt(4)

    # Footer
    f_box = s1.shapes.add_textbox(Inches(1.0), Inches(6.5), Inches(11.333), Inches(0.5))
    pf = f_box.text_frame.paragraphs[0]
    pf.text = "Department of Computer Science and Engineering  |  The ICFAI Foundation for Higher Education (IFHE), Hyderabad"
    pf.font.size = Pt(11)
    pf.font.color.rgb = RGBColor(100, 116, 139)

    # ==============================================================
    # SLIDE 2: Urban Challenges & Problem Background
    # ==============================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_bg(s2, BG_LIGHT)
    add_header(s2, "Urban Challenges & The Need for Predictive Analytics", "PROBLEM BACKGROUND")

    col_w = Inches(3.64)
    col_h = Inches(4.2)

    # 3 Column Cards
    c1 = add_card(s2, Inches(0.8), Inches(1.5), col_w, col_h)
    tb = s2.shapes.add_textbox(Inches(1.0), Inches(1.7), col_w - Inches(0.4), col_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "RAPID METROPOLITAN GROWTH"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = ACCENT_BLUE
    p.space_after = Pt(8)
    for t in [
        "Escalating Road Congestion: Bottlenecks on primary arterial corridors cause severe travel delays and fuel wastage.",
        "Public Transit Crowding: Commuters lack advance visibility into vehicle seating vs. standing conditions.",
        "Unpredictable Travel Times: Static timetables fail to account for dynamic urban friction.",
        "High Economic Losses: Congestion in major Indian cities costs billions annually in lost productivity."
    ]:
        p = tf.add_paragraph()
        p.text = "• " + t
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(6)

    c2 = add_card(s2, Inches(4.84), Inches(1.5), col_w, col_h)
    tb = s2.shapes.add_textbox(Inches(5.04), Inches(1.7), col_w - Inches(0.4), col_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "ENVIRONMENT & HEALTH"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = ACCENT_AMBER
    p.space_after = Pt(8)
    for t in [
        "Air Quality Degradation: Elevated particulate matter (PM2.5, PM10) from vehicle emissions and industrial activity.",
        "Weather Vulnerabilities: Monsoon downpours and temperature extremes severely disrupt traffic flow.",
        "Micro-Climate Hotspots: Disproportionate pollution spikes around major transit interchanges.",
        "Lack of Unified Warnings: Commuters receive environmental alerts separately from route planning apps."
    ]:
        p = tf.add_paragraph()
        p.text = "• " + t
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(6)

    c3 = add_card(s2, Inches(8.88), Inches(1.5), col_w, col_h)
    tb = s2.shapes.add_textbox(Inches(9.08), Inches(1.7), col_w - Inches(0.4), col_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "INFORMATION FRAGMENTATION"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(8)
    for t in [
        "Siloed Municipal Agencies: Traffic police, public bus operators, and pollution boards operate isolated databases.",
        "Passive Monitoring Only: Current tools display current conditions rather than predictive forecasts.",
        "Delayed Decision-Making: City managers manually compile retrospective reports after crises occur.",
        "Platform Vision: Unify heterogeneous urban data into active predictive decision support."
    ]:
        p = tf.add_paragraph()
        p.text = "• " + t
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(6)

    # Bottom Pipeline Visual
    add_card(s2, Inches(0.8), Inches(5.9), Inches(11.733), Inches(0.9), bg_color=CARD_BG_MUTED)
    tb_b = s2.shapes.add_textbox(Inches(1.0), Inches(6.05), Inches(11.333), Inches(0.6))
    p_b = tb_b.text_frame.paragraphs[0]
    p_b.text = "PLATFORM PARADIGM:   Heterogeneous Urban Data  ➔  Relational Storage  ➔  ML & Analytics  ➔  Predictive Decision Support"
    p_b.font.size = Pt(11)
    p_b.font.bold = True
    p_b.font.color.rgb = ACCENT_NAVY
    p_b.alignment = PP_ALIGN.CENTER

    # ==============================================================
    # SLIDE 3: Problem Statement
    # ==============================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_bg(s3, BG_LIGHT)
    add_header(s3, "The Cross-Domain Urban Analytics Bottleneck", "PROBLEM STATEMENT")

    card_w = Inches(5.7)
    card_h = Inches(4.3)

    # Left: Root Causes
    add_card(s3, Inches(0.8), Inches(1.5), card_w, card_h)
    tb_l = s3.shapes.add_textbox(Inches(1.0), Inches(1.7), card_w - Inches(0.4), card_h - Inches(0.4))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    p = tf_l.paragraphs[0]
    p.text = "OPERATIONAL & DATA ISOLATION"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_RED
    p.space_after = Pt(10)
    for t in [
        "Isolated Data Reservoirs: Public transportation schedules, road sensor counts, AQI stations, and weather radars reside in separate databases.",
        "Missing Domain Interactions: Difficult to model how heavy rainfall or pollution surges directly ripple into bus delays and passenger crowding.",
        "Absence of Joint Decision Metrics: Commuters cannot evaluate transit options based on travel time, expected delay, and crowding simultaneously.",
        "Lack of Centralized Analytics: Municipal authorities lack a single pane of glass to observe cross-sector urban patterns in real time."
    ]:
        p = tf_l.add_paragraph()
        p.text = "• " + t
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    # Right: Consequences
    add_card(s3, Inches(6.8), Inches(1.5), card_w, card_h)
    tb_r = s3.shapes.add_textbox(Inches(7.0), Inches(1.7), card_w - Inches(0.4), card_h - Inches(0.4))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    p = tf_r.paragraphs[0]
    p.text = "CONSEQUENCES ON CITIZENS & OPERATORS"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_AMBER
    p.space_after = Pt(10)
    for t in [
        "Suboptimal Route Decisions: Commuters choose routes based on nominal schedules, frequently encountering unannounced peak-hour gridlocks.",
        "Fleet Allocation Inefficiencies: Bus operators cannot dynamically adjust dispatch frequencies due to lack of predictive demand models.",
        "Prolonged Commute Stress: Severe platform crowding and uncertainty undermine public transit reliability.",
        "Reactive Emergency Response: Urban authorities only respond after severe bottlenecks or environmental hazards occur."
    ]:
        p = tf_r.add_paragraph()
        p.text = "• " + t
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    # Core Statement Box
    add_card(s3, Inches(0.8), Inches(6.0), Inches(11.733), Inches(0.85), bg_color=ACCENT_NAVY, border_color=ACCENT_NAVY)
    tb_stmt = s3.shapes.add_textbox(Inches(1.0), Inches(6.12), Inches(11.333), Inches(0.6))
    p_s = tb_stmt.text_frame.paragraphs[0]
    p_s.text = "PROBLEM FORMULATION: There is an urgent need for an integrated, data-driven platform capable of fusing multiple urban data streams to provide predictive decision support across transit routing, passenger demand, and city operations."
    p_s.font.size = Pt(11)
    p_s.font.bold = True
    p_s.font.color.rgb = RGBColor(255, 255, 255)
    p_s.alignment = PP_ALIGN.CENTER

    # ==============================================================
    # SLIDE 4: Motivation & Multi-Stakeholder Need
    # ==============================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_bg(s4, BG_LIGHT)
    add_header(s4, "Multi-Stakeholder Value & Project Motivation", "MOTIVATION & VALUE")

    col_w = Inches(3.64)
    col_h = Inches(4.5)

    # 3 Stakeholder Columns
    add_card(s4, Inches(0.8), Inches(1.5), col_w, col_h)
    tb = s4.shapes.add_textbox(Inches(1.0), Inches(1.7), col_w - Inches(0.4), col_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "CITIZEN PERSPECTIVE"
    p.font.bold = True
    p.font.size = Pt(12.5)
    p.font.color.rgb = ACCENT_BLUE
    p.space_after = Pt(8)
    for t in [
        "Reliable Transit Discovery: Find direct bus connections between any two stops with accurate intermediate stop counts.",
        "Dynamic Delay Awareness: View expected traffic-induced delays rather than relying on static timetables.",
        "Crowd Visibility: Advance notice of whether upcoming buses have ample seats, partial seats, or standing only.",
        "Environmental Awareness: Route-level visibility into air quality conditions."
    ]:
        p = tf.add_paragraph()
        p.text = "• " + t
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(6)

    add_card(s4, Inches(4.84), Inches(1.5), col_w, col_h)
    tb = s4.shapes.add_textbox(Inches(5.04), Inches(1.7), col_w - Inches(0.4), col_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "TRANSIT OPERATORS (TGSRTC)"
    p.font.bold = True
    p.font.size = Pt(12.5)
    p.font.color.rgb = ACCENT_TEAL
    p.space_after = Pt(8)
    for t in [
        "Passenger Demand Forecasting: Daily ridership forecasts using time-series machine learning models.",
        "Proactive Fleet Scheduling: Plan bus frequency adjustments for weekends, holidays, and weekdays in advance.",
        "Corridor Bottleneck Detection: Identify high-friction transit corridors where buses consistently lose punctuality.",
        "Optimized Fleet Utilization: Prevent bus bunching and reduce unnecessary empty runs."
    ]:
        p = tf.add_paragraph()
        p.text = "• " + t
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(6)

    add_card(s4, Inches(8.88), Inches(1.5), col_w, col_h)
    tb = s4.shapes.add_textbox(Inches(9.08), Inches(1.7), col_w - Inches(0.4), col_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "MUNICIPAL PLANNERS"
    p.font.bold = True
    p.font.size = Pt(12.5)
    p.font.color.rgb = ACCENT_AMBER
    p.space_after = Pt(8)
    for t in [
        "Unified Urban Observability: Single platform combining transit, traffic, and environmental metrics.",
        "Evidence-Based Policy: Leverage historical datasets and predictive models for infrastructure planning.",
        "Cross-Domain Incident Correlation: Analyze how traffic congestion spikes correlate with localized pollution surges.",
        "Decision-Support Proof-of-Concept: Technical prototype validating smart city data fusion."
    ]:
        p = tf.add_paragraph()
        p.text = "• " + t
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(6)

    # Disclaimer Note
    add_badge(s4, Inches(0.8), Inches(6.2), Inches(11.733), Inches(0.55),
              "DISCLAIMER: The platform is developed as a university research / technical proof-of-concept; it is NOT currently deployed by any government entity.",
              CARD_BG_MUTED, TEXT_MUTED)

    # ==============================================================
    # SLIDE 5: Project Objectives
    # ==============================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_bg(s5, BG_LIGHT)
    add_header(s5, "Primary Project Objectives & Engineering Goals", "PROJECT OBJECTIVES")

    obj_w = Inches(5.7)
    obj_h = Inches(1.15)

    objectives = [
        ("OBJ 1", "Develop an Integrated Smart City Analytics Platform", "Create a modular architecture uniting transit schedules, ridership datasets, traffic, and environmental metrics into one common platform.", ACCENT_BLUE),
        ("OBJ 2", "Build a GTFS-Based Relational Transit Database", "Ingest and index official GTFS schedules (5,028 stops, 1.13M timetable rows) in MySQL 8.4 with high-performance B-tree indexing.", ACCENT_TEAL),
        ("OBJ 3", "Implement Origin-to-Destination Route Discovery", "Develop an algorithm resolving physical multi-bay platform clusters and discovering direct transit paths between any two stops.", ACCENT_PURPLE),
        ("OBJ 4", "Provide Intelligent Decision-Support Estimates", "Compute dynamic traffic-induced delays and crowd occupancy tiers to rank transit options via a multi-factor recommendation score.", ACCENT_AMBER),
        ("OBJ 5", "Develop ML-Based Transit Demand Forecasting", "Engineer calendar, lag, and rolling statistics on 9,312 historical transit days; train and benchmark multiple regression models.", ACCENT_GREEN),
        ("OBJ 6", "Formulate Traffic, Air Quality & Weather Analytics", "Establish analytical frameworks for road congestion analysis, CPCB standard AQI classification, and weather impact modeling.", ACCENT_NAVY)
    ]

    for idx, (num, title, desc, color) in enumerate(objectives):
        col = idx % 2
        row = idx // 2
        left = Inches(0.8 + col * 6.0)
        top = Inches(1.5 + row * 1.35)

        add_card(s5, left, top, obj_w, obj_h)
        # Left tag bar
        tag = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, Inches(0.12), obj_h)
        tag.fill.solid()
        tag.fill.fore_color.rgb = color
        tag.line.fill.background()

        tb = s5.shapes.add_textbox(left + Inches(0.3), top + Inches(0.1), obj_w - Inches(0.5), obj_h - Inches(0.2))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"{num}: {title}"
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = color
        p.space_after = Pt(2)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_MUTED

    # Bottom Objective 7 Banner
    add_card(s5, Inches(0.8), Inches(5.8), Inches(11.733), Inches(0.9), bg_color=CARD_BG_MUTED)
    tb_o7 = s5.shapes.add_textbox(Inches(1.0), Inches(5.92), Inches(11.333), Inches(0.65))
    tf_o7 = tb_o7.text_frame
    p = tf_o7.paragraphs[0]
    p.text = "OBJ 7: Design a Unified Operations Dashboard Architecture"
    p.font.bold = True
    p.font.size = Pt(11.5)
    p.font.color.rgb = ACCENT_NAVY
    p2 = tf_o7.add_paragraph()
    p2.text = "Architect role-specific user interaction interfaces tailored for City Administrators, Transit Officers, and Citizens to interact with predictive models and urban metrics."
    p2.font.size = Pt(10)
    p2.font.color.rgb = TEXT_MUTED

    # ==============================================================
    # SLIDE 6: Existing System vs. Proposed Platform
    # ==============================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_bg(s6, BG_LIGHT)
    add_header(s6, "Existing System Architecture vs. Proposed Platform", "RESEARCH GAP & INTEGRATION")

    c_w = Inches(5.7)
    c_h = Inches(4.5)

    # Left: Existing
    add_card(s6, Inches(0.8), Inches(1.5), c_w, c_h)
    tb = s6.shapes.add_textbox(Inches(1.0), Inches(1.7), c_w - Inches(0.4), c_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "EXISTING URBAN TOOLS (SILOED)"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_RED
    p.space_after = Pt(10)

    for domain, detail in [
        ("Transit Apps", "Display static published schedules; no dynamic traffic delay awareness or crowding levels."),
        ("Traffic GPS", "Provide vehicle navigation speeds; completely isolated from bus routes and public transit options."),
        ("AQI Portals", "Display static air monitoring station readings; decoupled from commuter travel planning."),
        ("Weather Apps", "Provide general forecasts; no direct correlation with transit delays or urban road bottlenecks.")
    ]:
        p = tf.add_paragraph()
        p.text = f"• {domain}: {detail}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    p_sum = tf.add_paragraph()
    p_sum.text = "CRITICAL GAP: Zero cross-domain data fusion. Commuters and planners must manually toggle between disconnected systems."
    p_sum.font.bold = True
    p_sum.font.size = Pt(10.5)
    p_sum.font.color.rgb = ACCENT_RED
    p_sum.space_before = Pt(6)

    # Right: Proposed
    add_card(s6, Inches(6.8), Inches(1.5), c_w, c_h)
    tb = s6.shapes.add_textbox(Inches(7.0), Inches(1.7), c_w - Inches(0.4), c_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "PROPOSED INTEGRATED PLATFORM"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_GREEN
    p.space_after = Pt(10)

    for feat, detail in [
        ("Common Data Layer", "Centralized MySQL 8.4 database storing transit schedules, trip histories, and urban telemetry."),
        ("Integrated Route Engine", "Combines scheduled transit timetables with dynamic heuristic traffic delay multipliers and crowd tiers."),
        ("AI Demand Forecasting", "Machine learning regressor predicting daily public transit passenger volumes."),
        ("Cross-Domain Visibility", "Architected to fuse transit, traffic congestion, AQI categories, and weather indicators.")
    ]:
        p = tf.add_paragraph()
        p.text = f"• {feat}: {detail}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    p_sum = tf.add_paragraph()
    p_sum.text = "INTEGRATION VALUE: Transforms passive, fragmented monitoring into proactive, multi-domain predictive decision support."
    p_sum.font.bold = True
    p_sum.font.size = Pt(10.5)
    p_sum.font.color.rgb = ACCENT_GREEN
    p_sum.space_before = Pt(6)

    # Bottom Note
    add_badge(s6, Inches(0.8), Inches(6.2), Inches(11.733), Inches(0.55),
              "OBJECTIVE CLARITY: We do not claim our prototype outperforms commercial navigation apps in every feature; our core contribution is the unified cross-domain data and decision framework.",
              CARD_BG_MUTED, TEXT_MUTED)

    # ==============================================================
    # SLIDE 7: Proposed System Architecture (Conceptual)
    # ==============================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_bg(s7, BG_LIGHT)
    add_header(s7, "Proposed System Architecture & End-to-End Pipeline", "SYSTEM DESIGN")

    # 5 Sequential Cards
    b_w = Inches(2.2)
    b_h = Inches(4.5)

    pipeline = [
        ("DATA SOURCES", ACCENT_BLUE, [
            "Official GTFS Schedule Archive (TGSRTC)",
            "5,028 Bus Stops",
            "1,031 Bus Lines",
            "Historical Ridership Dataset (9,312 Days)",
            "Traffic & Sensor Telemetry (Planned)",
            "CPCB AQI Data (Planned)"
        ]),
        ("DATA INGESTION", ACCENT_TEAL, [
            "GTFS CSV/TXT Parser",
            "Batch Transaction Loading",
            "Referential Integrity Validation",
            "Data Cleaning & Missing Value Handling",
            "Temporal Feature Engineering Pipeline"
        ]),
        ("STORAGE LAYER", ACCENT_NAVY, [
            "MySQL 8.4 Server (smart_city_db)",
            "1.13M Stop Times Records",
            "Composite B-tree Indexing Strategy",
            "user_trip_searches Audit Log Table",
            "transit_demand_forecasts Storage"
        ]),
        ("ANALYTICS & ML", ACCENT_PURPLE, [
            "Stop Clustering (resolve_stop_cluster)",
            "SQL O-D Route Finder",
            "Heuristic Delay & Crowd Estimation",
            "Multi-Objective Route Recommendation",
            "Random Forest Demand Forecasting Regressor"
        ]),
        ("DECISION SUPPORT", ACCENT_AMBER, [
            "Commuter Transit Guidance",
            "Recommended Best Bus Line Tagging",
            "Proactive Fleet Demand Projections",
            "Threshold-Triggered Urban Alerts",
            "Operations Dashboard (In Progress)"
        ])
    ]

    for idx, (title, color, items) in enumerate(pipeline):
        left = Inches(0.8 + idx * 2.38)
        add_card(s7, left, Inches(1.5), b_w, b_h)

        tag = s7.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, Inches(1.5), b_w, Inches(0.35))
        tag.fill.solid()
        tag.fill.fore_color.rgb = color
        tag.line.fill.background()
        tf_tag = tag.text_frame
        tf_tag.margin_left = tf_tag.margin_top = tf_tag.margin_right = tf_tag.margin_bottom = 0
        p = tf_tag.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(9)
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = PP_ALIGN.CENTER

        tb = s7.shapes.add_textbox(left + Inches(0.1), Inches(1.95), b_w - Inches(0.2), b_h - Inches(0.55))
        tf = tb.text_frame
        tf.word_wrap = True
        p0 = tf.paragraphs[0]
        p0.text = ""
        for itm in items:
            p = tf.add_paragraph()
            p.text = "• " + itm
            p.font.size = Pt(9.5)
            p.font.color.rgb = TEXT_DARK
            p.space_after = Pt(5)

    # Bottom Summary
    add_card(s7, Inches(0.8), Inches(6.15), Inches(11.733), Inches(0.65), bg_color=CARD_BG_MUTED)
    tb_sum = s7.shapes.add_textbox(Inches(1.0), Inches(6.23), Inches(11.333), Inches(0.5))
    p = tb_sum.text_frame.paragraphs[0]
    p.text = "MODULAR DESIGN PRINCIPLE: Each urban domain operates independently within its analytics pipeline while sharing the centralized MySQL storage and decision-support layer."
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_NAVY
    p.alignment = PP_ALIGN.CENTER

    # ==============================================================
    # SLIDE 8: Overall System Architecture (Layered)
    # ==============================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_bg(s8, BG_DARK)
    add_header(s8, "Layered Technical Architecture & Implementation Status", "SYSTEM ARCHITECTURE", dark_mode=True)

    layer_w = Inches(11.733)
    layer_h = Inches(0.88)

    arch_layers = [
        ("LAYER 5: PRESENTATION (REACT.JS DASHBOARD)", ACCENT_CYAN,
         "Citizen Commuter Portal  |  Transit & Traffic Operator Views  |  Admin Management",
         "UNDER DEVELOPMENT", ACCENT_AMBER),

        ("LAYER 4: BACKEND APPLICATION SERVICES (NODE.JS / EXPRESS)", ACCENT_BLUE,
         "REST APIs: /api/transport/plan-trip  |  /api/traffic/status  |  /api/environment/aqi",
         "UNDER DEVELOPMENT", ACCENT_AMBER),

        ("LAYER 3: ANALYTICS & MACHINE LEARNING (PYTHON 3.x)", ACCENT_PURPLE,
         "O-D Route Finder  |  Stop Clustering  |  Heuristic Delays & Crowds  |  Random Forest Demand Regressor",
         "IMPLEMENTED & VERIFIED", ACCENT_GREEN),

        ("LAYER 2: DATA STORAGE (MYSQL 8.4 SERVER)", ACCENT_TEAL,
         "Database: smart_city_db  |  1.13M Stop Times  |  5,028 Stops  |  1,031 Routes  |  44,892 Trips  |  user_trip_searches",
         "IMPLEMENTED & OPERATIONAL", ACCENT_GREEN),

        ("LAYER 1: DATA INGESTION & OPEN TELEMETRY", ACCENT_GREEN,
         "Telangana TGSRTC GTFS Archive  |  9,312 Days Transit Ridership Dataset  |  Traffic & AQI Schemas",
         "INGESTED & PREPROCESSED", ACCENT_GREEN)
    ]

    for idx, (title, col, items, status_text, status_col) in enumerate(arch_layers):
        top = Inches(1.5 + idx * 1.05)
        add_card(s8, Inches(0.8), top, layer_w, layer_h, bg_color=ACCENT_NAVY, border_color=RGBColor(51, 65, 85))

        # Status Badge
        add_badge(s8, Inches(10.4), top + Inches(0.2), Inches(1.9), Inches(0.35), status_text, status_col)

        tb = s8.shapes.add_textbox(Inches(1.0), top + Inches(0.08), Inches(9.2), layer_h - Inches(0.16))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = col
        p.space_after = Pt(2)

        p2 = tf.add_paragraph()
        p2.text = items
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = RGBColor(203, 213, 225)

    # Bottom Note
    f_box = s8.shapes.add_textbox(Inches(0.8), Inches(6.8), Inches(11.733), Inches(0.4))
    pf = f_box.text_frame.paragraphs[0]
    pf.text = "Note: Architecture clearly reflects verified project repository status. Layers 1, 2, and 3 are fully operational; Layers 4 and 5 are structured skeletons."
    pf.font.size = Pt(9.5)
    pf.font.color.rgb = RGBColor(148, 163, 184)
    pf.alignment = PP_ALIGN.CENTER

    # ==============================================================
    # SLIDE 9: The Four Urban Analytics Modules
    # ==============================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_bg(s9, BG_LIGHT)
    add_header(s9, "Four Core Urban Analytics Modules: Scope & Status", "MODULAR OVERVIEW")

    m_w = Inches(2.7)
    m_h = Inches(5.2)

    modules = [
        ("01. TRANSPORTATION", ACCENT_BLUE, "IMPLEMENTED", ACCENT_GREEN, [
            "Official GTFS Schedule Ingestion (5,028 stops, 1.13M rows in MySQL).",
            "Stop Clustering Algorithm (resolve_stop_cluster).",
            "Origin-to-Destination shortest path SQL routing.",
            "Heuristic Traffic Delay and Crowd Level estimation.",
            "Trained Random Forest Passenger Demand Forecasting ML model (R² = 0.6413)."
        ]),
        ("02. TRAFFIC MONITORING", ACCENT_AMBER, "UNDER DEVELOPMENT", ACCENT_AMBER, [
            "Congestion indexing formulation based on Volume-to-Capacity (V/C) ratios.",
            "Segment speed telemetry specifications (< 15 km/h congestion thresholds).",
            "Planned integration: dynamic traffic speeds feeding transit delay calculations.",
            "Under development: Leaflet spatial congestion heatmap visualization."
        ]),
        ("03. AIR QUALITY (AQI)", ACCENT_TEAL, "PLANNED / SPECIFIED", ACCENT_PURPLE, [
            "Pollutant telemetry processing schema: PM2.5, PM10, CO, NO2.",
            "Central Pollution Control Board (CPCB) standard AQI calculation.",
            "AQI classification tiers (Good to Severe/Hazardous).",
            "Planned: Threshold-triggered automated health advisories."
        ]),
        ("04. WEATHER ANALYTICS", ACCENT_NAVY, "PLANNED / SPECIFIED", ACCENT_PURPLE, [
            "Micro-climate telemetry parameters: Temperature, humidity, rainfall.",
            "Analytical objective: Quantify weather disruption on road speeds.",
            "Planned: Cross-domain correlation between rainfall and transit delays.",
            "Under development: Weather impact risk index."
        ])
    ]

    for idx, (title, color, status, s_col, items) in enumerate(modules):
        left = Inches(0.8 + idx * 2.95)
        add_card(s9, left, Inches(1.5), m_w, m_h)

        # Status Badge
        add_badge(s9, left + Inches(0.15), Inches(1.65), m_w - Inches(0.3), Inches(0.32), status, s_col)

        tb = s9.shapes.add_textbox(left + Inches(0.15), Inches(2.1), m_w - Inches(0.3), m_h - Inches(0.7))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_after = Pt(8)

        for itm in items:
            p = tf.add_paragraph()
            p.text = "• " + itm
            p.font.size = Pt(9.5)
            p.font.color.rgb = TEXT_DARK
            p.space_after = Pt(6)

    # ==============================================================
    # SLIDE 10: Transport Module — Detailed Overview
    # ==============================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_bg(s10, BG_LIGHT)
    add_header(s10, "Public Transportation Module: Architecture & Flow", "CORE IMPLEMENTED MODULE — LEAD: MOHAMMED MUZAMMIL PASHA")

    # Workflow Visual Cards
    step_w = Inches(11.733)
    step_h = Inches(1.1)

    steps = [
        ("STEP 1: COMMUTER QUERY INPUT & RESOLUTION", ACCENT_BLUE,
         "Commuter inputs Origin and Destination stop names (e.g. 'Charminar' to 'Afzalgunj') or GPS coordinates.",
         "resolve_stop_cluster() matches search query across transit_stops, identifying all related directional platform IDs."),

        ("STEP 2: RELATIONAL GTFS ROUTE DISCOVERY", ACCENT_TEAL,
         "Executes optimized self-join on transit_stop_times matching s1 (origin) and s2 (destination) on identical trip_id.",
         "Enforces chronological progression: s1.stop_sequence < s2.stop_sequence. Calculates scheduled travel duration & intermediate stops."),

        ("STEP 3: HEURISTIC DECISION-SUPPORT EVALUATION", ACCENT_AMBER,
         "Calculates expected traffic delay using peak-hour multipliers: Morning (+25%), Evening (+30%), Off-peak (+5%).",
         "Estimates passenger crowding category: LOW CROWD (Ample Seats), MODERATE (Partial Seats), or HIGH (Standing Only)."),

        ("STEP 4: MULTI-OBJECTIVE RANKING & RECOMMENDATION", ACCENT_GREEN,
         "Computes composite decision score: Score = Scheduled_Time + (1.2 * Delay) + Crowd_Penalty.",
         "Ranks all candidate direct lines; tags optimal route with [RECOMMENDED BEST OPTION] for commuter display.")
    ]

    for idx, (title, color, desc1, desc2) in enumerate(steps):
        top = Inches(1.5 + idx * 1.3)
        add_card(s10, Inches(0.8), top, step_w, step_h)

        tag = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), top, Inches(0.12), step_h)
        tag.fill.solid()
        tag.fill.fore_color.rgb = color
        tag.line.fill.background()

        tb = s10.shapes.add_textbox(Inches(1.1), top + Inches(0.1), step_w - Inches(0.4), step_h - Inches(0.2))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = color
        p.space_after = Pt(2)

        p1 = tf.add_paragraph()
        p1.text = "• " + desc1
        p1.font.size = Pt(9.5)
        p1.font.color.rgb = TEXT_DARK

        p2 = tf.add_paragraph()
        p2.text = "• " + desc2
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_MUTED

    # Bottom Callout
    add_card(s10, Inches(0.8), Inches(6.75), Inches(11.733), Inches(0.45), bg_color=CARD_BG_MUTED)
    tb_c = s10.shapes.add_textbox(Inches(1.0), Inches(6.8), Inches(11.333), Inches(0.35))
    p = tb_c.text_frame.paragraphs[0]
    p.text = "Data Integrity: Implemented using official published GTFS transit schedule feeds from TGSRTC Greater Hyderabad."
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = ACCENT_NAVY
    p.alignment = PP_ALIGN.CENTER

    # ==============================================================
    # SLIDE 11: GTFS + MySQL Database Implementation
    # ==============================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_bg(s11, BG_LIGHT)
    add_header(s11, "GTFS Relational Database Implementation in MySQL 8.4", "DATABASE ARCHITECTURE")

    # Left Stats Card
    left_w = Inches(3.6)
    add_card(s11, Inches(0.8), Inches(1.5), left_w, Inches(5.2))
    tb = s11.shapes.add_textbox(Inches(1.0), Inches(1.7), left_w - Inches(0.4), Inches(4.8))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "PRODUCTION DATABASE METRICS"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = ACCENT_BLUE
    p.space_after = Pt(12)

    db_stats = [
        ("1,132,807", "Timetable Stop Times"),
        ("44,892", "Scheduled Bus Trips"),
        ("5,028", "Transit Stops"),
        ("1,031", "Transit Route Lines"),
        ("MySQL 8.4", "Server Engine (smart_city_db)")
    ]
    for val, lbl in db_stats:
        p_v = tf.add_paragraph()
        p_v.text = val
        p_v.font.size = Pt(18)
        p_v.font.bold = True
        p_v.font.color.rgb = TEXT_DARK

        p_l = tf.add_paragraph()
        p_l.text = lbl
        p_l.font.size = Pt(9.5)
        p_l.font.color.rgb = TEXT_MUTED
        p_l.space_after = Pt(6)

    # Right Schema Table Card
    right_w = Inches(7.8)
    add_card(s11, Inches(4.7), Inches(1.5), right_w, Inches(5.2))

    # Add Table
    rows, cols = 6, 4
    table_shape = s11.shapes.add_table(rows, cols, Inches(4.9), Inches(1.7), Inches(7.4), Inches(2.7))
    t = table_shape.table
    col_w_list = [Inches(1.6), Inches(1.1), Inches(2.2), Inches(2.5)]
    for idx, w in enumerate(col_w_list):
        t.columns[idx].width = w

    headers = ["Table Name", "Records", "Key Columns", "Operational Role"]
    schema_rows = [
        ["transit_stops", "5,028", "stop_id (PK), stop_name, lat, lon", "Spatial stop registry for GPS search."],
        ["transit_routes", "1,031", "route_id (PK), short_name, long_name", "Catalog of bus lines and service corridors."],
        ["transit_trips", "44,892", "trip_id (PK), route_id (FK), direction", "Scheduled vehicle runs and operational directions."],
        ["transit_stop_times", "1,132,807", "trip_id, stop_id, stop_sequence, time", "Chronological arrival/departure sequences."],
        ["user_trip_searches", "Dynamic", "search_id (PK), origin, dest, time", "Commuter search log for corridor demand analytics."]
    ]

    for c_idx, h in enumerate(headers):
        cell = t.cell(0, c_idx)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = ACCENT_NAVY
        p = cell.text_frame.paragraphs[0]
        p.font.bold = True
        p.font.size = Pt(9.5)
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = PP_ALIGN.CENTER

    for r_idx, row in enumerate(schema_rows):
        for c_idx, val in enumerate(row):
            cell = t.cell(r_idx + 1, c_idx)
            cell.text = val
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(255, 255, 255) if r_idx % 2 == 0 else RGBColor(248, 250, 252)
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(8.5)
            p.font.color.rgb = TEXT_DARK
            p.alignment = PP_ALIGN.CENTER if c_idx == 1 else PP_ALIGN.LEFT

    # Lower Indexing Note in Right Card
    tb_idx = s11.shapes.add_textbox(Inches(4.9), Inches(4.5), Inches(7.4), Inches(2.0))
    tf_idx = tb_idx.text_frame
    tf_idx.word_wrap = True

    p = tf_idx.paragraphs[0]
    p.text = "COMPOSITE INDEXING & PERFORMANCE OPTIMIZATION"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = ACCENT_TEAL
    p.space_after = Pt(4)

    for item in [
        "Composite Index 1: idx_transit_st_stop_trip (stop_id, trip_id) — Accelerates origin/destination stop time lookups.",
        "Composite Index 2: idx_transit_st_trip_seq (trip_id, stop_sequence) — Eliminates table scans during sequence progression joins.",
        "Index Impact: Reduces O-D join query latency from ~14.8 seconds (unindexed scan) to < 180 ms in production MySQL 8.4.",
        "Batch Transaction Loading: Ingested 1.13M rows in chunks of 50,000 with disabled foreign-key checks during bulk loading."
    ]:
        p = tf_idx.add_paragraph()
        p.text = "• " + item
        p.font.size = Pt(9)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(2)

    # ==============================================================
    # SLIDE 12: Stop Clustering + Route Finder Engine
    # ==============================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_bg(s12, BG_LIGHT)
    add_header(s12, "Stop Clustering Algorithm & SQL Routing Engine", "CORE ALGORITHMS")

    card_w = Inches(5.7)
    card_h = Inches(5.2)

    # Left: Stop Clustering
    add_card(s12, Inches(0.8), Inches(1.5), card_w, card_h)
    tb = s12.shapes.add_textbox(Inches(1.0), Inches(1.7), card_w - Inches(0.4), card_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "STOP CLUSTERING (resolve_stop_cluster)"
    p.font.bold = True
    p.font.size = Pt(12.5)
    p.font.color.rgb = ACCENT_BLUE
    p.space_after = Pt(10)

    for itm in [
        "The Physical Reality: Stations in Greater Hyderabad possess multiple stop_id records for opposite-side bus poles or multi-bay terminals (e.g., Afzalgunj has 5 separate stop IDs).",
        "Naive ID Matching Failure: Querying an exact single stop_id fails to discover buses arriving at adjacent platforms or returning along opposite street sides.",
        "Algorithmic Solution: The system extracts the base station descriptor and dynamically groups all matching IDs:",
        "CLUSTER_IDS = { id | stop_name(id) LIKE query_name }",
        "Query Integration: All subsequent routing joins query across the resolved cluster using SQL set inclusion (IN (...)).",
        "Result: Resolves multi-platform fragmentation and guarantees complete bus route discovery across transit hubs."
    ]:
        p = tf.add_paragraph()
        p.text = "• " if not itm.startswith("CLUSTER") else "   "
        p.text += itm
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_DARK if not itm.startswith("CLUSTER") else ACCENT_BLUE
        p.font.bold = True if itm.startswith("CLUSTER") or "The Physical Reality:" in itm or "Algorithmic Solution:" in itm else False
        p.space_after = Pt(6)

    # Right: SQL Route Discovery
    add_card(s12, Inches(6.8), Inches(1.5), card_w, card_h)
    tb = s12.shapes.add_textbox(Inches(7.0), Inches(1.7), card_w - Inches(0.4), card_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "ORIGIN-DESTINATION SQL RELATIONAL ENGINE"
    p.font.bold = True
    p.font.size = Pt(12.5)
    p.font.color.rgb = ACCENT_TEAL
    p.space_after = Pt(10)

    for itm in [
        "Relational Self-Join: Joins transit_stop_times s1 (origin) with transit_stop_times s2 (destination) on s1.trip_id = s2.trip_id.",
        "Directional Sequence Enforcement: Strictly verifies that origin occurs prior to destination along the vehicle trajectory:",
        "WHERE s1.stop_id IN (origin_cluster) AND s2.stop_id IN (dest_cluster) AND s1.stop_sequence < s2.stop_sequence",
        "Intermediate Stops: Computes (s2.stop_sequence - s1.stop_sequence) stops between.",
        "Scheduled Travel Duration: Calculates TIMEDIFF(s2.arrival_time, s1.departure_time) in minutes.",
        "Haversine Proximity: Evaluates straight-line spherical distance between origin and destination GPS coordinates."
    ]:
        p = tf.add_paragraph()
        p.text = "• " if not itm.startswith("WHERE") else "   "
        p.text += itm
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_DARK if not itm.startswith("WHERE") else ACCENT_TEAL
        p.font.bold = True if itm.startswith("WHERE") or "Directional Sequence" in itm else False
        p.space_after = Pt(6)

    # ==============================================================
    # SLIDE 13: Intelligent Route Decision Support (Heuristics)
    # ==============================================================
    s13 = prs.slides.add_slide(blank_layout)
    set_bg(s13, BG_LIGHT)
    add_header(s13, "Rule-Based Traffic Delay & Crowd Decision Factors", "INTELLIGENT ROUTE GUIDANCE")

    # Disclaimer Callout
    add_badge(s13, Inches(0.8), Inches(1.35), Inches(11.733), Inches(0.35),
              "METHODOLOGY NOTE: Traffic delay and crowd level factors in the routing engine are rule-based / heuristic estimates, NOT machine learning models.",
              CARD_BG_MUTED, TEXT_MUTED)

    col_w = Inches(3.64)
    col_h = Inches(4.7)

    # Column 1: Delay Heuristic
    add_card(s13, Inches(0.8), Inches(1.85), col_w, col_h)
    tb = s13.shapes.add_textbox(Inches(1.0), Inches(2.0), col_w - Inches(0.4), col_h - Inches(0.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "DYNAMIC TRAFFIC DELAY HEURISTIC"
    p.font.bold = True
    p.font.size = Pt(11.5)
    p.font.color.rgb = ACCENT_AMBER
    p.space_after = Pt(8)
    for t in [
        "Time-of-day traffic friction function: estimate_expected_delay()",
        "Peak Morning Rush (08:00–10:30): delay = max(5, 5 + stops * 0.45) mins",
        "Peak Evening Rush (17:00–20:00): delay = max(5, 5 + stops * 0.45) mins",
        "Midday Business (11:00–16:30): delay = max(2, 2 + stops * 0.25) mins",
        "Off-Peak / Night (20:30–07:30): delay = max(0, 1 + stops * 0.10) mins",
        "Total Estimated Time = Scheduled_Duration + Expected_Delay"
    ]:
        p = tf.add_paragraph()
        p.text = "• " + t
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(5)

    # Column 2: Crowd Heuristic
    add_card(s13, Inches(4.84), Inches(1.85), col_w, col_h)
    tb = s13.shapes.add_textbox(Inches(5.04), Inches(2.0), col_w - Inches(0.4), col_h - Inches(0.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "CROWD OCCUPANCY ESTIMATE"
    p.font.bold = True
    p.font.size = Pt(11.5)
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(8)
    for t in [
        "Departure time profile function: estimate_crowd_level()",
        "HIGH CROWD (Standing Room Only): Peak commuter windows (08:00–10:30 & 17:00–20:00). High passenger boarding pressure. (Penalty = 15)",
        "MODERATE CROWD (Partial Seats): Midday inter-peak hours (11:00–16:30). Standard transit demand. (Penalty = 6)",
        "LOW CROWD (Ample Seats): Early morning (<08:00) and late night (>20:30). (Penalty = 0)"
    ]:
        p = tf.add_paragraph()
        p.text = "• " + t
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(6)

    # Column 3: Multi-Objective Score
    add_card(s13, Inches(8.88), Inches(1.85), col_w, col_h)
    tb = s13.shapes.add_textbox(Inches(9.08), Inches(2.0), col_w - Inches(0.4), col_h - Inches(0.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "MULTI-OBJECTIVE RANKING"
    p.font.bold = True
    p.font.size = Pt(11.5)
    p.font.color.rgb = ACCENT_GREEN
    p.space_after = Pt(8)
    for t in [
        "Composite Objective Function:",
        "Score = Scheduled_Time + (1.2 * Delay) + Crowd_Penalty",
        "Lower score indicates a superior travel option (fast, punctual, uncrowded).",
        "Route options are sorted ascending by score.",
        "The winning route is tagged with: [RECOMMENDED BEST OPTION] badge for commuters."
    ]:
        p = tf.add_paragraph()
        p.text = "• " if not t.startswith("Score") else "   "
        p.text += t
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_DARK if not t.startswith("Score") else ACCENT_GREEN
        p.font.bold = True if t.startswith("Score") else False
        p.space_after = Pt(6)

    # ==============================================================
    # SLIDE 14: Transport Machine Learning Pipeline
    # ==============================================================
    s14 = prs.slides.add_slide(blank_layout)
    set_bg(s14, BG_LIGHT)
    add_header(s14, "Transport Machine Learning Pipeline & Feature Engineering", "PASSENGER DEMAND FORECASTING")

    # 4 Pipeline Cards
    c_w = Inches(2.7)
    c_h = Inches(4.3)

    pipeline_ml = [
        ("01. DATASET", ACCENT_BLUE, [
            "Dataset: Historical daily public transit passenger boardings.",
            "Raw Observations: 9,312 daily records.",
            "Target Variable: total_rides (Continuous regression target).",
            "Period Covered: 25 years of daily urban mobility."
        ]),
        ("02. PREPROCESSING", ACCENT_TEAL, [
            "Inspection for missing values and duplicates.",
            "Datetime feature extraction.",
            "30-day initialization window dropped for lag alignment.",
            "Usable Records: Exactly 9,282 daily samples."
        ]),
        ("03. 22 ENGINEERED FEATURES", ACCENT_PURPLE, [
            "Calendar (7): year, month, day, day_of_week, day_of_year, is_weekend, quarter.",
            "Day Types (3): day_type_A, day_type_U, day_type_W.",
            "Lags (5): lag_1, lag_2, lag_7, lag_14, lag_30.",
            "Rolling Stats (6): mean_7, std_7, mean_14, mean_30, min_7, max_7.",
            "Trend (1): time_index."
        ]),
        ("04. MODEL TRAINING", ACCENT_AMBER, [
            "RobustScaler feature normalization.",
            "Chronological time-aware split (80% train / 20% test).",
            "Trained 5 competitive regression architectures.",
            "Selected Best: Random Forest Regressor."
        ])
    ]

    for idx, (title, color, items) in enumerate(pipeline_ml):
        left = Inches(0.8 + idx * 2.95)
        add_card(s14, left, Inches(1.5), c_w, c_h)
        tb = s14.shapes.add_textbox(left + Inches(0.15), Inches(1.7), c_w - Inches(0.3), c_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = color
        p.space_after = Pt(8)

        for itm in items:
            p = tf.add_paragraph()
            p.text = "• " + itm
            p.font.size = Pt(9)
            p.font.color.rgb = TEXT_DARK
            p.space_after = Pt(5)

    # Bottom Callout Box
    add_card(s14, Inches(0.8), Inches(6.0), Inches(11.733), Inches(0.8), bg_color=CARD_BG_MUTED)
    tb_b = s14.shapes.add_textbox(Inches(1.0), Inches(6.12), Inches(11.333), Inches(0.6))
    p = tb_b.text_frame.paragraphs[0]
    p.text = "VERIFIED FEATURE COUNT: Exactly 22 input features were generated and scaled in train.py. No synthetic features were added."
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = ACCENT_NAVY
    p.alignment = PP_ALIGN.CENTER

    # ==============================================================
    # SLIDE 15: ML Model Comparison & Results
    # ==============================================================
    s15 = prs.slides.add_slide(blank_layout)
    set_bg(s15, BG_LIGHT)
    add_header(s15, "Machine Learning Benchmark Results & Model Selection", "EXPERIMENTAL EVALUATION")

    # Table Card
    add_card(s15, Inches(0.8), Inches(1.4), Inches(11.733), Inches(3.2))

    rows, cols = 6, 6
    table_shape = s15.shapes.add_table(rows, cols, Inches(1.0), Inches(1.6), Inches(11.333), Inches(2.6))
    t = table_shape.table

    col_w_list = [Inches(2.8), Inches(1.7), Inches(1.7), Inches(1.5), Inches(1.6), Inches(2.033)]
    for idx, w in enumerate(col_w_list):
        t.columns[idx].width = w

    headers = ["Model Architecture", "MAE (Passengers)", "RMSE", "R² Score", "MAPE (%)", "Evaluation Rank"]
    data = [
        ["Random Forest Regressor", "105,570.74", "135,231.47", "0.6413", "14.32%", "1st (Saved Best Model)"],
        ["Linear Regression (Baseline)", "118,912.26", "148,107.39", "0.5698", "19.54%", "2nd"],
        ["Ridge Regression (L2)", "119,019.66", "148,208.84", "0.5692", "19.56%", "3rd"],
        ["Gradient Boosting Regressor", "140,707.46", "176,832.05", "0.3867", "17.87%", "4th"],
        ["Decision Tree Regressor", "224,210.80", "297,600.64", "-0.7371", "28.44%", "5th"]
    ]

    for c_idx, h in enumerate(headers):
        cell = t.cell(0, c_idx)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = ACCENT_NAVY
        p = cell.text_frame.paragraphs[0]
        p.font.bold = True
        p.font.size = Pt(10)
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = PP_ALIGN.CENTER

    for r_idx, row in enumerate(data):
        for c_idx, val in enumerate(row):
            cell = t.cell(r_idx + 1, c_idx)
            cell.text = val
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(236, 253, 245) if r_idx == 0 else (RGBColor(255, 255, 255) if r_idx % 2 == 1 else RGBColor(248, 250, 252))
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(9.5)
            p.font.color.rgb = ACCENT_GREEN if r_idx == 0 and c_idx in [0, 3, 4, 5] else TEXT_DARK
            p.font.bold = True if r_idx == 0 else False
            p.alignment = PP_ALIGN.CENTER if c_idx > 0 else PP_ALIGN.LEFT

    # Lower Commentary Card
    add_card(s15, Inches(0.8), Inches(4.8), Inches(11.733), Inches(2.0))
    tb_c = s15.shapes.add_textbox(Inches(1.0), Inches(4.95), Inches(11.333), Inches(1.7))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True

    p = tf_c.paragraphs[0]
    p.text = "MODEL EVALUATION & SELECTION RATIONALE"
    p.font.bold = True
    p.font.size = Pt(11.5)
    p.font.color.rgb = ACCENT_BLUE
    p.space_after = Pt(4)

    for itm in [
        "Selected Architecture: Random Forest Regressor achieved the lowest MAPE (14.32%), lowest MAE (105,570 passengers), and highest R² (0.6413).",
        "Why Decision Tree Failed: Single decision tree overfitted training splits, resulting in negative test R² (-0.7371) and 28.44% MAPE on unseen future data.",
        "Model Artifact: Best estimator was serialized and persisted to models/transport_demand_model.pkl (15.1 MB) with model_metadata.json.",
        "Accuracy Transparency: This is a realistic out-of-sample time-series evaluation, NOT an overfitted 100% claim."
    ]:
        p = tf_c.add_paragraph()
        p.text = "• " + itm
        p.font.size = Pt(9.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(2)

    # ==============================================================
    # SLIDE 16: Time-Series Validation & Leakage Prevention
    # ==============================================================
    s16 = prs.slides.add_slide(blank_layout)
    set_bg(s16, BG_LIGHT)
    add_header(s16, "Chronological Split & Data Leakage Prevention", "METHODOLOGICAL RIGOR")

    c_w = Inches(5.7)
    c_h = Inches(4.5)

    # Left: Data Leakage Risk
    add_card(s16, Inches(0.8), Inches(1.5), c_w, c_h)
    tb = s16.shapes.add_textbox(Inches(1.0), Inches(1.7), c_w - Inches(0.4), c_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "THE RISK OF FUTURE-DATA LEAKAGE"
    p.font.bold = True
    p.font.size = Pt(12.5)
    p.font.color.rgb = ACCENT_RED
    p.space_after = Pt(10)

    for itm in [
        "The Problem with Random K-Fold Splits: In urban time-series, passenger boardings exhibit strong temporal autocorrelation.",
        "Randomly shuffling data points leaks future observations into training sets, artificially inflating R² to near 0.99.",
        "When deployed on real future dates, models evaluated with random splits suffer catastrophic degradation.",
        "Essential Requirement: The model must be evaluated strictly on unseen future dates."
    ]:
        p = tf.add_paragraph()
        p.text = "• " + itm
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    # Right: Strict Chronological Split
    add_card(s16, Inches(6.8), Inches(1.5), c_w, c_h)
    tb = s16.shapes.add_textbox(Inches(7.0), Inches(1.7), c_w - Inches(0.4), c_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "STRICT TEMPORAL PARTITIONING"
    p.font.bold = True
    p.font.size = Pt(12.5)
    p.font.color.rgb = ACCENT_GREEN
    p.space_after = Pt(10)

    for itm in [
        "Total Usable Dataset: Exactly 9,282 daily observations (after initial 30-day lag window).",
        "Training Set (Past 80%): 7,425 daily samples used strictly for feature scaling and model training.",
        "Holdout Test Set (Future 20%): 1,857 daily samples representing the most recent unseen future period.",
        "Backward Feature Windowing: All lag (1, 2, 7, 14, 30 days) and rolling statistics (7d, 14d, 30d) use historical observations strictly preceding the target date."
    ]:
        p = tf.add_paragraph()
        p.text = "• " + itm
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    # Bottom Summary Badge
    add_badge(s16, Inches(0.8), Inches(6.2), Inches(11.733), Inches(0.55),
              "METHODOLOGICAL INTEGRITY: All reported metrics (R² = 0.6413, MAPE = 14.32%) are derived exclusively from the 1,857 unseen test observations.",
              CARD_BG_MUTED, TEXT_MUTED)

    # ==============================================================
    # SLIDE 17: Hyderabad Validation & Test Cases
    # ==============================================================
    s17 = prs.slides.add_slide(blank_layout)
    set_bg(s17, BG_LIGHT)
    add_header(s17, "Empirical Validation Across Hyderabad Corridors", "SYSTEM VERIFICATION")

    c_w = Inches(3.64)
    c_h = Inches(4.5)

    cases = [
        ("TEST CASE 1: HERITAGE CORRIDOR", "Charminar ➔ Afzalgunj", ACCENT_BLUE, [
            ("Straight-line Distance", "~1.51 km"),
            ("Direct Routes Discovered", "14 Lines (242 Trips)"),
            ("Selected Best Route", "Route 9X/272G"),
            ("Scheduled Run Time", "27 mins (5 stops)"),
            ("Expected Traffic Delay", "+3 mins (Moderate Traffic)"),
            ("Total Estimated Time", "30 mins"),
            ("Predicted Crowd Level", "Moderate (Partial Seats)"),
            ("Alternative Options", "9K/272G, 9M/X, 9Y/F, 9X, 2C")
        ]),
        ("TEST CASE 2: CROSS-CITY ARTERIAL", "Secunderabad ➔ Mehdipatnam", ACCENT_TEAL, [
            ("Straight-line Distance", "~12.4 km"),
            ("Direct Routes Discovered", "54 Direct Route Lines"),
            ("Selected Best Route", "Route 92R"),
            ("Scheduled Run Time", "48 mins (26 stops)"),
            ("Expected Traffic Delay", "+5 mins (Standard Traffic)"),
            ("Total Estimated Time", "53 mins"),
            ("Predicted Crowd Level", "Moderate (Partial Seats)"),
            ("Alternative Options", "5K, 49M, 5M, 113M, 187")
        ]),
        ("TEST CASE 3: COMMERCIAL CORRIDOR", "Ameerpet ➔ Dilsukhnagar", ACCENT_PURPLE, [
            ("Straight-line Distance", "~14.8 km"),
            ("Direct Routes Discovered", "38 Direct Route Lines"),
            ("Selected Best Route", "Route 10H / 218"),
            ("Scheduled Run Time", "50 mins (22 stops)"),
            ("Expected Traffic Delay", "+8 mins (Heavy Peak Traffic)"),
            ("Total Estimated Time", "58 mins"),
            ("Predicted Crowd Level", "High Crowd (Standing Only)"),
            ("Alternative Options", "218D, 10K, 222, 10Y")
        ])
    ]

    for idx, (title, sub, color, metrics) in enumerate(cases):
        left = Inches(0.8 + idx * 4.04)
        add_card(s17, left, Inches(1.5), c_w, c_h)
        tb = s17.shapes.add_textbox(left + Inches(0.2), Inches(1.7), c_w - Inches(0.4), c_h - Inches(0.4))
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
        p_s.font.size = Pt(12.5)
        p_s.font.color.rgb = TEXT_DARK
        p_s.space_after = Pt(8)

        for k, v in metrics:
            p_k = tf.add_paragraph()
            p_k.text = f"{k}:"
            p_k.font.bold = True
            p_k.font.size = Pt(9.5)
            p_k.font.color.rgb = TEXT_MUTED

            p_v = tf.add_paragraph()
            p_v.text = f"  {v}"
            p_v.font.size = Pt(10)
            p_v.font.color.rgb = TEXT_DARK
            p_v.space_after = Pt(3)

    # Verification Note
    add_badge(s17, Inches(0.8), Inches(6.2), Inches(11.733), Inches(0.55),
              "VERIFICATION STATUS: Executed directly against the local MySQL 8.4 database running on TGSRTC GTFS feeds. Validates route query functionality.",
              CARD_BG_MUTED, TEXT_MUTED)

    # ==============================================================
    # SLIDE 18: Other Modules: Traffic, AQI & Weather
    # ==============================================================
    s18 = prs.slides.add_slide(blank_layout)
    set_bg(s18, BG_LIGHT)
    add_header(s18, "Traffic, Air Quality & Weather Modules: Status Breakdown", "MULTI-DOMAIN SCOPE")

    col_w = Inches(3.64)
    col_h = Inches(4.5)

    other_mods = [
        ("TRAFFIC CONGESTION", ACCENT_AMBER, "UNDER DEVELOPMENT", ACCENT_AMBER, [
            ("Objective", "Quantify corridor congestion and dynamic travel speeds."),
            ("Formulation", "Volume-to-Capacity (V/C) ratio along arterial segments."),
            ("Speed Tiers", "Free Flow (>40 km/h), Moderate (20-40), Severe Congestion (<15 km/h)."),
            ("Transit Link", "Feed dynamic segment speeds into transit delay calculations to replace heuristic multipliers."),
            ("Repo Status", "ml/traffic/ directory created; model training under development.")
        ]),
        ("AIR QUALITY (AQI)", ACCENT_TEAL, "PLANNED / ARCHITECTURE", ACCENT_PURPLE, [
            ("Objective", "Monitor urban environmental pollution exposure."),
            ("Pollutants", "Ingest PM2.5, PM10, Carbon Monoxide (CO), and Nitrogen Dioxide (NO2)."),
            ("Standard", "Central Pollution Control Board (CPCB) sub-index calculation."),
            ("Categories", "Good (0-50) to Severe / Hazardous (301+)."),
            ("Repo Status", "ml/air_quality/ directory structured; sensor ingestion pipeline planned.")
        ]),
        ("WEATHER ANALYTICS", ACCENT_NAVY, "PLANNED / ARCHITECTURE", ACCENT_PURPLE, [
            ("Objective", "Analyze meteorological impacts on urban mobility."),
            ("Parameters", "Rainfall precipitation, ambient temperature, relative humidity."),
            ("Analytical Aim", "Evaluate transit delay correlations during monsoon downpours."),
            ("Decision Goal", "Early flood and road friction advisory for transit planners."),
            ("Repo Status", "ml/weather/ directory structured; data ingestion planned.")
        ])
    ]

    for idx, (title, color, badge_txt, badge_col, details) in enumerate(other_mods):
        left = Inches(0.8 + idx * 4.04)
        add_card(s18, left, Inches(1.5), col_w, col_h)
        add_badge(s18, left + Inches(0.15), Inches(1.65), col_w - Inches(0.3), Inches(0.32), badge_txt, badge_col)

        tb = s18.shapes.add_textbox(left + Inches(0.15), Inches(2.1), col_w - Inches(0.3), col_h - Inches(0.7))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = color
        p.space_after = Pt(8)

        for k, v in details:
            p_k = tf.add_paragraph()
            p_k.text = f"{k}: "
            p_k.font.bold = True
            p_k.font.size = Pt(9.5)
            p_k.font.color.rgb = TEXT_DARK
            p_v = tf.add_paragraph()
            p_v.text = f"  {v}"
            p_v.font.size = Pt(9)
            p_v.font.color.rgb = TEXT_MUTED
            p_v.space_after = Pt(3)

    # Note
    add_badge(s18, Inches(0.8), Inches(6.2), Inches(11.733), Inches(0.55),
              "TRANSPARENT REPOSITORY STATUS: The project codebase contains verified transport and GTFS modules; traffic, AQI, and weather models are in active architecture & design phases.",
              CARD_BG_MUTED, TEXT_MUTED)

    # ==============================================================
    # SLIDE 19: Dashboard & User Interface Architecture
    # ==============================================================
    s19 = prs.slides.add_slide(blank_layout)
    set_bg(s19, BG_LIGHT)
    add_header(s19, "Proposed Dashboard & User Interaction Architecture", "APPLICATION TIER DESIGN")

    # Status Callout
    add_badge(s19, Inches(0.8), Inches(1.35), Inches(11.733), Inches(0.35),
              "ARCHITECTURE STATUS: Backend (Node.js/Express) and Frontend (React.js) directory skeletons exist in repository; UI implementation is currently in progress.",
              CARD_BG_MUTED, TEXT_MUTED)

    col_w = Inches(3.64)
    col_h = Inches(4.7)

    portals = [
        ("CITIZEN COMMUTER PORTAL", ACCENT_BLUE, [
            "Point-to-Point Trip Planning: Search origin and destination stops across Greater Hyderabad.",
            "Dynamic Travel Times: View scheduled run times alongside estimated traffic delays.",
            "Crowding Visibility: Advance badge indicators (Low, Moderate, High Crowd) for upcoming buses.",
            "Nearby Stop Locator: Find bus stops within walking distance via GPS coordinates."
        ]),
        ("DEPARTMENTAL OFFICER PORTAL", ACCENT_TEAL, [
            "Transit Operations View: Monitor route-level passenger demand trends and bus bunching.",
            "Traffic Police View: Live corridor congestion speeds and bottleneck alerts.",
            "Environmental Officer View: Zone-wise CPCB air quality sub-indices and threshold breaches.",
            "Field Dispatch Support: Actionable warnings for high-friction intersections."
        ]),
        ("CITY ADMINISTRATOR PORTAL", ACCENT_NAVY, [
            "Macro Urban Indicators: Unified high-level mobility health, ridership volume, and city AQI.",
            "System Audit & Logs: Commuter search query distribution from user_trip_searches table.",
            "Role-Based Access Control: Granular permissions for municipal operators.",
            "Cross-Domain Incident Center: Integrated view of weather, traffic, and transit alerts."
        ])
    ]

    for idx, (title, color, items) in enumerate(portals):
        left = Inches(0.8 + idx * 4.04)
        add_card(s19, left, Inches(1.85), col_w, col_h)
        tb = s19.shapes.add_textbox(left + Inches(0.15), Inches(2.0), col_w - Inches(0.3), col_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = color
        p.space_after = Pt(10)

        for itm in items:
            p = tf.add_paragraph()
            p.text = "• " + itm
            p.font.size = Pt(10)
            p.font.color.rgb = TEXT_DARK
            p.space_after = Pt(8)

    # ==============================================================
    # SLIDE 20: Performance & Technical Validation
    # ==============================================================
    s20 = prs.slides.add_slide(blank_layout)
    set_bg(s20, BG_LIGHT)
    add_header(s20, "Measured Performance, Latencies & Technical Validation", "TECHNICAL BENCHMARKS")

    # 4 Metric Cards
    m_w = Inches(2.7)
    m_h = Inches(2.3)

    metrics = [
        ("< 180 ms", "SQL Query Latency", "Origin-to-destination self-join query execution across 1.13M timetable rows in MySQL 8.4.", ACCENT_BLUE),
        ("< 15 ms", "GPS Spatial Search", "Haversine distance calculation for nearby bus stop discovery within a 1.0 km radius.", ACCENT_TEAL),
        ("14.32%", "MAPE Demand Error", "Mean Absolute Percentage Error achieved by the Random Forest model on unseen test data.", ACCENT_GREEN),
        ("83x Speedup", "Indexing Efficiency", "Indexed composite queries (142–178 ms) vs unindexed table scan (~14.8 seconds).", ACCENT_PURPLE)
    ]

    for idx, (val, title, desc, color) in enumerate(metrics):
        left = Inches(0.8 + idx * 2.95)
        add_card(s20, left, Inches(1.5), m_w, m_h)
        tb = s20.shapes.add_textbox(left + Inches(0.15), Inches(1.65), m_w - Inches(0.3), m_h - Inches(0.3))
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

    # Lower Technical Card
    add_card(s20, Inches(0.8), Inches(4.1), Inches(11.733), Inches(2.6))
    tb_t = s20.shapes.add_textbox(Inches(1.0), Inches(4.25), Inches(11.333), Inches(2.3))
    tf_t = tb_t.text_frame
    tf_t.word_wrap = True

    p = tf_t.paragraphs[0]
    p.text = "DATABASE INDEXING & THROUGHPUT BENCHMARKS"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = ACCENT_NAVY
    p.space_after = Pt(6)

    for itm in [
        "Unindexed Baseline: A naive SQL self-join on 1.13 million unindexed stop time records required ~14.8 seconds per query.",
        "Indexed Optimization: Creating composite B-tree indexes on (stop_id, trip_id) and (trip_id, stop_sequence) reduced latency to 142–178 ms.",
        "Throughput Capability: Direct connection pooling via PyMySQL achieves 60+ concurrent routing queries per second on commodity hardware.",
        "Reproducibility Note: Benchmarks measured directly on local MySQL 8.4 Server instance under batch query stress tests."
    ]:
        p = tf_t.add_paragraph()
        p.text = "• " + itm
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(4)

    # ==============================================================
    # SLIDE 21: Engineering Challenges & Solutions
    # ==============================================================
    s21 = prs.slides.add_slide(blank_layout)
    set_bg(s21, BG_LIGHT)
    add_header(s21, "Key Technical Challenges & Engineering Solutions", "PROBLEM-SOLVING")

    ch_w = Inches(11.733)
    ch_h = Inches(1.15)

    challenges = [
        ("CHALLENGE 1: MULTI-PLATFORM BUS STOP DISCREPANCIES", ACCENT_BLUE,
         "Problem: Stations in Hyderabad (e.g. Afzalgunj) possess multiple stop IDs for opposite street sides or bays. Searching by single ID returned 0 routes.",
         "Solution: Engineered resolve_stop_cluster() which groups matching stop IDs and queries across the entire cluster using SQL IN (...) set inclusion."),

        ("CHALLENGE 2: MASSIVE GTFS TIMETABLE SCALE (1.13M ROWS)", ACCENT_TEAL,
         "Problem: Loading and joining 1,132,807 stop time records caused high memory usage and 14+ second query latency in unindexed relational tables.",
         "Solution: Applied composite B-tree indexes on (stop_id, trip_id) and (trip_id, stop_sequence); implemented batch ingestion of 50,000 rows/batch."),

        ("CHALLENGE 3: PAST-MIDNIGHT GTFS SERVICE TIMES (>= 24:00:00)", ACCENT_AMBER,
         "Problem: GTFS timetable feeds represent next-day continuing service using timestamps like 25:03:00, causing SQL TIME parser exceptions.",
         "Solution: Implemented format_gtfs_time() with modulo-24 arithmetic to cleanly convert 25:03:00 into 01:03:00 (+1 day) for commuters."),

        ("CHALLENGE 4: TEMPORAL DATA LEAKAGE IN DEMAND FORECASTING", ACCENT_PURPLE,
         "Problem: Random train/test shuffling leaks future ridership trends into training sets, producing misleadingly inflated model accuracy.",
         "Solution: Implemented strict 80/20 chronological time-aware partitioning with rolling window and lag features calculated only from past dates.")
    ]

    for idx, (title, col, prob, sol) in enumerate(challenges):
        top = Inches(1.5 + idx * 1.35)
        add_card(s21, Inches(0.8), top, ch_w, ch_h)

        tag = s21.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), top, Inches(0.12), ch_h)
        tag.fill.solid()
        tag.fill.fore_color.rgb = col
        tag.line.fill.background()

        tb = s21.shapes.add_textbox(Inches(1.1), top + Inches(0.1), ch_w - Inches(0.4), ch_h - Inches(0.2))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = col
        p.space_after = Pt(2)

        p_p = tf.add_paragraph()
        p_p.text = "• " + prob
        p_p.font.size = Pt(9.5)
        p_p.font.color.rgb = TEXT_DARK

        p_s = tf.add_paragraph()
        p_s.text = "• " + sol
        p_s.font.size = Pt(9.5)
        p_s.font.color.rgb = TEXT_MUTED

    # ==============================================================
    # SLIDE 22: Current Implementation Status Summary
    # ==============================================================
    s22 = prs.slides.add_slide(blank_layout)
    set_bg(s22, BG_LIGHT)
    add_header(s22, "Current Implementation Status: Completed vs. Roadmap", "PROJECT ACCOUNTABILITY")

    c_w = Inches(5.7)
    c_h = Inches(5.2)

    # Completed Card
    add_card(s22, Inches(0.8), Inches(1.5), c_w, c_h)
    tb = s22.shapes.add_textbox(Inches(1.0), Inches(1.7), c_w - Inches(0.4), c_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "COMPLETED & FUNCTIONAL (PHASE 1)"
    p.font.bold = True
    p.font.size = Pt(12.5)
    p.font.color.rgb = ACCENT_GREEN
    p.space_after = Pt(10)

    completed_items = [
        "MySQL 8.4 Relational Database (smart_city_db) fully deployed.",
        "Full GTFS Ingestion: 5,028 bus stops, 1,031 routes, 44,892 trips, 1,132,807 timetable rows.",
        "Composite B-tree indexing enabling sub-180ms SQL joins.",
        "Stop Clustering Algorithm (resolve_stop_cluster) resolving multi-platform bus stations.",
        "Origin-to-Destination shortest path SQL routing engine.",
        "Heuristic dynamic traffic delay & crowd tier estimation.",
        "Transit Demand ML Pipeline: 22 engineered features, chronological 80/20 train/test split.",
        "Random Forest Regressor trained and saved (R² = 0.6413, MAPE = 14.32%).",
        "Corridor validation across Greater Hyderabad (Charminar, Secunderabad, Ameerpet)."
    ]
    for itm in completed_items:
        p = tf.add_paragraph()
        p.text = "[DONE] " + itm
        p.font.size = Pt(9.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(4)

    # Roadmap Card
    add_card(s22, Inches(6.8), Inches(1.5), c_w, c_h)
    tb = s22.shapes.add_textbox(Inches(7.0), Inches(1.7), c_w - Inches(0.4), c_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "UNDER DEVELOPMENT & ROADMAP (PHASE 2)"
    p.font.bold = True
    p.font.size = Pt(12.5)
    p.font.color.rgb = ACCENT_BLUE
    p.space_after = Pt(10)

    roadmap_items = [
        "Express REST APIs: Implement /api/transport, /api/traffic, and /api/environment endpoints.",
        "React.js Interactive Dashboard: Connect frontend Leaflet maps to MySQL transit routes.",
        "Traffic Congestion Model: Machine learning model for road segment speeds to replace heuristic delay multipliers.",
        "Air Quality Ingestion: CPCB PM2.5/PM10 calculation & threshold alert notification engine.",
        "Weather Analytics: Meteorological telemetry correlation with transit delay spikes.",
        "Multi-Leg Transit Transfer: Expand routing engine to support 1-transfer transit paths.",
        "Progressive Web App (PWA): Mobile packaging for commuter field testing.",
        "End-to-End System Integration: Final defense demo and documentation."
    ]
    for itm in roadmap_items:
        p = tf.add_paragraph()
        p.text = "[ROADMAP] " + itm
        p.font.size = Pt(9.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(4)

    # ==============================================================
    # SLIDE 23: Future Cross-Domain AI Decision Support
    # ==============================================================
    s23 = prs.slides.add_slide(blank_layout)
    set_bg(s23, BG_LIGHT)
    add_header(s23, "Vision: Future Multi-Domain AI Decision Support", "LONG-TERM ENHANCEMENTS")

    # Disclaimer Callout
    add_badge(s23, Inches(0.8), Inches(1.35), Inches(11.733), Inches(0.35),
              "CONCEPTUAL ENHANCEMENT: The following represents the advanced multi-domain architecture planned for the complete platform.",
              CARD_BG_MUTED, TEXT_MUTED)

    # 4 Pillar Vision Cards
    c_w = Inches(2.7)
    c_h = Inches(4.7)

    vision_cards = [
        ("CROSS-DOMAIN FUSION", ACCENT_BLUE, [
            "Fusing transit ridership, traffic congestion heatmaps, AQI readings, and weather forecasts.",
            "Understanding inter-domain causality (e.g. how torrential rains trigger transit delays and pollution spikes).",
            "Unified urban feature matrix for multi-task predictive learning."
        ]),
        ("PROACTIVE TRANSIT FLEET DISPATCH", ACCENT_TEAL, [
            "Dynamically recommending bus frequency adjustments 2 hours before peak commuter crowding peaks.",
            "Automated bus rerouting around severe road blockages or waterlogged intersections.",
            "Reducing bus bunching and improving schedule adherence."
        ]),
        ("HEALTH-AWARE COMMUTER ROUTING", ACCENT_PURPLE, [
            "Recommending transit options with lower air pollution exposure for pedestrians and cyclists.",
            "Triggering localized health advisories when PM2.5 exceeds 120 ug/m3 in school or hospital zones.",
            "Balancing travel speed against environmental health."
        ]),
        ("MUNICIPAL DECISION COCKPIT", ACCENT_AMBER, [
            "Real-time decision recommendations for city administrators.",
            "Simulating impact of road closures, public events, or transit fare adjustments.",
            "Evidence-based capital allocation for urban transit infrastructure."
        ])
    ]

    for idx, (title, color, items) in enumerate(vision_cards):
        left = Inches(0.8 + idx * 2.95)
        add_card(s23, left, Inches(1.85), c_w, c_h)
        tb = s23.shapes.add_textbox(left + Inches(0.15), Inches(2.0), c_w - Inches(0.3), c_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = color
        p.space_after = Pt(8)

        for itm in items:
            p = tf.add_paragraph()
            p.text = "• " + itm
            p.font.size = Pt(9.5)
            p.font.color.rgb = TEXT_DARK
            p.space_after = Pt(6)

    # ==============================================================
    # SLIDE 24: Societal Value & Government-Oriented Impact
    # ==============================================================
    s24 = prs.slides.add_slide(blank_layout)
    set_bg(s24, BG_LIGHT)
    add_header(s24, "Intended Public Governance & Societal Impact", "VALUE & IMPACT")

    # Disclaimer Callout
    add_badge(s24, Inches(0.8), Inches(1.35), Inches(11.733), Inches(0.35),
              "PROOF-OF-CONCEPT VALUE: The platform is designed as a government-oriented decision-support proof of concept, demonstrating how open municipal data can be operationalized.",
              CARD_BG_MUTED, TEXT_MUTED)

    col_w = Inches(3.64)
    col_h = Inches(4.7)

    impact_pillars = [
        ("EMPOWERING COMMUTERS", ACCENT_BLUE, [
            "Reduced Commute Friction: Advance awareness of traffic delays and crowd levels reduces commuter anxiety.",
            "Informed Modal Choice: Enables commuters to choose faster or more comfortable bus lines.",
            "Equitable Public Transit: Empowers citizens who rely on public buses with modern transit intelligence.",
            "Health Protection: Alerts commuters to localized air pollution surges."
        ]),
        ("TRANSIT OPERATOR EFFICIENCY", ACCENT_TEAL, [
            "Empirical Demand Forecasting: Transitions bus scheduling from rigid timetables to predictive demand planning.",
            "Resource Optimization: Helps transit agencies reduce empty bus runs during off-peak hours.",
            "Corridor Bottleneck Visibility: Pinpoints high-delay corridors requiring dedicated bus lanes.",
            "Increased Transit Ridership: Predictability encourages more citizens to adopt public transit."
        ]),
        ("DATA-DRIVEN GOVERNANCE", ACCENT_AMBER, [
            "Breaking Agency Silos: Provides municipal leadership with cross-departmental situational awareness.",
            "Proactive Urban Interventions: Facilitates interventions before traffic gridlock or pollution crises peak.",
            "Open Data Utilization: Demonstrates the practical return on public open data initiatives (e.g. TGSRTC GTFS).",
            "Scalable Blueprint: Establishes a replicable architecture for other Indian metropolitan cities."
        ])
    ]

    for idx, (title, color, items) in enumerate(impact_pillars):
        left = Inches(0.8 + idx * 4.04)
        add_card(s24, left, Inches(1.85), col_w, col_h)
        tb = s24.shapes.add_textbox(left + Inches(0.15), Inches(2.0), col_w - Inches(0.3), col_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = color
        p.space_after = Pt(10)

        for itm in items:
            p = tf.add_paragraph()
            p.text = "• " + itm
            p.font.size = Pt(10)
            p.font.color.rgb = TEXT_DARK
            p.space_after = Pt(8)

    # ==============================================================
    # SLIDE 25: Team Contributions & Conclusion / Q&A
    # ==============================================================
    s25 = prs.slides.add_slide(blank_layout)
    set_bg(s25, BG_DARK)
    add_header(s25, "Team Contributions, Summary & Review Discussion", "PROJECT DEFENSE", dark_mode=True)

    # 4 Team Member Contribution Cards
    m_w = Inches(2.7)
    m_h = Inches(3.6)

    team_contributions = [
        ("MOHAMMED MUZAMMIL PASHA", ACCENT_BLUE, [
            "TGSRTC GTFS ingestion into MySQL 8.4.",
            "Engineered Stop Clustering algorithm (resolve_stop_cluster).",
            "Built Origin-to-Destination SQL routing engine.",
            "Implemented heuristic traffic delays & crowd tier logic.",
            "Trained & benchmarked Random Forest transit demand model."
        ]),
        ("LASKAR VARSHINI REDDY", ACCENT_CYAN, [
            "Designed 5-layer overall system architecture and DFDs.",
            "Formulated centralized operations dashboard specifications.",
            "Coordinated inter-module API schemas and data structures.",
            "Authored project mid-term report and documentation.",
            "Defined role-based access control architecture."
        ]),
        ("NAVKAR GELDA JAIN", ACCENT_AMBER, [
            "Engineered traffic sensor data ingestion framework.",
            "Calculated Volume-to-Capacity (V/C) ratios for road segments.",
            "Formulated real-time corridor congestion speed tiers.",
            "Designed traffic bottleneck alerting thresholds.",
            "Planned traffic telemetry integration with transit delays."
        ]),
        ("MOHITH MADARAPU", ACCENT_PURPLE, [
            "Structured air quality sensor telemetry pipeline.",
            "Applied Central Pollution Control Board (CPCB) AQI standards.",
            "Calculated sub-indices for PM2.5, PM10, CO, and NO2.",
            "Formulated environmental threshold alerting framework.",
            "Integrated weather telemetry correlation architecture."
        ])
    ]

    for idx, (name, color, tasks) in enumerate(team_contributions):
        left = Inches(0.8 + idx * 2.95)
        add_card(s25, left, Inches(1.5), m_w, m_h, bg_color=ACCENT_NAVY, border_color=RGBColor(51, 65, 85))
        tb = s25.shapes.add_textbox(left + Inches(0.12), Inches(1.65), m_w - Inches(0.24), m_h - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p_n = tf.paragraphs[0]
        p_n.text = name
        p_n.font.size = Pt(10)
        p_n.font.bold = True
        p_n.font.color.rgb = color
        p_n.space_after = Pt(6)

        for t in tasks:
            p_t = tf.add_paragraph()
            p_t.text = "• " + t
            p_t.font.size = Pt(8.5)
            p_t.font.color.rgb = RGBColor(226, 232, 240)
            p_t.space_after = Pt(3)

    # Q&A / Conclusion Box at bottom
    add_card(s25, Inches(0.8), Inches(5.3), Inches(11.733), Inches(1.7), bg_color=RGBColor(2, 6, 23), border_color=ACCENT_BLUE)
    tb_q = s25.shapes.add_textbox(Inches(1.0), Inches(5.4), Inches(11.333), Inches(1.5))
    tf_q = tb_q.text_frame
    tf_q.word_wrap = True

    p0 = tf_q.paragraphs[0]
    p0.text = "THANK YOU  |  QUESTIONS & DISCUSSION"
    p0.font.size = Pt(22)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(255, 255, 255)
    p0.alignment = PP_ALIGN.CENTER
    p0.space_after = Pt(4)

    p1 = tf_q.add_paragraph()
    p1.text = "From Heterogeneous Urban Data  ➔  Relational Storage  ➔  Machine Learning  ➔  Predictive Decision Support"
    p1.font.size = Pt(12)
    p1.font.bold = True
    p1.font.color.rgb = ACCENT_CYAN
    p1.alignment = PP_ALIGN.CENTER
    p1.space_after = Pt(4)

    p2 = tf_q.add_paragraph()
    p2.text = "Mohammed Muzammil Pasha  |  Laskar Varshini Reddy  |  Navkar Gelda Jain  |  Mohith Madarapu"
    p2.font.size = Pt(11)
    p2.font.color.rgb = RGBColor(203, 213, 225)
    p2.alignment = PP_ALIGN.CENTER

    prs.save(output_path)
    print(f"Final presentation created successfully at: {output_path}")

if __name__ == "__main__":
    out1 = "C:/Users/dell/Desktop/Smart_City_Final_Project_Presentation.pptx"
    create_deck(out1)

    out2 = "C:/Users/dell/Desktop/SMART CITIES.pptx"
    create_deck(out2)
