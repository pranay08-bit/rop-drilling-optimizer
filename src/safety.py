"""
safety.py — Physics-based safety checks and penalty computation
Ensures optimization recommendations stay within safe operating limits.
"""
import logging
import numpy as np

logger = logging.getLogger(__name__)

BIT_AREA = np.pi * (6.0 / 2) ** 2  # Assumed 6-inch bit diameter (in²)


def mse_penalty(swob: float, rpm: float, stor: float, circ: float, rop_pred: float,
                threshold: float = 0.7) -> float:
    """
    Mechanical Specific Energy penalty.
    Flags inefficient drilling where energy input is high relative to ROP output.
    
    Returns: penalty value (0 = safe, > 0 = penalized)
    """
    rop_safe = max(rop_pred, 1.0)
    wob_lbs = swob * 1000
    torque_ftlbs = stor * 1000
    
    mse_raw = (wob_lbs / BIT_AREA) + (2 * np.pi * rpm * torque_ftlbs) / (rop_safe * BIT_AREA)
    
    # Normalize against a reference MSE (typical efficient drilling ≈ 50,000 psi)
    mse_norm = mse_raw / 50000.0
    
    if mse_norm > threshold:
        return (mse_norm - threshold) ** 2
    return 0.0


def hydraulics_penalty(circ: float, min_flow: float = 150.0) -> float:
    """
    Hydraulics penalty for insufficient flow rate.
    Low CIRC → poor cutting transport → bit balling risk → reduced effective ROP.
    
    Returns: penalty value (0 = safe, > 0 = penalized)
    """
    if circ < min_flow:
        return ((min_flow - circ) / min_flow) ** 2
    return 0.0


def stick_slip_penalty(rpm: float, stor: float, rpm_threshold_frac: float = 0.3) -> float:
    """
    Stick-slip vibration penalty.
    Low RPM with high torque is a classic stick-slip indicator.
    
    Returns: penalty value (0 = safe, > 0 = penalized)
    """
    if rpm <= 0:
        return 1.0
    
    torque_per_rpm = stor / rpm
    # Empirical threshold: torque-to-RPM ratio above 0.15 klbf-ft/RPM = high risk
    threshold = 0.15
    if torque_per_rpm > threshold:
        return ((torque_per_rpm - threshold) / threshold) ** 2
    return 0.0


def motor_stall_penalty(stor: float, max_torque_frac: float = 0.85,
                         max_torque: float = 30.0) -> float:
    """
    Motor stall penalty for excessive torque.
    High torque approaching BHA motor limit risks stall and tool failure.
    
    Returns: penalty value (0 = safe, > 0 = penalized)
    """
    limit = max_torque * max_torque_frac
    if stor > limit:
        return ((stor - limit) / limit) ** 2
    return 0.0


def pressure_penalty(sppa: float, max_sppa: float = 3500.0) -> float:
    """
    Standpipe pressure penalty.
    Excessive pressure risks surface equipment and wellbore integrity.
    
    Returns: penalty value (0 = safe, > 0 = penalized)
    """
    if sppa > max_sppa:
        return ((sppa - max_sppa) / max_sppa) ** 2
    return 0.0


def compute_total_penalty(
    swob: float,
    rpm: float,
    stor: float,
    circ: float,
    sppa: float,
    rop_pred: float,
    cfg: dict,
) -> tuple:
    """
    Compute weighted sum of all safety penalties.
    
    Returns: (total_penalty, penalty_breakdown_dict)
    """
    sc = cfg["safety"]
    
    p_mse = mse_penalty(swob, rpm, stor, circ, rop_pred, sc["mse_threshold"])
    p_hyd = hydraulics_penalty(circ, sc["min_flow_for_cleaning"])
    p_ss = stick_slip_penalty(rpm, stor, sc["stick_slip_rpm_threshold"])
    p_motor = motor_stall_penalty(stor, sc["motor_stall_torque_fraction"])
    p_press = pressure_penalty(sppa, sc["max_sppa"])
    
    total = sc["penalty_weight"] * (p_mse + p_hyd + p_ss + p_motor + p_press)
    
    breakdown = {
        "MSE_penalty": round(p_mse, 6),
        "Hydraulics_penalty": round(p_hyd, 6),
        "StickSlip_penalty": round(p_ss, 6),
        "MotorStall_penalty": round(p_motor, 6),
        "Pressure_penalty": round(p_press, 6),
        "Total_penalty": round(total, 4),
    }
    
    return total, breakdown


def safety_status(breakdown: dict) -> str:
    """Return a human-readable safety status string."""
    flags = []
    if breakdown["MSE_penalty"] > 0.01:
        flags.append("HIGH MSE (inefficient)")
    if breakdown["Hydraulics_penalty"] > 0.01:
        flags.append("LOW FLOW RATE")
    if breakdown["StickSlip_penalty"] > 0.01:
        flags.append("STICK-SLIP RISK")
    if breakdown["MotorStall_penalty"] > 0.01:
        flags.append("MOTOR STALL RISK")
    if breakdown["Pressure_penalty"] > 0.01:
        flags.append("HIGH STANDPIPE PRESSURE")
    
    if not flags:
        return "SAFE ✓"
    return "WARNING: " + " | ".join(flags)


def validate_bounds(swob, rpm, stor, circ, sppa, cfg) -> list:
    """Check that parameter values are within configured bounds."""
    bounds = cfg["optimization"]["bounds"]
    violations = []
    params = {"SWOB": swob, "RPM": rpm, "STOR": stor, "CIRC": circ, "SPPA": sppa}
    for param, val in params.items():
        lo, hi = bounds[param]
        if val < lo or val > hi:
            violations.append(f"{param}={val:.1f} outside [{lo}, {hi}]")
    return violations
