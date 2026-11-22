"""Configuration centrale. Tout se règle par variables d'environnement (.env)."""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:  # python-dotenv facultatif
    pass

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = Path(os.getenv("QR_JSONL", ROOT / "base_QR_EIDIA.jsonl"))

# --- Embeddings ---
# "st"   : sentence-transformers (modèle multilingue, usage réel)
# "hash" : baseline lexicale sans téléchargement (tests / dépannage uniquement)
EMBED_BACKEND = os.getenv("EMBED_BACKEND", "st")
EMBED_MODEL = os.getenv("EMBED_MODEL", "intfloat/multilingual-e5-base")

# --- Base vectorielle ---
CHROMA_DIR = Path(os.getenv("CHROMA_DIR", ROOT / "rag" / f"chroma_db_{EMBED_BACKEND}"))
COLLECTION = "eidia_qr"

# --- Recherche ---
TOP_K = int(os.getenv("TOP_K", "4"))
# Seuil sous lequel on ne appelle PAS le LLM (hors périmètre probable).
# 0.0 = désactivé. À calibrer avec `python -m rag.eval_retrieval` (étape 9).
MIN_SCORE = float(os.getenv("MIN_SCORE", "0.0"))

# --- LLM ---
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "anthropic")  # anthropic | ollama
LLM_MODEL = os.getenv("LLM_MODEL", "claude-haiku-5-5")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
MAX_QUESTION_CHARS = int(os.getenv("MAX_QUESTION_CHARS", "500"))
