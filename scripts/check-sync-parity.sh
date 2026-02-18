#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

exec python3 - "$ROOT_DIR" "$@" <<'PY'
import hashlib
import json
import subprocess
import sys
from pathlib import Path


def die(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def git_head(path: Path) -> str:
    proc = subprocess.run(
        ["git", "-C", str(path), "rev-parse", "HEAD"],
        check=True,
        capture_output=True,
        text=True,
    )
    return proc.stdout.strip()


root = Path(sys.argv[1]).resolve()
argv = sys.argv[2:]
manifest_path = Path(argv[0]).resolve() if len(argv) > 0 else root / "sync-manifest.json"
source_repo = Path(argv[1]).resolve() if len(argv) > 1 else None

if not manifest_path.is_file():
    die(f"missing manifest: {manifest_path}")

data = json.loads(manifest_path.read_text(encoding="utf-8"))
if data.get("mode") != "openapi":
    die("manifest mode must be openapi")

artifact = data["artifacts"][0]
source_commit = data["source_repo"]["commit"]
source_path = artifact["source_path"]
target_path = artifact["target_path"]
expected_target_sha = artifact["target_sha256"]

target_file = root / target_path
if not target_file.is_file():
    die(f"missing target file: {target_file}")

actual_target_sha = file_sha256(target_file)
if actual_target_sha != expected_target_sha:
    die(
        f"target digest mismatch: expected {expected_target_sha}, "
        f"got {actual_target_sha}"
    )

if source_repo is not None:
    if not (source_repo / ".git").exists():
        die(f"source repo must be a git checkout: {source_repo}")

    source_head = git_head(source_repo)
    if source_head != source_commit:
        die(f"source repo commit mismatch: expected {source_commit}, got {source_head}")

    source_file = source_repo / source_path
    if not source_file.is_file():
        die(f"missing source file: {source_file}")
    source_sha = file_sha256(source_file)
    if source_sha != actual_target_sha:
        die(f"source/target digest mismatch: source={source_sha} target={actual_target_sha}")

print("ok: openapi parity")
PY
