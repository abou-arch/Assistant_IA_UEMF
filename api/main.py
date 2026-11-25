"""API HTTP minimale autour du pipeline RAG (rag/), pour le front-end.

Lancement (à la racine du dépôt) :
    uvicorn api.main:app --reload --port 8000

Sous-ensemble de docs/02-contrat-api.md : /api/health, /api/suggestions, /api/chat.
L'historique des conversations est gardé en mémoire (perdu au redémarrage) : suffisant pour le prototype.
"""
import html
import re
import uuid
from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from rag import config, pipeline
from rag.corpus import load_fiches

Langue = Literal["fr", "en", "ar"]

app = FastAPI(title="Assistant IA EIDIA", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(HTTPException)
def erreur_http(_request, exc: HTTPException):
    """Format d'erreur du contrat : {"erreur": {"code", "message"}}."""
    detail = exc.detail if isinstance(exc.detail, dict) else {"code": "erreur", "message": str(exc.detail)}
    return JSONResponse({"erreur": detail}, status_code=exc.status_code)


FICHES = {f["id"]: f for f in load_fiches()}
CONVERSATIONS: dict[str, list[dict]] = {}
CITATION = re.compile(r"\s*\[Q\d{3}\]")


class ChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str = Field(min_length=1, max_length=config.MAX_QUESTION_CHARS)
    langue: Langue = "fr"


class Source(BaseModel):
    id: str
    titre: str
    url: str


class Orientation(BaseModel):
    libelle: str
    contact: str | None = None


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    langue: Langue
    contenu: str
    comportement: str
    sources: list[Source]
    orientation: Orientation | None
    fiches_utilisees: list[str]
    confiance: float
    validite: str | None
    a_confirmer: bool
    cree_le: str


class Suggestion(BaseModel):
    fiche_id: str
    categorie: str
    question: str


def _orientation(texte: str) -> Orientation | None:
    """« Service des admissions (+212 5 38 90-3230) » → libellé + contact."""
    if not texte:
        return None
    m = re.match(r"^(.*?)\s*\(([^)]*)\)\s*$", texte)
    return Orientation(libelle=m[1], contact=m[2]) if m else Orientation(libelle=texte)


@app.get("/api/health")
def health():
    return {"statut": "ok", "fiches_indexees": sum(f["a_indexer"] for f in FICHES.values()), "version": app.version}


@app.get("/api/suggestions", response_model=list[Suggestion])
def suggestions(langue: Langue = "fr", limite: int = 6):
    champ = {"fr": "question", "en": "question_en", "ar": "question_ar"}[langue]
    vues, out = set(), []
    for f in FICHES.values():
        # Une question « Répondre et citer » par catégorie, pour varier les suggestions.
        if f["a_indexer"] and f["comportement_attendu"].startswith("Répondre et citer") and f["categorie"] not in vues:
            vues.add(f["categorie"])
            out.append(Suggestion(fiche_id=f["id"], categorie=f["categorie"], question=f[champ] or f["question"]))
    return out[:limite]


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    conv_id = req.conversation_id if req.conversation_id in CONVERSATIONS else f"c_{uuid.uuid4().hex[:12]}"
    historique = CONVERSATIONS.setdefault(conv_id, [])

    try:
        res = pipeline.answer(req.message, historique)
    except Exception as exc:  # LLM injoignable, index absent…
        raise HTTPException(503, detail={"code": "llm_indisponible", "message": str(exc)[:200]}) from exc

    # Les fiches sont échappées (html.escape) dans le prompt et le LLM recopie parfois « &#x27; » :
    # on décode, le front affichant du texte brut (pas de HTML injecté).
    contenu = html.unescape(CITATION.sub("", res.answer)).strip()
    historique += [{"role": "user", "content": req.message}, {"role": "assistant", "content": res.answer}]

    fiches = [FICHES[i] for i in res.fiches if i in FICHES]
    orientation = _orientation(res.orientation)
    if not res.grounded:
        comportement = "non_publie_orienter"
    elif orientation:
        comportement = "repondre_limite_orienter"
    else:
        comportement = "repondre_citer"

    return ChatResponse(
        conversation_id=conv_id,
        message_id=f"m_{uuid.uuid4().hex[:12]}",
        langue=res.language if res.language in ("fr", "en", "ar") else req.langue,
        contenu=contenu,
        comportement=comportement,
        sources=[Source(id=s["id"], titre=s["titre"], url=s.get("url", "")) for s in res.sources],
        orientation=orientation,
        fiches_utilisees=res.fiches,
        confiance=round(res.top_score, 3),
        validite=fiches[0]["validite"] if fiches else None,
        a_confirmer=any("confirmer" in f["statut"] for f in fiches),
        cree_le=datetime.now(timezone.utc).isoformat(timespec="seconds"),
    )
