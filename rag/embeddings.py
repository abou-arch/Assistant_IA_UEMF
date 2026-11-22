"""Encodage des textes. Le préfixe « query: / passage: » est requis par les modèles E5."""
import re
import unicodedata
import zlib

import numpy as np

from . import config

_model = None


def _st_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(config.EMBED_MODEL)
    return _model


def _hash_embed(texts: list[str], dim: int = 2048) -> np.ndarray:
    """Baseline lexicale (n-grammes de caractères hachés). Pas de sémantique, pas de multilingue."""
    out = np.zeros((len(texts), dim), dtype=np.float32)
    for i, t in enumerate(texts):
        t = unicodedata.normalize("NFKD", t.lower())
        t = "".join(c for c in t if not unicodedata.combining(c))
        t = " " + re.sub(r"\s+", " ", t) + " "
        for n in (3, 4):
            for j in range(len(t) - n + 1):
                out[i, zlib.crc32(t[j:j + n].encode()) % dim] += 1.0
    out = np.sqrt(out)
    norms = np.linalg.norm(out, axis=1, keepdims=True)
    return out / np.maximum(norms, 1e-9)


def embed(texts: list[str], kind: str) -> np.ndarray:
    """kind : 'passage' (documents indexés) ou 'query' (question de l'utilisateur)."""
    if config.EMBED_BACKEND == "hash":
        return _hash_embed(texts)
    prefix = f"{kind}: " if "e5" in config.EMBED_MODEL.lower() else ""
    return _st_model().encode([prefix + t for t in texts],
                              normalize_embeddings=True, show_progress_bar=False)
