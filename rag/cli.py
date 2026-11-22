"""Utilisation en ligne de commande : `python -m rag.cli`."""
from .pipeline import answer


def main() -> None:
    print("Assistant EIDIA — tapez 'q' pour quitter.\n")
    history: list[dict] = []
    while True:
        q = input("Vous : ").strip()
        if q.lower() in {"q", "quit", "exit"}:
            break
        if not q:
            continue
        res = answer(q, history)
        print(f"\nAssistant : {res.answer}")
        if res.orientation:
            print(f"→ Orientation : {res.orientation}")
        for s in res.sources:
            print(f"  [{s['id']}] {s['titre']} — {s['url']}")
        print(f"  (fiches : {res.fiches or '—'} | score top-1 : {res.top_score:.3f})\n")
        history += [{"role": "user", "content": q}, {"role": "assistant", "content": res.answer}]


if __name__ == "__main__":
    main()
