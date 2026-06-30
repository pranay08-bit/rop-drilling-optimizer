"""
main.py — ROP Optimizer Orchestrator
Runs the full pipeline: ingest → clean → features → train → evaluate → optimize → report
"""
import os
import sys
import logging
import warnings
warnings.filterwarnings("ignore", category=UserWarning)
import json
import numpy as np
import pandas as pd

# ── ensure src/ is on the path ────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from ingest import load_config, load_all_wells, get_well_summary
from clean import run_cleaning_pipeline, cleaning_report
from features import run_feature_pipeline, build_feature_matrix, get_feature_columns, normalize_inputs
from model import train_model, predict_rop, save_model
from evaluate import compute_kpis, evaluate_robustness, evaluate_per_well, get_feature_importance, print_kpi_report
from safety import compute_total_penalty, safety_status
from optimize import optimize_parameters
from report import (
    plot_actual_vs_predicted, plot_feature_importance,
    plot_rop_depth_profile, plot_optimization_results,
    write_excel_report,
)

# ── Logging setup ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("outputs/run.log", mode="w"),
    ],
)
logger = logging.getLogger(__name__)


def main():
    os.makedirs("outputs", exist_ok=True)
    os.makedirs("models", exist_ok=True)
    
    # ── 1. Load Config ─────────────────────────────────────────
    logger.info("╔══════════════════════════════════════════╗")
    logger.info("║       ROP Optimizer — Full Pipeline      ║")
    logger.info("╚══════════════════════════════════════════╝")
    
    cfg = load_config("config.yaml")
    logger.info("Config loaded.")
    
    # ── 2. Ingest Training Data ────────────────────────────────
    logger.info("\n[1/8] DATA INGESTION")
    df_raw = load_all_wells(cfg, split="train")
    logger.info(f"\nWell summary (raw):\n{get_well_summary(df_raw).to_string()}\n")
    
    # ── 3. Clean ───────────────────────────────────────────────
    logger.info("\n[2/8] DATA CLEANING")
    df_clean = run_cleaning_pipeline(df_raw, cfg)
    clean_rpt = cleaning_report(df_raw, df_clean)
    logger.info(f"Cleaning report: {json.dumps(clean_rpt, indent=2)}")
    
    if len(df_clean) < 500:
        logger.error("Too few rows after cleaning. Check config drilling_states.")
        sys.exit(1)
    
    # ── 4. Feature Engineering ─────────────────────────────────
    logger.info("\n[3/8] FEATURE ENGINEERING")
    df_feat = run_feature_pipeline(df_clean, cfg)
    
    # ── 5. Model Training ──────────────────────────────────────
    logger.info("\n[4/8] MODEL TRAINING")
    model, X_train, X_test, y_train, y_test, feature_cols, meta = train_model(df_feat, cfg)
    # Normalize inputs per spec: "data is normalized so all parameters are treated fairly"
    import joblib as _jl
    X_all_raw, _, _ = build_feature_matrix(df_feat, cfg)
    _, scaler = normalize_inputs(X_all_raw)
    _jl.dump(scaler, "models/input_scaler.pkl")
    logger.info("Input scaler saved to models/input_scaler.pkl")
    save_model(model, feature_cols, meta, model_dir="models")
    
    # ── 6. Evaluate on Hold-out ────────────────────────────────
    logger.info("\n[5/8] MODEL EVALUATION")
    y_pred_test = model.predict(X_test)
    kpis = compute_kpis(y_test, y_pred_test, label="Hold-out test set")
    robustness = evaluate_robustness(model, X_test)
    print_kpi_report(kpis, robustness)
    
    # Per-well evaluation
    per_well_kpis = evaluate_per_well(model, df_feat, feature_cols)
    logger.info(f"\nPer-well performance:\n{per_well_kpis.to_string()}\n")
    
    # Feature importance
    fi_df = get_feature_importance(model, feature_cols, top_n=len(feature_cols))
    logger.info(f"\nFeature importance (top 5):\n{fi_df.head().to_string()}\n")
    
    # ── 7. Safety checks (sanity test on test set) ─────────────
    logger.info("\n[6/8] PHYSICS SAFETY CHECKS")
    # Test on median test parameters
    df_test_rows = df_feat.iloc[len(X_train):]
    med = df_test_rows[["SWOB","RPM","STOR","CIRC","SPPA"]].median()
    rop_sample = float(predict_rop(model, X_test[:1])[0])
    _, sample_breakdown = compute_total_penalty(
        med["SWOB"], med["RPM"], med["STOR"], med["CIRC"], med["SPPA"],
        rop_pred=rop_sample, cfg=cfg
    )
    logger.info(f"Safety check on median test params: {safety_status(sample_breakdown)}")
    logger.info(f"Penalty breakdown: {sample_breakdown}")
    
    # ── 8. Optimize ────────────────────────────────────────────
    logger.info("\n[7/8] PARAMETER OPTIMIZATION")
    # Use median depth from training data as reference
    hdth_ref = float(df_feat["HDTH"].median())
    
    # Example "current" parameters from median of training data
    current_params = {
        "SWOB": float(med["SWOB"]),
        "RPM": float(med["RPM"]),
        "STOR": float(med["STOR"]),
        "CIRC": float(med["CIRC"]),
        "SPPA": float(med["SPPA"]),
    }
    
    opt_result = optimize_parameters(model, feature_cols, hdth_ref, cfg, current_params)
    
    logger.info("\n=== OPTIMIZATION RESULTS ===")
    logger.info(f"  Optimal parameters  : {opt_result['optimal_params']}")
    logger.info(f"  Predicted ROP       : {opt_result['predicted_ROP_ft_hr']:.2f} ft/hr")
    logger.info(f"  Safety status       : {opt_result['safety_status']}")
    if "ROP_improvement_pct" in opt_result:
        logger.info(f"  ROP improvement     : +{opt_result['ROP_improvement_ft_hr']:.2f} ft/hr (+{opt_result['ROP_improvement_pct']:.1f}%)")
    logger.info(f"  Converged           : {opt_result['optimizer_converged']}")
    
    # ── 9. Generate Reports ────────────────────────────────────
    logger.info("\n[8/8] GENERATING REPORTS")
    
    # Get full-set predictions for plots
    X_all, y_all, _ = build_feature_matrix(df_feat, cfg)
    y_pred_all = model.predict(X_all)
    y_true_orig = np.expm1(y_all)
    y_pred_orig = np.expm1(y_pred_all)
    
    # Plots
    plot_actual_vs_predicted(
        y_true_orig, y_pred_orig,
        output_path="outputs/actual_vs_predicted.png",
        title="All training wells"
    )
    plot_feature_importance(fi_df, output_path="outputs/feature_importance.png")
    plot_optimization_results(opt_result, output_path="outputs/optimization_results.png")
    
    # Depth profile plot for each well used in training
    for well_name in df_feat["WELL_NAME"].unique():
        df_well = df_feat[df_feat["WELL_NAME"] == well_name].copy()
        X_well, y_well, _ = build_feature_matrix(df_well, cfg)
        y_pred_well = np.expm1(model.predict(X_well))
        df_well["ROP_pred"] = y_pred_well
        plot_rop_depth_profile(
            df_well, y_pred_well,
            output_path=f"outputs/depth_profile_{well_name}.png",
            well_name=well_name
        )
    
    # Excel report
    write_excel_report(
        kpis=kpis,
        robustness=robustness,
        per_well_kpis=per_well_kpis,
        fi_df=fi_df,
        opt_result=opt_result,
        cleaning_report=clean_rpt,
        output_path="outputs/ROP_Optimizer_Report.xlsx",
    )
    
    # Save optimization result as JSON
    output_data = {
        **opt_result,
        "r2_score": float(kpis.get("R2", 0)),
        "rmse": float(kpis.get("RMSE_ft_hr", 0)),
        "mae": float(kpis.get("MAE_ft_hr", 0)),
    }
    with open("outputs/optimization_result.json", "w") as f:
        json.dump(output_data, f, indent=2)
    
    logger.info("\n╔══════════════════════════════════════════╗")
    logger.info("║        Pipeline Complete! ✓              ║")
    logger.info("╚══════════════════════════════════════════╝")
    logger.info("Outputs in: outputs/")
    logger.info("  - ROP_Optimizer_Report.xlsx")
    logger.info("  - actual_vs_predicted.png")
    logger.info("  - feature_importance.png")
    logger.info("  - optimization_results.png")
    logger.info("  - depth_profile_*.png")
    logger.info("  - optimization_result.json")
    logger.info("  - run.log")
    
    return {
        "kpis": kpis,
        "robustness": robustness,
        "opt_result": opt_result,
        "clean_report": clean_rpt,
    }


if __name__ == "__main__":
    main()
