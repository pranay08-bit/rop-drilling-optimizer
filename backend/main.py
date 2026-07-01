from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil
import subprocess
import json
import yaml
import sys
from pathlib import Path
import os

app = FastAPI()

# Configure CORS to allow the frontend to talk to the backend
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Actual ML pipeline folder
PIPELINE_DIR = Path(__file__).resolve().parent.parent
CONFIG_FILE = PIPELINE_DIR / "config.yaml"
OUTPUT_DIR = PIPELINE_DIR / "outputs"

# Ensure output directory exists before mounting StaticFiles
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")

pipeline_process = None


@app.get("/api/config")
async def get_config():
    try:
        with open(CONFIG_FILE, 'r') as f:
            cfg = yaml.safe_load(f)
        
        well_definitions = []
        if "data" in cfg:
            for w in cfg["data"].get("train_wells", []):
                well_definitions.append({"name": w["name"], "file": w["file"]})
        
        # Unique list by well name
        unique_defs = []
        seen = set()
        for wd in well_definitions:
            if wd["name"] not in seen:
                seen.add(wd["name"])
                unique_defs.append(wd)
        
        available_wells = [wd["name"] for wd in unique_defs]
        selected_wells = [w for w in cfg.get("selected_wells", []) if w in available_wells]
        
        return {
            "status": "success",
            "available_wells": available_wells,
            "well_definitions": unique_defs,
            "selected_wells": selected_wells,
            "formations": cfg.get("formations", ["Sulaiy", "ETop1"]),
            "selected_formations": cfg.get("selected_formations", cfg.get("formations", ["Sulaiy", "ETop1"])),
            "limits": cfg.get("optimization", {}).get("bounds", {})
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/config/save")
async def save_config(config: dict):
    try:
        with open(CONFIG_FILE, 'r') as f:
            existing = yaml.safe_load(f)

        if "wells" in config:
            existing["selected_wells"] = config["wells"]
        if "formations" in config:
            existing["formations"] = config["formations"]
        if "selected_formations" in config:
            existing["selected_formations"] = config["selected_formations"]
        if "limits" in config:
            existing.setdefault("optimization", {})["bounds"] = config["limits"]

        if "well_definitions" in config:
            train_wells = existing.setdefault("data", {}).setdefault("train_wells", [])
            existing_by_name = {w["name"]: w for w in train_wells}
            
            new_train_wells = []
            for wdef in config["well_definitions"]:
                name = wdef.get("name")
                filename = wdef.get("file")
                if not name or not filename:
                    continue
                if name in existing_by_name:
                    # Keep existing configuration fields
                    new_train_wells.append(existing_by_name[name])
                else:
                    # Append new well with default configuration
                    new_train_wells.append({
                        "file": filename,
                        "name": name,
                        "separator": ",",
                        "rop_col": wdef.get("rop_col", "ROP"),
                        "drilling_states": wdef.get("drilling_states", [3, 7, 11])
                    })
            existing["data"]["train_wells"] = new_train_wells

        with open(CONFIG_FILE, 'w') as f:
            yaml.dump(existing, f)

        return {"status": "success", "message": "Config saved"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/wells/upload")
async def upload_well_file(file: UploadFile = File(...)):
    try:
        # Check that it's a CSV file
        if not file.filename.endswith(".csv"):
            return {"status": "error", "message": "Only CSV files are supported"}

        # Destination path
        data_dir = PIPELINE_DIR / "data"
        data_dir.mkdir(parents=True, exist_ok=True)
        dest_file = data_dir / file.filename

        # Save file to outputs/data folder
        with open(dest_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Register in config.yaml
        with open(CONFIG_FILE, 'r') as f:
            cfg = yaml.safe_load(f)

        well_name = file.filename[:-4] # strip .csv
        
        train_wells = cfg.setdefault("data", {}).setdefault("train_wells", [])
        existing_train_names = {w["name"] for w in train_wells}

        if well_name not in existing_train_names:
            train_wells.append({
                "file": file.filename,
                "name": well_name,
                "separator": ",",
                "rop_col": "ROP",
                "drilling_states": [3, 7, 11]
            })
            
            # Auto-select the newly uploaded well
            selected_wells = cfg.setdefault("selected_wells", [])
            if well_name not in selected_wells:
                selected_wells.append(well_name)

            with open(CONFIG_FILE, 'w') as f:
                yaml.dump(cfg, f)

        return {"status": "success", "message": f"Successfully uploaded and registered well: {well_name}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/pipeline/run")
async def run_pipeline():
    global pipeline_process
    try:
        # Clear existing optimization result to prevent stale complete status
        result_file = OUTPUT_DIR / "optimization_result.json"
        try:
            if result_file.exists():
                result_file.unlink()
        except Exception:
            pass

        # Clear existing logs
        log_file = OUTPUT_DIR / "run.log"
        try:
            if log_file.exists():
                log_file.unlink()
        except Exception:
            pass

        debug_file = OUTPUT_DIR / "pipeline_debug.log"
        try:
            if debug_file.exists():
                debug_file.unlink()
        except Exception:
            pass

        # Clear existing png files from outputs directory
        for f in OUTPUT_DIR.glob("*.png"):
            try:
                f.unlink()
            except Exception:
                pass

        # Redirect child process stdout/stderr to debug file to catch startup crashes
        try:
            fh = open(debug_file, "w", encoding="utf-8", errors="ignore")
            pipeline_process = subprocess.Popen(
                [sys.executable, "main.py"],
                cwd=str(PIPELINE_DIR),
                stdout=fh,
                stderr=fh,
            )
        except Exception as e:
            return {"status": "error", "message": f"Failed to start pipeline: {str(e)}"}
            
        return {"status": "running", "pid": pipeline_process.pid}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/pipeline/status")
async def get_pipeline_status():
    global pipeline_process
    log_file = OUTPUT_DIR / "run.log"
    debug_file = OUTPUT_DIR / "pipeline_debug.log"

    is_running = pipeline_process is not None and pipeline_process.poll() is None
    is_done = (OUTPUT_DIR / "optimization_result.json").exists()

    logs = []
    # Try reading run.log first, ignore lock errors on Windows
    if log_file.exists():
        try:
            with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                logs = f.readlines()
        except (PermissionError, OSError):
            pass

    # Fall back to pipeline_debug.log if it contains more detailed info (e.g. traceback)
    if debug_file.exists():
        try:
            with open(debug_file, 'r', encoding='utf-8', errors='ignore') as f:
                debug_logs = f.readlines()
                if len(debug_logs) > len(logs):
                    logs = debug_logs
        except (PermissionError, OSError):
            pass

    logs = logs[-30:]

    if is_done and not is_running:
        status = "complete"
    elif is_running:
        status = "running"
    elif pipeline_process is not None and pipeline_process.poll() is not None:
        # Check if process exited with an error
        if pipeline_process.returncode != 0:
            status = "failed"
        else:
            status = "complete" if is_done else "failed"
    else:
        status = "idle"

    return {"status": status, "logs": [line.strip() for line in logs]}


@app.post("/api/pipeline/cancel")
async def cancel_pipeline():
    global pipeline_process
    try:
        if pipeline_process is not None and pipeline_process.poll() is None:
            pipeline_process.terminate()
            try:
                pipeline_process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                pipeline_process.kill()
            return {"status": "success", "message": "Pipeline cancelled"}
        return {"status": "success", "message": "No active pipeline to cancel"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/pipeline/outputs")
async def get_pipeline_outputs():
    try:
        files = []
        if OUTPUT_DIR.exists():
            files = [f.name for f in OUTPUT_DIR.iterdir() if f.is_file()]
        return {"status": "success", "files": files}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/results")
async def get_results():
    try:
        result_file = OUTPUT_DIR / "optimization_result.json"
        if not result_file.exists():
            return {"status": "error", "message": "Results not ready"}

        with open(result_file, 'r') as f:
            opt_result = json.load(f)

        return {
            "status": "success",
            "optimal_params": opt_result.get("optimal_params", {}),
            "predicted_rop": opt_result.get("predicted_ROP_ft_hr"),
            "safety_status": opt_result.get("safety_status"),
            "rop_improvement_pct": opt_result.get("ROP_improvement_pct"),
            "current_rop": opt_result.get("current_ROP_ft_hr"),
            "rop_improvement_val": opt_result.get("ROP_improvement_ft_hr"),
            "r2_score": opt_result.get("r2_score"),
            "rmse": opt_result.get("rmse"),
            "mae": opt_result.get("mae"),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)