"""Safe runner for approved npm scripts.

Runs whitelisted npm scripts from package.json and returns stdout/stderr.
"""
import json
import subprocess
from pathlib import Path
from typing import Dict, Any


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _allowed_scripts() -> Dict[str, str]:
    pkg = _repo_root() / 'package.json'
    if not pkg.exists():
        return {}
    data = json.loads(pkg.read_text(encoding='utf-8'))
    return data.get('scripts', {})


def run_npm_script(script: str, timeout: int = 120) -> Dict[str, Any]:
    scripts = _allowed_scripts()
    if script not in scripts:
        return {"ok": False, "error": "script not found or not allowed"}
    try:
        proc = subprocess.run(["npm", "run", script], cwd=str(_repo_root()), capture_output=True, text=True, timeout=timeout)
        out = proc.stdout or ""
        err = proc.stderr or ""
        # truncate big outputs
        max_chars = 12000
        if len(out) > max_chars:
            out = out[:max_chars] + "\n...[truncated]"
        if len(err) > max_chars:
            err = err[:max_chars] + "\n...[truncated]"
        return {"ok": proc.returncode == 0, "returncode": proc.returncode, "stdout": out, "stderr": err}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}
