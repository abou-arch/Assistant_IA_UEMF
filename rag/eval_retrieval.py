"""Étape 5 — test de la recherche seule : `python -m rag.eval_retrieval`.

Requêtes de test = variante FR, question EN, question AR de chaque fiche indexée
(formulations différentes du texte indexé, qui contient la question FR principale).
"""
import csv
import statistics as st
from pathlib import Path

from .corpus import indexables, load_fiches
from .retriever import search

HORS_PERIMETRE = [
    "Quelle est la capitale de l'Australie ?", "Donne-moi une recette de tajine au poulet",
    "Qui a gagné la Coupe du monde 2022 ?", "Comment pirater un compte Instagram ?",
    "What is the best smartphone to buy this year?", "Write me a poem about love",
    "Explain quantum computing in simple words", "اكتب لي قصيدة عن الحب",
    "ما هي أفضل وصفة للكسكس؟", "Quel temps fait-il demain à Paris ?",
]


def rank_of(gold: str, query: str, k: int = 5):
    hits = search(query, k)
    ids = [h.id for h in hits]
    return (ids.index(gold) + 1 if gold in ids else None), hits[0].score


def main() -> None:
    fiches = load_fiches()
    rows, pos_scores = [], []
    for f in indexables(fiches):
        for lang, key in (("fr", "variante"), ("en", "question_en"), ("ar", "question_ar")):
            q = f.get(key, "")
            if not q:
                continue
            rank, top1 = rank_of(f["id"], q)
            rows.append({"id": f["id"], "langue": lang, "requete": q, "rang": rank or "", "score_top1": round(top1, 3)})
            if rank == 1:
                pos_scores.append(top1)

    print("RECALL (fiche attendue dans les k premiers résultats)")
    for lang in ("fr", "en", "ar", "tous"):
        sub = [r for r in rows if lang == "tous" or r["langue"] == lang]
        n = len(sub)
        r = lambda k: sum(1 for x in sub if x["rang"] and x["rang"] <= k) / n
        print(f"  {lang:>4} (n={n}) : @1 {r(1):.0%} | @3 {r(3):.0%} | @5 {r(5):.0%}")

    print("\nÉCHECS (hors top-3) :")
    for r in rows:
        if not r["rang"] or r["rang"] > 3:
            print(f"  {r['id']} [{r['langue']}] rang={r['rang'] or '>5'}  « {r['requete']} »")

    print("\nSCORES TOP-1")
    neg = [search(q, 1)[0].score for q in HORS_PERIMETRE]
    print(f"  Requêtes bien classées (p10 / médiane) : {st.quantiles(pos_scores, n=10)[0]:.3f} / {st.median(pos_scores):.3f}")
    print(f"  Hors périmètre ({len(neg)} requêtes)  (médiane / max)  : {st.median(neg):.3f} / {max(neg):.3f}")
    p10 = st.quantiles(pos_scores, n=10)[0]
    if max(neg) < p10:
        print(f"  → Seuil possible MIN_SCORE ≈ {(max(neg) + p10) / 2:.3f} (sépare les deux groupes)")
    else:
        print("  → Les groupes se chevauchent : pas de seuil net, comptez sur le prompt (règle 7) et le re-ranking.")

    out = Path(__file__).parent / "reports" / "retrieval_eval.csv"
    out.parent.mkdir(exist_ok=True)
    with open(out, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=rows[0].keys())
        w.writeheader(); w.writerows(rows)
    print(f"\nDétail : {out}")


if __name__ == "__main__":
    main()
