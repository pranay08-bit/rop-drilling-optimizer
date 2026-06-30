# ROP Optimizer Pipeline

This project is a machine learning pipeline designed to predict and optimize the Rate of Penetration (ROP) during drilling operations. It uses a LightGBM regressor with strict physics-based constraints to find optimal parameters (Weight on Bit, RPM, Torque, Flow Rate, Pressure) without violating mechanical safety limits.

## Project Structure
* `main.py` - The central orchestrator that runs the entire pipeline.
* `config.yaml` - The configuration file controlling models, data files, optimization limits, and safety penalties.
* `src/` - The core logic modules (cleaning, features, model training, evaluation, optimization, and safety).
* `data/` - **(Action Required)** The folder where your raw well CSV files must be placed.
* `outputs/` - The folder where all generated charts, logs, and Excel reports are saved.
* `models/` - The folder where the trained AI models are exported.

## How to Run the Pipeline

### 1. Prepare Your Data
You must create a `data` folder inside this project directory and place your raw CSV files there. Make sure the file names match what is written in your `config.yaml` file (e.g., `Camel1_2016_Cleaned.csv`).

### 2. Install Dependencies
You will need Python installed on your computer. Open a terminal or command prompt inside this folder and run the following command to install all the necessary libraries:
```bash
pip install -r requirements.txt
```

### 3. Run the Orchestrator
To execute the pipeline, simply run the main Python script:
```bash
python main.py
```

### 4. View Results
Once the script finishes running, it will automatically create an `outputs` folder. Inside you will find:
* `ROP_Optimizer_Report.xlsx`: A full spreadsheet containing all the performance metrics (KPIs) and optimized parameters.
* Various `.png` charts showing Feature Importance, Depth Profiles, and Actual vs Predicted comparisons.
* `run.log`: A text log of everything the system did.
