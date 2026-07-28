"""Local network (LAN) access detection - the server already binds 0.0.0.0
by default, so any device on the same network can reach it in principle.
The two things that actually trip people up are (1) not knowing which URL
to type on the other device, and (2) Windows Firewall silently blocking
inbound connections to THIS specific python.exe even when a rule exists
for some other Python install on the machine - both surfaced here,
read-only, no firewall changes made by the app itself."""
import socket
import subprocess
import sys
from typing import Optional


def get_lan_ips() -> list:
    """Best-effort local IPv4 addresses - excludes loopback/link-local, so
    only addresses another device on the LAN could actually use are shown."""
    ips = []
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if not ip.startswith("127.") and not ip.startswith("169.254.") and ip not in ips:
                ips.append(ip)
    except socket.gaierror:
        pass
    return ips


def check_firewall_rule_exists() -> Optional[bool]:
    """None means the check itself couldn't run (no PowerShell, unexpected
    output, timeout) - kept distinct from an actual "no rule found" so the
    UI doesn't confidently report a wrong answer either way.

    Reads the firewall rules straight out of the registry rather than the
    NetSecurity module's Get-NetFirewallRule/Get-NetFirewallApplicationFilter
    cmdlets - confirmed directly those take 30+ seconds on a machine with a
    few hundred rules (each rule triggers its own underlying CIM call), far
    too slow to run inline on every admin panel load. The registry format
    (App=..., Action=..., etc. joined by "|") is stable, undocumented-but-
    well-known, and this same read completes in well under a second."""
    try:
        script = (
            f"$prog = '{sys.executable}'; "
            "$rules = Get-ItemProperty -Path "
            "'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\SharedAccess\\Parameters\\FirewallPolicy\\FirewallRules' "
            "-ErrorAction SilentlyContinue; "
            "$found = $false; "
            "foreach ($p in $rules.PSObject.Properties) { "
            "  if ($p.Name -like 'PS*') { continue }; "
            "  $fields = @{}; "
            "  foreach ($pair in ($p.Value -split '\\|')) { "
            "    $kv = $pair -split '=', 2; "
            "    if ($kv.Length -eq 2) { $fields[$kv[0]] = $kv[1] } "
            "  }; "
            "  if ($fields.Action -eq 'Allow' -and $fields.Active -eq 'TRUE' -and $fields.Dir -eq 'In' "
            "      -and $fields.App -and ($fields.App -ieq $prog)) { $found = $true; break } "
            "}; "
            "if ($found) { 'yes' } else { 'no' }"
        )
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command", script],
            capture_output=True, text=True, timeout=15, stdin=subprocess.DEVNULL,
        )
        output = result.stdout.strip().lower()
        if output == "yes":
            return True
        if output == "no":
            return False
        return None
    except (OSError, subprocess.TimeoutExpired):
        return None


def get_network_status() -> dict:
    return {
        "lan_ips": get_lan_ips(),
        "firewall_rule_found": check_firewall_rule_exists(),
        "python_exe": sys.executable,
    }
