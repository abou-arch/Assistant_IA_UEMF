import json
from pathlib import Path
from . import config


def load_fiches(path: Path | None = None) -> list[dict]:
    with open(path or config.DATA_PATH, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def indexables(fiches: list[dict]) -> list[dict]:
    """Fiches à indexer (les fiches « Évaluation seulement » restent hors index)."""
    return [f for f in fiches if f.get("a_indexer")]
