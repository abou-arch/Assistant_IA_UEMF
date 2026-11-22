"""Étape 6 — Pipeline RAG : question -> (réponse, sources)."""
import html
import re
from dataclasses import dataclass, field

from . import config, llm
from .prompts import CONDENSE_PROMPT, CONTACT_SOURCE, FALLBACK, SYSTEM_PROMPT
from .retriever import Hit, search

FR_WORDS = {"le", "la", "les", "des", "est", "quels", "quelle", "quelles", "quel", "comment", "pour",
            "et", "je", "mes", "ma", "puis", "où", "combien", "que", "qui", "une", "un", "du",
            "de", "dans", "sur", "mon", "est-ce"}
EN_WORDS = {"the", "is", "are", "what", "how", "do", "does", "can", "i", "my", "for", "and", "to",
            "of", "in", "where", "when", "which", "who", "there", "any"}


@dataclass
class Answer:
    answer: str
    language: str
    sources: list[dict] = field(default_factory=list)
    fiches: list[str] = field(default_factory=list)
    orientation: str = ""
    grounded: bool = True      # False = repli sans appel au LLM (rien de pertinent trouvé)
    top_score: float = 0.0


def detect_language(text: str) -> str:
    letters = [c for c in text if c.isalpha()]
    if letters and sum("\u0600" <= c <= "\u06FF" for c in letters) / len(letters) > 0.3:
        return "ar"
    words = re.findall(r"[a-zàâçéèêëîïôûùüÿœ'-]+", text.lower())
    en = sum(w in EN_WORDS for w in words)
    fr = sum(w in FR_WORDS for w in words)
    return "en" if en > fr else "fr"


def _condense(question: str, history: list[dict]) -> str:
    """Rend une question de suivi autonome (« et pour le master ? ») avant la recherche."""
    if not history:
        return question
    convo = "\n".join(f"{m['role']}: {m['content']}" for m in history[-4:])
    try:
        out = llm.complete(CONDENSE_PROMPT,
                           [{"role": "user", "content": f"{convo}\nuser: {question}"}], max_tokens=150)
        return out.strip().splitlines()[0] or question
    except Exception:
        return question


def _build_user_message(question: str, standalone: str, hits: list[Hit]) -> str:
    blocs = []
    for h in hits:
        attrs = (f'id="{h.id}" validite="{h.meta["validite"]}" statut="{h.meta["statut"]}" '
                 f'comportement="{html.escape(h.meta["comportement"], quote=True)}" '
                 f'orientation="{html.escape(h.orientation, quote=True)}"')
        blocs.append(f"<fiche {attrs}>\n{html.escape(h.text)}\n</fiche>")
    msg = "<fiches>\n" + "\n".join(blocs) + "\n</fiches>\n\n"
    msg += f"<question>{html.escape(question)}</question>"
    if standalone != question:
        msg += f"\n<question_reformulee>{html.escape(standalone)}</question_reformulee>"
    return msg


def _collect_sources(used: list[Hit]) -> list[dict]:
    seen, out = set(), []
    for h in used:
        for s in h.sources:
            if s.get("url") and s["id"] not in seen:   # S00 (document interne) n'a pas d'URL
                seen.add(s["id"])
                out.append(s)
    return out


def answer(question: str, history: list[dict] | None = None) -> Answer:
    history = history or []
    question = question.strip()[: config.MAX_QUESTION_CHARS]
    lang = detect_language(question)

    standalone = _condense(question, history)
    hits = search(standalone)

    if not hits or hits[0].score < config.MIN_SCORE:
        return Answer(FALLBACK[lang], lang, sources=[CONTACT_SOURCE], grounded=False,
                      top_score=hits[0].score if hits else 0.0)

    messages = [*history[-4:], {"role": "user", "content": _build_user_message(question, standalone, hits)}]
    text = llm.complete(SYSTEM_PROMPT, messages).strip()

    ids = {h.id: h for h in hits}
    cited = [i for i in dict.fromkeys(re.findall(r"\[(Q\d{3})\]", text)) if i in ids]
    used = [ids[i] for i in cited] or [hits[0]]       # repli : la fiche la plus proche
    orientation = next((h.orientation for h in used if h.orientation), "")
    return Answer(text, lang, sources=_collect_sources(used), fiches=[h.id for h in used],
                  orientation=orientation, top_score=hits[0].score)
