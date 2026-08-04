"""Best-effort detection of this machine's own LAN IP, for the "you're on
the same network - switch to a direct connection" banner (see
main.py's /api/network/local-info)."""
import ipaddress
import socket
from typing import Optional


def is_loopback_ip(ip: Optional[str]) -> bool:
    """True for any loopback representation a network stack/proxy might
    report - not just the literal strings "127.0.0.1"/"::1", which misses
    the rest of the 127.0.0.0/8 range and, more importantly, the
    IPv4-mapped-IPv6 form (::ffff:127.x, or its hex equivalent
    ::ffff:7f00:1) some setups use instead of plain "127.0.0.1". Parsing
    with the ipaddress module and unwrapping any IPv4-mapped address
    before checking .is_loopback covers every valid representation
    generically, rather than growing an ever-longer list of literal
    strings/prefixes every time a new one turns up."""
    if not ip:
        return False
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    if isinstance(addr, ipaddress.IPv6Address) and addr.ipv4_mapped is not None:
        addr = addr.ipv4_mapped
    return addr.is_loopback


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
