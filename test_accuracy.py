import os
import sys
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))
from features import build_feature_matrix, run_feature_pipeline
from model import load_model, predict_rop
from clean import run_cleaning_pipeline
from ingest import load_config, load_well

def test_random_50(csv_path=r"d:\VrajWells\VrajWells\Camel1_2016_Cleaned.csv"):
    if not os.path.exists(csv_path):
        print(f"❌ Error: Cannot find dataset at {csv_path}")
        print("Please ensure the CSV file is present in the data/ directory.")
        return
    
    print(f"Loading config...")
    cfg = load_config("config.yaml")

    print(f"Loading data from {csv_path}...")
    df = load_well(
        file_path=csv_path,
        well_name="Camel1",
        separator=",",
        rop_col="ROP"
    )
    # Tag valid states (3, 7, 11) for Camel1 based on config.yaml
    df["_VALID_STATES"] = df["RIG_STATE"].isin([3, 7, 11])
    
    print("Cleaning and engineering features...")
    df_clean = run_cleaning_pipeline(df, cfg)
    df_feat = run_feature_pipeline(df_clean, cfg)
    
    if len(df_feat) < 50:
        print("Not enough data rows after cleaning.")
        return
        
    # Sample 50 random rows
    df_sample = df_feat.sample(50, random_state=np.random.randint(0, 10000))
    
    # Get features for model
    X, y_true_log, feature_cols = build_feature_matrix(df_sample, cfg)
    y_true = np.expm1(y_true_log)
    
    print("Loading trained model...")
    model, _, _ = load_model("models")
    
    print("Predicting ROP...")
    y_pred = predict_rop(model, X)
    
    # Display results
    results = pd.DataFrame({
        "Depth (ft)": df_sample.get("HDTH", np.nan).values,
        "Actual ROP": y_true,
        "Predicted ROP": y_pred,
        "Diff (ft/hr)": y_pred - y_true,
        "Error (%)": (np.abs(y_pred - y_true) / y_true) * 100
    })
    
    print("\n============== 50 RANDOM SAMPLES ==============")
    print(results.to_string(index=False, float_format=lambda x: f"{x:.2f}"))
    print("===============================================")
    
    mean_abs_error = results["Diff (ft/hr)"].abs().mean()
    mean_percentage_error = results["Error (%)"].mean()
    accuracy = 100 - mean_percentage_error
    
    print(f"\n SUMMARY METRICS:")
    print(f"Average Absolute Error : {mean_abs_error:.2f} ft/hr")
    print(f"Average Accuracy       : {max(0, accuracy):.2f} %")

if __name__ == "__main__":
    # Feel free to change this path to wherever your CSV is located!
    test_random_50(r"d:\VrajWells\VrajWells\Camel1_2016_Cleaned.csv")
