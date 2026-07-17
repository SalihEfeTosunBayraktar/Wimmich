"""Wimmich bootstrap installer.

Self-contained, stdlib-only (no pip dependencies whatsoever) local
installer: starts a small local HTTP server, serves an embedded HTML page,
and does the real work (fetching the repo, creating a venv, installing
dependencies, launching the app) when that page's JS calls back to it.

This file is downloaded and run BEFORE the Wimmich repository exists on
the user's machine at all (see bootstrap.bat) - it must never import
anything from the rest of the Wimmich codebase, only the standard library.
"""
import io
import json
import platform
import shutil
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

GITHUB_OWNER = "SalihEfeTosunBayraktar"
GITHUB_REPO = "Wimmich"
GITHUB_API_BASE = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}"
GITHUB_USER_AGENT = "Wimmich-Bootstrap"
REPO_CLONE_URL = f"https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}.git"

# This installer's own local server - unrelated to WIMMICH_PORT, the port
# the app itself will eventually run on (chosen by the user in the form).
SERVER_PORT = 8347

STATE_LOCK = threading.Lock()
STATE = {
    "running": False,
    "done": False,
    "error": None,
    "phase": "idle",
    "percent": 0,
    "log": [],
    "launched_url": None,
}


def _log(line: str) -> None:
    with STATE_LOCK:
        STATE["log"].append(line)
    print(line, flush=True)


def _set_phase(phase: str, percent: int) -> None:
    with STATE_LOCK:
        STATE["phase"] = phase
        STATE["percent"] = percent


def _fail(message: str) -> None:
    with STATE_LOCK:
        STATE["error"] = message
        STATE["done"] = True
        STATE["running"] = False
    _log(f"ERROR: {message}")


def _run_streamed(cmd: list, cwd: Path, label: str) -> bool:
    """Runs a command, streaming its output line-by-line into the log -
    subprocess.run() would only surface output once the whole thing
    finishes, which makes a multi-minute `pip install torch` look frozen."""
    _log(f"$ {' '.join(cmd)}")
    try:
        proc = subprocess.Popen(
            cmd, cwd=str(cwd), stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, encoding="utf-8", errors="replace",
        )
    except Exception as e:
        _log(f"Failed to start {label}: {e}")
        return False
    for line in proc.stdout:
        _log(line.rstrip())
    proc.wait()
    if proc.returncode != 0:
        _log(f"{label} failed (exit code {proc.returncode}).")
        return False
    return True


def _fetch_repo_git(install_dir: Path) -> bool:
    return _run_streamed(["git", "clone", REPO_CLONE_URL, str(install_dir)], install_dir.parent, "git clone")


def _fetch_repo_zip(install_dir: Path) -> bool:
    """No-git fallback. Mirrors services/update_service.py's
    _apply_update_zip() - same archive URL shape, same root-prefix
    stripping - kept in sync manually since this file can't import that
    module (the repo doesn't exist locally yet when this runs)."""
    try:
        req = urllib.request.Request(
            f"{GITHUB_API_BASE}/commits/main",
            headers={"User-Agent": GITHUB_USER_AGENT, "Accept": "application/vnd.github+json"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            latest = json.loads(resp.read().decode("utf-8"))
        sha = latest["sha"]
    except Exception as e:
        _log(f"Could not reach GitHub to look up the latest version: {e}")
        return False

    _log(f"Downloading Wimmich (commit {sha[:7]})...")
    try:
        archive_url = f"https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/archive/{sha}.zip"
        req = urllib.request.Request(archive_url, headers={"User-Agent": GITHUB_USER_AGENT})
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = resp.read()
    except Exception as e:
        _log(f"Download failed: {e}")
        return False

    try:
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            names = z.namelist()
            if not names:
                _log("Downloaded archive is empty.")
                return False
            root_prefix = names[0].split("/")[0] + "/"
            for member in names:
                if not member.startswith(root_prefix):
                    continue
                rel = member[len(root_prefix):]
                if not rel:
                    continue
                dest = install_dir / rel
                if member.endswith("/"):
                    dest.mkdir(parents=True, exist_ok=True)
                    continue
                dest.parent.mkdir(parents=True, exist_ok=True)
                with z.open(member) as src, open(dest, "wb") as out:
                    out.write(src.read())
    except Exception as e:
        _log(f"Failed to extract the downloaded archive: {e}")
        return False

    # Prime self-update's version marker immediately - mirrors
    # update_service.py's "fresh zip install, adopt current as baseline"
    # special-case, just done proactively instead of waiting on the first
    # admin-panel update check.
    try:
        data_dir = install_dir / "data"
        data_dir.mkdir(parents=True, exist_ok=True)
        (data_dir / ".wimmich_version").write_text(sha, encoding="utf-8")
    except Exception:
        pass  # best-effort - not fatal if this one file can't be written

    _log("Download complete.")
    return True


def _install_worker(install_dir: Path, port: int, profile: str, gpu: bool) -> None:
    try:
        _run_install(install_dir, port, profile, gpu)
    except Exception as e:
        _fail(f"Unexpected error: {e}")


def _run_install(install_dir: Path, port: int, profile: str, gpu: bool) -> None:
    _set_phase("preparing", 2)
    try:
        install_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        _fail(f"Could not create {install_dir}: {e}. Choose a folder you have write access to.")
        return
    if any(install_dir.iterdir()):
        _fail(f"{install_dir} is not empty. Choose an empty or new folder.")
        return

    _set_phase("fetching_repo", 5)
    if shutil.which("git") is not None:
        _log("git found - cloning the repository...")
        ok = _fetch_repo_git(install_dir)
        if not ok:
            _log("git clone failed - falling back to a direct download...")
            ok = _fetch_repo_zip(install_dir)
    else:
        _log("git not found - downloading the repository directly...")
        ok = _fetch_repo_zip(install_dir)
    if not ok:
        _fail("Could not fetch the Wimmich source code. Check your internet connection and try again.")
        return

    _set_phase("venv", 15)
    _log("Creating virtual environment...")
    if not _run_streamed([sys.executable, "-m", "venv", "venv"], install_dir, "venv creation"):
        _fail("Failed to create the virtual environment.")
        return

    venv_python = install_dir / "venv" / "Scripts" / "python.exe"
    if not venv_python.exists():
        _fail("Virtual environment was created but python.exe is missing - something went wrong.")
        return

    _set_phase("pip_base", 25)
    _log("Installing base dependencies...")
    if not _run_streamed([str(venv_python), "-m", "pip", "install", "-r", "requirements.txt"], install_dir, "pip install"):
        _fail("Failed to install base dependencies - see the log above.")
        return

    _set_phase("ffmpeg", 40)
    _log("Checking for FFmpeg...")
    # Best-effort, same as install_full.bat/install_minimal.bat today -
    # video support just runs limited if this fails, it's not fatal.
    _run_streamed(
        [str(venv_python), "-c", "from utils.ffmpeg_setup import check_and_download_ffmpeg; check_and_download_ffmpeg()"],
        install_dir, "FFmpeg setup",
    )

    if profile == "full":
        _set_phase("pip_torch", 50)
        torch_ok = False
        if gpu:
            _log("Installing CUDA-accelerated PyTorch (trying recent CUDA builds)...")
            # Each CUDA build tag (cuXXX) stops publishing wheels for newer
            # Python versions before PyTorch itself drops support, so a
            # single pinned tag goes stale - same fallback chain as
            # install_full.bat, newest first, CPU-only as the last resort.
            for tag in ("cu130", "cu126", "cu121"):
                if _run_streamed(
                    [str(venv_python), "-m", "pip", "install", "torch", "torchvision",
                     "--index-url", f"https://download.pytorch.org/whl/{tag}"],
                    install_dir, f"PyTorch ({tag})",
                ):
                    torch_ok = True
                    break
            if not torch_ok:
                _log("None of the CUDA builds had a wheel for this Python version - falling back to CPU-only.")
        if not torch_ok:
            _log("Installing CPU-only PyTorch (this works everywhere, but ML features run slower)...")
            torch_ok = _run_streamed([str(venv_python), "-m", "pip", "install", "torch", "torchvision"], install_dir, "PyTorch (CPU)")
        if not torch_ok:
            _fail("Failed to install PyTorch - see the log above.")
            return

        _set_phase("pip_ml", 70)
        _log("Installing CLIP (semantic search)...")
        if not _run_streamed([str(venv_python), "-m", "pip", "install", "open_clip_torch", "transformers"], install_dir, "CLIP install"):
            _fail("Failed to install CLIP dependencies - see the log above.")
            return
        _log("Installing face recognition...")
        if not _run_streamed([str(venv_python), "-m", "pip", "install", "facenet-pytorch", "--no-deps"], install_dir, "facenet-pytorch install"):
            _fail("Failed to install face recognition dependencies - see the log above.")
            return
        if not _run_streamed([str(venv_python), "-m", "pip", "install", "requests"], install_dir, "requests install"):
            _fail("Failed to install 'requests' - see the log above.")
            return
        if not _run_streamed([str(venv_python), "-m", "pip", "install", "scikit-learn"], install_dir, "scikit-learn install"):
            _fail("Failed to install scikit-learn - see the log above.")
            return

        _set_phase("clip_model", 85)
        _log("Downloading CLIP model weights (multilingual semantic search, ~4-5GB)...")
        # Best-effort, same reasoning as FFmpeg above: fetched now instead
        # of left to its usual lazy on-first-use download (see
        # services/clip_service.py's _load_clip), so the first real scan a
        # user runs doesn't stall on a surprise multi-GB download.
        _run_streamed(
            [str(venv_python), "-c", "from services.clip_service import _load_clip; _load_clip()"],
            install_dir, "CLIP model download",
        )

    _set_phase("configuring", 92)
    _log("Writing configuration...")
    (install_dir / ".env").write_text(f"WIMMICH_PORT={port}\n", encoding="utf-8")

    _set_phase("launching", 97)
    _log("Launching Wimmich...")
    try:
        # A new, visible console window running start.bat, same as a
        # normal double-click - not a hidden background process, since the
        # user should be able to see it (and its logs) same as any other
        # Wimmich launch.
        #
        # The "" is a required placeholder, not a mistake - cmd.exe's
        # `start` treats its first argument as a window title only when
        # quoted; passed as a bare word (as "Wimmich" was here) it reads as
        # the program to run instead, and Python's list2cmdline never
        # quotes a plain word with no spaces in it. Confirmed directly:
        # that exact bare-word form produced "'Wimmich' Windows tarafından
        # bulunamıyor" - Windows trying and failing to run a program
        # literally named "Wimmich". Also confirmed that hand-inserting
        # quote characters into the string ('"Wimmich"') doesn't fix it
        # either - list2cmdline backslash-escapes embedded quotes for a
        # normal argv-parsing program, which isn't how cmd.exe's own
        # tokenizer reads them. The empty string is the one form
        # list2cmdline always quotes (empty args need quoting to survive
        # at all), so it's the only reliable way to fill this slot -
        # costs the custom window title, not worth fighting cmd.exe's
        # quoting rules to keep it.
        #
        # ".\\start.bat", not bare "start.bat" - confirmed directly that a
        # bare filename fails to resolve here ("'start.bat' is not
        # recognized...") even while cmd's own cwd is demonstrably the
        # right folder, while the explicit relative path runs it every
        # time. Same landmine already documented elsewhere in this
        # project: a bare "start.bat" is looked up via cmd's normal
        # command search rather than treated as a direct file reference,
        # and that search doesn't reliably include the current directory
        # in every environment - ".\\" sidesteps the search entirely.
        subprocess.Popen(
            ["cmd.exe", "/c", "start", "", "cmd.exe", "/k", ".\\start.bat"],
            cwd=str(install_dir),
        )
    except Exception as e:
        _fail(f"Setup finished, but failed to launch start.bat automatically: {e}. Run start.bat in {install_dir} manually.")
        return

    with STATE_LOCK:
        STATE["launched_url"] = f"http://localhost:{port}"
        STATE["done"] = True
        STATE["running"] = False
    _set_phase("done", 100)
    _log(f"Done! Wimmich is starting at http://localhost:{port}")


PAGE_HTML = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wimmich Setup</title>
<style>
  :root {
    --bg-primary: #0a0a0f; --bg-secondary: #12121a; --bg-tertiary: #1a1a28;
    --text-primary: #f0f0f5; --text-secondary: #9a9ab0; --text-muted: #6b6b80;
    --accent-primary: #6366f1; --accent-secondary: #8b5cf6;
    --success: #22c55e; --warning: #f59e0b; --danger: #ef4444;
    --border-color: rgba(255,255,255,0.08);
    --radius: 14px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle at 20% 10%, #171727 0%, var(--bg-primary) 60%);
    color: var(--text-primary);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 24px;
  }
  .card {
    width: 100%; max-width: 560px; background: var(--bg-secondary);
    border: 1px solid var(--border-color); border-radius: var(--radius);
    padding: 32px; box-shadow: 0 16px 48px rgba(0,0,0,0.5);
  }
  h1 { margin: 0 0 4px; font-size: 1.4rem; }
  .subtitle { color: var(--text-secondary); margin: 0 0 24px; font-size: 0.9rem; }
  label { display: block; font-size: 0.85rem; color: var(--text-secondary); margin: 16px 0 6px; }
  input[type="text"], input[type="number"] {
    width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color);
    border-radius: 8px; padding: 10px 12px; color: var(--text-primary); font-size: 0.95rem;
  }
  input:focus { outline: none; border-color: var(--accent-primary); }
  .profiles { display: flex; gap: 10px; margin-top: 6px; }
  .profile-card {
    flex: 1; border: 1px solid var(--border-color); border-radius: 10px; padding: 12px;
    cursor: pointer; transition: border-color 150ms ease, background 150ms ease;
  }
  .profile-card b { display: block; font-size: 0.9rem; }
  .profile-card span { font-size: 0.78rem; color: var(--text-muted); }
  .profile-card.selected { border-color: var(--accent-primary); background: rgba(99,102,241,0.1); }
  .checkbox-row { display: flex; align-items: center; gap: 8px; margin-top: 14px; }
  .checkbox-row input { width: auto; }
  .checkbox-row label { margin: 0; color: var(--text-primary); font-size: 0.88rem; }
  .note { font-size: 0.78rem; color: var(--warning); margin-top: 10px; display: none; }
  button.primary {
    width: 100%; margin-top: 24px; padding: 12px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
    color: white; font-size: 1rem; font-weight: 600; cursor: pointer;
  }
  button.primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .progress-track { height: 8px; border-radius: 4px; background: var(--bg-tertiary); overflow: hidden; margin-bottom: 20px; }
  .progress-fill {
    height: 100%; width: 0%; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    transition: width 300ms ease;
  }
  .step-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
  .step-list li {
    display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: var(--text-muted);
    transition: color 200ms ease;
  }
  .step-list li.active { color: var(--text-primary); font-weight: 600; }
  .step-list li.done { color: var(--text-secondary); }
  .step-icon {
    width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
    border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; color: white; transition: border-color 200ms ease, background 200ms ease;
  }
  .step-list li.active .step-icon { border-color: var(--accent-primary); background: rgba(99,102,241,0.2); animation: pulse 1.2s ease-in-out infinite; }
  .step-list li.done .step-icon { border-color: var(--success); background: var(--success); }
  .step-list li.done .step-icon::after { content: '\2713'; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
  .log-details { margin-top: 20px; }
  .log-details summary { cursor: pointer; font-size: 0.8rem; color: var(--text-muted); }
  .log-box {
    margin-top: 10px; height: 220px; overflow-y: auto; background: #000;
    border: 1px solid var(--border-color); border-radius: 8px; padding: 10px;
    font-family: 'Consolas', monospace; font-size: 0.75rem; color: #9adb9a; white-space: pre-wrap;
  }
  .center { text-align: center; }
  .success-icon { font-size: 2.6rem; margin-bottom: 8px; }
  a.open-btn {
    display: inline-block; margin-top: 18px; padding: 12px 28px; border-radius: 10px;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    color: white; text-decoration: none; font-weight: 600;
  }
  #error-message { color: var(--danger); margin-top: 10px; font-size: 0.9rem; }
  #progress-view, #done-view, #error-view { display: none; }
</style>
</head>
<body>
<div class="card">
  <div id="form-view">
    <h1>Welcome to Wimmich</h1>
    <p class="subtitle">Let's get your setup finished before we begin.</p>

    <label>Install to folder</label>
    <input type="text" id="install_dir">

    <label>Port</label>
    <input type="number" id="port" min="1024" max="65535">

    <label>Features</label>
    <div class="profiles">
      <div class="profile-card selected" data-profile="full" onclick="selectProfile('full')">
        <b>Full (recommended)</b>
        <span>Smart search + face recognition (a few GB)</span>
      </div>
      <div class="profile-card" data-profile="minimal" onclick="selectProfile('minimal')">
        <b>Minimal</b>
        <span>Everything except AI features</span>
      </div>
    </div>
    <input type="hidden" id="profile_input" value="full">

    <div class="checkbox-row" id="gpu-row">
      <input type="checkbox" id="gpu">
      <label for="gpu">I have an NVIDIA GPU (CUDA)</label>
    </div>
    <p class="note" id="git-note">git wasn't found - Wimmich will be downloaded directly instead (this works fine, just without a .git history).</p>

    <button class="primary" id="install-btn" onclick="startInstall(event)">Install</button>
  </div>

  <div id="progress-view">
    <h1>Setting up Wimmich...</h1>
    <div class="progress-track"><div class="progress-fill" id="progress-bar"></div></div>
    <ul class="step-list" id="step-list"></ul>
    <details class="log-details">
      <summary>Show details</summary>
      <div class="log-box" id="log-box"></div>
    </details>
  </div>

  <div id="done-view" class="center">
    <div class="success-icon">✅</div>
    <h1>Wimmich is ready</h1>
    <p class="subtitle">The server is starting in its own window - give it a few seconds on first launch.</p>
    <a class="open-btn" id="open-link" href="#" target="_blank">Open Wimmich</a>
  </div>

  <div id="error-view">
    <h1>Setup failed</h1>
    <p id="error-message"></p>
    <div class="log-box" id="error-log"></div>
  </div>
</div>
<script>
async function loadSystemCheck() {
  try {
    const res = await fetch('/api/system-check');
    const data = await res.json();
    document.getElementById('install_dir').value = data.default_install_dir;
    document.getElementById('port').value = data.default_port;
    document.getElementById('gpu').checked = !!data.gpu_hint;
    if (!data.git_available) document.getElementById('git-note').style.display = 'block';
  } catch (e) { /* form still usable with blank defaults */ }
}

function selectProfile(profile) {
  document.querySelectorAll('.profile-card').forEach(el => el.classList.toggle('selected', el.dataset.profile === profile));
  document.getElementById('profile_input').value = profile;
  document.getElementById('gpu-row').style.display = profile === 'full' ? 'flex' : 'none';
}

const STEPS_FULL = [
  ['fetching_repo', 'Downloading Wimmich'],
  ['venv', 'Creating virtual environment'],
  ['pip_base', 'Installing base dependencies'],
  ['ffmpeg', 'Setting up FFmpeg'],
  ['pip_torch', 'Installing PyTorch'],
  ['pip_ml', 'Installing AI dependencies'],
  ['clip_model', 'Downloading AI models'],
  ['configuring', 'Writing configuration'],
  ['launching', 'Launching Wimmich'],
];
const SKIP_WHEN_MINIMAL = new Set(['pip_torch', 'pip_ml', 'clip_model']);
const STEPS_MINIMAL = STEPS_FULL.filter(([key]) => !SKIP_WHEN_MINIMAL.has(key));

let currentSteps = STEPS_FULL;

function renderSteps() {
  document.getElementById('step-list').innerHTML = currentSteps
    .map(([key, label]) => `<li data-key="${key}" class="pending"><span class="step-icon"></span><span>${label}</span></li>`)
    .join('');
}

function updateSteps(phase, done, error) {
  const keys = currentSteps.map(s => s[0]);
  const activeIdx = (done && !error) ? keys.length : keys.indexOf(phase);
  document.querySelectorAll('#step-list li').forEach((li, i) => {
    li.classList.remove('done', 'active', 'pending');
    li.classList.add(i < activeIdx ? 'done' : (i === activeIdx ? 'active' : 'pending'));
  });
}

async function startInstall(e) {
  e.preventDefault();
  const btn = document.getElementById('install-btn');
  btn.disabled = true;
  const payload = {
    install_dir: document.getElementById('install_dir').value.trim(),
    port: parseInt(document.getElementById('port').value, 10),
    profile: document.getElementById('profile_input').value,
    gpu: document.getElementById('gpu').checked,
  };
  let res, data;
  try {
    res = await fetch('/api/install', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload),
    });
    data = await res.json();
  } catch (err) {
    btn.disabled = false;
    alert('Could not reach the installer server.');
    return;
  }
  if (!res.ok) {
    btn.disabled = false;
    alert(data.error || 'Could not start the installation.');
    return;
  }
  currentSteps = payload.profile === 'minimal' ? STEPS_MINIMAL : STEPS_FULL;
  renderSteps();
  document.getElementById('form-view').style.display = 'none';
  document.getElementById('progress-view').style.display = 'block';
  poll();
}

function poll() {
  const timer = setInterval(async () => {
    let s;
    try {
      s = await (await fetch('/api/progress')).json();
    } catch (e) { return; }
    document.getElementById('progress-bar').style.width = s.percent + '%';
    updateSteps(s.phase, s.done, s.error);
    const logBox = document.getElementById('log-box');
    logBox.textContent = s.log.join('\\n');
    logBox.scrollTop = logBox.scrollHeight;
    if (s.done) {
      clearInterval(timer);
      if (s.error) {
        document.getElementById('progress-view').style.display = 'none';
        document.getElementById('error-view').style.display = 'block';
        document.getElementById('error-message').textContent = s.error;
        document.getElementById('error-log').textContent = s.log.join('\\n');
      } else {
        document.getElementById('progress-view').style.display = 'none';
        document.getElementById('done-view').style.display = 'block';
        document.getElementById('open-link').href = s.launched_url;
      }
    }
  }, 1000);
}

window.addEventListener('DOMContentLoaded', loadSystemCheck);
</script>
</body>
</html>
"""


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # keep console output limited to our own _log() lines

    def _send_json(self, obj, status=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/":
            body = PAGE_HTML.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif self.path == "/api/system-check":
            self._send_json({
                "git_available": shutil.which("git") is not None,
                "gpu_hint": shutil.which("nvidia-smi") is not None,
                "default_install_dir": str(Path.home() / "Wimmich"),
                "default_port": 3000,
            })
        elif self.path == "/api/progress":
            with STATE_LOCK:
                self._send_json(dict(STATE))
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path != "/api/install":
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            self._send_json({"error": "Invalid request body."}, status=400)
            return

        with STATE_LOCK:
            if STATE["running"]:
                self._send_json({"error": "An installation is already in progress."}, status=409)
                return

        install_dir_str = str(body.get("install_dir", "")).strip()
        profile = body.get("profile") if body.get("profile") in ("full", "minimal") else None
        gpu = bool(body.get("gpu"))
        try:
            port = int(body.get("port"))
        except (TypeError, ValueError):
            port = None

        if not install_dir_str:
            self._send_json({"error": "Choose an install folder."}, status=400)
            return
        if profile is None:
            self._send_json({"error": "Choose Full or Minimal."}, status=400)
            return
        if port is None or not (1024 <= port <= 65535):
            self._send_json({"error": "Port must be between 1024 and 65535."}, status=400)
            return

        install_dir = Path(install_dir_str).expanduser()

        with STATE_LOCK:
            STATE.update({
                "running": True, "done": False, "error": None,
                "phase": "starting", "percent": 0, "log": [], "launched_url": None,
            })

        threading.Thread(target=_install_worker, args=(install_dir, port, profile, gpu), daemon=True).start()
        self._send_json({"status": "started"})


def main():
    if platform.system() != "Windows":
        print("Wimmich currently only supports Windows. Exiting.")
        sys.exit(1)

    try:
        server = ThreadingHTTPServer(("127.0.0.1", SERVER_PORT), Handler)
    except OSError as e:
        print(f"Could not start the local installer server on port {SERVER_PORT}: {e}")
        sys.exit(1)

    url = f"http://127.0.0.1:{SERVER_PORT}"
    print(f"Wimmich installer running at {url}")
    print("Opening your browser... if it doesn't open automatically, go to the address above.")
    threading.Thread(target=lambda: (time.sleep(0.5), webbrowser.open(url)), daemon=True).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
