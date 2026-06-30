"""
clean.py — Data cleaning and filtering pipeline
"""
import logging
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def replace_sentinels(df: pd.DataFrame, sentinel: float = -999.25) -> pd.DataFrame:
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].replace(sentinel, np.nan)
    return df



def drop_incomplete_records(df: pd.DataFrame, cfg: dict) -> pd.DataFrame:
    """
    Step 1 per spec: Remove incomplete records.
    Drops any row where a required input or output column has NaN.
    """
    required = cfg["features"]["input_cols"] + [cfg["features"]["target_col"]]
    required = [c for c in required if c in df.columns]
    before = len(df)
    df = df.dropna(subset=required)
    logger.info(f"  Incomplete record removal: {before:,} → {len(df):,} rows")
    return df

def filter_drilling_states(df: pd.DataFrame) -> pd.DataFrame:
    if "_VALID_STATES" not in df.columns:
        logger.warning("_VALID_STATES column missing — skipping state filter")
        return df
    before = len(df)
    df = df[df["_VALID_STATES"]].copy()
    logger.info(f"  Drilling state filter: {before:,} → {len(df):,} rows")
    return df


def filter_non_drilling_conditions(df: pd.DataFrame, cfg: dict) -> pd.DataFrame:
    before = len(df)
    min_rpm  = cfg["cleaning"]["min_rpm"]
    min_circ = cfg["cleaning"]["min_circ"]
    min_rop  = cfg["cleaning"]["min_rop"]
    df = df[
        (df["RPM"]  >= min_rpm)  &
        (df["CIRC"] >= min_circ) &
        (df["ROP"]  >= min_rop)
    ].copy()
    logger.info(f"  Non-drilling filter: {before:,} → {len(df):,} rows")
    return df


def remove_outliers(df: pd.DataFrame, cfg: dict) -> pd.DataFrame:
    before = len(df)
    rop_pct  = cfg["cleaning"]["max_rop_percentile"]
    iqr_mult = cfg["cleaning"]["rop_iqr_multiplier"]

    parts = []
    for well_name, grp in df.groupby("WELL_NAME", sort=False):
        grp = grp.copy()
        cap = grp["ROP"].quantile(rop_pct / 100.0)
        grp = grp[grp["ROP"] <= cap]
        q1, q3 = grp["ROP"].quantile(0.25), grp["ROP"].quantile(0.75)
        iqr    = q3 - q1
        grp = grp[(grp["ROP"] >= q1 - iqr_mult * iqr) &
                  (grp["ROP"] <= q3 + iqr_mult * iqr)]
        parts.append(grp)

    df = pd.concat(parts, ignore_index=True)

    feature_cols = cfg["features"]["input_cols"] + [cfg["features"]["target_col"]]
    feature_cols = [c for c in feature_cols if c in df.columns]
    df = df.dropna(subset=feature_cols)

    logger.info(f"  Outlier removal: {before:,} → {len(df):,} rows")
    return df


def apply_rolling_smooth(df: pd.DataFrame, cfg: dict) -> pd.DataFrame:
    window      = cfg["cleaning"]["rolling_window_rows"]
    smooth_cols = [c for c in ["SWOB","RPM","STOR","CIRC","SPPA"] if c in df.columns]

    parts = []
    for _, grp in df.groupby("WELL_NAME", sort=False):
        grp = grp.copy()
        if "DATETIME" in grp.columns:
            grp = grp.sort_values("DATETIME")
        grp[smooth_cols] = (
            grp[smooth_cols]
            .rolling(window=window, min_periods=1, center=True)
            .mean()
        )
        parts.append(grp)

    df = pd.concat(parts, ignore_index=True)
    logger.info(f"  Rolling smoothing applied (window={window})")
    return df


def run_cleaning_pipeline(df: pd.DataFrame, cfg: dict) -> pd.DataFrame:
    logger.info("=== Starting cleaning pipeline ===")
    df = replace_sentinels(df, sentinel=cfg["cleaning"]["sentinel_value"])
    df = drop_incomplete_records(df, cfg)
    df = filter_drilling_states(df)
    df = filter_non_drilling_conditions(df, cfg)
    df = remove_outliers(df, cfg)
    df = apply_rolling_smooth(df, cfg)
    df = df.reset_index(drop=True)
    logger.info(f"=== Cleaning complete: {len(df):,} rows ===")
    return df


def cleaning_report(df_before: pd.DataFrame, df_after: pd.DataFrame) -> dict:
    return {
        "rows_before":  len(df_before),
        "rows_after":   len(df_after),
        "rows_removed": len(df_before) - len(df_after),
        "pct_retained": round(100 * len(df_after) / max(len(df_before), 1), 1),
        "wells":        df_after["WELL_NAME"].unique().tolist(),
        "rop_mean":     round(df_after["ROP"].mean(), 2),
        "rop_std":      round(df_after["ROP"].std(),  2),
        "rop_min":      round(df_after["ROP"].min(),  2),
        "rop_max":      round(df_after["ROP"].max(),  2),
    }
