"""
ingest.py — Data ingestion and schema unification
Handles all CSV format variations across wells.
"""
import os
import logging
import pandas as pd
import numpy as np
import yaml
from pathlib import Path

logger = logging.getLogger(__name__)


def load_config(config_path: str = "config.yaml") -> dict:
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def _parse_datetime(df: pd.DataFrame) -> pd.DataFrame:
    """Detect and parse datetime from single DATETIME column or separate DATE + TIME columns."""
    if "DATETIME" in df.columns:
        df["DATETIME"] = pd.to_datetime(df["DATETIME"], dayfirst=True, errors="coerce")
    elif "DATE" in df.columns and "TIME" in df.columns:
        df["DATETIME"] = pd.to_datetime(
            df["DATE"].astype(str) + " " + df["TIME"].astype(str),
            dayfirst=True,
            errors="coerce",
        )
        df = df.drop(columns=["DATE", "TIME"], errors="ignore")
    return df


def _unify_rop_column(df: pd.DataFrame, rop_col: str) -> pd.DataFrame:
    """Rename ROPAvg or custom ROP column to standard 'ROP'."""
    if rop_col in df.columns and rop_col != "ROP":
        df = df.rename(columns={rop_col: "ROP"})
    return df


def load_well(
    file_path: str,
    well_name: str,
    separator: str = ",",
    rop_col: str = "ROP",
) -> pd.DataFrame:
    """
    Load a single well CSV file into a standardized DataFrame.
    
    Returns columns: DATETIME, HDTH, SWOB, RPM, STOR, CIRC, SPPA, RIG_STATE, ROP, WELL_NAME
    """
    logger.info(f"Loading {well_name} from {file_path}")
    
    df = pd.read_csv(file_path, sep=separator, low_memory=False)
    df.columns = df.columns.str.strip()
    
    # Standardize column mapping case-insensitively for required inputs
    mapping = {
        "HDTH": ["HDTH", "HOLE_DEPTH", "DEPTH", "HOLE DEPTH"],
        "SWOB": ["SWOB", "WOB", "WEIGHT ON BIT", "WEIGHT_ON_BIT"],
        "RPM": ["RPM", "ROTARY SPEED", "ROTARY_SPEED"],
        "STOR": ["STOR", "TORQUE", "SURFACE TORQUE", "SURFACE_TORQUE"],
        "CIRC": ["CIRC", "FLOW", "FLOW RATE", "FLOW_RATE", "FLOWRATE"],
        "SPPA": ["SPPA", "SPP", "STANDPIPE PRESSURE", "STANDPIPE_PRESSURE"],
        "RIG_STATE": ["RIG_STATE", "RIG STATE", "RIGSTATE"],
        "ROP": ["ROP", "ROPAVG", "ROP_AVG", "ROPAVERAGE", "RATE OF PENETRATION", "RATE_OF_PENETRATION"]
    }
    
    # Map DATETIME case-insensitively first
    dt_col = next((c for c in df.columns if c.upper() == "DATETIME"), None)
    if dt_col and dt_col != "DATETIME":
        df = df.rename(columns={dt_col: "DATETIME"})
        
    df = _parse_datetime(df)
    
    # Rename configured rop_col first if present
    if rop_col in df.columns:
        df = df.rename(columns={rop_col: "ROP"})
        
    # Standardize other columns
    rename_dict = {}
    for unified_name, candidates in mapping.items():
        if unified_name == "ROP" and "ROP" in df.columns:
            continue
            
        # If the unified name exists case-insensitively, rename to uppercase
        col_match = next((col for col in df.columns if col.upper() == unified_name), None)
        if col_match:
            if col_match != unified_name:
                rename_dict[col_match] = unified_name
            continue
            
        # Search candidate names case-insensitively
        for candidate in candidates:
            match = next((col for col in df.columns if col.upper() == candidate.upper()), None)
            if match:
                rename_dict[match] = unified_name
                logger.info(f"  Mapped column '{match}' to standardized '{unified_name}' for well {well_name}")
                break
                
    df = df.rename(columns=rename_dict)
    
    # Required columns check
    required = ["HDTH", "SWOB", "RPM", "STOR", "CIRC", "SPPA", "RIG_STATE", "ROP"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Well {well_name}: missing columns {missing}. Available: {list(df.columns)}")
    
    df = df[["DATETIME"] + required].copy()
    df["WELL_NAME"] = well_name
    
    # Cast numeric columns
    for col in required:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    
    logger.info(f"  Loaded {len(df):,} rows from {well_name}")
    return df


def load_all_wells(config: dict, split: str = "train") -> pd.DataFrame:
    """
    Load and concatenate all wells for a given split ('train' or 'test').
    
    Returns a unified DataFrame with a WELL_NAME column.
    """
    key = f"{split}_wells"
    well_configs = config["data"].get(key, [])
    data_dir = config["data"]["data_dir"]
    
    frames = []
    for wc in well_configs:
        if split == "train" and "selected_wells" in config and config["selected_wells"]:
            if wc["name"] not in config["selected_wells"]:
                logger.info(f"Skipping well {wc['name']} as it is not in selected_wells")
                continue
        path = os.path.join(data_dir, wc["file"])
        if not os.path.exists(path):
            logger.warning(f"File not found, skipping: {path}")
            continue
        df = load_well(
            file_path=path,
            well_name=wc["name"],
            separator=wc.get("separator", ","),
            rop_col=wc.get("rop_col", "ROP"),
        )
        df["DRILLING_STATES"] = str(wc.get("drilling_states", []))
        df["_DRILLING_STATE_LIST"] = [wc.get("drilling_states", [])] * len(df)
        frames.append((df, wc.get("drilling_states", [])))
    
    if not frames:
        raise RuntimeError(f"No valid wells loaded for split='{split}'")
    
    # Tag each row with its well's drilling state list before concat
    tagged = []
    for df, states in frames:
        df = df.copy()
        df["_VALID_STATES"] = df["RIG_STATE"].isin(states)
        tagged.append(df)
    
    combined = pd.concat(tagged, ignore_index=True)
    logger.info(f"Combined {split} set: {len(combined):,} rows from {len(frames)} wells")
    return combined


def get_well_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Return per-well row counts and ROP statistics."""
    return df.groupby("WELL_NAME").agg(
        rows=("ROP", "count"),
        rop_mean=("ROP", "mean"),
        rop_median=("ROP", "median"),
        rop_min=("ROP", "min"),
        rop_max=("ROP", "max"),
        depth_min=("HDTH", "min"),
        depth_max=("HDTH", "max"),
    ).round(2)
