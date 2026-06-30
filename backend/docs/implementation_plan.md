# Implementation Plan - Dynamic Well-Specific Charts & Metrics

This plan details how we will ensure that the Results Dashboard displays actual training evaluation charts and metrics matching the specific wells selected by the user.

## User Review Required

> [!IMPORTANT]
> * **All Selected Wells Plots**: The pipeline orchestrator `main.py` will be updated to generate depth profile plots for *each* well that was included in the training dataset, rather than only the first well.
> * **Interactive Well Selector**: The frontend `ResultsDashboard.jsx` will detect all generated well depth profile plots and display a dropdown menu next to the "Actual vs Predicted Depth Profile" chart title, allowing users to switch the plot dynamically to any well used in training.

## Proposed Changes

---

### [ML Pipeline Orchestrator]

#### [MODIFY] [main.py](file:///D:/ag+cd/ROP_Optimizer%20working/ROP_Optimizer/main.py)
* Loop through all unique wells present in `df_feat["WELL_NAME"]` to generate a separate depth profile plot (`outputs/depth_profile_{well_name}.png`) for each well, rather than just the first well.

---

### [Vite React Frontend]

#### [MODIFY] [ResultsDashboard.jsx](file:///C:/Users/user/rop-optimizer-ui/src/pages/ResultsDashboard.jsx)
* **Depth Profile Dropdown**:
  * Parse all generated files from the backend static output listing starting with `depth_profile_` and extract the well names (e.g. `depth_profile_Camel1.png` -> `Camel1`).
  * Render a styled select/dropdown element inside the "Actual vs Predicted Depth Profile" panel.
  * When a different well is selected in the dropdown, dynamically update the image source to display the corresponding well's actual depth profile plot.

---

## Verification Plan

### Automated Verification
* Run the backend and UI dev servers.
* Save configuration selecting multiple wells (e.g. `Camel1` and `Camel1_OldGeo`), trigger the pipeline, and verify that depth profile charts are generated for both.

### Manual Verification
* Access the Results Dashboard, toggle the new well selector dropdown, and verify that the plots switch cleanly on the screen.
