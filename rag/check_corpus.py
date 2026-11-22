"""Étape 4 — contrôle qualité du corpus : `python -m rag.check_corpus`."""
import re
from collections import Counter

from .corpus import load_fiches

REQUIRED = ["id", "categorie", "question", "question_en", "question_ar", "reponse", "sources",
            "validite", "statut", "usage", "a_indexer", "texte_a_indexer"]
INJECTION = re.compile(r"ignore[sz]?\b|system prompt|prompt système|instructions? précédentes|you are now", re.I)


def main() -> None:
    f = load_fiches()
    errs = []
    ids = Counter(r["id"] for r in f)
    errs += [f"id en double : {k}" for k, v in ids.items() if v > 1]
    for r in f:
        errs += [f"{r['id']} : champ manquant « {k} »" for k in REQUIRED if k not in r or r[k] in ("", [], None)]
        if (r["usage"] == "Base + évaluation") != r["a_indexer"]:
            errs.append(f"{r['id']} : a_indexer incohérent avec usage")
        if r["a_indexer"] and r["texte_a_indexer"] != f"Question : {r['question']}\nRéponse : {r['reponse']}":
            errs.append(f"{r['id']} : texte_a_indexer ≠ question + réponse")
        if r["a_indexer"] and INJECTION.search(r["reponse"]):
            errs.append(f"{r['id']} : motif d'injection suspect dans la réponse")
        for s in r["sources"]:
            if not s.get("url") and s["id"] != "S00":
                errs.append(f"{r['id']} : source {s['id']} sans URL")
    print(f"{len(f)} fiches, {sum(r['a_indexer'] for r in f)} à indexer")
    print("ERREURS STRUCTURELLES :", *(errs or ["aucune"]), sep="\n  ")

    print("\nÀ TRAITER AVANT LA DÉMO (contenu) :")
    print("  Validité périmée (2024-2025) :", [r["id"] for r in f if r["validite"] == "2024-2025"])
    print("  Statut « à confirmer »       :", [r["id"] for r in f if "confirmer" in r["statut"]])
    print("  Notes « À COMPLÉTER »        :", [r["id"] for r in f if "COMPLÉTER" in r["note_verification"].upper()])
    print("  Fiches sans relecture        :", sum(not r["relu_par"] for r in f), "/", len(f))
    mails = set(re.findall(r"[\w.\-]+@[\w.\-]+\w", " ".join(r["reponse"] for r in f)))
    print("  E-mails à domaine inhabituel :", sorted(m for m in mails if not m.endswith("@ueuromed.org")))


if __name__ == "__main__":
    main()
