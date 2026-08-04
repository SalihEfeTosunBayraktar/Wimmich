"""Best-effort detection of this machine's own LAN IP, for the "you're on
the same network - switch to a direct connection" banner (see
main.py's /api/network/local-info)."""
import socket
from typing import Optional


def get_local_lan_ip() -> Optional[str]:
    """UDP "connect" to a public address without ever actually sending a
    packet - just enough for the OS routing table to pick which local
    interface/IP would be used to reach it. More reliable than resolving
    the machine's own hostname, which on many home/office setups resolves
    to 127.0.0.1 or the wrong interface on a multi-NIC machine."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.settimeout(1)
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except OSError:
        return None
