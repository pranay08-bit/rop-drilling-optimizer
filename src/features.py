"""
features.py — Feature engineering for ROP prediction
Computes MSE, derived features, and log-transforms the target.
"""
import logging
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib, os

logger = logging.getLogger(__name__)


def compute_mse(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute Mechanical Specific Energy (MSE) — a physics-based drilling efficiency indicator.
    
    MSE = (WOB/A) + (2π × RPM × Torque) / (ROP × A)
    
    We compute a simplified normalized version for use as an engineered feature.
    Higher MSE = less efficient drilling.
    """
    bit_area = np.pi * (6.0 / 2) ** 2  # Assume 6" bit diameter (in²) — adjust if known
    
    wob_lbs = df["SWOB"] * 1000  # Convert klbs → lbs
    torque_ft_lbs = df["STOR"] * 1000  # Convert klbf-ft → lbf-ft
    rop_ft_hr = df["ROP"].replace(0, np.nan)  # Avoid division by zero
    rpm = df["RPM"]
    
    # Rotary MSE formula (psi)
    mse = (wob_lbs / bit_area) + (2 * np.pi * rpm * torque_ft_lbs) / (rop_ft_hr * bit_area)
    
    df["MSE"] = mse.clip(lower=0)
    df["MSE"] = np.log1p(df["MSE"])  # Log-scale to reduce skew
    return df


def compute_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer additional physically meaningful features:
    - WOB_per_RPM: weight normalized by rotation speed
    - Hydraulic_Power: flow × pressure proxy
    - Depth_normalized: depth relative to well's own range
    - Torque_RPM_product: rotational energy proxy
    """
    df["WOB_per_RPM"] = df["SWOB"] / df["RPM"].replace(0, np.nan)
    df["Hydraulic_Power"] = df["CIRC"] * df["SPPA"] / 1714  # HP = GPM × PSI / 1714
    df["Torque_RPM"] = df["STOR"] * df["RPM"]
    
    # Normalize depth within each well (0 = top, 1 = TD)
    df["Depth_norm"] = 0.5
    if "WELL_NAME" in df.columns:
        for well, idx in df.groupby("WELL_NAME").groups.items():
            d = df.loc[idx, "HDTH"]
            span = d.max() - d.min()
            if span > 0:
                df.loc[idx, "Depth_norm"] = (d - d.min()) / span
    else:
        d = df["HDTH"]
        span = d.max() - d.min()
        if span > 0:
            df["Depth_norm"] = (d - d.min()) / span
    
    # Fill NaN from derived cols
    derived = ["WOB_per_RPM", "Hydraulic_Power", "Torque_RPM", "Depth_norm", "MSE"]
    for col in derived:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
    
    return df


def get_feature_columns(cfg: dict, extended: bool = True) -> list:
    """Return the list of feature columns used for modeling."""
    base = cfg["features"]["input_cols"]
    if extended:
        extra = ["MSE", "WOB_per_RPM", "Hydraulic_Power", "Torque_RPM", "Depth_norm"]
        return base + extra
    return base


def get_monotone_constraints(cfg: dict, extended: bool = True) -> list:
    """Return monotone constraints matching the feature column order."""
    base = cfg["features"]["monotone_constraints"]  # For base cols
    if extended:
        # MSE: -1 (higher MSE → lower ROP)
        # WOB_per_RPM: +1 (higher = more weight per rotation → generally better)
        # Hydraulic_Power: +1 (more hydraulics → better cleaning → higher ROP)
        # Torque_RPM: 0 (complex relationship)
        # Depth_norm: 0 (depth relationship varies by formation)
        extra = [-1, 1, 1, 0, 0]
        return base + extra
    return base


def log_transform_target(df: pd.DataFrame, target_col: str = "ROP") -> pd.DataFrame:
    """Apply log(1 + ROP) transformation to stabilize variance and prevent negatives."""
    df["ROP_log"] = np.log1p(df[target_col])
    return df



def normalize_inputs(X: np.ndarray, scaler: StandardScaler = None) -> tuple:
    """
    Normalize input features so all parameters are treated fairly (spec requirement).
    If scaler is None, fits a new one. Returns (X_scaled, scaler).
    """
    if scaler is None:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
    else:
        X_scaled = scaler.transform(X)
    return X_scaled, scaler

def build_feature_matrix(df: pd.DataFrame, cfg: dict) -> tuple:
    """
    Build X (features) and y (target) arrays for model training.
    
    Returns: (X, y, feature_cols)
    """
    feature_cols = get_feature_columns(cfg, extended=True)
    # Only use columns that exist
    feature_cols = [c for c in feature_cols if c in df.columns]
    
    X = df[feature_cols].values
    
    if "ROP_log" in df.columns:
        y = df["ROP_log"].values
    else:
        y = np.log1p(df["ROP"].values)
    
    return X, y, feature_cols


def fit_scaler(X: np.ndarray, scaler_path: str = None) -> StandardScaler:
    """Fit a StandardScaler on training data."""
    scaler = StandardScaler()
    scaler.fit(X)
    if scaler_path:
        os.makedirs(os.path.dirname(scaler_path), exist_ok=True)
        joblib.dump(scaler, scaler_path)
        logger.info(f"Scaler saved to {scaler_path}")
    return scaler


def load_scaler(scaler_path: str) -> StandardScaler:
    return joblib.load(scaler_path)


def run_feature_pipeline(df: pd.DataFrame, cfg: dict) -> pd.DataFrame:
    """Full feature engineering pipeline."""
    logger.info("=== Starting feature engineering ===")
    df = compute_mse(df)
    df = compute_derived_features(df)
    df = log_transform_target(df, target_col="ROP")
    logger.info(f"  Features ready: {get_feature_columns(cfg, extended=True)}")
    return df
