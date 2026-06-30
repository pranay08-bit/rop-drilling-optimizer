"""
optimize.py — Drilling parameter optimization engine
Uses Differential Evolution (global) → L-BFGS-B (local refinement)
"""
import logging
import numpy as np
from scipy.optimize import differential_evolution, minimize

from model import predict_rop, _estimate_derived
from safety import compute_total_penalty, safety_status, validate_bounds

logger = logging.getLogger(__name__)


def _build_bounds_list(cfg: dict) -> list:
    """Return ordered list of (min, max) tuples for [SWOB, RPM, STOR, CIRC, SPPA]."""
    b = cfg["optimization"]["bounds"]
    return [
        tuple(b["SWOB"]),
        tuple(b["RPM"]),
        tuple(b["STOR"]),
        tuple(b["CIRC"]),
        tuple(b["SPPA"]),
    ]


def _params_to_array(swob, rpm, stor, circ, sppa, hdth, feature_cols):
    """Build a feature row from base params with estimated derived features."""
    base = {"SWOB": swob, "RPM": rpm, "STOR": stor, "CIRC": circ, "SPPA": sppa, "HDTH": hdth}
    derived = _estimate_derived(base)
    all_features = {**base, **derived}
    return np.array([[all_features.get(c, 0.0) for c in feature_cols]])


def objective_function(
    x: np.ndarray,
    model,
    feature_cols: list,
    hdth: float,
    cfg: dict,
    return_breakdown: bool = False,
) -> float:
    """
    Objective: maximize predicted ROP minus safety penalties.
    x = [SWOB, RPM, STOR, CIRC, SPPA]
    """
    swob, rpm, stor, circ, sppa = x
    
    # Predict ROP in ft/hr
    X_row = _params_to_array(swob, rpm, stor, circ, sppa, hdth, feature_cols)
    rop_pred = float(predict_rop(model, X_row)[0])
    
    # Compute safety penalties
    total_penalty, breakdown = compute_total_penalty(swob, rpm, stor, circ, sppa, rop_pred, cfg)
    
    # Net score: we MINIMIZE this, so negative ROP + penalties
    score = -rop_pred + total_penalty
    
    if return_breakdown:
        return score, rop_pred, breakdown
    return score


def run_global_search(model, feature_cols: list, hdth: float, cfg: dict) -> dict:
    """
    Stage 1: Differential Evolution global search.
    Explores the full parameter space to find promising regions.
    """
    logger.info("  [Optimizer] Starting Differential Evolution global search...")
    
    bounds = _build_bounds_list(cfg)
    de_cfg = cfg["optimization"]
    
    def obj(x):
        return objective_function(x, model, feature_cols, hdth, cfg)
    
    result = differential_evolution(
        obj,
        bounds=bounds,
        popsize=de_cfg["de_popsize"],
        maxiter=de_cfg["de_maxiter"],
        tol=float(de_cfg["de_tol"]),
        seed=de_cfg["de_seed"],
        polish=False,
        init="latinhypercube",
        workers=1,
    )
    
    logger.info(f"  [Optimizer] DE complete. Best obj = {result.fun:.4f}")
    return result


def run_local_refinement(
    model,
    feature_cols: list,
    hdth: float,
    cfg: dict,
    starting_points: list,
) -> list:
    """
    Stage 2: L-BFGS-B local refinement starting from the best DE candidates.
    """
    logger.info("  [Optimizer] Running local refinement (L-BFGS-B)...")
    
    bounds = _build_bounds_list(cfg)
    refined_results = []
    
    for i, x0 in enumerate(starting_points):
        res = minimize(
            fun=lambda x: objective_function(x, model, feature_cols, hdth, cfg),
            x0=x0,
            method="L-BFGS-B",
            bounds=bounds,
            options={"maxiter": 500, "ftol": 1e-9},
        )
        refined_results.append(res)
    
    logger.info(f"  [Optimizer] Local refinement done for {len(starting_points)} candidates")
    return refined_results


def optimize_parameters(
    model,
    feature_cols: list,
    hdth: float,
    cfg: dict,
    current_params: dict = None,
) -> dict:
    """
    Full optimization pipeline: DE → local refinement → best solution.
    
    Args:
        hdth: Current hole depth (ft) — used in depth-normalized features
        current_params: Current drilling parameters (for improvement comparison)
    
    Returns:
        Dict with optimal parameters, predicted ROP, safety status, and improvement metrics.
    """
    logger.info(f"  [Optimizer] Target depth: {hdth:.0f} ft")
    
    # Stage 1: Global search
    de_result = run_global_search(model, feature_cols, hdth, cfg)
    
    # Collect top candidates from DE for local refinement
    n_candidates = cfg["optimization"]["local_refinement_candidates"]
    # Use DE result + small perturbations as starting points
    x_best = de_result.x
    candidates = [x_best]
    rng = np.random.default_rng(42)
    bounds_arr = np.array(_build_bounds_list(cfg))
    for _ in range(n_candidates - 1):
        perturb = rng.normal(0, 0.05, size=x_best.shape)
        x_perturbed = np.clip(x_best * (1 + perturb), bounds_arr[:, 0], bounds_arr[:, 1])
        candidates.append(x_perturbed)
    
    # Stage 2: Local refinement
    refined = run_local_refinement(model, feature_cols, hdth, cfg, candidates)
    
    # Pick best refined result
    best_local = min(refined, key=lambda r: r.fun)
    x_opt = best_local.x
    
    # Evaluate final solution
    score, rop_opt, breakdown = objective_function(
        x_opt, model, feature_cols, hdth, cfg, return_breakdown=True
    )
    
    swob_opt, rpm_opt, stor_opt, circ_opt, sppa_opt = x_opt
    
    # Validate bounds
    violations = validate_bounds(swob_opt, rpm_opt, stor_opt, circ_opt, sppa_opt, cfg)
    
    result = {
        "optimal_params": {
            "SWOB_klbs": round(swob_opt, 2),
            "RPM": round(rpm_opt, 1),
            "STOR_klbf_ft": round(stor_opt, 2),
            "CIRC_gpm": round(circ_opt, 1),
            "SPPA_psi": round(sppa_opt, 1),
        },
        "predicted_ROP_ft_hr": round(rop_opt, 2),
        "safety_penalties": breakdown,
        "safety_status": safety_status(breakdown),
        "bound_violations": violations,
        "optimizer_converged": best_local.success,
    }
    
    # Compare with current parameters if provided
    if current_params:
        current_x = np.array([
            current_params.get("SWOB", 20),
            current_params.get("RPM", 100),
            current_params.get("STOR", 10),
            current_params.get("CIRC", 400),
            current_params.get("SPPA", 2000),
        ])
        current_score, current_rop, current_breakdown = objective_function(
            current_x, model, feature_cols, hdth, cfg, return_breakdown=True
        )
        improvement = rop_opt - current_rop
        improvement_pct = (improvement / max(current_rop, 0.1)) * 100
        
        result["current_ROP_ft_hr"] = round(current_rop, 2)
        result["ROP_improvement_ft_hr"] = round(improvement, 2)
        result["ROP_improvement_pct"] = round(improvement_pct, 1)
        result["current_safety_status"] = safety_status(current_breakdown)
    
    return result


def batch_optimize(
    model,
    feature_cols: list,
    depths: list,
    cfg: dict,
) -> list:
    """
    Run optimization at multiple depth points.
    Useful for planning ahead along the well trajectory.
    """
    results = []
    for depth in depths:
        logger.info(f"Optimizing at depth {depth:.0f} ft...")
        res = optimize_parameters(model, feature_cols, depth, cfg)
        res["depth_ft"] = depth
        results.append(res)
    return results
