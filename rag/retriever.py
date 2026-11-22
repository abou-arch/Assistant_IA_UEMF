"""Recherche des fiches les plus proches d'une question."""
import json
from dataclasses import dataclass

import chromadb

from . import config
from .embeddings import embed

_col = None


@dataclass
class Hit:
    id: str
    score: float          # similarité cosinus (1 = identique)
    text: str
    meta: dict

    @property
    def sources(self) -> list[dict]:
        return json.loads(self.meta["sources"])

    @property
    def orientation(self) -> str:
        return self.meta.get("orientation", "")


def _collection():
    global _col
    if _col is None:
        client = chromadb.PersistentClient(path=str(config.CHROMA_DIR))
        _col = client.get_collection(config.COLLECTION)
    return _col


def search(query: str, k: int | None = None) -> list[Hit]:
    k = k or config.TOP_K
    res = _collection().query(
        query_embeddings=embed([query], "query").tolist(),
        n_results=k, include=["documents", "metadatas", "distances"])
    return [Hit(i, 1.0 - d, doc, meta) for i, doc, meta, d in
            zip(res["ids"][0], res["documents"][0], res["metadatas"][0], res["distances"][0])]
