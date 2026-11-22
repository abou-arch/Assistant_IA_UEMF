"""Étape 5 — Indexation. Relançable à volonté : `python -m rag.build_index`."""
import hashlib
import json
import time

import chromadb

from . import config
from .corpus import indexables, load_fiches
from .embeddings import embed


def build() -> int:
    fiches = indexables(load_fiches())
    client = chromadb.PersistentClient(path=str(config.CHROMA_DIR))
    try:
        client.delete_collection(config.COLLECTION)
    except Exception:
        pass
    col = client.create_collection(config.COLLECTION, metadata={"hnsw:space": "cosine"})

    texts = [f["texte_a_indexer"] for f in fiches]
    metas = [{
        "categorie": f["categorie"],
        "validite": f["validite"],
        "statut": f["statut"],
        "comportement": f["comportement_attendu"],
        "orientation": f["orientation"],
        "sources": json.dumps(f["sources"], ensure_ascii=False),
    } for f in fiches]
    col.add(ids=[f["id"] for f in fiches], documents=texts,
            embeddings=embed(texts, "passage").tolist(), metadatas=metas)

    manifest = {
        "date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "fiches_indexees": len(fiches),
        "backend": config.EMBED_BACKEND,
        "modele": config.EMBED_MODEL if config.EMBED_BACKEND == "st" else "hash (baseline)",
        "sha256_jsonl": hashlib.sha256(config.DATA_PATH.read_bytes()).hexdigest(),
    }
    (config.CHROMA_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(fiches)


if __name__ == "__main__":
    n = build()
    print(f"{n} fiches indexées dans {config.CHROMA_DIR} (backend={config.EMBED_BACKEND})")
