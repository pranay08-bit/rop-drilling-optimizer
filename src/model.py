"""
model.py — LightGBM model training with physics-informed constraints
"""
import logging
import os
import numpy as np
import pandas as pd
import lightgbm as lgb
import joblib
from sklearn.model_selection import train_test_split

from features import (
    build_feature_matrix,
    get_monotone_constraints,
    get_feature_columns,
)

logger = logging.getLogger(__name__)


def build_lgbm_params(cfg: dict, feature_cols: list) -> dict:
    """Construct LightGBM parameter dict from config."""
    mc = cfg["features"]["monotone_constraints"]
    # Extended monotone constraints for derived features
    extended_mc = mc + [-1, 1, 1, 0, 0]
    # Match constraint list length to actual feature count
    constraints = extended_mc[: len(feature_cols)]
    
    return {
        "objective": "regression",
        "metric": "rmse",
        "n_estimators": cfg["model"]["n_estimators"],
        "learning_rate": cfg["model"]["learning_rate"],
        "num_leaves": cfg["model"]["num_leaves"],
        "max_depth": cfg["model"]["max_depth"],
        "min_child_samples": cfg["model"]["min_child_samples"],
        "reg_alpha": cfg["model"]["reg_alpha"],
        "reg_lambda": cfg["model"]["reg_lambda"],
        "subsample": cfg["model"]["subsample"],
        "colsample_bytree": cfg["model"]["colsample_bytree"],
        "monotone_constraints": constraints,
        "verbose": -1,
        "n_jobs": -1,
        "random_state": cfg["model"]["random_state"],
    }


def train_model(df: pd.DataFrame, cfg: dict) -> tuple:
    """
    Train LightGBM on the prepared feature matrix.
    
    Returns: (model, X_train, X_test, y_train, y_test, feature_cols, metadata)
    """
    X, y, feature_cols = build_feature_matrix(df, cfg)
    
    logger.info(f"Training on {len(X):,} samples, {len(feature_cols)} features")
    logger.info(f"Features: {feature_cols}")
    logger.info(f"Target (log ROP) — mean={y.mean():.3f}, std={y.std():.3f}")
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=cfg["model"]["test_size"],
        random_state=cfg["model"]["random_state"],
    )
    
    params = build_lgbm_params(cfg, feature_cols)
    
    model = lgb.LGBMRegressor(**params)
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        callbacks=[
            lgb.early_stopping(stopping_rounds=cfg["model"]["early_stopping_rounds"], verbose=False),
            lgb.log_evaluation(period=100),
        ],
    )
    
    best_iter = model.best_iteration_
    logger.info(f"Training complete. Best iteration: {best_iter}")
    
    metadata = {
        "feature_cols": feature_cols,
        "n_train": len(X_train),
        "n_test": len(X_test),
        "best_iteration": best_iter,
        "wells_trained_on": df["WELL_NAME"].unique().tolist(),
    }
    
    return model, X_train, X_test, y_train, y_test, feature_cols, metadata


def predict_rop(model, X: np.ndarray) -> np.ndarray:
    """
    Predict ROP from feature matrix.
    Inverse-transforms log prediction back to ft/hr.
    """
    log_pred = model.predict(X)
    return np.expm1(log_pred)  # Inverse of log1p


def predict_rop_from_params(
    model,
    feature_cols: list,
    swob: float,
    rpm: float,
    stor: float,
    circ: float,
    sppa: float,
    hdth: float,
    extra_features: dict = None,
) -> float:
    """
    Predict ROP for a single set of drilling parameters.
    
    Args:
        extra_features: Dict of derived feature values (MSE, WOB_per_RPM, etc.)
                        If None, they are estimated from base params.
    """
    base = {
        "SWOB": swob,
        "RPM": rpm,
        "STOR": stor,
        "CIRC": circ,
        "SPPA": sppa,
        "HDTH": hdth,
    }
    
    # Estimate derived features if not provided
    derived = _estimate_derived(base)
    all_features = {**base, **derived}
    
    if extra_features:
        all_features.update(extra_features)
    
    row = np.array([[all_features.get(c, 0.0) for c in feature_cols]])
    return float(predict_rop(model, row)[0])


def _estimate_derived(base: dict) -> dict:
    """Estimate derived feature values from base drilling parameters."""
    rpm = base["RPM"] if base["RPM"] > 0 else 1
    rop_est = 20.0  # Rough estimate for MSE calculation (ft/hr)
    bit_area = np.pi * 9.0  # ~3.4" radius bit
    
    wob_lbs = base["SWOB"] * 1000
    torque_ftlbs = base["STOR"] * 1000
    mse_raw = (wob_lbs / bit_area) + (2 * np.pi * rpm * torque_ftlbs) / (rop_est * bit_area)
    
    return {
        "MSE": float(np.log1p(max(0, mse_raw))),
        "WOB_per_RPM": base["SWOB"] / rpm,
        "Hydraulic_Power": base["CIRC"] * base["SPPA"] / 1714,
        "Torque_RPM": base["STOR"] * base["RPM"],
        "Depth_norm": 0.5,  # Neutral default
    }


def save_model(model, feature_cols: list, metadata: dict, model_dir: str):
    """Save model, feature list, and metadata to disk."""
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "rop_lightgbm.pkl")
    meta_path = os.path.join(model_dir, "model_metadata.pkl")
    joblib.dump(model, model_path)
    joblib.dump({"feature_cols": feature_cols, **metadata}, meta_path)
    logger.info(f"Model saved to {model_path}")
    return model_path


def load_model(model_dir: str) -> tuple:
    """Load model and metadata from disk."""
    model = joblib.load(os.path.join(model_dir, "rop_lightgbm.pkl"))
    meta = joblib.load(os.path.join(model_dir, "model_metadata.pkl"))
    return model, meta["feature_cols"], meta
