# 20-Week Internship Presentation Structure
## Project: Real-Time ROP Drilling Optimizer

This document provides a professional 10-slide presentation structure detailing your work, technical achievements, and methodology over your 20-week internship.

---

### Slide 1: Title & Introduction
* **Header**: Real-Time ROP Drilling Optimizer: Data-Driven Machine Learning & Parameter Optimization
* **Sub-items**: 
  * Your Name, Internship Role, and Department
  * Institution Name & Host Company Logo
  * Supervisors: [Company Supervisor Name] & [Academic Advisor Name]
  * Date of Presentation

---

### Slide 2: Executive Summary & Project Objectives
* **Objective**: Introduce the business problem and the engineering solution in 30 seconds.
* **Key Content**:
  * **The Problem**: Offshore/deep drilling costs exceed $150k+/day. Even a 5% improvement in Rate of Penetration (ROP) saves tens of thousands of dollars per well.
  * **The Solution**: An end-to-end desktop software solution that trains a machine learning model on historical well log datasets, checks operational equipment constraints, and uses mathematical optimization to recommend optimal setpoints.
  * **Impact**: Live simulation achieves substantial ROP improvements while guaranteeing physical safety margins.

---

### Slide 3: Problem Definition & Data Source (Weeks 1 - 5)
* **Objective**: Explain the physics of drilling and the raw log datasets.
* **Key Content**:
  * **Physics of ROP**: ROP is a complex, non-linear function of geological rock strength, Weight on Bit (WOB), rotational speed (RPM), and hydraulic cleaning flow.
  * **The Dataset**: Historical multi-well logs (e.g. Camel1, ETECH_Offshore) containing high-frequency measurements (Depth, SWOB, RPM, Torque, Pump Pressure, Rig State).
  * **Challenge**: Data from different wells are inconsistent—different headers (e.g. `ROPAvg` vs `ROP`), missing rows, and raw sensor outliers.

---

### Slide 4: Data Ingestion & Sanitization Pipeline (Weeks 6 - 8)
* **Objective**: Explain how you cleaned and preprocessed the raw CSV data.
* **Key Content**:
  * **Schema Unification**: Developed an intelligent column mapper that maps alternative casings and abbreviations (e.g., `WOB` -> `SWOB`) case-insensitively.
  * **Data Cleaning Stages**:
    * Removing null/incomplete logs.
    * Filtering non-drilling states (RIG_STATE filtering).
    * Statistical outlier removal using the IQR (Interquartile Range) method.
    * **Rolling Smoothing**: Applied sliding window averages to remove measurement noise.

---

### Slide 5: Physics-Informed ML Modeling (Weeks 9 - 12)
* **Objective**: Detail the training of the ROP predictive model.
* **Key Content**:
  * **Physics Feature Engineering**: Calculated **Mechanical Specific Energy (MSE)**—the energy required to excavate a unit volume of rock:
    $$\text{MSE} = \frac{\text{WOB}}{\text{Bit Area}} + \frac{2\pi \times \text{RPM} \times \text{Torque}}{\text{ROP} \times \text{Bit Area}}$$
  * **Algorithm**: Gradient Boosted Trees (XGBoost Regressor) trained with log-transformed target variables (to guarantee non-negative predictions).
  * **Live Model Metrics**: High-accuracy results on test sets ($R^2$ Score of **`0.998`**, MAE **`1.4` ft/hr**).

---

### Slide 6: Safe Parameter Optimization Engine (Weeks 13 - 15)
* **Objective**: Explain how you calculate the best parameters.
* **Key Content**:
  * **Differential Evolution (DE)**: A global, metaheuristic optimization algorithm that searches for WOB, RPM, and circulation flow configurations that maximize expected ROP.
  * **Rig Safety Envelope (Constraints)**:
    * Preventing motor stall (checking torque vs RPM).
    * Preventing standpipe pressure rupture (`sppa` caps).
    * Ensuring minimum flow rate for hole cleaning (`circ` floor).
  * **Penalty Functions**: Applied penalization in the loss function to guide the optimizer away from unsafe configurations.

---

### Slide 7: UI Design System & Frontend Development (Weeks 16 - 18)
* **Objective**: Showcase the Vite React frontend and Figma dark mode style integration.
* **Key Content**:
  * **Design Principles**: Sleek dark-mode aesthetic utilizing rich borders, curated harmonized palettes (like Outfit & Inter fonts), hover indicators, and micro-animations.
  * **Key Views Developed**:
    * **Wells Selection tab**: Interactive checkboxes, search bar, and CSV upload zone.
    * **Formation Tops tab**: Dynamic lists, active layer checkboxes, and custom popups.
    * **Analysis Limits tab**: Operational parameter cards with live Min/Max validation (displays warning state in red `#E24B4A`).

---

### Slide 8: Results & Dynamic Visualizations (Weeks 19)
* **Objective**: Show the live dashboard and output charts.
* **Key Content**:
  * **Dynamic KPIs**: Direct linkage of live pipeline performance metrics ($R^2$, RMSE, MAE) to dashboard cards.
  * **Interactive Well Selector**: Added a custom dropdown allowing users to select and display the depth profile plot (`actual vs predicted`) for any well in the training run.
  * **Automatic Cache-Busting**: Implemented timestamp query queries to guarantee charts update on screen immediately after running the pipeline.

---

### Slide 9: Internship Timeline & Milestone Achievements
* **Objective**: Highlight your productivity and achievements over the 20 weeks.
* **Timeline Table**:
  | Weeks | Phase | Main Milestone Achieved |
  | --- | --- | --- |
  | **Weeks 1-4** | Research & Setup | Literature review of ROP modeling; raw dataset analysis. |
  | **Weeks 5-8** | Ingestion & Cleaning | Developed backend API and robust column mapping; cleaned log data. |
  | **Weeks 9-12** | ML Modeling | Engineered physics features (MSE); trained and evaluated XGBoost model. |
  | **Weeks 13-15** | Optimization Engine | Integrated Differential Evolution solver and safety penalty margins. |
  | **Weeks 16-19** | React UI Integration | Developed Figma-inspired tabs, bounds validation, and Results Dashboard. |
  | **Week 20** | Verification & Report | Finalized excel reports, verified end-to-end user flows, and compiled docs. |

---

### Slide 10: Technical Learnings, Conclusion & Future Work
* **Technical Skills Gained**: React (JSX/State/Effects), FastAPI (Python APIs), XGBoost, Scipy Optimization, Docker containerization.
* **Key Takeaway**: Bridging the gap between data science and physical engineering constraints creates practical tools that field operators trust.
* **Future Work**:
  * Implementing live WebSocket streaming to simulate real-time drilling log updates.
  * Storing uploaded files in AWS S3 / Google Cloud Storage for global deployment.
