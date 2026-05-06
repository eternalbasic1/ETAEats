import re

SEMVER_RE = re.compile(r'^\d+\.\d+\.\d+$')

def parse_version(version: str) -> tuple[int, int, int]:
    """Parse 'MAJOR.MINOR.PATCH' → (major, minor, patch). Raises ValueError on invalid input."""
    if not SEMVER_RE.match(version):
        raise ValueError(f"Invalid semver: {version!r}")
    parts = version.split('.')
    return (int(parts[0]), int(parts[1]), int(parts[2]))

def is_version_outdated(current: str, minimum: str) -> bool:
    """Return True iff current < minimum using semver precedence."""
    return parse_version(current) < parse_version(minimum)

def format_version(major: int, minor: int, patch: int) -> str:
    """Format a parsed version tuple back to a string."""
    return f"{major}.{minor}.{patch}"
