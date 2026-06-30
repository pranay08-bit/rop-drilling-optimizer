"""
evaluate.py — Model evaluation and KPI metrics
Computes all performance indicators from the specification.
"""
import logging
import numpy as np
import pandas as pd
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

logger = logging.getLogger(__name__)


def inverse_log(y_log: np.ndarray) -> np.ndarray:
    """Convert log-space predictions back to ft/hr."""
    return np.expm1(y_log)


def compute_kpis(y_true_log: np.ndarray, y_pred_log: np.ndarray, label: str = "") -> dict:
    """
    Compute all KPIs in both log-space and original ROP space.
    
    Returns a dict with all metrics described in the specification.
    """
    y_true = inverse_log(y_true_log)
    y_pred = inverse_log(y_pred_log)
    
    # Basic regression metrics
    r2 = r2_score(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    
    # MAPE (exclude near-zero ROP to avoid division by zero)
    mask = y_true > 1.0
    mape = np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100
    
    # Consistency score: Pearson correlation between predicted and actual trends
    consistency = float(np.corrcoef(y_true, y_pred)[0, 1])
    
    # Hallucination margin: % predictions exceeding 110% of historical max
    historical_max = y_true.max()
    hallucination_pct = float(np.mean(y_pred > historical_max * 1.10) * 100)
    
    # Robustness score: stability under small input perturbation
    # (computed externally in evaluate_robustness, placeholder here)
    
    # Directional accuracy: when actual ROP goes up, does predicted ROP go up?
    if len(y_true) > 1:
        actual_dir = np.diff(y_true) > 0
        pred_dir = np.diff(y_pred) > 0
        directional_accuracy = float(np.mean(actual_dir == pred_dir) * 100)
    else:
        directional_accuracy = np.nan
    
    result = {
        "label": label,
        "n_samples": len(y_true),
        "R2": round(r2, 4),
        "RMSE_ft_hr": round(rmse, 3),
        "MAE_ft_hr": round(mae, 3),
        "MAPE_pct": round(mape, 2),
        "Consistency_score": round(consistency, 4),
        "Hallucination_margin_pct": round(hallucination_pct, 2),
        "Directional_accuracy_pct": round(directional_accuracy, 1),
        "ROP_true_mean": round(y_true.mean(), 2),
        "ROP_pred_mean": round(y_pred.mean(), 2),
        "ROP_pred_max": round(y_pred.max(), 2),
        "ROP_true_max": round(y_true.max(), 2),
    }
    
    return result


def evaluate_robustness(model, X_test: np.ndarray, noise_std: float = 0.01) -> dict:
    """
    Robustness score: average prediction stability when small Gaussian noise
    is added to inputs. Lower std = more robust.
    """
    y_base = model.predict(X_test)
    noise = np.random.normal(0, noise_std, X_test.shape)
    y_noisy = model.predict(X_test + noise)
    
    delta = np.abs(inverse_log(y_noisy) - inverse_log(y_base))
    return {
        "Robustness_mean_delta_ft_hr": round(float(delta.mean()), 3),
        "Robustness_max_delta_ft_hr": round(float(delta.max()), 3),
        "Robustness_score": round(float(1 / (1 + delta.mean())), 4),
    }


def evaluate_per_well(
    model,
    df_test: pd.DataFrame,
    feature_cols: list,
) -> pd.DataFrame:
    """
    Evaluate model on each well separately to measure cross-well generalization.
    """
    results = []
    for well_name, group in df_test.groupby("WELL_NAME"):
        X = group[feature_cols].values
        y_log = group["ROP_log"].values
        
        y_pred_log = model.predict(X)
        kpis = compute_kpis(y_log, y_pred_log, label=well_name)
        results.append(kpis)
    
    return pd.DataFrame(results).set_index("label")


def get_feature_importance(model, feature_cols: list, top_n: int = 10) -> pd.DataFrame:
    """Return feature importance as a DataFrame, sorted by gain."""
    importance = model.feature_importances_
    df = pd.DataFrame({
        "feature": feature_cols,
        "importance": importance,
    }).sort_values("importance", ascending=False)
    return df.head(top_n).reset_index(drop=True)


def print_kpi_report(kpis: dict, robustness: dict = None):
    """Pretty-print KPI results to the logger."""
    logger.info("=" * 55)
    logger.info(f"  MODEL PERFORMANCE — {kpis.get('label', 'Overall')}")
    logger.info("=" * 55)
    logger.info(f"  Samples evaluated : {kpis['n_samples']:,}")
    logger.info(f"  R²                : {kpis['R2']:.4f}  (target: > 0.80)")
    logger.info(f"  RMSE              : {kpis['RMSE_ft_hr']:.2f} ft/hr")
    logger.info(f"  MAE               : {kpis['MAE_ft_hr']:.2f} ft/hr")
    logger.info(f"  MAPE              : {kpis['MAPE_pct']:.1f}%")
    logger.info(f"  Consistency score : {kpis['Consistency_score']:.4f}")
    logger.info(f"  Hallucination     : {kpis['Hallucination_margin_pct']:.1f}%")
    logger.info(f"  Directional acc.  : {kpis['Directional_accuracy_pct']:.1f}%")
    if robustness:
        logger.info(f"  Robustness score  : {robustness['Robustness_score']:.4f}")
        logger.info(f"  Mean delta (noise): {robustness['Robustness_mean_delta_ft_hr']:.3f} ft/hr")
    logger.info("=" * 55)
