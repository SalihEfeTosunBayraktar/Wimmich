"""Shared password strength rule for register, profile password change, and
admin password reset - one constant so the three call sites can't drift.

Length over character-class rules (NIST SP 800-63B): a longer passphrase
beats a short "P@ssw0rd1" without forcing symbol/uppercase requirements
that mostly just annoy home/family users on a self-hosted server.
"""
MIN_PASSWORD_LENGTH = 8


def is_password_strong_enough(password: str) -> bool:
    return bool(password) and len(password) >= MIN_PASSWORD_LENGTH
